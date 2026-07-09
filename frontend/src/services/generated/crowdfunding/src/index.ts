import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CDWWUENTA4JTHXGHHORU6HZ2KDNJFKC6WP6O5EN2WF2MLWMMCES7BYWZ",
  }
} as const


export interface CampaignData {
  contributor_count: u32;
  created_at: u64;
  description: string;
  funding_goal: i128;
  goal_reached: boolean;
  name: string;
  owner: string;
  total_raised: i128;
}

export const ContractError = {
  1: {message:"AlreadyInitialized"},
  2: {message:"NotInitialized"},
  3: {message:"Unauthorized"},
  4: {message:"InvalidAmount"},
  5: {message:"InvalidGoal"}
}


export interface DonationRecord {
  amount: i128;
  donor: string;
  timestamp: u64;
  transaction_id: string;
}


export interface DonationReceivedEvent {
  amount: i128;
  donor: string;
  timestamp: u64;
  transaction_id: string;
}


export interface CampaignGoalReachedEvent {
  funding_goal: i128;
  timestamp: u64;
  total_raised: i128;
}


export interface CampaignInitializedEvent {
  funding_goal: i128;
  name: string;
  owner: string;
  timestamp: u64;
}

export interface Client {
  /**
   * Construct and simulate a donate transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  donate: ({donor, amount, transaction_id}: {donor: string, amount: i128, transaction_id: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_total transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_total: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_campaign transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_campaign: (options?: MethodOptions) => Promise<AssembledTransaction<CampaignData>>

  /**
   * Construct and simulate a initialize_campaign transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  initialize_campaign: ({owner, name, description, funding_goal}: {owner: string, name: string, description: string, funding_goal: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_recent_donations transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_recent_donations: ({limit}: {limit: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Array<DonationRecord>>>

  /**
   * Construct and simulate a get_contributor_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_contributor_count: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAAAAAAAAGZG9uYXRlAAAAAAADAAAAAAAAAAVkb25vcgAAAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAOdHJhbnNhY3Rpb25faWQAAAAAABAAAAAA",
        "AAAAAAAAAAAAAAAJZ2V0X3RvdGFsAAAAAAAAAAAAAAEAAAAL",
        "AAAAAQAAAAAAAAAAAAAADENhbXBhaWduRGF0YQAAAAgAAAAAAAAAEWNvbnRyaWJ1dG9yX2NvdW50AAAAAAAABAAAAAAAAAAKY3JlYXRlZF9hdAAAAAAABgAAAAAAAAALZGVzY3JpcHRpb24AAAAAEAAAAAAAAAAMZnVuZGluZ19nb2FsAAAACwAAAAAAAAAMZ29hbF9yZWFjaGVkAAAAAQAAAAAAAAAEbmFtZQAAABAAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAAMdG90YWxfcmFpc2VkAAAACw==",
        "AAAABAAAAAAAAAAAAAAADUNvbnRyYWN0RXJyb3IAAAAAAAAFAAAAAAAAABJBbHJlYWR5SW5pdGlhbGl6ZWQAAAAAAAEAAAAAAAAADk5vdEluaXRpYWxpemVkAAAAAAACAAAAAAAAAAxVbmF1dGhvcml6ZWQAAAADAAAAAAAAAA1JbnZhbGlkQW1vdW50AAAAAAAABAAAAAAAAAALSW52YWxpZEdvYWwAAAAABQ==",
        "AAAAAAAAAAAAAAAMZ2V0X2NhbXBhaWduAAAAAAAAAAEAAAfQAAAADENhbXBhaWduRGF0YQ==",
        "AAAAAQAAAAAAAAAAAAAADkRvbmF0aW9uUmVjb3JkAAAAAAAEAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAABWRvbm9yAAAAAAAAEwAAAAAAAAAJdGltZXN0YW1wAAAAAAAABgAAAAAAAAAOdHJhbnNhY3Rpb25faWQAAAAAABA=",
        "AAAAAAAAAAAAAAATaW5pdGlhbGl6ZV9jYW1wYWlnbgAAAAAEAAAAAAAAAAVvd25lcgAAAAAAABMAAAAAAAAABG5hbWUAAAAQAAAAAAAAAAtkZXNjcmlwdGlvbgAAAAAQAAAAAAAAAAxmdW5kaW5nX2dvYWwAAAALAAAAAA==",
        "AAAAAQAAAAAAAAAAAAAAFURvbmF0aW9uUmVjZWl2ZWRFdmVudAAAAAAAAAQAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAFZG9ub3IAAAAAAAATAAAAAAAAAAl0aW1lc3RhbXAAAAAAAAAGAAAAAAAAAA50cmFuc2FjdGlvbl9pZAAAAAAAEA==",
        "AAAAAAAAAAAAAAAUZ2V0X3JlY2VudF9kb25hdGlvbnMAAAABAAAAAAAAAAVsaW1pdAAAAAAAAAQAAAABAAAD6gAAB9AAAAAORG9uYXRpb25SZWNvcmQAAA==",
        "AAAAAAAAAAAAAAAVZ2V0X2NvbnRyaWJ1dG9yX2NvdW50AAAAAAAAAAAAAAEAAAAE",
        "AAAAAQAAAAAAAAAAAAAAGENhbXBhaWduR29hbFJlYWNoZWRFdmVudAAAAAMAAAAAAAAADGZ1bmRpbmdfZ29hbAAAAAsAAAAAAAAACXRpbWVzdGFtcAAAAAAAAAYAAAAAAAAADHRvdGFsX3JhaXNlZAAAAAs=",
        "AAAAAQAAAAAAAAAAAAAAGENhbXBhaWduSW5pdGlhbGl6ZWRFdmVudAAAAAQAAAAAAAAADGZ1bmRpbmdfZ29hbAAAAAsAAAAAAAAABG5hbWUAAAAQAAAAAAAAAAVvd25lcgAAAAAAABMAAAAAAAAACXRpbWVzdGFtcAAAAAAAAAY=" ]),
      options
    )
  }
  public readonly fromJSON = {
    donate: this.txFromJSON<null>,
        get_total: this.txFromJSON<i128>,
        get_campaign: this.txFromJSON<CampaignData>,
        initialize_campaign: this.txFromJSON<null>,
        get_recent_donations: this.txFromJSON<Array<DonationRecord>>,
        get_contributor_count: this.txFromJSON<u32>
  }
}