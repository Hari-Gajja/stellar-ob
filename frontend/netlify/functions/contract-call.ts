import type { Config, Context } from "@netlify/functions";

const RPC_URL = process.env.SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
const CONTRACT_ID = process.env.VITE_CONTRACT_ID || "";

interface ContractCallRequest {
  method: string;
  params: unknown[];
}

interface SimulateTransactionResponse {
  result?: {
    retval: string;
    auth?: unknown[];
    footprint?: {
      readOnly: string[];
      readWrite: string[];
    };
  };
  error?: string;
  latestLedger?: number;
  minResourceFee?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function rpcCall(method: string, params: unknown[]) {
  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  return response.json();
}

export default async (req: Request, context: Context) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { method, params }: ContractCallRequest = await req.json();

    if (!CONTRACT_ID) {
      return new Response(JSON.stringify({ error: "Contract ID not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const simulation = await rpcCall("simulateTransaction", [
      {
        contractId: CONTRACT_ID,
        functionName: method,
        args: params,
      },
    ]) as SimulateTransactionResponse;

    if (simulation.error) {
      return new Response(JSON.stringify({ error: simulation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ result: simulation.result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Contract call failed", message: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

export const config: Config = {
  path: "/api/contract/call",
};