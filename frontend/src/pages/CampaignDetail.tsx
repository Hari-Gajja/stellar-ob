import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft, Users, Clock, Crosshair, Spinner,
  CopySimple, CheckCircle, XCircle, Wallet,
} from "@phosphor-icons/react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWallet, useTransaction, useToast } from "../contexts/AppContext";
import { getCampaign, getRecentDonations, CONTRACT_ID } from "../services/contract";
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

function statusBadge(status: string, daysLeft: number): { label: string; className: string } {
  if (status === "Active" && daysLeft === 0) return { label: "Expired", className: "badge-warning" };
  switch (status) {
    case "Active": return { label: "Active", className: "badge-success" };
    case "Successful": return { label: "Completed", className: "badge-info" };
    case "Failed": return { label: "Failed", className: "badge-danger" };
    case "Closed": return { label: "Closed", className: "badge-neutral" };
    default: return { label: status, className: "badge-neutral" };
  }
}

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { address, connect } = useWallet();
  const { donate, withdraw, refund, state: txState, reset } = useTransaction();
  const toast = useToast();
  const reduceMotion = useReducedMotion();

  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [donateAmount, setDonateAmount] = useState("");
  const [copied, setCopied] = useState(false);
  const campaignId = Number(id);

  const loadCampaign = useCallback(async () => {
    try {
      const [campaignData, donationsData] = await Promise.all([
        getCampaign(campaignId),
        getRecentDonations(campaignId, 20),
      ]);
      setCampaign(campaignData);
      setDonations(donationsData.sort((a, b) => Number(b.timestamp - a.timestamp)));
    } catch (err) {
      console.error("Failed to load campaign:", err);
    } finally { setLoading(false); }
  }, [campaignId]);

  useEffect(() => { setLoading(true); loadCampaign(); }, [loadCampaign]);

  const progress = useMemo(() => {
    if (!campaign || campaign.funding_goal === 0n) return 0;
    return Math.min(100, Math.round((Number(campaign.total_raised) / Number(campaign.funding_goal)) * 100));
  }, [campaign]);

  const raisedXlm = campaign ? stroopsToXlm(campaign.total_raised) : 0;
  const goalXlm = campaign ? stroopsToXlm(campaign.funding_goal) : 0;
  const endTime = campaign ? Number(campaign.deadline) * 1000 : 0;
  const timeLeft = endTime - Date.now();
  const daysLeft = Math.max(0, Math.ceil(timeLeft / (24 * 60 * 60 * 1000)));

  const handleDonate = async () => {
    if (!address || !campaign) return;
    const parsed = parseFloat(donateAmount);
    if (isNaN(parsed) || parsed <= 0) {
      toast.error("Invalid amount", "Enter a valid donation amount");
      return;
    }
    try {
      await donate(address, campaign.id, xlmToStroops(parsed));
      toast.success("Donation successful", `You donated ${parsed.toLocaleString()} XLM`);
      setDonateAmount("");
      loadCampaign();
    } catch { toast.error("Donation failed"); }
  };

  const handleWithdraw = async () => {
    if (!address || !campaign) return;
    try {
      await withdraw(address, campaign.id);
      toast.success("Funds withdrawn", "We sent campaign funds to your wallet");
      loadCampaign();
    } catch { toast.error("Withdrawal failed"); }
  };

  const handleRefund = async () => {
    if (!address || !campaign) return;
    try {
      await refund(address, campaign.id);
      toast.success("Refund claimed", "We refunded your donation");
      loadCampaign();
    } catch { toast.error("Refund failed"); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!id) { navigate("/", { replace: true }); return null; }

  return (
    <div className="flex-1 pb-20 pt-6 sm:pt-10">
      <motion.div initial={reduceMotion ? false : { opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
        <button type="button" onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-1 text-xs font-semibold tracking-wide text-[#787774] transition-colors duration-200 hover:text-[#111111]">
          <ArrowLeft size={12} />
          Back
        </button>
      </motion.div>

      {loading ? (
        <div className="space-y-6">
          <div className="card-shell">
            <div className="card-shell__inner space-y-5">
              <div className="skeleton h-8 w-2/3" /><div className="skeleton h-4 w-full" /><div className="skeleton h-4 w-4/5" />
              <div className="skeleton h-2 w-full" />
              <div className="grid grid-cols-3 gap-3"><div className="skeleton h-20" /><div className="skeleton h-20" /><div className="skeleton h-20" /></div>
            </div>
          </div>
        </div>
      ) : !campaign ? (
        <div className="empty-state">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-black/[0.04] text-[#787774]"><XCircle size={20} /></span>
          <p className="mt-5 text-lg font-bold tracking-tight text-[#111111]">Campaign not found</p>
          <p className="mt-2 max-w-sm text-sm text-[#787774]">We couldn't find this campaign. Check the ID or browse other campaigns.</p>
          <button type="button" onClick={() => navigate("/")} className="btn-primary mt-6">Browse all campaigns</button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <motion.div initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
            <div className="card-shell">
              <div className="card-shell__inner">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold tracking-tight text-[#111111] sm:text-3xl">{campaign.name}</h1>
                      <span className={statusBadge(campaign.status, daysLeft).className}>{statusBadge(campaign.status, daysLeft).label}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#787774]">{campaign.description}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="tabular font-bold text-[#111111]">{raisedXlm.toLocaleString()} XLM raised</span>
                    <span className="tabular font-bold text-[#111111]">{progress}%</span>
                  </div>
                  <div className="progress-track h-3"><div className="progress-fill" style={{ width: `${Math.min(100, progress)}%` }} /></div>
                  <div className="mt-2 flex items-center justify-between text-xs text-[#787774]">
                    <span>Goal: {goalXlm.toLocaleString()} XLM</span>
                    <span>{campaign.contributor_count} supporter{campaign.contributor_count !== 1 ? "s" : ""}</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="stat-tile">
                    <Crosshair size={16} className="mb-1.5 text-[#787774]" />
                    <p className="tabular font-bold tracking-tight text-[#111111] text-base">{daysLeft}</p>
                    <p className="text-xs text-[#787774]">{daysLeft === 1 ? "Day left" : "Days left"}</p>
                  </div>
                  <div className="stat-tile">
                    <Users size={16} className="mb-1.5 text-[#787774]" />
                    <p className="tabular font-bold tracking-tight text-[#111111] text-base">{campaign.contributor_count}</p>
                    <p className="text-xs text-[#787774]">Supporters</p>
                  </div>
                  <div className="stat-tile">
                    <Clock size={16} className="mb-1.5 text-[#787774]" />
                    <p className="tabular font-bold tracking-tight text-[#111111] text-base">{formatRelativeTime(campaign.created_at)}</p>
                    <p className="text-xs text-[#787774]">Created</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[#EAEAEA] pt-5 text-xs text-[#787774]">
                  <span className="font-medium">Owner:</span>
                  <code className="font-mono text-[#111111]">{truncateAddress(campaign.owner)}</code>
                  <button type="button" onClick={() => copyToClipboard(campaign.owner)} className="btn-ghost !rounded-md !px-2 !py-1" aria-label="Copy owner address">
                    {copied ? <CheckCircle size={14} className="text-[#346538]" /> : <CopySimple size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-bold tracking-tight text-[#111111] mb-4">Recent donations</h2>
              {donations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#EAEAEA] bg-white px-6 py-12 text-center">
                  <p className="text-sm text-[#787774]">No donations yet. Be the first to contribute.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {donations.map((d, i) => (
                    <motion.div
                      key={i}
                      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.2), ease: [0.16, 1, 0.3, 1] }}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[#EAEAEA] bg-white px-4 py-3 transition-all duration-200 hover:bg-black/[0.02]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] text-[#787774] text-xs font-bold">{d.donor.slice(-2).toUpperCase()}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#111111]">{truncateAddress(d.donor)}</p>
                          <p className="text-xs text-[#787774]">{formatRelativeTime(d.timestamp)}</p>
                        </div>
                      </div>
                      <span className="tabular font-bold text-[#111111]">+{stroopsToXlm(d.amount).toLocaleString()} XLM</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          <motion.div initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }} className="lg:sticky lg:top-24 lg:self-start">
            {!address ? (
              <div className="card-shell">
                <div className="card-shell__inner flex flex-col items-center px-6 py-8 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-black/[0.04] text-[#787774]"><Wallet size={20} /></span>
                  <p className="mt-5 text-base font-bold tracking-tight text-[#111111]">Connect your wallet</p>
                  <p className="mt-2 text-sm text-[#787774]">Connect a wallet to donate, withdraw, or claim refunds.</p>
                  <button type="button" onClick={connect} className="btn-primary mt-6 w-full"><Wallet size={16} />Connect wallet</button>
                </div>
              </div>
            ) : (
              <>
                <div className="card-shell">
                  <div className="card-shell__inner">
                    {campaign.status === "Active" && daysLeft > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-base font-bold tracking-tight text-[#111111]">Donate</h3>
                        <div>
                          <input type="number" min="0" step="0.1" placeholder="Amount in XLM" value={donateAmount} onChange={(e) => setDonateAmount(e.target.value)} className="field" aria-label="Donation amount in XLM" />
                        </div>
                        <button type="button" onClick={handleDonate} disabled={txState.status === "signing" || txState.status === "submitting"} className="btn-primary w-full py-3">
                          {txState.status === "signing" || txState.status === "submitting" ? <Spinner size={16} className="animate-spin" /> : "Confirm donation"}
                        </button>
                        {txState.status === "failed" && txState.error && <p className="text-xs text-[#9F2F2D]">{txState.error}</p>}
                      </div>
                    )}

                    {campaign.owner === address && (
                      <div className="space-y-3">
                        <h3 className="text-base font-bold tracking-tight text-[#111111]">Manage campaign</h3>
                        {campaign.status === "Successful" && (
                          <button type="button" onClick={handleWithdraw} disabled={txState.status === "signing" || txState.status === "submitting"} className="btn-primary w-full py-3">
                            {txState.status === "signing" || txState.status === "submitting" ? <Spinner size={16} className="animate-spin" /> : null}
                            Withdraw funds
                          </button>
                        )}
                        {campaign.status === "Failed" && (
                          <button type="button" onClick={handleRefund} disabled={txState.status === "signing" || txState.status === "submitting"} className="btn-primary w-full py-3">
                            {txState.status === "signing" || txState.status === "submitting" ? <Spinner size={16} className="animate-spin" /> : null}
                            Issue refunds
                          </button>
                        )}
                      </div>
                    )}

                    {campaign.owner !== address && (campaign.status === "Failed" || campaign.status === "Closed") && (
                      <div className="space-y-3">
                        <h3 className="text-base font-bold tracking-tight text-[#111111]">Refund available</h3>
                        <p className="text-sm text-[#787774]">This campaign did not reach its goal. You can claim a refund.</p>
                        <button type="button" onClick={handleRefund} disabled={txState.status === "signing" || txState.status === "submitting"} className="btn-primary w-full py-3">
                          {txState.status === "signing" || txState.status === "submitting" ? <Spinner size={16} className="animate-spin" /> : null}
                          Claim refund
                        </button>
                      </div>
                    )}

                    <TransactionStatus state={txState} onDismiss={reset} />
                  </div>
                </div>

                <div className="mt-4 card-shell">
                  <div className="card-shell__inner !px-4 !py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#787774]">Contract</span>
                      <button type="button" onClick={() => copyToClipboard(CONTRACT_ID)} className="inline-flex items-center gap-1.5 text-xs text-[#787774] transition-colors duration-200 hover:text-[#111111]">
                        {truncateAddress(CONTRACT_ID)}
                        {copied ? <CheckCircle size={12} className="text-[#346538]" /> : <CopySimple size={12} />}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
