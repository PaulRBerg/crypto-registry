import type { DerivationPath, PathTemplate, Role } from "./segment.js";
import { HARDENED_OFFSET } from "./segment.js";

/**
 * The single source of truth for a derivation standard.
 *
 * A {@link Template} is an ordered list of {@link Segment}s describing either every level after the `m` master node or a
 * native non-BIP evidence string such as `index=0`. The same structure drives both directions: {@link render} walks it
 * to produce a concrete path string, and {@link toMatcher} walks it to produce the recognizer regex. Because
 * construction and recognition read the same data, they cannot drift.
 */
export type Segment =
  | { readonly kind: "fixed"; readonly value: number; readonly hardened: boolean }
  | {
      readonly kind: "param";
      readonly role: Role;
      readonly hardened: boolean;
      readonly minValue?: number;
    }
  | {
      readonly kind: "native-param";
      readonly prefix: string;
      readonly role: Role;
      readonly minValue?: number;
    };

export type Template = readonly Segment[];

/** The numeric values bound to (or extracted from) a template's variable levels. */
export type RoleValues = Partial<Record<Role, number>>;

/** Terse constructor for a fixed level, e.g. `lit(44, true)` -> `44'`. */
export const lit = (value: number, hardened = false): Segment => ({
  hardened,
  kind: "fixed",
  value,
});

/** Terse constructor for a variable level, e.g. `vr("account", true)` -> `{account}'`. */
export const vr = (role: Role, hardened = false, minValue?: number): Segment =>
  minValue === undefined
    ? { hardened, kind: "param", role }
    : { hardened, kind: "param", minValue, role };

/** Native non-BIP evidence constructor, e.g. `nvr("index", "index=")` -> `index={index}`. */
export const nvr = (role: Role, prefix: string, minValue?: number): Segment =>
  minValue === undefined
    ? { kind: "native-param", prefix, role }
    : { kind: "native-param", minValue, prefix, role };

const tick = (hardened: boolean): string => (hardened ? "'" : "");

const join = (parts: readonly string[]): string => (parts.length > 0 ? `/${parts.join("/")}` : "");

const templateKind = (template: Template): "bip" | "native" => {
  const hasNative = template.some((segment) => segment.kind === "native-param");
  if (hasNative && template.some((segment) => segment.kind !== "native-param")) {
    throw new Error("mixed BIP and native template segments are not supported");
  }
  return hasNative ? "native" : "bip";
};

const variableSegments = (
  template: Template
): readonly Extract<Segment, { kind: "native-param" | "param" }>[] =>
  template.filter(
    (segment): segment is Extract<Segment, { kind: "native-param" | "param" }> =>
      segment.kind === "param" || segment.kind === "native-param"
  );

const escapeRegex = (value: string): string => value.replace(/[\\^$.*+?()[\]{}|]/gu, "\\$&");

/**
 * Direction A — render a template to a concrete path. Every param role must be supplied in `values`.
 *
 * @example render(evmAddressIndexShape(60), { index: 5 }) // "m/44'/60'/0'/0/5"
 */
export function render(template: Template, values: RoleValues = {}): DerivationPath {
  const kind = templateKind(template);
  const parts = template.map((segment) => {
    if (segment.kind === "fixed") {
      return `${segment.value}${tick(segment.hardened)}`;
    }
    const value = values[segment.role];
    if (value === undefined) {
      throw new Error(`render: missing value for role "${segment.role}"`);
    }
    if (segment.kind === "native-param") {
      return `${segment.prefix}${value}`;
    }
    return `${value}${tick(segment.hardened)}`;
  });
  return (kind === "native" ? parts.join("") : `m${join(parts)}`) as DerivationPath;
}

/** Render a template to its placeholder string, e.g. `m/44'/60'/0'/0/{index}`. */
export function renderTemplate(template: Template): PathTemplate {
  const kind = templateKind(template);
  const parts = template.map((segment) => {
    if (segment.kind === "native-param") {
      return `${segment.prefix}{${segment.role}}`;
    }
    if (segment.kind === "fixed") {
      return `${segment.value}${tick(segment.hardened)}`;
    }
    return `{${segment.role}}${tick(segment.hardened)}`;
  });
  return (kind === "native" ? parts.join("") : `m${join(parts)}`) as PathTemplate;
}

type CompiledMatcher = { regex: RegExp; captures: readonly Role[] };

/**
 * Memoized by template identity. Registry profile templates are stable references, so recognition reuses the compiled
 * regex instead of rebuilding it on every call. Safe to share: the regex is non-global, so `exec` always matches from
 * the start and carries no `lastIndex` state between calls.
 */
const matcherCache = new WeakMap<Template, CompiledMatcher>();

/**
 * Direction B — compile a template to a recognizer. Fixed levels become literals; params become `(\d+)` capture
 * groups, in path order. The `source` of the returned regex matches the hand-written account-style rules verbatim
 * (those that capture with `(\d+)`).
 */
export function toMatcher(template: Template): CompiledMatcher {
  const cached = matcherCache.get(template);
  if (cached !== undefined) {
    return cached;
  }
  const kind = templateKind(template);
  const captures: Role[] = [];
  const body = template.map((segment) => {
    if (segment.kind === "native-param") {
      captures.push(segment.role);
      return `${escapeRegex(segment.prefix)}(\\d+)`;
    }
    if (segment.kind === "fixed") {
      return `${segment.value}${tick(segment.hardened)}`;
    }
    captures.push(segment.role);
    return `(\\d+)${tick(segment.hardened)}`;
  });
  const source =
    kind === "native"
      ? `^${body.join("")}$`
      : `^m${body.length > 0 ? `\\/${body.join("\\/")}` : ""}$`;
  const compiled: CompiledMatcher = { captures, regex: new RegExp(source, "u") };
  matcherCache.set(template, compiled);
  return compiled;
}

/**
 * Recognize a path against a template, returning the extracted role values or `undefined` on mismatch. Honors each
 * param's `minValue` (e.g. a `minValue: 1` account rejects `0`) and rejects any level at or above the hardened offset
 * (`2^31`), which would overflow into hardened space.
 */
export function match(template: Template, path: string): RoleValues | undefined {
  const { regex } = toMatcher(template);
  const found = regex.exec(path);
  if (found === null) {
    return undefined;
  }
  const variables = variableSegments(template);
  const values: RoleValues = {};
  for (const [position, segment] of variables.entries()) {
    const value = Number.parseInt(found[position + 1], 10);
    if (value < (segment.minValue ?? 0) || value >= HARDENED_OFFSET) {
      return undefined;
    }
    values[segment.role] = value;
  }
  return values;
}
