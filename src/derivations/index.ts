// UTXO output-descriptor kind + template.
export {
  descriptorKindForAddressKind,
  outputDescriptorTemplate,
  type UtxoDescriptorKind,
} from "./descriptors.js";
// Path engine: the single-source-of-truth template, plus parse/build helpers.
export {
  buildPath,
  DEFAULT_HARDENING,
  type DerivationPath,
  DerivationPathError,
  type DerivationPathErrorCode,
  formatPath,
  HARDENED_OFFSET,
  type HardeningLayout,
  lit,
  MAX_DERIVATION_INDEX,
  match,
  nvr,
  type ParsedPath,
  type PathComponents,
  type PathSegment,
  type PathTemplate,
  parsePath,
  type Role,
  type RoleValues,
  render,
  renderTemplate,
  type SafeParseResult,
  SEGMENT_ROLES,
  type Segment,
  safeParsePath,
  type Template,
  toBip32Indexes,
  toMatcher,
  vr,
} from "./path/index.js";
// Profiles registry + recognition.
export {
  accountPathRenderer,
  CARDANO_PROFILES,
  COSMOS_PROFILES,
  DERIVATION_PROFILES,
  type DerivationProfile,
  EVM_PROFILES,
  IOTA_PROFILES,
  indexPathRenderer,
  isUtxoChain,
  LEGACY_PROFILES,
  MISC_PROFILES,
  minValueForRole,
  NAMADA_PROFILES,
  type PathRenderer,
  profileById,
  profilesForChain,
  RADIX_PROFILES,
  RESOLVED_PROFILES,
  type Recognition,
  type ResolvedProfile,
  recognizeAll,
  recognizePath,
  renderProfilePath,
  SOLANA_PROFILES,
  STARKNET_PROFILES,
  SUBSTRATE_PROFILES,
  UTXO_CHAINS,
  UTXO_PROFILES,
  type UtxoChain,
  ZCASH_SHIELDED_PROFILES,
} from "./profiles/index.js";
// Purposes + standards.
export {
  PURPOSE_LABELS,
  PURPOSES,
  type Purpose,
  type PurposeKey,
  STANDARDS,
  type Standard,
} from "./purposes.js";
// Raw-key address descriptors (pathless single-keypair cross-ecosystem re-encoding).
export {
  RAW_KEY_DESCRIPTORS,
  type RawKeyDescriptor,
  type RawKeyEncoding,
  type RawKeyEncodingParams,
  rawKeyDescriptorsForScheme,
  schemeForEcosystem,
} from "./raw-key.js";
// Signature schemes + address kinds.
export {
  ADDRESS_KINDS,
  type AddressKind,
  SIGNATURE_SCHEMES,
  type SignatureScheme,
} from "./schemes.js";
// SLIP-44 coin types.
export {
  COIN_TYPE_INFO,
  COIN_TYPES,
  type CoinType,
  type CoinTypeInfo,
  type CoinTypeKey,
  coinTypeInfo,
  coinTypeName,
  isKnownCoinType,
  keyByCoinType,
} from "./slip44.js";
// SLIP-132 extended-key version bytes.
export {
  SLIP132_VERSION_BYTES,
  type VersionBytes,
  versionBytesNumber,
  type XpubFamily,
  xpubFamilyFor,
} from "./slip132.js";
// Substrate secret-URI (SURI) junction recognizer.
export {
  formatSubstrateSuri,
  isSubstrateSuri,
  parseSubstrateSuri,
  SUBSTRATE_ROOT_LABEL,
  type SubstrateJunction,
  type SubstrateSuri,
} from "./substrate-suri.js";
