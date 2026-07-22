import { describe, expect, it } from "vitest";
import { getStablecoins, getWrappedTokens } from "./lookup.js";
import {
  CANONICAL_TICKER_ALIASES,
  NATIVE_ASSET_CHAINS,
  PRICE_ASSET_ALIASES,
  STABLECOIN_TICKERS_BY_PEG,
} from "./tickers.js";

const UPPERCASE_TICKER_RE = /^[A-Z0-9]+$/u;

describe("canonical ticker aliases", () => {
  it("matches the exact curated identity map", () => {
    expect(CANONICAL_TICKER_ALIASES).toEqual({
      HAV: "SNX",
      INST: "FLUID",
      MATIC: "POL",
      WMATIC: "WPOL",
      XNO: "NANO",
      XRB: "NANO",
    });
  });

  it("uses sorted uppercase keys and values without self-aliases", () => {
    const entries = Object.entries(CANONICAL_TICKER_ALIASES);
    expect(entries.map(([ticker]) => ticker)).toEqual(entries.map(([ticker]) => ticker).toSorted());
    for (const [from, to] of entries) {
      expect(from).toMatch(UPPERCASE_TICKER_RE);
      expect(to).toMatch(UPPERCASE_TICKER_RE);
      expect(from).not.toBe(to);
    }
  });
});

describe("stablecoin tickers", () => {
  it("lists the exact USD-equivalent quote vocabulary", () => {
    expect([...STABLECOIN_TICKERS_BY_PEG.USD].sort()).toEqual([
      "BSC-USD",
      "BUSD",
      "DAI",
      "DAI.e",
      "GUSD",
      "LinkUSD",
      "USD",
      "USDC",
      "USDC.e",
      "USDT",
      "USDT0",
      "USDbC",
      "USDt",
      "WxDAI",
      "axlUSDC",
      "frxUSD",
      "ioUSDC",
      "lzUSDC",
      "mUSD",
      "pUSD",
      "xDAI",
    ]);
  });

  it("lists the exact EUR-equivalent quote vocabulary", () => {
    expect([...STABLECOIN_TICKERS_BY_PEG.EUR]).toEqual(["EURe", "EURT"]);
  });

  it("has no duplicates within or across pegs", () => {
    const all = [...STABLECOIN_TICKERS_BY_PEG.USD, ...STABLECOIN_TICKERS_BY_PEG.EUR];
    expect(new Set(all).size).toBe(all.length);
  });

  it("covers every registry ticker or names it as an explicit exception", () => {
    const exceptions: readonly string[] = ["TUSD", "USDB", "USDT-matic", "BUSD-bsc"];
    for (const row of getStablecoins()) {
      expect(
        STABLECOIN_TICKERS_BY_PEG[row.peg].includes(row.ticker) || exceptions.includes(row.ticker),
        `${row.chainId}:${row.address} ${row.ticker}`
      ).toBe(true);
    }
  });
});

describe("price-asset aliases", () => {
  it("matches the exact wrapped/decorated ticker map", () => {
    expect(PRICE_ASSET_ALIASES).toEqual({
      COREBTC: "BTC",
      clBTC: "BTC",
      ioETH: "ETH",
      WAVAX: "AVAX",
      WBERA: "BERA",
      WBNB: "BNB",
      "WBNB.b": "BNB",
      WBTC: "BTC",
      WCELO: "CELO",
      WEGLD: "EGLD",
      WETH: "ETH",
      WFRAX: "FRAX",
      WFTM: "FTM",
      WHYPE: "HYPE",
      WIOTX: "IOTX",
      WMATIC: "POL",
      WMON: "MON",
      WPOL: "POL",
      WSEI: "SEI",
      WXDC: "XDC",
      WxDAI: "xDAI",
      wfrxETH: "frxETH",
      wNXM: "NXM",
      wSOL: "SOL",
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
      FRAX: "Fraxtal",
      frxETH: "Fraxtal",
      HBAR: "Hedera",
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
