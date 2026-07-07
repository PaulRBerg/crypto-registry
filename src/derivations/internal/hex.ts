const HEX_PREFIX = /^0x/u;

/** Decode a `0x`-prefixed hex string back to a number. */
export const fromHex = (hex: string): number => Number.parseInt(hex.replace(HEX_PREFIX, ""), 16);
