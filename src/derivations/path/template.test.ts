import { describe, expect, it } from "vitest";
import { DERIVATION_PROFILES } from "../profiles/registry.js";
import type { RoleValues, Template } from "./template.js";
import { match, render } from "./template.js";

const paramRoles = (template: Template) =>
  template.flatMap((segment) =>
    segment.kind === "param" || segment.kind === "native-param" ? [segment] : []
  );

/** Assign every param the same test value, clamped up to its `minValue`. */
const bind = (template: Template, value: number): RoleValues => {
  const values: RoleValues = {};
  for (const segment of paramRoles(template)) {
    values[segment.role] = Math.max(value, segment.minValue ?? 0);
  }
  return values;
};

const TEST_VALUES = [0, 1, 2, 5, 7, 42, 100, 2 ** 31 - 1];

describe("template round-trip laws", () => {
  for (const profile of DERIVATION_PROFILES) {
    const template = profile.template;

    it(`law #1 match(render(v)) === v — ${profile.id}`, () => {
      for (const value of TEST_VALUES) {
        const values = bind(template, value);
        expect(match(template, render(template, values))).toEqual(values);
      }
    });

    it(`law #2 render(match(p)) === p — ${profile.id}`, () => {
      for (const value of TEST_VALUES) {
        const path = render(template, bind(template, value));
        const recovered = match(template, path);
        expect(recovered).toBeDefined();
        expect(render(template, recovered)).toBe(path);
      }
    });
  }

  it("renders zero-variable templates as a fixed string", () => {
    const root = DERIVATION_PROFILES.find((profile) => profile.id === "solana-legacy-ledger-root");
    expect(root).toBeDefined();
    expect(paramRoles(root?.template ?? [])).toHaveLength(0);
    expect(render(root?.template ?? [])).toBe("m/44'/501'");
    expect(match(root?.template ?? [], "m/44'/501'")).toEqual({});
  });
});
