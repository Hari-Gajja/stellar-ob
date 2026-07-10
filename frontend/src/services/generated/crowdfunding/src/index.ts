import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
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
    contractId: "CCYJOPGDQSZ2XVR4QCP67RAIFZRVDNXVYT2LRO2U4AJ2XL5D66M3PDYX",
  },
} as const;

export interface CampaignData {
  id: u32;
  owner: string;
  name: string;
  description: string;
  funding_goal: i128;
  total_raised: i128;
  contributor_count: u32;
  created_at: u64;
  deadline: u64;
  active: boolean;
}

export const ContractError = {
  1: { message: "AlreadyInitialized" },
  2: { message: "NotInitialized" },
  3: { message: "Unauthorized" },
  4: { message: "InvalidAmount" },
  5: { message: "InvalidGoal" },
  6: { message: "CampaignNotFound" },
  7: { message: "CampaignClosed" },
  8: { message: "CampaignExpired" },
};

export interface DonationRecord {
  campaign_id: u32;
  donor: string;
  amount: i128;
  timestamp: u64;
}

export interface DonationReceivedEvent {
  campaign_id: u32;
  donor: string;
  amount: i128;
  timestamp: u64;
}

export interface CampaignCreatedEvent {
  campaign_id: u32;
  owner: string;
  name: string;
  funding_goal: i128;
  deadline: u64;
  timestamp: u64;
}

export interface CampaignClosedEvent {
  campaign_id: u32;
  timestamp: u64;
}

export interface Client {
  initialize: (
    options?: MethodOptions,
  ) => Promise<AssembledTransaction<null>>;
  create_campaign: (
    {
      owner,
      name,
      description,
      funding_goal,
      deadline,
    }: {
      owner: string;
      name: string;
      description: string;
      funding_goal: i128;
      deadline: i128;
    },
    options?: MethodOptions,
  ) => Promise<AssembledTransaction<u32>>;
  donate: (
    {
      campaign_id,
      donor,
      amount,
    }: { campaign_id: u32; donor: string; amount: i128 },
    options?: MethodOptions,
  ) => Promise<AssembledTransaction<null>>;
  close_campaign: (
    { campaign_id }: { campaign_id: u32 },
    options?: MethodOptions,
  ) => Promise<AssembledTransaction<null>>;
  get_campaign: (
    { campaign_id }: { campaign_id: u32 },
    options?: MethodOptions,
  ) => Promise<AssembledTransaction<CampaignData>>;
  get_all_campaigns: (
    options?: MethodOptions,
  ) => Promise<AssembledTransaction<Array<CampaignData>>>;
  get_recent_donations: (
    { campaign_id, limit }: { campaign_id: u32; limit: u32 },
    options?: MethodOptions,
  ) => Promise<AssembledTransaction<Array<DonationRecord>>>;
  get_contributors: (
    { campaign_id }: { campaign_id: u32 },
    options?: MethodOptions,
  ) => Promise<AssembledTransaction<Array<string>>>;
}

export class Client extends ContractClient {
  static async deploy<T = Client>(
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        wasmHash: Buffer | string;
        salt?: Buffer | Uint8Array;
        format?: "hex" | "base64";
      },
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options);
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([
        "AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAAAAAAAAAAAAA=",
        "AAAAAAAAAAAAAAAPY3JlYXRlX2NhbXBhaWduAAAAAAUAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAAEbmFtZQAAABAAAAAAAAAAC2Rlc2NyaXB0aW9uAAAAAAAQAAAAAAAAAAxmdW5kaW5nX2dvYWwAAAALAAAAAAAAAAhkZWFkbGluZQAAAAAADAAAAAABAAAABAAAAA==",
        "AAAAAAAAAAAAAAAGZG9uYXRlAAAAAAADAAAAAAAAAAtjYW1wYWlnbl9pZAAAAAAABAAAAAAAAAAFZG9ub3IAAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAA",
        "AAAAAAAAAAAAAAAOY2xvc2VfY2FtcGFpZ24AAAABAAAAAAAAAAtjYW1wYWlnbl9pZAAAAAAABAAAAAAAAAA=",
        "AAAAAQAAAAAAAAAAAAAADENhbXBhaWduRGF0YQAAAAAAAAoAAAAAAAAAAmlkAAAAAAAABAAAAAAAAAAFb3duZXIAAAAAAAATAAAAAAAAAARuYW1lAAAAEAAAAAAAAAALZGVzY3JpcHRpb24AAAAQAAAAAAAAAAxmdW5kaW5nX2dvYWwAAAALAAAAAAAAAAx0b3RhbF9yYWlzZWQAAAALAAAAAAAAABFjb250cmlidXRvcl9jb3VudAAAAAAAAAQAAAAAAAAACmNyZWF0ZWRfYXQAAAAABgAAAAAAAAAIZGVhZGxpbmUAAAAABgAAAAAAAAAGYWN0aXZlAAAAAAE=",
        "AAAAAAAAAAAAAAANZ2V0X2NhbXBhaWduAAAAAAEAAAAAAAAAC2NhbXBhaWduX2lkAAAAAAAEAAAAAAAH0AAAAAxDYW1wYWlnbkRhdGE=",
        "AAAAAAAAAAAAAAASZ2V0X2FsbF9jYW1wYWlnbnMAAAAAAAAAAQAAA+gAAAfQAAAADENhbXBhaWduRGF0YQ==",
        "AAAAAQAAAAAAAAAAAAAADkRvbmF0aW9uUmVjb3JkAAAAAAAEAAAAAAAAAAtjYW1wYWlnbl9pZAAAAAAABAAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAVkb25vcgAAAAAAABMAAAAAAAAACXRpbWVzdGFtcAAAAAAAAAY=",
        "AAAAAAAAAAAAAAAVZ2V0X3JlY2VudF9kb25hdGlvbnMAAAACAAAAAAAAAAtjYW1wYWlnbl9pZAAAAAAABAAAAAAAAAAFbGltaXQAAAAAAAAEAAAAAAEAAAPoAAAH0AAAAA5Eb25hdGlvblJlY29yZA==",
        "AAAAAAAAAAAAAAARZ2V0X2NvbnRyaWJ1dG9ycwAAAAABAAAAAAAAAAtjYW1wYWlnbl9pZAAAAAAABAAAAAABAAAAEw==",
        "AAAABAAAAAAAAAAAAAAADUNvbnRyYWN0RXJyb3IAAAAAAAAIAAAAAAAAABJBbHJlYWR5SW5pdGlhbGl6ZWQAAAAAAAEAAAAAAAAADk5vdEluaXRpYWxpemVkAAAAAAACAAAAAAAAAAxVbmF1dGhvcml6ZWQAAAADAAAAAAAAAA1JbnZhbGlkQW1vdW50AAAAAAAABAAAAAAAAAALSW52YWxpZEdvYWwAAAAABQAAAAAAAAAPQ2FtcGFpZ25Ob3RGb3VuZAAAAAYAAAAAAAAADkNhbXBhaWduQ2xvc2VkAAAAAAAHAAAAAAAAAA9DYW1wYWlnbkV4cGlyZWQAAAAAAAg=",
        "AAAAAQAAAAAAAAAAAAAAGUNhbXBhaWduQ3JlYXRlZEV2ZW50AAAAAAUAAAAAAAAAC2NhbXBhaWduX2lkAAAAAAAEAAAAAAAAAAVvd25lcgAAAAAAABMAAAAAAAAABG5hbWUAAAAQAAAAAAAAAAxmdW5kaW5nX2dvYWwAAAALAAAAAAAAAAhkZWFkbGluZQAAAAAADAAAAAAAAAAJdGltZXN0YW1wAAAAAAAABg==",
        "AAAAAQAAAAAAAAAAAAAAGURvbmF0aW9uUmVjZWl2ZWRFdmVudAAAAAAAAAMAAAAAAAAAC2NhbXBhaWduX2lkAAAAAAAEAAAAAAAAAAVkb25vcgAAAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAJdGltZXN0YW1wAAAAAAAABg==",
        "AAAAAQAAAAAAAAAAAAAAGENhbXBhaWduQ2xvc2VkRXZlbnQAAAACAAAAAAAAAAtjYW1wYWlnbl9pZAAAAAAABAAAAAAAAAAJdGltZXN0YW1wAAAAAAAABg==",
      ]),
      options,
    );
  }
  public readonly fromJSON = {
    initialize: this.txFromJSON<null>,
    create_campaign: this.txFromJSON<u32>,
    donate: this.txFromJSON<null>,
    close_campaign: this.txFromJSON<null>,
    get_campaign: this.txFromJSON<CampaignData>,
    get_all_campaigns: this.txFromJSON<Array<CampaignData>>,
    get_recent_donations: this.txFromJSON<Array<DonationRecord>>,
    get_contributors: this.txFromJSON<Array<string>>,
  };
}
