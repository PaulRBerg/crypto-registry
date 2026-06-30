/**
 * A 0x-prefixed, 40-hex-character EVM address.
 *
 * All addresses in this registry are stored {@link normalizeAddress | normalized}
 * to lowercase. No EIP-55 checksum casing is applied — comparisons are
 * case-insensitive and keccak-free to keep the package dependency-free.
 */
export type Address = `0x${string}`;

const ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;

/** Type guard: `true` when `value` is a 0x-prefixed, 40-hex-char string. */
export function isAddress(value: string): value is Address {
  return ADDRESS_REGEX.test(value);
}

/**
 * Validate and lowercase an EVM address.
 *
 * @throws if `value` is not a 0x-prefixed, 40-hex-character string.
 */
export function normalizeAddress(value: string): Address {
  if (!ADDRESS_REGEX.test(value)) {
    throw new Error(`Invalid EVM address: ${value}`);
  }
  return value.toLowerCase() as Address;
}

/**
 * Compare two addresses for equality, ignoring case.
 *
 * @throws if either argument is not a valid EVM address.
 */
export function isAddressEqual(a: string, b: string): boolean {
  return normalizeAddress(a) === normalizeAddress(b);
}
