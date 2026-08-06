#!/usr/bin/env node

const USAGE =
  "Usage: node scripts/read-erc20-metadata.mjs --rpc <url> --chain-id <id> --slug <slug> --address <erc20>";

const SELECTORS = {
  decimals: "0x313ce567",
  name: "0x06fdde03",
  symbol: "0x95d89b41",
};

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const CHAIN_ID_RE = /^\d+$/;
const HEX_RE = /^[0-9a-fA-F]*$/;
const RPC_TIMEOUT_MS = 30_000;
const UINT_HEX_RE = /^0x[0-9a-fA-F]+$/;

let nextId = 1;

function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help" || token === "-h") {
      console.log(USAGE);
      process.exit(0);
    }
    if (!token.startsWith("--")) {
      throw new Error(`Unexpected argument: ${token}\n${USAGE}`);
    }

    const key = token.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${token}\n${USAGE}`);
    }
    args[key] = value;
    i += 1;
  }

  const rpc = args.rpc;
  const chainIdText = args["chain-id"];
  const chainId = chainIdText && CHAIN_ID_RE.test(chainIdText) ? Number(chainIdText) : Number.NaN;
  const slug = args.slug;
  const address = args.address?.toLowerCase();

  if (!rpc) throw new Error(`Missing --rpc\n${USAGE}`);
  if (!Number.isSafeInteger(chainId) || chainId <= 0)
    throw new Error(`Invalid --chain-id\n${USAGE}`);
  if (!slug) throw new Error(`Missing --slug\n${USAGE}`);
  if (!address || !ADDRESS_RE.test(address)) throw new Error(`Invalid --address\n${USAGE}`);

  return { address, chainId, rpc, slug };
}

async function rpcCall(rpc, method, params = []) {
  const id = nextId;
  nextId += 1;
  const response = await fetch(rpc, {
    body: JSON.stringify({
      id,
      jsonrpc: "2.0",
      method,
      params,
    }),
    method: "POST",
    signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
    headers: {
      "content-type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`${method} failed with HTTP ${response.status}`);
  }

  const body = await response.json();
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error(`${method} returned an invalid JSON-RPC response`);
  }
  if (body.error) {
    throw new Error(`${method} failed: ${body.error.message ?? JSON.stringify(body.error)}`);
  }
  if (typeof body.result !== "string") {
    throw new Error(`${method} returned a non-string result`);
  }

  return body.result;
}

function ethCall(rpc, address, data) {
  return rpcCall(rpc, "eth_call", [{ data, to: address }, "latest"]);
}

function hexToBytes(hex) {
  if (!hex.startsWith("0x")) throw new Error("Hex result must start with 0x");
  const raw = hex.slice(2);
  if (raw.length % 2 !== 0) throw new Error(`Odd-length hex result (${raw.length} digits)`);
  if (!HEX_RE.test(raw)) throw new Error("Invalid hex result");
  const bytes = new Uint8Array(raw.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(raw.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function wordToNumber(bytes, offset) {
  if (offset + 32 > bytes.length) return null;
  let value = 0n;
  for (let i = offset; i < offset + 32; i += 1) {
    value = value * 256n + BigInt(bytes[i]);
  }
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) return null;
  return Number(value);
}

function decodeBytes(bytes) {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes).replace(/\0+$/g, "");
}

function decodeStringLike(result) {
  if (!result || result === "0x") return null;

  const bytes = hexToBytes(result);
  if (bytes.length === 32) {
    let end = bytes.length;
    while (end > 0 && bytes[end - 1] === 0) end -= 1;
    const staticBytes = bytes.slice(0, end);
    return decodeBytes(staticBytes);
  }

  const offset = wordToNumber(bytes, 0);
  if (offset === null) return null;
  const length = wordToNumber(bytes, offset);
  if (length === null) return null;
  const start = offset + 32;
  const end = start + length;
  if (end > bytes.length) return null;

  return decodeBytes(bytes.slice(start, end));
}

function decodeUint8(result) {
  if (!result || result === "0x") return null;
  if (!UINT_HEX_RE.test(result)) throw new Error("Invalid uint8 hex result");
  const value = BigInt(result);
  if (value > 255n) throw new Error(`uint8 out of range: ${value.toString()}`);
  return Number(value);
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

async function readNullable(label, read) {
  try {
    return await read();
  } catch (error) {
    console.error(`Warning: failed to read ${label}: ${errorMessage(error)}`);
    return null;
  }
}

async function main() {
  const { address, chainId, rpc, slug } = parseArgs(process.argv.slice(2));
  const actualChainId = BigInt(await rpcCall(rpc, "eth_chainId"));
  if (actualChainId !== BigInt(chainId)) {
    throw new Error(`RPC chain mismatch: expected ${chainId}, got ${actualChainId.toString()}`);
  }

  const decimals = await readNullable("decimals", async () =>
    decodeUint8(await ethCall(rpc, address, SELECTORS.decimals))
  );
  const symbol = await readNullable("symbol", async () =>
    decodeStringLike(await ethCall(rpc, address, SELECTORS.symbol))
  );
  const name = await readNullable("name", async () =>
    decodeStringLike(await ethCall(rpc, address, SELECTORS.name))
  );

  console.log(
    JSON.stringify(
      {
        chainId,
        slug,
        address,
        symbol,
        name,
        decimals,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(errorMessage(error));
  process.exit(1);
});
