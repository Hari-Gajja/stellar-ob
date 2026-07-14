import { Spinner, CheckCircle, XCircle, ArrowSquareOut, Clock } from "@phosphor-icons/react";
import type { TransactionState } from "../types";
import { CONTRACT_ID } from "../services/contract";

export default function TransactionStatus({
  state,
  onDismiss,
}: {
  state: TransactionState;
  onDismiss?: () => void;
}) {
  if (state.status === "idle") return null;

  const explorerUrl = state.hash && CONTRACT_ID ? `https://stellar.expert/explorer/testnet/tx/${state.hash}` : null;

  const tone = state.status === "confirmed"
    ? "border-[#EAEAEA] bg-[#EDF3EC]"
    : state.status === "failed"
      ? "border-[#EAEAEA] bg-[#FDEBEC]"
      : state.status === "pending"
        ? "border-[#EAEAEA] bg-[#FBF3DB]"
        : "border-[#EAEAEA] bg-white";

  return (
    <div className={`mt-4 rounded-xl border p-4 ${tone}`}>
      <div className="flex items-start gap-3">
        {state.status === "signing" && (
          <>
            <Spinner size={20} className="mt-0.5 animate-spin text-[#787774]" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[#111111]">Signing transaction...</p>
              <p className="mt-1 text-xs text-[#787774]">Approve in your wallet</p>
            </div>
          </>
        )}
        {state.status === "submitting" && (
          <>
            <Spinner size={20} className="mt-0.5 animate-spin text-[#111111]" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[#111111]">Submitting transaction...</p>
              <p className="mt-1 text-xs text-[#787774]">Sending to the Stellar network</p>
            </div>
          </>
        )}
        {state.status === "pending" && (
          <>
            <Clock size={20} className="mt-0.5 text-[#956400]" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[#111111]">Transaction pending</p>
              <p className="mt-1 text-xs text-[#787774]">Waiting for confirmation</p>
              {explorerUrl && (
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-[#111111] transition-colors hover:text-[#787774]">
                  View on explorer <ArrowSquareOut size={12} />
                </a>
              )}
            </div>
          </>
        )}
        {state.status === "confirmed" && (
          <>
            <CheckCircle size={20} className="mt-0.5 text-[#346538]" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[#346538]">Transaction confirmed</p>
              {state.hash && <p className="mt-1 break-all font-mono text-xs text-[#787774]">{state.hash}</p>}
              {explorerUrl && (
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-[#111111] transition-colors hover:text-[#787774]">
                  View on explorer <ArrowSquareOut size={12} />
                </a>
              )}
            </div>
          </>
        )}
        {state.status === "failed" && (
          <>
            <XCircle size={20} className="mt-0.5 text-[#9F2F2D]" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[#9F2F2D]">Transaction failed</p>
              {state.error && <p className="mt-1 text-xs text-[#787774]">{state.error}</p>}
            </div>
          </>
        )}
        {onDismiss && state.status !== "signing" && state.status !== "submitting" && state.status !== "pending" && (
          <button type="button" onClick={onDismiss} className="shrink-0 text-[#787774] transition-colors hover:text-[#111111]" aria-label="Dismiss">
            <XCircle size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
