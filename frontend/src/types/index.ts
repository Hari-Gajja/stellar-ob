export interface CampaignData {
  name: string;
  description: string;
  funding_goal: bigint;
  total_raised: bigint;
  contributor_count: number;
  owner: string;
  created_at: bigint;
  goal_reached: boolean;
}

export interface DonationRecord {
  donor: string;
  amount: bigint;
  timestamp: bigint;
  transaction_id: string;
}

export interface CampaignInitializedEvent {
  owner: string;
  name: string;
  funding_goal: bigint;
  timestamp: bigint;
}

export interface DonationReceivedEvent {
  donor: string;
  amount: bigint;
  timestamp: bigint;
  transaction_id: string;
}

export interface CampaignGoalReachedEvent {
  total_raised: bigint;
  funding_goal: bigint;
  timestamp: bigint;
}

export interface ContractError {
  code: number;
  message: string;
}

export type TransactionStatus = 
  | 'idle'
  | 'signing'
  | 'submitting'
  | 'pending'
  | 'confirmed'
  | 'failed';

export interface TransactionState {
  status: TransactionStatus;
  hash?: string;
  error?: string;
  timestamp?: number;
}

export interface WalletInfo {
  name: string;
  address: string;
  icon?: string;
  installed: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface NetworkConfig {
  networkPassphrase: string;
  rpcUrl: string;
  contractId: string;
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