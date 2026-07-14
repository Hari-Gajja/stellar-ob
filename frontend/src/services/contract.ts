import { AssembledTransaction } from "@stellar/stellar-sdk/contract";
import { Address, nativeToScVal, scValToNative } from "@stellar/stellar-sdk";
import {
  STELLAR_NETWORK_PASSPHRASE,
  STELLAR_RPC_URL,
  signTransaction,
} from "./wallet";
import type { CampaignData, CampaignStatus, DonationRecord } from "../types";

export const CONTRACT_ID =
  import.meta.env.VITE_CONTRACT_ID ||
  "CCB63UK4GQPL7NOKZ3EHM5CDM74SSPYYJ4NGKP4M6Q2U7XPDHHBHVANC";

export const TREASURY_CONTRACT_ID =
  import.meta.env.VITE_TREASURY_CONTRACT_ID ||
  "CAL7LQPOFPA4BB6WC2USJLWOOQSRXQKULA64TARKGTRPRB24EYX4F6LY";

const STATUS_MAP: Record<number, CampaignStatus> = {
  0: "Active",
  1: "Successful",
  2: "Failed",
  3: "Closed",
};

function scvAddress(a: string): ReturnType<typeof nativeToScVal> {
  return Address.fromString(a).toScVal();
}

function scvU32(n: number): ReturnType<typeof nativeToScVal> {
  return nativeToScVal(n, { type: "u32" });
}

function scvU64(n: bigint | number): ReturnType<typeof nativeToScVal> {
  return nativeToScVal(BigInt(n), { type: "u64" });
}

function scvI128(n: bigint | number): ReturnType<typeof nativeToScVal> {
  return nativeToScVal(BigInt(n), { type: "i128" });
}

function scvString(s: string): ReturnType<typeof nativeToScVal> {
  return nativeToScVal(s, { type: "string" });
}

function parseCampaignData(m: Record<string, unknown>): CampaignData {
  const statusVal = m.status;
  let status: CampaignStatus = "Active";
  if (typeof statusVal === "number") {
    status = STATUS_MAP[statusVal] || "Active";
  } else if (typeof statusVal === "string") {
    status = statusVal as CampaignStatus;
  }

  return {
    id: Number(m.id),
    owner: m.owner as string,
    name: m.name as string,
    description: m.description as string,
    funding_goal: BigInt(m.funding_goal as number | bigint),
    total_raised: BigInt(m.total_raised as number | bigint),
    contributor_count: Number(m.contributor_count),
    created_at: BigInt(m.created_at as number | bigint),
    deadline: BigInt(m.deadline as number | bigint),
    status,
  };
}

function parseDonationRecord(m: Record<string, unknown>): DonationRecord {
  return {
    campaign_id: Number(m.campaign_id),
    donor: m.donor as string,
    amount: BigInt(m.amount as number | bigint),
    timestamp: BigInt(m.timestamp as number | bigint),
  };
}

async function readCall<T>(
  method: string,
  args: ReturnType<typeof nativeToScVal>[],
  parse: (v: ReturnType<typeof scValToNative>) => T,
): Promise<T> {
  const tx = await AssembledTransaction.build<T>({
    method,
    args,
    contractId: CONTRACT_ID,
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
    rpcUrl: STELLAR_RPC_URL,
    parseResultXdr: (v) => parse(scValToNative(v)),
  });
  return tx.result;
}

async function writeCall<T>(
  method: string,
  args: ReturnType<typeof nativeToScVal>[],
  publicKey: string,
  parse: (v: ReturnType<typeof scValToNative>) => T,
): Promise<AssembledTransaction<T>> {
  return AssembledTransaction.build<T>({
    method,
    args,
    contractId: CONTRACT_ID,
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
    rpcUrl: STELLAR_RPC_URL,
    publicKey,
    signTransaction: (xdrStr: string, opts?: { networkPassphrase?: string; address?: string }) =>
      signTransaction(xdrStr, {
        networkPassphrase: opts?.networkPassphrase ?? STELLAR_NETWORK_PASSPHRASE,
        address: opts?.address ?? publicKey,
      }),
    parseResultXdr: (v) => parse(scValToNative(v)),
  });
}

export async function getCampaign(
  campaignId: number,
): Promise<CampaignData> {
  return readCall("get_campaign", [scvU32(campaignId)], (v) =>
    parseCampaignData(v as Record<string, unknown>),
  );
}

export async function getAllCampaigns(): Promise<CampaignData[]> {
  return readCall("get_all_campaigns", [], (v) => {
    const arr = v as Record<string, unknown>[];
    return arr.map((m) => parseCampaignData(m));
  });
}

export async function getRecentDonations(
  campaignId: number,
  limit: number = 20,
): Promise<DonationRecord[]> {
  return readCall(
    "get_recent_donations",
    [scvU32(campaignId), scvU32(limit)],
    (v) => {
      const arr = v as Record<string, unknown>[];
      return arr.map((m) => parseDonationRecord(m));
    },
  );
}

export async function getContributors(
  campaignId: number,
): Promise<string[]> {
  return readCall("get_contributors", [scvU32(campaignId)], (v) => {
    return v as string[];
  });
}

export async function getContributor(
  campaignId: number,
  contributor: string,
): Promise<bigint> {
  return readCall(
    "get_contributor",
    [scvU32(campaignId), scvAddress(contributor)],
    (v) => BigInt(v as number | bigint),
  );
}

export async function createCampaign(
  publicKey: string,
  name: string,
  description: string,
  fundingGoal: bigint,
  deadline: bigint,
): Promise<AssembledTransaction<number>> {
  return writeCall(
    "create_campaign",
    [
      scvAddress(publicKey),
      scvString(name),
      scvString(description),
      scvI128(fundingGoal),
      scvU64(deadline),
    ],
    publicKey,
    (v) => Number(v),
  );
}

export async function donate(
  publicKey: string,
  campaignId: number,
  amount: bigint,
): Promise<AssembledTransaction<void>> {
  return writeCall(
    "donate",
    [scvU32(campaignId), scvAddress(publicKey), scvI128(amount)],
    publicKey,
    () => undefined,
  );
}

export async function withdrawFunds(
  publicKey: string,
  campaignId: number,
): Promise<AssembledTransaction<void>> {
  return writeCall(
    "withdraw_funds",
    [scvU32(campaignId)],
    publicKey,
    () => undefined,
  );
}

export async function refund(
  publicKey: string,
  campaignId: number,
  contributor: string,
): Promise<AssembledTransaction<void>> {
  return writeCall(
    "refund",
    [scvU32(campaignId), scvAddress(contributor)],
    publicKey,
    () => undefined,
  );
}

export async function closeCampaign(
  publicKey: string,
  campaignId: number,
): Promise<AssembledTransaction<void>> {
  return writeCall(
    "close_campaign",
    [scvU32(campaignId)],
    publicKey,
    () => undefined,
  );
}

export function createReadOnlyClient() {
  return {
    getCampaign,
    getAllCampaigns,
    getRecentDonations,
    getContributors,
    getContributor,
  };
}

export function createSigningClient(publicKey: string) {
  return {
    createCampaign: (
      name: string,
      description: string,
      fundingGoal: bigint,
      deadline: bigint,
    ) => createCampaign(publicKey, name, description, fundingGoal, deadline),
    donate: (campaignId: number, amount: bigint) =>
      donate(publicKey, campaignId, amount),
    withdrawFunds: (campaignId: number) =>
      withdrawFunds(publicKey, campaignId),
    refund: (campaignId: number, contributor: string) =>
      refund(publicKey, campaignId, contributor),
    closeCampaign: (campaignId: number) =>
      closeCampaign(publicKey, campaignId),
  };
}
