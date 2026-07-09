import { Client as CrowdfundingClient } from "./generated/crowdfunding/src/index";
import { STELLAR_NETWORK_PASSPHRASE, STELLAR_RPC_URL, signTransaction } from "./wallet";
/**
 * Creates a CrowdfundingClient wired to the user's connected wallet for signing.
 * The signTransaction callback delegates to the Stellar Wallets Kit, which
 * routes to whichever wallet the user selected (Freighter, xBull, Albedo, etc.).
 */
export function createCrowdfundingClient(contractId: string, publicKey: string) {
  return new CrowdfundingClient({
    contractId,
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
    rpcUrl: STELLAR_RPC_URL,
    publicKey,
    signTransaction: (xdr: string, opts?: { networkPassphrase?: string; address?: string }) => {
      return signTransaction(xdr, {
        networkPassphrase: opts?.networkPassphrase ?? STELLAR_NETWORK_PASSPHRASE,
        address: opts?.address ?? publicKey,
      });
    },
  });
}
