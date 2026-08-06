import { describe, expect, it, vi } from "vitest";
import type { EnrichedToken } from "./enrich.js";

vi.mock("node:fs", () => ({ writeFileSync: vi.fn() }));

import { generate } from "./codegen.js";

const TOKEN: EnrichedToken = {
  address: "0x1111111111111111111111111111111111111111",
  chainId: 1,
  decimals: 18,
  name: "Test Token",
  slug: "mainnet",
  symbol: "TEST",
};

describe("token codegen", () => {
  it("rejects duplicate chain/address keys instead of silently keeping the first", () => {
    expect(() => generate([TOKEN, { ...TOKEN, symbol: "OTHER" }])).toThrow(
      `duplicate token ${TOKEN.slug} ${TOKEN.address}`
    );
  });
});
