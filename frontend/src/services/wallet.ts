import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";
import { Horizon } from "@stellar/stellar-sdk";
export const STELLAR_NETWORK_PASSPHRASE =
  import.meta.env.VITE_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";
export const STELLAR_RPC_URL =
  import.meta.env.VITE_RPC_URL ?? "https://soroban-testnet.stellar.org";
export const STELLAR_HORIZON_URL =
  import.meta.env.VITE_HORIZON_URL ?? "https://horizon-testnet.stellar.org";
// Initialize the kit with all default wallet modules (Freighter, xBull, Albedo, etc.)
StellarWalletsKit.init({
  modules: defaultModules(),
});
/**
 * Opens the Stellar Wallets Kit auth modal, allowing the user to pick a wallet,
 * connect it, and return the active address.
 */
export async function connectWallet(): Promise<string> {
  const { address } = await StellarWalletsKit.authModal();
  return address;
}
/**
 * Attempts to retrieve the currently connected address from kit memory,
 * without re-prompting the user. Returns null if no wallet is connected.
 */
export async function getStoredAddress(): Promise<string | null> {
  try {
    const { address } = await StellarWalletsKit.getAddress();
    return address || null;
  } catch {
    return null;
  }
}
/**
 * Disconnects the currently connected wallet and clears kit memory.
 */
export async function disconnectWallet(): Promise<void> {
  await StellarWalletsKit.disconnect();
}
/**
 * Signs a Soroban transaction XDR using the currently selected wallet module.
 * This function signature matches the `SignTransaction` type expected by
 * `@stellar/stellar-sdk/contract` ClientOptions.
 */
export interface Balance {
  asset_type: string;
  balance: string;
  asset_code?: string;
  asset_issuer?: string;
}

export async function getAccountBalances(publicKey: string): Promise<Balance[]> {
  const server = new Horizon.Server(STELLAR_HORIZON_URL);
  const account = await server.loadAccount(publicKey);
  return account.balances as Balance[];
}

export async function signTransaction(
  xdr: string,
  opts?: { networkPassphrase?: string; address?: string }
): Promise<{ signedTxXdr: string; signerAddress?: string }> {
  const result = await StellarWalletsKit.signTransaction(xdr, {
    networkPassphrase: opts?.networkPassphrase ?? STELLAR_NETWORK_PASSPHRASE,
    address: opts?.address,
  });
  return result;
}