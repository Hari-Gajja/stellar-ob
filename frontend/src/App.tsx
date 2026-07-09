import { motion } from "framer-motion";
import { ArrowRight, Copy, ExternalLink, Sparkles, Wallet, Loader2, LogOut } from "lucide-react";
import { useMemo, useState, useEffect, useCallback } from "react";
import { connectWallet, disconnectWallet, getStoredAddress, STELLAR_NETWORK_PASSPHRASE, STELLAR_RPC_URL } from "./services/wallet";
import { createCrowdfundingClient } from "./services/contract";
import { Client as CrowdfundingClient, CampaignData, DonationRecord } from "./services/generated/crowdfunding/src/index";
import { truncateAddress } from "./utils/format";
const contractId = import.meta.env.VITE_CONTRACT_ID || "CDWWUENTA4JTHXGHHORU6HZ2KDNJFKC6WP6O5EN2WF2MLWMMCES7BYWZ";
const readOnlyClient = new CrowdfundingClient({
  contractId,
  networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
  rpcUrl: STELLAR_RPC_URL,
});
function formatRelativeTime(timestampSeconds: bigint) {
  const diffMs = Date.now() - Number(timestampSeconds) * 1000;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffSec < 10) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${diffDay}d ago`;
}
function App() {
  const [address, setAddress] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [donating, setDonating] = useState(false);
  const [donateAmount, setDonateAmount] = useState("");
  // Try to restore a previously connected wallet on mount
  useEffect(() => {
    getStoredAddress().then((addr) => {
      if (addr) setAddress(addr);
    });
  }, []);
  const loadData = useCallback(async () => {
    try {
      const campaignTx = await readOnlyClient.get_campaign();
      setCampaign(campaignTx.result);
      const donationsTx = await readOnlyClient.get_recent_donations({ limit: 10 });
      const sortedDonations = [...donationsTx.result].sort((a, b) => Number(b.timestamp - a.timestamp));
      setDonations(sortedDonations);
    } catch (err) {
      console.error("Error loading contract data:", err);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);
  const handleConnectWallet = async () => {
    if (connecting) return;
    setConnecting(true);
    try {
      const addr = await connectWallet();
      setAddress(addr);
    } catch (err) {
      console.error("Wallet connection failed:", err);
      alert("Connection failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setConnecting(false);
    }
  };
  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      setAddress(null);
    } catch (err) {
      console.error("Disconnect failed:", err);
    }
  };
  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donateAmount || isNaN(Number(donateAmount)) || Number(donateAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    // If not connected, prompt wallet connection first
    if (!address) {
      await handleConnectWallet();
      return;
    }
    try {
      setDonating(true);
      const client = createCrowdfundingClient(contractId, address);
      // Convert XLM amount to stroops (7 decimals)
      const stroops = BigInt(Math.floor(Number(donateAmount) * 10_000_000));
      const txId = "tx-" + Math.random().toString(36).substring(2, 11);
      const tx = await client.donate({
        donor: address,
        amount: stroops,
        transaction_id: txId,
      });
      await tx.signAndSend();
      setDonateAmount("");
      alert("Thank you for your donation!");
      await loadData();
    } catch (err) {
      console.error("Donation failed:", err);
      alert("Donation failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setDonating(false);
    }
  };
  const progress = useMemo(() => {
    if (!campaign || campaign.funding_goal === 0n) return 0;
    const goal = Number(campaign.funding_goal);
    const raised = Number(campaign.total_raised);
    return Math.min(100, Math.round((raised / goal) * 100));
  }, [campaign]);
  const stats = useMemo(() => {
    if (!campaign) {
      return [
        { label: "Goal", value: "0 XLM" },
        { label: "Raised", value: "0 XLM" },
        { label: "Contributors", value: "0" },
        { label: "Days left", value: "0" },
      ];
    }
    const createdTime = Number(campaign.created_at) * 1000;
    const endTime = createdTime + 30 * 24 * 60 * 60 * 1000;
    const timeLeft = endTime - Date.now();
    const daysLeft = Math.max(0, Math.ceil(timeLeft / (24 * 60 * 60 * 1000)));
    const goalXlm = Number(campaign.funding_goal) / 10_000_000;
    const raisedXlm = Number(campaign.total_raised) / 10_000_000;
    return [
      { label: "Goal", value: `${goalXlm.toLocaleString()} XLM` },
      { label: "Raised", value: `${raisedXlm.toLocaleString()} XLM` },
      { label: "Contributors", value: String(campaign.contributor_count) },
      { label: "Days left", value: String(daysLeft) },
    ];
  }, [campaign]);
  const handleCopyContract = () => {
    navigator.clipboard.writeText(contractId);
    alert("Contract address copied!");
  };
  const handleViewExplorer = () => {
    window.open(`https://stellar.expert/explorer/testnet/contract/${contractId}`, "_blank");
  };
  return (
    <div className="min-h-screen bg-white text-zinc-950">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 pb-10 pt-5 lg:px-10">
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 text-sm">
          <div>
            <p className="font-semibold tracking-tight">StellarFund</p>
          </div>
          <nav className="hidden gap-6 text-zinc-600 md:flex">
            <a href="#campaign" className="transition hover:text-zinc-950">Campaign</a>
            <a href="#donate" className="transition hover:text-zinc-950">Donate</a>
            <a href="#activity" className="transition hover:text-zinc-950">Activity</a>
          </nav>
          <div className="flex items-center gap-2">
            {address ? (
              <>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {truncateAddress(address)}
                </span>
                <button
                  onClick={handleDisconnect}
                  className="inline-flex items-center gap-1 rounded-full border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                  title="Disconnect wallet"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <button
                onClick={handleConnectWallet}
                disabled={connecting}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-900 px-4 py-2 text-sm font-medium transition hover:bg-zinc-950 hover:text-white disabled:opacity-50"
              >
                {connecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wallet className="h-4 w-4" />
                )}
                {connecting ? "Connecting..." : "Connect wallet"}
              </button>
            )}
          </div>
        </header>
        <main className="grid flex-1 gap-10 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-16">
          <section className="max-w-2xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.24em] text-zinc-500">Soroban crowdfunding on Testnet</p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl"
            >
              Fund ideas.
              <br />
              Build together.
              <br />
              On Stellar.
            </motion.h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-zinc-600 md:text-lg">Support open-source work with a clean, transparent crowdfunding flow powered by a Soroban smart contract.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#campaign" className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-zinc-800">
                Launch app
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#learn-more" className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-950 transition hover:border-zinc-950">
                Learn more
              </a>
            </div>
          </section>
          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 shadow-soft"
            id="campaign"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-zinc-500">Campaign overview</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  {loading ? "Loading campaign..." : campaign?.name || "Open source tooling fund"}
                </h2>
              </div>
              <Sparkles className="h-5 w-5 text-zinc-500" />
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-600">
              {loading ? "Loading description..." : campaign?.description || "A compact, crowdfunding flow powered by Soroban."}
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-zinc-600">
                  <span>Raised</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-200">
                  <div className="h-2 rounded-full bg-zinc-950" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {stats.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-zinc-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{item.label}</p>
                    <p className="mt-2 text-lg font-semibold tracking-tight">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <button
                onClick={handleCopyContract}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-900 px-4 py-2 font-medium transition hover:bg-zinc-950 hover:text-white"
              >
                <Copy className="h-4 w-4" />
                Copy contract
              </button>
              <button
                onClick={handleViewExplorer}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-4 py-2 font-medium transition hover:border-zinc-950"
              >
                <ExternalLink className="h-4 w-4" />
                View explorer
              </button>
            </div>
          </motion.aside>
        </main>
        <section className="grid gap-6 border-t border-zinc-200 py-10 lg:grid-cols-[1fr_1fr]">
          <div id="donate" className="rounded-3xl border border-zinc-200 p-6">
            <p className="text-sm uppercase tracking-[0.22em] text-zinc-500">Donation form</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">Donate XLM</h3>
            <form onSubmit={handleDonate} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Amount (XLM)</span>
                <input
                  type="number"
                  step="any"
                  min="0.0000001"
                  value={donateAmount}
                  onChange={(e) => setDonateAmount(e.target.value)}
                  placeholder="0.00"
                  disabled={donating}
                  className="w-full rounded-2xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-zinc-950 disabled:opacity-50"
                  required
                />
              </label>
              <button
                type="submit"
                disabled={donating}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
              >
                {donating && <Loader2 className="h-4 w-4 animate-spin" />}
                {donating ? "Processing..." : address ? "Donate now" : "Connect wallet & Donate"}
              </button>
            </form>
          </div>
          <div id="activity" className="rounded-3xl border border-zinc-200 p-6">
            <p className="text-sm uppercase tracking-[0.22em] text-zinc-500">Recent donations</p>
            <div className="mt-4 space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {loading ? (
                <p className="text-sm text-zinc-500">Loading donations...</p>
              ) : donations.length === 0 ? (
                <p className="text-sm text-zinc-500">No donations yet. Be the first to contribute!</p>
              ) : (
                donations.map((donation) => (
                  <div key={donation.transaction_id} className="flex items-center justify-between border-b border-zinc-100 pb-4 last:border-b-0 last:pb-0">
                    <div>
                      <p className="font-medium">{truncateAddress(donation.donor)}</p>
                      <p className="text-sm text-zinc-500">{formatRelativeTime(donation.timestamp)}</p>
                    </div>
                    <p className="text-sm font-semibold">{(Number(donation.amount) / 10_000_000).toLocaleString()} XLM</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
        <footer className="flex flex-col gap-3 border-t border-zinc-200 py-6 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between">
          <p>Built for Stellar Yellow Belt Level 2.</p>
          <div className="flex gap-4">
            <a href="#campaign" className="transition hover:text-zinc-950">Campaign</a>
            <a href="#donate" className="transition hover:text-zinc-950">Donate</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
export default App;
