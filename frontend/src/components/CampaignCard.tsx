import { motion, useReducedMotion } from "framer-motion";
import { Users, Clock, Crosshair, ArrowRight } from "@phosphor-icons/react";
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
  const reduceMotion = useReducedMotion();
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
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: reduceMotion ? 0 : Math.min(index * 0.05, 0.35),
        ease: [0.16, 1, 0.3, 1],
      }}
      className="card-shell group h-full"
    >
      <div className="card-shell__inner flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <h3 className="truncate text-lg font-bold tracking-tight text-[#111111]">{campaign.name}</h3>
          <span className={`shrink-0 ${campaign.status !== "Active" ? (campaign.status === "Successful" ? "badge-info" : campaign.status === "Failed" ? "badge-danger" : campaign.status === "Closed" ? "badge-neutral" : "badge-danger") : daysLeft === 0 ? "badge-warning" : ""}`}>
            {campaign.status !== "Active" ? (campaign.status === "Successful" ? "Completed" : campaign.status) : daysLeft === 0 ? "Expired" : ""}
          </span>
        </div>
        <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-[#787774]">{campaign.description}</p>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-[#111111]">{raisedXlm.toLocaleString()} XLM raised</span>
            <span className="tabular font-semibold text-[#111111]">{progress}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${Math.min(100, progress)}%` }} />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 border-t border-[#EAEAEA] pt-4 text-xs text-[#787774]">
          <span className="flex items-center gap-1.5">
            <Crosshair size={12} /> {goalXlm.toLocaleString()} XLM
          </span>
          <span className="h-3 w-px bg-[#EAEAEA]" />
          <span className="flex items-center gap-1.5">
            <Users size={12} /> {campaign.contributor_count}
          </span>
          <span className="h-3 w-px bg-[#EAEAEA]" />
          <span className="flex items-center gap-1.5">
            <Clock size={12} /> {daysLeft} {daysLeft === 1 ? "day" : "days"}
          </span>
        </div>

        {campaign.status === "Active" && daysLeft > 0 && <p className="mt-2 text-[11px] text-[#787774]">Created {formatRelativeTime(campaign.created_at)}</p>}

        <div className="mt-auto flex gap-2 pt-4">
          <button type="button" onClick={onView} className="btn-secondary flex-1 py-2.5">View details</button>
          <button type="button" onClick={onDonate} disabled={campaign.status !== "Active" || daysLeft === 0} className="btn-primary flex-1 py-2.5">
            Donate <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
