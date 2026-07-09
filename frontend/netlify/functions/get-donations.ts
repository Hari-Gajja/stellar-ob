import type { Config, Context } from "@netlify/functions";

const RPC_URL = process.env.VITE_RPC_URL || "https://soroban-testnet.stellar.org";
const CONTRACT_ID = process.env.VITE_CONTRACT_ID || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

interface Donation {
  donor: string;
  amount: string;
  timestamp: number;
  transactionId: string;
}

async function rpcCall(method: string, params: unknown[]): Promise<Record<string, unknown>> {
  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  return response.json() as Promise<Record<string, unknown>>;
}

function readVec(data: Uint8Array, offset: number): [Uint8Array[], number] {
  const len = Number(data[offset]) + (Number(data[offset + 1]) << 8);
  const items: Uint8Array[] = [];
  let pos = offset + 2;

  for (let i = 0; i < len; i++) {
    const itemLen = Number(data[pos]) + (Number(data[pos + 1]) << 8);
    pos += 2;
    items.push(data.slice(pos, pos + itemLen));
    pos += itemLen;
  }
  return [items, pos];
}

function readString(data: Uint8Array, offset: number): [string, number] {
  const len = Number(data[offset]) + (Number(data[offset + 1]) << 8);
  const str = new TextDecoder().decode(data.slice(offset + 2, offset + 2 + len));
  return [str, offset + 2 + len];
}

function readU64(data: Uint8Array, offset: number): [number, number] {
  let val = 0;
  for (let i = 0; i < 8; i++) {
    val += Number(data[offset + i]) << (i * 8);
  }
  return [val, offset + 8];
}

function readI128(data: Uint8Array, offset: number): [string, number] {
  const bytes = data.slice(offset, offset + 16);
  let val = 0n;
  for (let i = 0; i < 16; i++) {
    val += BigInt(bytes[i]) << BigInt(i * 8);
  }
  return [val.toString(), offset + 16];
}

function readAddress(data: Uint8Array, offset: number): [string, number] {
  const len = Number(data[offset]) + (Number(data[offset + 1]) << 8);
  const addrBytes = data.slice(offset + 2, offset + 2 + len);
  const addr = new TextDecoder().decode(addrBytes);
  return [addr, offset + 2 + len];
}

function decodeDonations(encoded: string): Donation[] {
  try {
    const binary = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
    const [vec, _] = readVec(binary, 0);
    const donations: Donation[] = [];

    for (const item of vec) {
      let pos = 0;
      const [donor, p1] = readAddress(item, pos);
      pos = p1;
      const [amount, p2] = readI128(item, pos);
      pos = p2;
      const [timestamp, p3] = readU64(item, pos);
      pos = p3;
      const [transactionId] = readString(item, pos);
      donations.push({ donor, amount, timestamp, transactionId });
    }
    return donations;
  } catch (e) {
    console.error("Decode error:", e);
    return [];
  }
}

export default async (req: Request, context: Context): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    if (!CONTRACT_ID) {
      return new Response(JSON.stringify({ error: "Contract ID not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);

    const simulation = await rpcCall("simulateTransaction", [
      {
        contractId: CONTRACT_ID,
        functionName: "get_recent_donations",
        args: [{ u32: limit }],
      },
    ]);

    if (simulation.error) {
      return new Response(JSON.stringify({ error: simulation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const retval = simulation.result?.retval;
    if (!retval || typeof retval !== "string") {
      return new Response(JSON.stringify({ donations: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const donations = decodeDonations(retval);

    return new Response(JSON.stringify({ donations }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch donations", message: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

export const config: Config = {
  path: "/api/donations",
};