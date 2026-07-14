import { type Icon as PhosphorIcon } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "framer-motion";

interface StatCardProps {
  icon: PhosphorIcon;
  label: string;
  value: string | number;
  sub?: string;
  index?: number;
}

export default function StatCard({ icon: Icon, label, value, sub, index = 0 }: StatCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: reduceMotion ? 0 : index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="card-shell"
    >
      <div className="card-shell__inner !p-4 sm:!p-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/[0.04] text-[#787774]">
          <Icon size={16} />
        </span>
        <p className="mt-3 text-[11px] font-semibold tracking-wide text-[#787774]">{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight tabular text-[#111111]">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-[#787774]">{sub}</p>}
      </div>
    </motion.div>
  );
}
