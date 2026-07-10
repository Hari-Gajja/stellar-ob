import { motion } from "framer-motion";
import { ArrowLeft, Users, Clock, Target, Loader2, ExternalLink, Copy, CheckCircle, Wallet, XCircle, Sparkles } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWallet, useTransaction, useToast } from "../contexts/AppContext";
import { getCampaign, getRecentDonations, donate, CONTRACT_ID } from "../services/contract";
import { truncateAddress, stroopsToXlm, xlmToStroops } from "../utils/format";
import TransactionStatus from "../components/TransactionStatus";
import type { CampaignData, DonationRecord } from "../types";

function formatRelativeTime(timestampSeconds: bigint): string {
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

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const campaignId = Number(id);
  const { address, connect } = useWallet();
  const { state: txState, donate: donateTx, reset: resetTx } = useTransaction();
  const toast = useToast();

  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [donateAmount, setDonateAmount] = useState("");
  const [copied, setCopied] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const loadData = useCallback(async () => {
    if (!campaignId) return;
    try {
      const [c, d] = await Promise.all([
        getCampaign(campaignId),
        getRecentDonations(campaignId, 20),
      ]);
      setCampaign(c);
      setDonations(d.sort((a, b) => Number(b.timestamp - a.timestamp)));
    } catch (err) {
      console.error("Failed to load campaign:", err);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    if (campaign && address) {
      setIsOwner(campaign.owner === address);
    }
  }, [campaign, address]);

  useEffect(() => {
    return () => resetTx();
  }, [resetTx]);

  const progress = useMemo(() => {
    if (!campaign || campaign.funding_goal === 0n) return 0;
    return Math.min(100, Math.round((Number(campaign.total_raised) / Number(campaign.funding_goal)) * 100));
  }, [campaign]);

  const raisedXlm = campaign ? stroopsToXlm(campaign.total_raised) : 0;
  const goalXlm = campaign ? stroopsToXlm(campaign.funding_goal) : 0;
  const endTime = campaign ? Number(campaign.deadline) * 1000 : 0;
  const timeLeft = endTime - Date.now();
  const daysLeft = Math.max(0, Math.ceil(timeLeft / (24 * 60 * 60 * 1000)));
  const isExpired = endTime > 0 && Date.now() > endTime;
  const remainingXlm = Math.max(0, goalXlm - raisedXlm);

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(donateAmount);
    if (!donateAmount || isNaN(amount) || amount <= 0) {
      toast.error("Invalid amount", "Please enter a valid XLM amount");
      return;
    }
    if (!address) {
      await connect();
      return;
    }
    if (!campaign || !campaign.active) {
      toast.error("Campaign closed", "This campaign is no longer accepting donations");
      return;
    }
    if (isExpired) {
      toast.error("Campaign expired", "The deadline for this campaign has passed");
      return;
    }
    try {
      resetTx();
      await donateTx(address, campaignId, xlmToStroops(amount));
      toast.success("Donation successful!", `Thank you for donating ${amount} XLM`);
      setDonateAmount("");
      await loadData();
    } catch (err) {
      toast.error("Donation failed", err instanceof Error ? err.message : "Transaction failed");
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(CONTRACT_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied", "Contract address copied to clipboard");
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="py-20 text-center">
        <XCircle className="mx-auto h-8 w-8 text-zinc-300" />
        <p className="mt-4 text-lg font-medium text-zinc-500">Campaign not found</p>
        <button onClick={() => navigate("/")} className="mt-4 text-sm text-zinc-600 underline hover:text-zinc-950">
          Back to campaigns
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 py-8 lg:py-12">
      <button
        onClick={() => navigate("/")}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-950"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to campaigns
      </button>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="mb-2 text-sm font-medium uppercase tracking-[0.22em] text-zinc-500">
                Campaign #{campaign.id}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{campaign.name}</h1>
            </div>
            {!campaign.active && (
              <span className="rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-medium text-red-600">
                Closed
              </span>
            )}
            {campaign.active && isExpired && (
              <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-medium text-amber-600">
                Expired
              </span>
            )}
          </div>

          <p className="mt-4 text-base leading-7 text-zinc-600">{campaign.description}</p>

          <div className="mt-6 space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm text-zinc-600 mb-2">
                <span>{raisedXlm.toLocaleString()} XLM raised of {goalXlm.toLocaleString()} XLM</span>
                <span>{progress}%</span>
              </div>
              <div className="h-3 rounded-full bg-zinc-200 overflow-hidden">
                <div className="h-full rounded-full bg-zinc-950 transition-all duration-700" style={{ width: `${Math.min(100, progress)}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <Target className="mb-1 h-4 w-4 text-zinc-400" />
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Goal</p>
                <p className="mt-1 text-lg font-semibold tracking-tight">{goalXlm.toLocaleString()} XLM</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <CheckCircle className="mb-1 h-4 w-4 text-zinc-400" />
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Raised</p>
                <p className="mt-1 text-lg font-semibold tracking-tight">{raisedXlm.toLocaleString()} XLM</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <Users className="mb-1 h-4 w-4 text-zinc-400" />
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Supporters</p>
                <p className="mt-1 text-lg font-semibold tracking-tight">{campaign.contributor_count}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <Clock className="mb-1 h-4 w-4 text-zinc-400" />
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{daysLeft === 1 ? "Day left" : "Days left"}</p>
                <p className="mt-1 text-lg font-semibold tracking-tight">{daysLeft}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-zinc-50 border border-zinc-200 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Remaining to goal</span>
                <span className="font-semibold">{remainingXlm.toLocaleString()} XLM</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-zinc-500">Created</span>
                <span>{campaign.created_at ? new Date(Number(campaign.created_at) * 1000).toLocaleDateString() : "-"}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-zinc-500">Deadline</span>
                <span>{campaign.deadline ? new Date(Number(campaign.deadline) * 1000).toLocaleDateString() : "-"}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-zinc-500">Owner</span>
                <span className="font-mono text-xs">{truncateAddress(campaign.owner)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={handleCopyAddress} className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:border-zinc-950">
                {copied ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy contract"}
              </button>
              <a
                href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:border-zinc-950"
              >
                <ExternalLink className="h-4 w-4" />
                View explorer
              </a>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-6"
        >
          <div className="rounded-3xl border border-zinc-200 p-6">
            <p className="text-sm uppercase tracking-[0.22em] text-zinc-500">Donation form</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">Donate XLM</h3>

            {!campaign.active ? (
              <div className="mt-6 rounded-2xl bg-red-50 border border-red-200 p-4 text-center">
                <XCircle className="mx-auto h-6 w-6 text-red-400" />
                <p className="mt-2 font-medium text-red-700">Campaign closed</p>
                <p className="mt-1 text-sm text-red-600">This campaign is no longer accepting donations.</p>
              </div>
            ) : isExpired ? (
              <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-center">
                <Clock className="mx-auto h-6 w-6 text-amber-400" />
                <p className="mt-2 font-medium text-amber-700">Campaign expired</p>
                <p className="mt-1 text-sm text-amber-600">The deadline has passed.</p>
              </div>
            ) : (
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
                    className="w-full rounded-2xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-zinc-950"
                    required
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
                >
                  {address ? "Donate now" : "Connect wallet & Donate"}
                </button>
              </form>
            )}

            <TransactionStatus state={txState} onClose={resetTx} />
          </div>

          <div className="rounded-3xl border border-zinc-200 p-6">
            <p className="text-sm uppercase tracking-[0.22em] text-zinc-500">Recent donations</p>
            <div className="mt-4 max-h-[320px] space-y-4 overflow-y-auto pr-2">
              {donations.length === 0 ? (
                <p className="text-sm text-zinc-500">No donations yet. Be the first to contribute!</p>
              ) : (
                donations.map((d, i) => (
                  <div key={`${d.donor}-${d.timestamp}-${i}`} className="flex items-center justify-between border-b border-zinc-100 pb-4 last:border-b-0 last:pb-0">
                    <div>
                      <p className="font-medium text-sm">{truncateAddress(d.donor)}</p>
                      <p className="text-xs text-zinc-500">{formatRelativeTime(d.timestamp)}</p>
                    </div>
                    <p className="text-sm font-semibold">{stroopsToXlm(d.amount).toLocaleString()} XLM</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
