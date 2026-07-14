import { motion, useReducedMotion } from "framer-motion";
import {
  Layout, Plus, ArrowRight, Wallet, ArrowsClockwise,
  List, Handshake, PiggyBank, TrendUp, ArrowSquareOut,
} from "@phosphor-icons/react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../contexts/AppContext";
import { getAllCampaigns, getContributor } from "../services/contract";
import { stroopsToXlm, truncateAddress } from "../utils/format";
import StatCard from "../components/features/dashboard/StatCard";
import type { CampaignData } from "../types";

export default function Dashboard() {
  const navigate = useNavigate();
  const { address, connect } = useWallet();
  const reduceMotion = useReducedMotion();
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [donationMap, setDonationMap] = useState<Record<number, bigint>>({});

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
    } catch (err) { console.error("Failed to load dashboard data:", err); }
    finally { setLoading(false); }
  }, [address]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const isExpired = useCallback((c: CampaignData) => c.status === "Active" && Number(c.deadline) * 1000 <= Date.now(), []);

  const myCampaigns = useMemo(() => campaigns.filter((c) => c.owner === address), [campaigns, address]);
  const totalDonated = useMemo(() => Object.values(donationMap).reduce((a, b) => a + b, 0n), [donationMap]);
  const totalReceived = useMemo(() => myCampaigns.filter((c) => c.status === "Successful").reduce((a, c) => a + c.total_raised, 0n), [myCampaigns]);
  const refundsAvailable = useMemo(() => campaigns.filter((c) => (c.status === "Failed" || c.status === "Closed") && donationMap[c.id] !== undefined && donationMap[c.id] > 0n).length, [campaigns, donationMap]);

  const activities = useMemo(() => {
    const items: { time: number; text: string; href?: string }[] = [];
    myCampaigns.forEach((c) => {
      items.push({ time: Number(c.created_at), text: `Created campaign "${c.name}"`, href: `/campaign/${c.id}` });
      if (c.status === "Successful") items.push({ time: Number(c.deadline), text: `Campaign "${c.name}" succeeded`, href: `/campaign/${c.id}` });
    });
    Object.entries(donationMap).forEach(([id, amount]) => {
      const camp = campaigns.find((c) => c.id === Number(id));
      if (camp) items.push({ time: Date.now() / 1000 - 60, text: `Donated ${stroopsToXlm(amount).toLocaleString()} XLM to "${camp.name}"`, href: `/campaign/${camp.id}` });
    });
    items.sort((a, b) => b.time - a.time);
    return items.slice(0, 10);
  }, [myCampaigns, donationMap, campaigns]);

  if (!address) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
        <div className="card-shell max-w-md">
          <div className="card-shell__inner flex flex-col items-center px-8 py-10">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-black/[0.04] text-[#787774]"><Wallet size={20} /></span>
            <p className="mt-5 text-lg font-bold tracking-tight text-[#111111]">Connect your wallet</p>
            <p className="mt-2 text-sm text-[#787774]">Connect a wallet to view your dashboard and manage your campaigns.</p>
            <button type="button" onClick={connect} className="btn-primary mt-6"><Wallet size={16} />Connect wallet</button>
            <button type="button" onClick={() => navigate("/")} className="btn-ghost mt-3 text-sm">Browse campaigns</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-20 pt-8 sm:pt-12">
      <div className="flex items-start justify-between">
        <motion.div initial={reduceMotion ? false : { opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
          <p className="section-kicker mb-2">Dashboard</p>
          <h1 className="section-title">Welcome back</h1>
          <p className="mt-1 text-sm text-[#787774]">{truncateAddress(address)}</p>
        </motion.div>
        <motion.button type="button" onClick={load} disabled={loading} className="btn-ghost" aria-label="Refresh">
          <ArrowsClockwise size={16} className={loading ? "animate-spin" : ""} />
        </motion.button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <StatCard icon={Layout} label="My campaigns" value={myCampaigns.length} sub={myCampaigns.filter((c) => c.status === "Active" && !isExpired(c)).length + " active"} index={0} />
        </div>
        <div>
          <StatCard icon={Handshake} label="Total donated" value={stroopsToXlm(totalDonated).toLocaleString() + " XLM"} sub={Object.keys(donationMap).length + " campaigns"} index={1} />
        </div>
        <div>
          <StatCard icon={TrendUp} label="Total received" value={stroopsToXlm(totalReceived).toLocaleString() + " XLM"} sub={myCampaigns.filter((c) => c.status === "Successful").length + " succeeded"} index={2} />
        </div>
        <div className="sm:col-span-2">
          <StatCard icon={PiggyBank} label="Refunds available" value={refundsAvailable} sub={refundsAvailable === 1 ? "campaign — from failed/closed campaigns" : "campaigns — from failed or closed campaigns"} index={3} />
        </div>
      </div>

      <motion.div initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35, ease: [0.16, 1, 0.3, 1] }} className="mt-10 flex flex-wrap gap-3">
        <button type="button" onClick={() => navigate("/create")} className="btn-primary group px-5 py-2.5"><Plus size={16} />Create campaign</button>
        <button type="button" onClick={() => navigate("/dashboard/my-campaigns")} className="btn-secondary group px-5 py-2.5"><List size={16} />My campaigns</button>
        <button type="button" onClick={() => navigate("/dashboard/my-donations")} className="btn-secondary group px-5 py-2.5"><Handshake size={16} />My donations</button>
      </motion.div>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} className="card-shell">
          <div className="card-shell__inner">
            <h2 className="text-lg font-bold tracking-tight text-[#111111]">My campaigns</h2>
            <div className="my-3 h-px bg-[#EAEAEA]" />
            {myCampaigns.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#EAEAEA] bg-white p-8 text-center">
                <p className="text-sm text-[#787774]">You haven't created any campaigns yet.</p>
                <button type="button" onClick={() => navigate("/create")} className="btn-primary mt-4"><Plus size={16} />Create your first campaign</button>
              </div>
            ) : (
              <div className="space-y-2">
                {myCampaigns.slice(0, 5).map((c) => (
                  <button key={c.id} type="button" onClick={() => navigate(`/campaign/${c.id}`)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-[#EAEAEA] bg-white px-4 py-3 text-left transition-all duration-200 hover:bg-black/[0.02]">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#111111]">{c.name}</p>
                      <p className="mt-0.5 text-xs text-[#787774]">{stroopsToXlm(c.total_raised).toLocaleString()} / {stroopsToXlm(c.funding_goal).toLocaleString()} XLM</p>
                    </div>
                    <span className={`${isExpired(c) ? "badge-warning" : c.status === "Active" ? "badge-success" : c.status === "Successful" ? "badge-info" : c.status === "Failed" ? "badge-danger" : "badge-neutral"} shrink-0`}>{isExpired(c) ? "Expired" : c.status === "Successful" ? "Completed" : c.status}</span>
                  </button>
                ))}
                {myCampaigns.length > 5 && <button type="button" onClick={() => navigate("/dashboard/my-campaigns")} className="btn-ghost w-full py-2 text-sm">View all {myCampaigns.length} campaigns<ArrowRight size={14} /></button>}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }} className="card-shell">
          <div className="card-shell__inner">
            <h2 className="text-lg font-bold tracking-tight text-[#111111]">Recent activity</h2>
            <div className="my-3 h-px bg-[#EAEAEA]" />
            {activities.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#EAEAEA] bg-white p-8 text-center">
                <p className="text-sm text-[#787774]">No activity yet. Create or donate to a campaign to get started.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activities.map((act, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg bg-white px-4 py-2.5 transition-colors duration-200 hover:bg-black/[0.02]">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[#111111]" />
                    <p className="flex-1 truncate text-sm text-[#787774]">{act.text}</p>
                    {act.href && <button type="button" onClick={() => navigate(act.href!)} className="shrink-0 text-[#787774] transition-colors duration-200 hover:text-[#111111]" aria-label="View campaign"><ArrowSquareOut size={14} /></button>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
