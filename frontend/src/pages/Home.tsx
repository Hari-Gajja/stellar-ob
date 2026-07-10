import { motion } from "framer-motion";
import { ArrowRight, Search, SlidersHorizontal, Plus, Sparkles, Loader2 } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../contexts/AppContext";
import { getAllCampaigns } from "../services/contract";
import CampaignCard from "../components/CampaignCard";
import type { CampaignData, SortOption, FilterOption } from "../types";

export default function Home() {
  const navigate = useNavigate();
  const { address, connect } = useWallet();
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
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q),
      );
    }

    if (filterBy === "active") result = result.filter((c) => c.active && Number(c.deadline) * 1000 > Date.now());
    else if (filterBy === "completed") result = result.filter((c) => c.active && c.total_raised >= c.funding_goal);
    else if (filterBy === "closed") result = result.filter((c) => !c.active);

    if (sortBy === "newest") result.sort((a, b) => Number(b.created_at - a.created_at));
    else if (sortBy === "most_funded") result.sort((a, b) => Number(b.total_raised - a.total_raised));
    else if (sortBy === "ending_soon") result.sort((a, b) => Number(a.deadline - b.deadline));

    return result;
  }, [campaigns, searchQuery, sortBy, filterBy]);

  const handleDonate = (campaignId: number) => {
    if (!address) {
      connect();
      return;
    }
    navigate(`/campaign/${campaignId}`);
  };

  return (
    <div className="flex-1">
      <section className="py-12 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="max-w-2xl"
        >
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.24em] text-zinc-500">
            Soroban crowdfunding on Testnet
          </p>
          <h1 className="text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl">
            Fund ideas.
            <br />
            Build together.
            <br />
            On Stellar.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-zinc-600 md:text-lg">
            Support open-source work with a clean, transparent crowdfunding flow powered by a Soroban smart contract.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => {
                if (!address) { connect(); return; }
                navigate("/create");
              }}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-zinc-800"
            >
              {address ? "Start a campaign" : "Connect wallet"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </section>

      <section className="border-t border-zinc-200 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-zinc-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-zinc-950"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-full border border-zinc-300 overflow-hidden text-sm">
              {(["all", "active", "closed"] as FilterOption[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterBy(f)}
                  className={`px-4 py-2 text-sm font-medium transition ${
                    filterBy === f
                      ? "bg-zinc-950 text-white"
                      : "text-zinc-600 hover:text-zinc-950"
                  }`}
                >
                  {f === "all" ? "All" : f === "active" ? "Active" : "Closed"}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`rounded-full border p-2.5 transition ${
                showFilters ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-300 text-zinc-600 hover:text-zinc-950"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 flex items-center gap-3 text-sm"
          >
            <span className="text-zinc-500">Sort by:</span>
            {(["newest", "most_funded", "ending_soon"] as SortOption[]).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition border ${
                  sortBy === s
                    ? "bg-zinc-950 text-white border-zinc-950"
                    : "border-zinc-300 text-zinc-600 hover:text-zinc-950"
                }`}
              >
                {s === "newest" ? "Newest" : s === "most_funded" ? "Most Funded" : "Ending Soon"}
              </button>
            ))}
          </motion.div>
        )}
      </section>

      <section className="pb-16">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-zinc-300" />
            <p className="mt-4 text-lg font-medium text-zinc-500">No campaigns found</p>
            <p className="mt-2 text-sm text-zinc-400">
              {searchQuery ? "Try a different search term" : "Be the first to create a campaign"}
            </p>
            {!searchQuery && (
              <button
                onClick={() => {
                  if (!address) { connect(); return; }
                  navigate("/create");
                }}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                <Plus className="h-4 w-4" />
                Create campaign
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c, i) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                index={i}
                onView={() => navigate(`/campaign/${c.id}`)}
                onDonate={() => handleDonate(c.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
