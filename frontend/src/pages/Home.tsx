import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MagnifyingGlass, SlidersHorizontal, Plus, Sparkle, Users } from "@phosphor-icons/react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../contexts/AppContext";
import { getAllCampaigns } from "../services/contract";
import CampaignCard from "../components/CampaignCard";
import type { CampaignData, SortOption, FilterOption } from "../types";

export default function Home() {
  const navigate = useNavigate();
  const { address, connect } = useWallet();
  const reduceMotion = useReducedMotion();
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [showFilters, setShowFilters] = useState(false);

  const loadCampaigns = useCallback(async () => {
    try {
      const data = await getAllCampaigns();
      setCampaigns(data);
    } catch (err) {
      console.error("Failed to load campaigns:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
    const interval = setInterval(loadCampaigns, 15000);
    return () => clearInterval(interval);
  }, [loadCampaigns]);

  const filtered = useMemo(() => {
    let result = [...campaigns];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }
    const now = Date.now();
    if (filterBy === "active") result = result.filter((c) => c.status === "Active" && Number(c.deadline) * 1000 > now);
    else if (filterBy === "completed") result = result.filter((c) => c.status === "Successful");
    else if (filterBy === "expired") result = result.filter((c) => c.status === "Active" && Number(c.deadline) * 1000 <= now);
    else if (filterBy === "closed") result = result.filter((c) => c.status === "Closed" || c.status === "Failed");
    if (sortBy === "newest") result.sort((a, b) => Number(b.created_at - a.created_at));
    else if (sortBy === "most_funded") result.sort((a, b) => Number(b.total_raised - a.total_raised));
    else if (sortBy === "ending_soon") result.sort((a, b) => Number(a.deadline - b.deadline));
    return result;
  }, [campaigns, searchQuery, sortBy, filterBy]);

  const handleDonate = (campaignId: number) => {
    if (!address) { connect(); return; }
    navigate(`/campaign/${campaignId}`);
  };

  const activeCount = campaigns.filter((c) => c.status === "Active" && Number(c.deadline) * 1000 > Date.now()).length;

  return (
    <div className="flex-1">
      <section className="relative overflow-hidden pb-20 pt-16 sm:pt-24 lg:pb-28 lg:pt-32">
        <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-[#1F6C9F]/3 blur-[100px]" aria-hidden />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-[#1F6C9F]/2 blur-[80px]" aria-hidden />

        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EAEAEA] bg-white px-3 py-1 text-[11px] font-semibold tracking-wide text-[#787774]">
                Soroban crowdfunding on Testnet
              </span>
              <h1 className="display-title mt-6 text-[clamp(2.5rem,5.5vw,5rem)]">
                Fund ideas.
                <br />
                Build together.
                <br />
                On Stellar.
              </h1>
              <p className="mt-5 max-w-[52ch] text-base leading-relaxed text-[#787774] md:text-lg">
                Support open-source work with a clean, transparent crowdfunding flow powered by a Soroban smart contract.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" onClick={() => { if (!address) { connect(); return; } navigate("/create"); }} className="btn-primary px-6 py-3">
                  {address ? "Start a campaign" : "Connect wallet"}
                  <ArrowRight size={14} />
                </button>
                <button type="button" onClick={() => document.getElementById("campaigns")?.scrollIntoView({ behavior: "smooth" })} className="btn-secondary px-6 py-3">
                  Browse campaigns
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-8"
            >
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[11px] font-semibold tracking-wide text-[#787774]">Live campaigns</p>
                  <p className="mt-1.5 tabular tracking-tight text-5xl font-bold leading-none text-[#111111]">
                    {loading ? <span className="inline-block h-10 w-14 animate-pulse rounded-lg bg-black/[0.06]" /> : activeCount}
                  </p>
                  <p className="mt-1.5 text-sm text-[#787774]">Accepting donations now</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold tracking-wide text-[#787774]">Total listed</p>
                  <p className="mt-1.5 tabular tracking-tight text-5xl font-bold leading-none text-[#111111]">
                    {loading ? <span className="inline-block h-10 w-14 animate-pulse rounded-lg bg-black/[0.06]" /> : campaigns.length}
                  </p>
                  <p className="mt-1.5 text-sm text-[#787774]">Across the testnet contract</p>
                </div>
              </div>
              <div className="flex items-center gap-3 border-t border-[#EAEAEA] pt-6 text-sm text-[#787774]">
                <Users size={16} />
                <span>Join the growing community of creators and supporters</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="campaigns" className="border-t border-[#EAEAEA] pb-4 pt-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <MagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#787774]" />
            <input type="text" placeholder="Search campaigns..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="field py-2.5 pl-10 pr-4" aria-label="Search campaigns" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="filter-segment" role="group" aria-label="Filter campaigns">
              {(["all", "active", "completed", "expired", "closed"] as FilterOption[]).map((f) => (
                <button key={f} type="button" onClick={() => setFilterBy(f)} className={`filter-segment__item ${filterBy === f ? "filter-segment__item--active" : ""}`}>
                  {f === "all" ? "All" : f === "active" ? "Active" : f === "completed" ? "Completed" : f === "expired" ? "Expired" : "Closed"}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setShowFilters(!showFilters)} className={`rounded-lg border p-2.5 transition-all duration-200 ${showFilters ? "border-[#111111]/30 bg-black/[0.04] text-[#111111]" : "border-[#EAEAEA] bg-white text-[#787774] hover:border-[#D0D0D0] hover:text-[#111111]"}`} aria-expanded={showFilters} aria-label="Toggle sort options">
              <SlidersHorizontal size={16} />
            </button>
          </div>
        </div>

        {showFilters && (
          <motion.div initial={reduceMotion ? false : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-[#787774]">Sort by</span>
            {(["newest", "most_funded", "ending_soon"] as SortOption[]).map((s) => (
              <button key={s} type="button" onClick={() => setSortBy(s)} className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition-all duration-200 ${sortBy === s ? "border-[#111111]/30 bg-black/[0.04] text-[#111111]" : "border-[#EAEAEA] bg-white text-[#787774] hover:border-[#D0D0D0] hover:text-[#111111]"}`}>
                {s === "newest" ? "Newest" : s === "most_funded" ? "Most Funded" : "Ending Soon"}
              </button>
            ))}
          </motion.div>
        )}
      </section>

      <section className="pb-24 pt-2">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card-shell">
                <div className="card-shell__inner space-y-4">
                  <div className="skeleton h-5 w-2/3" />
                  <div className="skeleton h-4 w-full" />
                  <div className="skeleton h-4 w-4/5" />
                  <div className="skeleton h-2 w-full" />
                  <div className="grid grid-cols-3 gap-2">
                    <div className="skeleton h-16" /><div className="skeleton h-16" /><div className="skeleton h-16" />
                  </div>
                  <div className="flex gap-2">
                    <div className="skeleton h-10 flex-1 rounded-lg" /><div className="skeleton h-10 flex-1 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-black/[0.04] text-[#787774]">
              <Sparkle size={20} />
            </span>
            <p className="mt-5 text-lg font-bold tracking-tight text-[#111111]">No campaigns found</p>
            <p className="mt-2 max-w-sm text-sm text-[#787774]">{searchQuery ? "Try a different search term" : "Be the first to create a campaign"}</p>
            {!searchQuery && (
              <button type="button" onClick={() => { if (!address) { connect(); return; } navigate("/create"); }} className="btn-primary mt-6">
                <Plus size={16} /> Create campaign
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((c, i) => (
              <CampaignCard key={c.id} campaign={c} index={i} onView={() => navigate(`/campaign/${c.id}`)} onDonate={() => handleDonate(c.id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
