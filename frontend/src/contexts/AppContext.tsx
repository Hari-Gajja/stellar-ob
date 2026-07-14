import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { connectWallet, getStoredAddress, disconnectWallet, signTransaction } from "../services/wallet";
import {
  donate as contractDonate,
  withdrawFunds as contractWithdraw,
  refund as contractRefund,
  CONTRACT_ID,
} from "../services/contract";
import type {
  WalletInfo,
  TransactionState,
  ToastMessage,
} from "../types";

interface WalletContextType {
  address: string | null;
  connected: boolean;
  connecting: boolean;
  availableWallets: WalletInfo[];
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshAddress: () => Promise<void>;
  signTransaction: typeof signTransaction;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);

  const refreshAddress = useCallback(async () => {
    const addr = await getStoredAddress();
    if (addr) setAddress(addr);
  }, []);

  useEffect(() => {
    refreshAddress();
  }, [refreshAddress]);

  const connect = async () => {
    if (connecting) return;
    setConnecting(true);
    try {
      const addr = await connectWallet();
      setAddress(addr);
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    await disconnectWallet();
    setAddress(null);
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        connected: !!address,
        connecting,
        availableWallets,
        connect,
        disconnect,
        refreshAddress,
        signTransaction,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}

interface TransactionContextType {
  state: TransactionState;
  donate: (publicKey: string, campaignId: number, amount: bigint) => Promise<string>;
  withdraw: (publicKey: string, campaignId: number) => Promise<string>;
  refund: (publicKey: string, campaignId: number) => Promise<string>;
  reset: () => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TransactionState>({ status: "idle" });

  const reset = useCallback(() => {
    setState({ status: "idle" });
  }, []);

  const execTx = async (
    fn: () => Promise<{ signAndSend: () => Promise<unknown> }>,
  ) => {
    setState({ status: "signing" });
    try {
      const tx = await fn();
      setState({ status: "submitting" });
      const sent: any = await tx.signAndSend();
      const hash = typeof sent === "string" ? sent : sent?.hash || "";
      setState({ status: "confirmed", hash, timestamp: Date.now() });
      return hash;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transaction failed";
      setState({ status: "failed", error: message });
      throw err;
    }
  };

  const donate = async (publicKey: string, campaignId: number, amount: bigint) =>
    execTx(() => contractDonate(publicKey, campaignId, amount));

  const withdraw = async (publicKey: string, campaignId: number) =>
    execTx(() => contractWithdraw(publicKey, campaignId));

  const refundTx = async (publicKey: string, campaignId: number) =>
    execTx(() => contractRefund(publicKey, campaignId, publicKey));

  return (
    <TransactionContext.Provider value={{ state, donate, withdraw, refund: refundTx, reset }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransaction() {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error("useTransaction must be used within a TransactionProvider");
  }
  return context;
}

const ToastContext = createContext<{
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, "id">) => void;
  dismissToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
} | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id, duration: toast.duration ?? 5000 };
    setToasts(prev => [...prev, newToast]);
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, newToast.duration);
    }
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((title: string, message?: string) => {
    showToast({ type: "success", title, message });
  }, [showToast]);

  const error = useCallback((title: string, message?: string) => {
    showToast({ type: "error", title, message, duration: 8000 });
  }, [showToast]);

  const warning = useCallback((title: string, message?: string) => {
    showToast({ type: "warning", title, message });
  }, [showToast]);

  const info = useCallback((title: string, message?: string) => {
    showToast({ type: "info", title, message });
  }, [showToast]);

  const value = { toasts, showToast, dismissToast, success, error, warning, info };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastContainer({ toasts, onDismiss }: { toasts: ToastMessage[]; onDismiss: (id: string) => void }) {
  return (
    <div className="pointer-events-none fixed bottom-6 right-4 z-50 flex max-w-sm flex-col gap-3 sm:right-6">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  const icons = {
    success: (
      <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5 text-brand-600" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
  };

  const tone = {
    success: "border-emerald-200/80 bg-emerald-50/95",
    error: "border-red-200/80 bg-red-50/95",
    warning: "border-amber-200/80 bg-amber-50/95",
    info: "border-brand-200/80 bg-brand-50/95",
  };

  return (
    <div
      className={`toast-panel animate-slide-in ${tone[toast.type]}`}
      role="alert"
    >
      <span className="mt-0.5 flex-shrink-0">{icons[toast.type]}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{toast.title}</p>
        {toast.message && <p className="mt-1 text-sm text-ink-muted">{toast.message}</p>}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 rounded-lg p-1 text-ink-faint transition-colors hover:bg-white/70 hover:text-ink-muted"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
