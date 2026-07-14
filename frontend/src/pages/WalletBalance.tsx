import { motion, useReducedMotion } from "framer-motion";
import { Wallet, ArrowsClockwise, CopySimple, CheckCircle } from "@phosphor-icons/react";
import { useState, useEffect, useCallback } from "react";
import { useWallet } from "../contexts/AppContext";
import { getAccountBalances } from "../services/wallet";
import { truncateAddress } from "../utils/format";
import type { Balance } from "../services/wallet";

export default function WalletBalance() {
  const { address, connect } = useWallet();
  const reduceMotion = useReducedMotion();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadBalances = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const data = await getAccountBalances(address);
      setBalances(data);
    } catch (err) {
      console.error("Failed to load balances:", err);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  const xlmBalance = balances.find((b) => b.asset_type === "native");
  const otherBalances = balances.filter((b) => b.asset_type !== "native");

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!address) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
        <div className="card-shell max-w-md">
          <div className="card-shell__inner flex flex-col items-center px-8 py-10">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-black/[0.04] text-[#787774]"><Wallet size={20} /></span>
            <p className="mt-5 text-lg font-bold tracking-tight text-[#111111]">Connect your wallet</p>
            <p className="mt-2 text-sm text-[#787774]">Connect a wallet to view your balances.</p>
            <button type="button" onClick={connect} className="btn-primary mt-6"><Wallet size={16} />Connect wallet</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-20 pt-8 sm:pt-12">
      <div className="flex items-start justify-between">
        <motion.div initial={reduceMotion ? false : { opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
          <p className="section-kicker mb-2">Wallet</p>
          <h1 className="section-title">Balances</h1>
        </motion.div>
        <motion.button type="button" onClick={loadBalances} disabled={loading} className="btn-ghost" aria-label="Refresh">
          <ArrowsClockwise size={16} className={loading ? "animate-spin" : ""} />
        </motion.button>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="font-mono text-xs text-[#787774] sm:text-sm">{truncateAddress(address)}</span>
        <button type="button" onClick={copyAddress} className="rounded-lg p-1.5 text-[#787774] transition-all duration-200 hover:bg-black/[0.04] hover:text-[#111111]" aria-label={copied ? "Copied" : "Copy address"}>
          {copied ? <CheckCircle size={14} /> : <CopySimple size={14} />}
        </button>
      </div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="mt-8 card-shell"
      >
        <div className="card-shell__inner">
          <p className="text-[11px] font-semibold tracking-wide text-[#787774]">Native balance</p>
          {loading ? (
            <div className="mt-2 h-10 w-48 animate-pulse rounded-lg bg-black/[0.06]" />
          ) : (
            <p className="mt-1 tabular tracking-tight text-4xl font-bold text-[#111111] leading-none">
              {xlmBalance ? (Number(xlmBalance.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 })) : "—"} XLM
            </p>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="mt-6"
      >
        <div className="mb-3 flex items-baseline gap-2">
          <h2 className="text-sm font-semibold text-[#787774]">Other assets</h2>
          <span className="text-[11px] text-[#787774]">— tokens and trustlines on this Stellar account</span>
        </div>
        {loading ? (
          <div className="card-shell">
            <div className="card-shell__inner space-y-3">
              {[0, 1].map((i) => <div key={i} className="skeleton h-12 w-full" />)}
            </div>
          </div>
        ) : otherBalances.length === 0 ? (
          <div className="card-shell">
            <div className="card-shell__inner">
              <p className="text-sm text-[#787774]">No other assets in this wallet.</p>
            </div>
          </div>
        ) : (
          <div className="card-shell overflow-hidden">
            <div className="divide-y divide-[#EAEAEA]">
              {otherBalances.map((b, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-3.5 sm:px-7">
                  <div>
                    <p className="text-sm font-medium text-[#111111]">{b.asset_code || b.asset_type}</p>
                    {b.asset_issuer && <p className="text-[11px] text-[#787774] font-mono truncate max-w-[200px]">{truncateAddress(b.asset_issuer)}</p>}
                  </div>
                  <p className="tabular text-sm font-semibold text-[#111111]">{Number(b.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 })}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
