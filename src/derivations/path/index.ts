export {
  buildPath,
  DEFAULT_HARDENING,
  formatPath,
  type HardeningLayout,
  type PathComponents,
  toBip32Indexes,
} from "./build.js";
export {
  DerivationPathError,
  type DerivationPathErrorCode,
  parsePath,
  type SafeParseResult,
  safeParsePath,
} from "./parse.js";
export {
  type DerivationPath,
  HARDENED_OFFSET,
  MAX_DERIVATION_INDEX,
  type ParsedPath,
  type PathSegment,
  type PathTemplate,
  type Role,
  SEGMENT_ROLES,
} from "./segment.js";
export {
  lit,
  match,
  nvr,
  type RoleValues,
  render,
  renderTemplate,
  type Segment,
  type Template,
  toMatcher,
  vr,
} from "./template.js";
