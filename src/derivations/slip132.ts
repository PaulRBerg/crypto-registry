import { fromHex } from "./internal/hex.js";
import type { AddressKind } from "./schemes.js";
import { COIN_TYPES } from "./slip44.js";

/**
 * SLIP-132 extended-key version-byte prefixes. The prefix encodes both the network/script type and the public/private
 * nature of the key, and determines the human-facing `xpub`/`ypub`/`zpub`/`Ltub`/`Mtub` first characters.
 *
 * @see https://github.com/satoshilabs/slips/blob/master/slip-0132.md
 */
export type XpubFamily = "Ltub" | "Mtub" | "xpub" | "ypub" | "zpub";

export type VersionBytes = {
  /** Public extended key version bytes (e.g. `xpub`). */
  readonly public: string;
  /** Private extended key version bytes (e.g. `xprv`). */
  readonly private: string;
};

export const SLIP132_VERSION_BYTES = {
  Ltub: { private: "0x019d9cfe", public: "0x019da462" },
  Mtub: { private: "0x01b26792", public: "0x01b26ef6" },
  xpub: { private: "0x0488ade4", public: "0x0488b21e" },
  ypub: { private: "0x049d7878", public: "0x049d7cb2" },
  zpub: { private: "0x04b2430c", public: "0x04b24746" },
} as const satisfies Record<XpubFamily, VersionBytes>;

/** The numeric form of a family's version bytes, e.g. `versionBytesNumber("xpub", "public")` -> `0x0488b21e`. */
export function versionBytesNumber(family: XpubFamily, key: keyof VersionBytes): number {
  return fromHex(SLIP132_VERSION_BYTES[family][key]);
}

/**
 * The xpub family for a UTXO coin's address kind. Litecoin uses its own `Ltub`/`Mtub` prefixes for legacy and nested
 * segwit (and reuses `xpub` for native segwit); all other transparent UTXO chains use Bitcoin's
 * `xpub`/`ypub`/`zpub`. Returns `undefined` for non-UTXO address kinds.
 */
export function xpubFamilyFor(coinType: number, addressKind: AddressKind): XpubFamily | undefined {
  if (coinType === COIN_TYPES.LITECOIN) {
    if (addressKind === "p2pkh") {
      return "Ltub";
    }
    if (addressKind === "p2sh-p2wpkh") {
      return "Mtub";
    }
    return addressKind === "p2wpkh" ? "xpub" : undefined;
  }
  if (addressKind === "p2pkh") {
    return "xpub";
  }
  if (addressKind === "p2sh-p2wpkh") {
    return "ypub";
  }
  return addressKind === "p2wpkh" ? "zpub" : undefined;
}
