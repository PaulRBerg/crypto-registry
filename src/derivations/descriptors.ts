import type { AddressKind } from "./schemes.js";

/**
 * Bitcoin output-descriptor kind and template. Both are pure functions of a profile's {@link AddressKind} — the
 * on-chain script type (P2PKH / P2SH-P2WPKH / P2WPKH), which is a BIP standard fact, not a wallet or explorer choice —
 * so they are modeled here even though other descriptor/wallet-UX glue is intentionally excluded from this package.
 */
export type BitcoinDescriptorKind = "pkh" | "sh-wpkh" | "wpkh";

const DESCRIPTOR_KIND_BY_ADDRESS_KIND: Partial<Record<AddressKind, BitcoinDescriptorKind>> = {
  p2pkh: "pkh",
  "p2sh-p2wpkh": "sh-wpkh",
  p2wpkh: "wpkh",
};

const OUTPUT_DESCRIPTOR_TEMPLATE: Record<BitcoinDescriptorKind, string> = {
  pkh: "pkh({xpub}/0/*)",
  "sh-wpkh": "sh(wpkh({xpub}/0/*))",
  wpkh: "wpkh({xpub}/0/*)",
};

/** The output-descriptor kind for a profile's address kind, or `undefined` when the address kind is not a Bitcoin-family script type. */
export function descriptorKindForAddressKind(
  addressKind: AddressKind
): BitcoinDescriptorKind | undefined {
  return DESCRIPTOR_KIND_BY_ADDRESS_KIND[addressKind];
}

/** The output-descriptor template for a descriptor kind, with `{xpub}` left as a placeholder for the caller to fill in. */
export function outputDescriptorTemplate(descriptorKind: BitcoinDescriptorKind): string {
  return OUTPUT_DESCRIPTOR_TEMPLATE[descriptorKind];
}
