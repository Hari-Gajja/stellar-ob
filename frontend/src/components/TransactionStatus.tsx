import { Loader2, CheckCircle, XCircle, ExternalLink, Clock } from "lucide-react";
import type { TransactionState } from "../types";
import { CONTRACT_ID } from "../services/contract";

export default function TransactionStatus({
  state,
  onClose,
}: {
  state: TransactionState;
  onClose?: () => void;
}) {
  if (state.status === "idle") return null;

  const explorerUrl =
    state.hash && CONTRACT_ID
      ? `https://stellar.expert/explorer/testnet/tx/${state.hash}`
      : null;

  return (
    <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex items-start gap-3">
        {state.status === "signing" && (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-zinc-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Signing transaction...</p>
              <p className="text-xs text-zinc-500 mt-1">Please approve in your wallet</p>
            </div>
          </>
        )}
        {state.status === "submitting" && (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-blue-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Submitting transaction...</p>
              <p className="text-xs text-zinc-500 mt-1">Sending to the Stellar network</p>
            </div>
          </>
        )}
        {state.status === "pending" && (
          <>
            <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Transaction pending</p>
              <p className="text-xs text-zinc-500 mt-1">Waiting for confirmation</p>
              {explorerUrl && (
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 mt-1 hover:underline">
                  View on explorer <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </>
        )}
        {state.status === "confirmed" && (
          <>
            <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-700">Transaction confirmed!</p>
              {state.hash && (
                <p className="text-xs text-zinc-500 mt-1 font-mono break-all">{state.hash}</p>
              )}
              {explorerUrl && (
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 mt-1 hover:underline">
                  View on explorer <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </>
        )}
        {state.status === "failed" && (
          <>
            <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700">Transaction failed</p>
              {state.error && <p className="text-xs text-red-600 mt-1">{state.error}</p>}
            </div>
          </>
        )}
        {onClose && state.status !== "signing" && state.status !== "submitting" && state.status !== "pending" && (
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
