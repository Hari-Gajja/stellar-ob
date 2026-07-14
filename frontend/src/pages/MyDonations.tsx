import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowSquareOut, Wallet, Spinner, ArrowsClockwise, Handshake, PiggyBank } from "@phosphor-icons/react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet, useToast } from "../contexts/AppContext";
import { getAllCampaigns, getContributor, refund } from "../services/contract";
import { stroopsToXlm } from "../utils/format";
import type { CampaignData } from "../types";

export default function MyDonations() {
  const navigate = useNavigate();
  const { address, connect } = useWallet();
  const toast = useToast();
  const reduceMotion = useReducedMotion();
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [donationMap, setDonationMap] = useState<Record<number, bigint>>({});
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!address) return;
    try {
      const data = await getAllCampaigns();
      setCampaigns(data);
      const map: Record<number, bigint> = {};
      await Promise.all(data.map(async (c) => {
        try { const a = await getContributor(c.id, address); if (a > 0n) map[c.id] = a; } catch {}
      }));
      setDonationMap(map);
    } catch (err) { console.error("Failed to load donations:", err); }
    finally { setLoading(false); }
  }, [address]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const donations = useMemo(() => {
    return Object.keys(donationMap).map(Number)
      .map((id) => { const c = campaigns.find((c) => c.id === id); return c ? { campaign: c, amount: donationMap[id] } : null; })
      .filter((d): d is { campaign: CampaignData; amount: bigint } => d !== null)
      .sort((a, b) => Number(b.campaign.created_at - a.campaign.created_at));
  }, [campaigns, donationMap]);

  const totalDonated = useMemo(() => donations.reduce((a, d) => a + d.amount, 0n), [donations]);

  const isExpired = (c: CampaignData) => c.status === "Active" && Number(c.deadline) * 1000 <= Date.now();

  const handleRefund = async (campaignId: number) => {
    if (!address) return;
    setActionPending(campaignId);
    try { const tx = await refund(address, campaignId, address); await tx.signAndSend(); toast.success("Refund claimed"); load(); }
    catch { toast.error("Failed to claim refund"); }
    finally { setActionPending(null); }
  };

  if (!address) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
        <div className="card-shell max-w-md">
          <div className="card-shell__inner flex flex-col items-center px-8 py-10">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-black/[0.04] text-[#787774]"><Wallet size={20} /></span>
            <p className="mt-5 text-lg font-bold tracking-tight text-[#111111]">Connect your wallet</p>
            <p className="mt-2 text-sm text-[#787774]">Connect a wallet to see your donation history.</p>
            <button type="button" onClick={connect} className="btn-primary mt-6"><Wallet size={16} />Connect wallet</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-20 pt-8 sm:pt-12">
      <motion.div initial={reduceMotion ? false : { opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="flex items-center justify-between">
        <div>
          <button type="button" onClick={() => navigate("/dashboard")} className="mb-3 inline-flex items-center gap-1 text-xs font-semibold tracking-wide text-[#787774] transition-colors duration-200 hover:text-[#111111]">
            <ArrowLeft size={12} />Dashboard
          </button>
          <h1 className="section-title">My donations</h1>
          <p className="mt-1 text-sm text-[#787774]">{donations.length} campaign{donations.length !== 1 ? "s" : ""} &middot; {stroopsToXlm(totalDonated).toLocaleString()} XLM total</p>
        </div>
        <button type="button" onClick={load} disabled={loading} className="btn-ghost" aria-label="Refresh"><ArrowsClockwise size={16} className={loading ? "animate-spin" : ""} /></button>
      </motion.div>

      <section className="mt-8">
        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card-shell"><div className="card-shell__inner !p-5"><div className="skeleton h-5 w-1/2" /><div className="skeleton mt-3 h-3 w-1/4" /><div className="skeleton mt-2 h-3 w-2/3" /></div></div>
            ))}
          </div>
        ) : donations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#EAEAEA] bg-white p-12 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-black/[0.04] text-[#787774]"><Handshake size={20} /></span>
            <p className="mt-5 text-base font-medium text-[#111111]">No donations yet</p>
            <p className="mt-2 text-sm text-[#787774]">You haven't donated to any campaigns yet. Browse active campaigns to get started.</p>
            <button type="button" onClick={() => navigate("/")} className="btn-primary mt-6">Browse campaigns</button>
          </div>
        ) : (
          <div className="space-y-4">
            {donations.map((d, i) => {
              const canRefund = d.campaign.status === "Failed" || d.campaign.status === "Closed";
              const progress = d.campaign.funding_goal === 0n ? 0 : Math.min(100, Math.round((Number(d.campaign.total_raised) / Number(d.campaign.funding_goal)) * 100));
              return (
                <motion.div key={d.campaign.id} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: reduceMotion ? 0 : Math.min(i * 0.04, 0.3), ease: [0.16, 1, 0.3, 1] }} className="card-shell group">
                  <div className="card-shell__inner !p-5 sm:!p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-lg font-bold tracking-tight text-[#111111]">{d.campaign.name}</h3>
                        <p className="mt-1 text-sm text-[#787774]">{d.campaign.description}</p>
                      </div>
                      <span className={`${isExpired(d.campaign) ? "badge-warning" : d.campaign.status === "Active" ? "badge-success" : d.campaign.status === "Successful" ? "badge-info" : d.campaign.status === "Failed" ? "badge-danger" : "badge-neutral"} shrink-0`}>{isExpired(d.campaign) ? "Expired" : d.campaign.status === "Successful" ? "Completed" : d.campaign.status}</span>
                    </div>
                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between text-xs text-[#787774]">
                        <span className="tabular font-medium text-[#111111]">{stroopsToXlm(d.campaign.total_raised).toLocaleString()} XLM raised</span>
                        <span className="tabular font-bold text-[#111111]">{progress}%</span>
                      </div>
                      <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(100, progress)}%` }} /></div>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-2 rounded-lg border border-[#EAEAEA] bg-white px-4 py-2.5">
                      <div className="flex items-center gap-2"><Handshake size={16} className="text-[#787774]" /><span className="text-sm text-[#787774]">You donated</span></div>
                      <span className="text-sm font-bold tabular text-[#111111]">{stroopsToXlm(d.amount).toLocaleString()} XLM</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-[#EAEAEA] pt-4">
                      <button type="button" onClick={() => navigate(`/campaign/${d.campaign.id}`)} className="btn-secondary flex-1 py-2 text-xs sm:flex-none sm:px-4"><ArrowSquareOut size={14} />View campaign</button>
                      {canRefund && (
                        <button type="button" onClick={() => handleRefund(d.campaign.id)} disabled={actionPending === d.campaign.id} className="btn-primary flex-1 py-2 text-xs sm:flex-none sm:px-4">
                          {actionPending === d.campaign.id ? <Spinner size={14} className="animate-spin" /> : <PiggyBank size={14} />}Claim refund
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
