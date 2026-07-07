import { describe, expect, it } from "vitest";
import { getWrappedTokens } from "./lookup.js";
import { NATIVE_ASSET_CHAINS, PRICE_ASSET_ALIASES, STABLECOIN_TICKERS_BY_PEG } from "./tickers.js";

describe("stablecoin tickers", () => {
  it("lists the exact USD-equivalent quote vocabulary", () => {
    expect([...STABLECOIN_TICKERS_BY_PEG.USD].sort()).toEqual([
      "BSC-USD",
      "BUSD",
      "DAI",
      "GUSD",
      "LinkUSD",
      "USD",
      "USDC",
      "USDT",
      "WXDAI",
      "XDAI",
      "mUSD",
      "sUSD",
      "xDAI",
    ]);
  });

  it("lists the exact EUR-equivalent quote vocabulary", () => {
    expect([...STABLECOIN_TICKERS_BY_PEG.EUR]).toEqual(["EURe"]);
  });

  it("has no duplicates within or across pegs", () => {
    const all = [...STABLECOIN_TICKERS_BY_PEG.USD, ...STABLECOIN_TICKERS_BY_PEG.EUR];
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("price-asset aliases", () => {
  it("matches the exact wrapped/decorated ticker map", () => {
    expect(PRICE_ASSET_ALIASES).toEqual({
      clBTC: "BTC",
      WAVAX: "AVAX",
      WBERA: "BERA",
      WBNB: "BNB",
      "WBNB.b": "BNB",
      WBTC: "BTC",
      WCELO: "CELO",
      WETH: "ETH",
      WFTM: "FTM",
      WHYPE: "HYPE",
      WMATIC: "POL",
      WMON: "MON",
      WPOL: "POL",
      WSEI: "SEI",
      WXDAI: "xDAI",
      WXDC: "XDC",
      wNXM: "NXM",
      wxDAI: "xDAI",
    });
  });

  it("never aliases a ticker to itself", () => {
    for (const [from, to] of Object.entries(PRICE_ASSET_ALIASES)) {
      expect(from).not.toBe(to);
    }
  });

  it("agrees with on-chain wrapped-native underlyings (case-insensitively)", () => {
    for (const token of getWrappedTokens()) {
      const alias = PRICE_ASSET_ALIASES[token.symbol];
      if (alias !== undefined) {
        expect(alias.toUpperCase()).toBe(token.underlyingSymbol.toUpperCase());
      }
    }
  });
});

describe("native asset chains", () => {
  it("matches the exact accounting native-asset chain vocabulary", () => {
    expect(NATIVE_ASSET_CHAINS).toEqual({
      AVAX: "Avalanche",
      BNB: "BNB Chain",
      BTC: "Bitcoin",
      EOS: "EOS",
      ETH: "Ethereum",
      NEO: "NEO",
      POL: "Polygon",
      SC: "Sia",
      SOL: "Solana",
      STEEM: "Steem",
      XRP: "XRP",
      xDAI: "Gnosis",
    });
  });
});
