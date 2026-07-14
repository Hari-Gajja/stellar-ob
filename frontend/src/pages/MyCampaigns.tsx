import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowSquareOut, Wallet, Spinner, Plus, XCircle, CurrencyCircleDollar, ArrowsClockwise } from "@phosphor-icons/react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet, useToast } from "../contexts/AppContext";
import { getAllCampaigns, closeCampaign, withdrawFunds } from "../services/contract";
import { stroopsToXlm, formatRelativeTime } from "../utils/format";
import type { CampaignData, CampaignStatus } from "../types";

type StatusFilter = "all" | CampaignStatus;

export default function MyCampaigns() {
  const navigate = useNavigate();
  const { address, connect } = useWallet();
  const toast = useToast();
  const reduceMotion = useReducedMotion();
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState<number | null>(null);
  const [filterBy, setFilterBy] = useState<StatusFilter>("all");

  const load = useCallback(async () => {
    if (!address) return;
    try {
      const data = await getAllCampaigns();
      setCampaigns(data.filter((c) => c.owner === address));
    } catch (err) { console.error("Failed to load campaigns:", err); }
    finally { setLoading(false); }
  }, [address]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const isExpired = (c: CampaignData) => c.status === "Active" && Number(c.deadline) * 1000 <= Date.now();

  const filtered = useMemo(() => filterBy === "all" ? campaigns : campaigns.filter((c) => c.status === filterBy), [campaigns, filterBy]);

  const handleClose = async (campaignId: number) => {
    if (!address) return;
    setActionPending(campaignId);
    try { const tx = await closeCampaign(address, campaignId); await tx.signAndSend(); toast.success("Campaign closed"); load(); }
    catch { toast.error("Failed to close campaign"); }
    finally { setActionPending(null); }
  };

  const handleWithdraw = async (campaignId: number) => {
    if (!address) return;
    setActionPending(campaignId);
    try { const tx = await withdrawFunds(address, campaignId); await tx.signAndSend(); toast.success("Funds withdrawn"); load(); }
    catch { toast.error("Failed to withdraw funds"); }
    finally { setActionPending(null); }
  };

  if (!address) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
        <div className="card-shell max-w-md">
          <div className="card-shell__inner flex flex-col items-center px-8 py-10">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-black/[0.04] text-[#787774]"><Wallet size={20} /></span>
            <p className="mt-5 text-lg font-bold tracking-tight text-[#111111]">Connect your wallet</p>
            <p className="mt-2 text-sm text-[#787774]">Connect a wallet to see your campaigns.</p>
            <button type="button" onClick={connect} className="btn-primary mt-6"><Wallet size={16} />Connect wallet</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-20 pt-8 sm:pt-12">
      <motion.div initial={reduceMotion ? false : { opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button type="button" onClick={() => navigate("/dashboard")} className="mb-3 inline-flex items-center gap-1 text-xs font-semibold tracking-wide text-[#787774] transition-colors duration-200 hover:text-[#111111]">
            <ArrowLeft size={12} />Dashboard
          </button>
          <h1 className="section-title">My campaigns</h1>
          <p className="mt-1 text-sm text-[#787774]">{campaigns.length} total</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={load} disabled={loading} className="btn-ghost" aria-label="Refresh"><ArrowsClockwise size={16} className={loading ? "animate-spin" : ""} /></button>
          <button type="button" onClick={() => navigate("/create")} className="btn-primary"><Plus size={16} />New campaign</button>
        </div>
      </motion.div>

      <div className="mt-8 overflow-x-auto">
        <div className="filter-segment w-fit" role="group" aria-label="Filter by status">
          {(["all", "Active", "Successful", "Failed", "Closed"] as StatusFilter[]).map((f) => (
            <button key={f} type="button" onClick={() => setFilterBy(f)} className={`filter-segment__item whitespace-nowrap ${filterBy === f ? "filter-segment__item--active" : ""}`}>{f === "all" ? "All" : f}</button>
          ))}
        </div>
      </div>

      <section className="mt-8">
        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card-shell">
                <div className="card-shell__inner !p-5"><div className="skeleton h-5 w-1/3" /><div className="skeleton mt-3 h-3 w-full" /><div className="skeleton mt-2 h-3 w-2/3" /></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#EAEAEA] bg-white p-12 text-center">
            <p className="text-base font-medium text-[#787774]">{filterBy === "all" ? "You haven't created any campaigns yet." : `No campaigns with status "${filterBy}".`}</p>
            {filterBy === "all" && <button type="button" onClick={() => navigate("/create")} className="btn-primary mt-6"><Plus size={16} />Create your first campaign</button>}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((c, i) => {
              const progress = c.funding_goal === 0n ? 0 : Math.min(100, Math.round((Number(c.total_raised) / Number(c.funding_goal)) * 100));
              const raisedXlm = stroopsToXlm(c.total_raised);
              const goalXlm = stroopsToXlm(c.funding_goal);
              return (
                <motion.div key={c.id} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: reduceMotion ? 0 : Math.min(i * 0.04, 0.3), ease: [0.16, 1, 0.3, 1] }} className="card-shell group">
                  <div className="card-shell__inner !p-5 sm:!p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-lg font-bold tracking-tight text-[#111111]">{c.name}</h3>
                          <span className={`${isExpired(c) ? "badge-warning" : c.status === "Active" ? "badge-success" : c.status === "Successful" ? "badge-info" : c.status === "Failed" ? "badge-danger" : "badge-neutral"} shrink-0`}>{isExpired(c) ? "Expired" : c.status === "Successful" ? "Completed" : c.status}</span>
                        </div>
                        <p className="mt-1.5 text-sm text-[#787774]">{c.description}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between text-xs text-[#787774]">
                        <span className="tabular font-medium text-[#111111]">{raisedXlm.toLocaleString()} XLM raised</span>
                        <span className="tabular font-bold text-[#111111]">{progress}%</span>
                      </div>
                      <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(100, progress)}%` }} /></div>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-2 text-xs text-[#787774]">
                      <span>Goal: {goalXlm.toLocaleString()} XLM</span>
                      <span>{c.contributor_count} supporter{c.contributor_count !== 1 ? "s" : ""}</span>
                      <span>Created {formatRelativeTime(c.created_at)}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-[#EAEAEA] pt-4">
                      <button type="button" onClick={() => navigate(`/campaign/${c.id}`)} className="btn-secondary flex-1 py-2 text-xs sm:flex-none sm:px-4"><ArrowSquareOut size={14} />View</button>
                      {(c.status === "Active" || c.status === "Failed") && (
                        <button type="button" onClick={() => handleClose(c.id)} disabled={actionPending === c.id} className="btn-danger-ghost flex-1 py-2 text-xs sm:flex-none sm:px-4">
                          {actionPending === c.id ? <Spinner size={14} className="animate-spin" /> : <XCircle size={14} />}Close
                        </button>
                      )}
                      {c.status === "Successful" && (
                        <button type="button" onClick={() => handleWithdraw(c.id)} disabled={actionPending === c.id} className="btn-primary flex-1 py-2 text-xs sm:flex-none sm:px-4">
                          {actionPending === c.id ? <Spinner size={14} className="animate-spin" /> : <CurrencyCircleDollar size={14} />}Withdraw
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
