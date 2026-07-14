export type CampaignStatus = "Active" | "Successful" | "Failed" | "Closed";

export interface CampaignData {
  id: number;
  owner: string;
  name: string;
  description: string;
  funding_goal: bigint;
  total_raised: bigint;
  contributor_count: number;
  created_at: bigint;
  deadline: bigint;
  status: CampaignStatus;
}

export function isActive(status: CampaignStatus): boolean {
  return status === "Active";
}

export function canDonate(status: CampaignStatus): boolean {
  return status === "Active";
}

export function canWithdraw(status: CampaignStatus): boolean {
  return status === "Successful";
}

export function canRefund(status: CampaignStatus): boolean {
  return status === "Failed" || status === "Closed";
}

export interface DonationRecord {
  campaign_id: number;
  donor: string;
  amount: bigint;
  timestamp: bigint;
}

export interface CampaignCreatedEvent {
  owner: string;
  campaign_id: number;
  name: string;
  funding_goal: bigint;
  deadline: bigint;
  timestamp: bigint;
}

export interface DonationReceivedEvent {
  campaign_id: number;
  donor: string;
  amount: bigint;
  timestamp: bigint;
}

export interface CampaignClosedEvent {
  campaign_id: number;
  status: CampaignStatus;
  timestamp: bigint;
}

export interface FundsWithdrawnEvent {
  campaign_id: number;
  owner: string;
  amount: bigint;
  timestamp: bigint;
}

export interface RefundIssuedEvent {
  campaign_id: number;
  contributor: string;
  amount: bigint;
  timestamp: bigint;
}

export type ContractEvent =
  | CampaignCreatedEvent
  | DonationReceivedEvent
  | CampaignClosedEvent
  | FundsWithdrawnEvent
  | RefundIssuedEvent;

export interface ContractError {
  code: number;
  message: string;
}

export type TransactionStatus =
  | "idle"
  | "signing"
  | "submitting"
  | "pending"
  | "confirmed"
  | "failed";

export interface TransactionState {
  status: TransactionStatus;
  hash?: string;
  error?: string;
  timestamp?: number;
}

export type TransactionAction = "donate" | "withdraw" | "refund" | "create" | "close";

export interface WalletInfo {
  name: string;
  address: string;
  icon?: string;
  installed: boolean;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
}

export interface NetworkConfig {
  networkPassphrase: string;
  rpcUrl: string;
  crowdfundingId: string;
  treasuryId: string;
}

export interface DonationFormData {
  amount: string;
  isValid: boolean;
  error?: string;
}

export interface DonationProgress {
  percentage: number;
  goalXlm: number;
  raisedXlm: number;
  contributors: number;
  daysLeft: number;
}

export interface CreateCampaignForm {
  title: string;
  description: string;
  goalAmount: string;
  deadline: string;
  category?: string;
}

export type SortOption = "newest" | "most_funded" | "ending_soon";
export type FilterOption = "all" | "active" | "completed" | "expired" | "closed";
