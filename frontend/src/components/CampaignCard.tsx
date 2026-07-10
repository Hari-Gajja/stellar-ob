import { motion } from "framer-motion";
import { Users, Clock, Target, ArrowRight } from "lucide-react";
import type { CampaignData } from "../types";
import { stroopsToXlm } from "../utils/format";
import { useMemo } from "react";

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

export default function CampaignCard({
  campaign,
  onDonate,
  onView,
  index = 0,
}: {
  campaign: CampaignData;
  onDonate: () => void;
  onView: () => void;
  index?: number;
}) {
  const progress = useMemo(() => {
    if (campaign.funding_goal === 0n) return 0;
    return Math.min(100, Math.round((Number(campaign.total_raised) / Number(campaign.funding_goal)) * 100));
  }, [campaign]);

  const raisedXlm = stroopsToXlm(campaign.total_raised);
  const goalXlm = stroopsToXlm(campaign.funding_goal);
  const endTime = Number(campaign.deadline) * 1000;
  const timeLeft = endTime - Date.now();
  const daysLeft = Math.max(0, Math.ceil(timeLeft / (24 * 60 * 60 * 1000)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="group rounded-3xl border border-zinc-200 bg-white p-6 transition-all hover:shadow-soft hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold tracking-tight truncate">{campaign.name}</h3>
          <p className="mt-2 text-sm leading-5 text-zinc-600 line-clamp-2">{campaign.description}</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
          <span>{raisedXlm.toLocaleString()} XLM raised</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-zinc-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-zinc-950 transition-all duration-500"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
          <Target className="mb-1 h-3.5 w-3.5 text-zinc-400" />
          <p className="font-semibold tracking-tight">{goalXlm.toLocaleString()} XLM</p>
          <p className="text-xs text-zinc-500">Goal</p>
        </div>
        <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
          <Users className="mb-1 h-3.5 w-3.5 text-zinc-400" />
          <p className="font-semibold tracking-tight">{campaign.contributor_count}</p>
          <p className="text-xs text-zinc-500">Supporters</p>
        </div>
        <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
          <Clock className="mb-1 h-3.5 w-3.5 text-zinc-400" />
          <p className="font-semibold tracking-tight">{daysLeft}</p>
          <p className="text-xs text-zinc-500">{daysLeft === 1 ? "Day left" : "Days left"}</p>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
        {!campaign.active && <span className="text-red-500 font-medium">Closed</span>}
        {campaign.active && daysLeft === 0 && <span className="text-amber-500 font-medium">Expired</span>}
        {campaign.active && daysLeft > 0 && <span>Created {formatRelativeTime(campaign.created_at)}</span>}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={onView}
          className="flex-1 rounded-full border border-zinc-300 px-4 py-2.5 text-sm font-medium transition hover:border-zinc-950"
        >
          View details
        </button>
        <button
          onClick={onDonate}
          disabled={!campaign.active}
          className="flex-1 rounded-full bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
        >
          Donate
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
