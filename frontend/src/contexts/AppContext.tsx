import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { 
  getAvailableWallets, 
  connectWallet, 
  getStoredAddress, 
  disconnectWallet,
  signTransaction,
  STELLAR_NETWORK_PASSPHRASE,
  STELLAR_RPC_URL
} from "../services/wallet";
import { 
  createReadOnlyClient, 
  createSigningClient,
  getCampaign,
  getRecentDonations,
  getContributorCount,
  donate as contractDonate,
  generateTransactionId,
  xlmToStroops,
  CONTRACT_ID
} from "../services/contract";
import type { 
  WalletInfo, 
  TransactionState, 
  ToastMessage, 
  CampaignData, 
  DonationRecord,
  DonationProgress 
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

  const loadWallets = useCallback(async () => {
    const wallets = await getAvailableWallets();
    setAvailableWallets(wallets);
  }, []);

  const refreshAddress = useCallback(async () => {
    const addr = await getStoredAddress();
    if (addr) setAddress(addr);
  }, []);

  useEffect(() => {
    loadWallets();
    refreshAddress();
  }, [loadWallets, refreshAddress]);

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

interface CampaignContextType {
  campaign: CampaignData | null;
  donations: DonationRecord[];
  progress: DonationProgress | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: number | null;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [progress, setProgress] = useState<DonationProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const readOnlyClient = createReadOnlyClient(CONTRACT_ID);

  const calculateProgress = useCallback((campaignData: CampaignData): DonationProgress => {
    const goalXlm = Number(campaignData.funding_goal) / 10_000_000;
    const raisedXlm = Number(campaignData.total_raised) / 10_000_000;
    const percentage = campaignData.funding_goal === 0n ? 0 : Math.min(100, Math.round((Number(campaignData.total_raised) / Number(campaignData.funding_goal)) * 100));
    
    const createdTime = Number(campaignData.created_at) * 1000;
    const endTime = createdTime + 30 * 24 * 60 * 60 * 1000;
    const timeLeft = endTime - Date.now();
    const daysLeft = Math.max(0, Math.ceil(timeLeft / (24 * 60 * 60 * 1000)));

    return {
      percentage,
      goalXlm,
      raisedXlm,
      contributors: Number(campaignData.contributor_count),
      daysLeft,
    };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [campaignData, donationsData, contributorCount] = await Promise.all([
        getCampaign(readOnlyClient),
        getRecentDonations(readOnlyClient, 20),
        getContributorCount(readOnlyClient),
      ]);

      setCampaign(campaignData);
      setDonations(donationsData.sort((a, b) => Number(b.timestamp - a.timestamp)));
      setProgress(calculateProgress(campaignData));
      setLastUpdated(Date.now());
    } catch (err) {
      console.error("Error fetching campaign data:", err);
      setError("Failed to load campaign data");
    } finally {
      setLoading(false);
    }
  }, [calculateProgress]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <CampaignContext.Provider
      value={{
        campaign,
        donations,
        progress,
        loading,
        error,
        refresh: fetchData,
        lastUpdated,
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaign() {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error("useCampaign must be used within a CampaignProvider");
  }
  return context;
}

interface TransactionContextType {
  state: TransactionState;
  donate: (client: ReturnType<typeof createSigningClient>, address: string, amount: bigint, txId: string) => Promise<string>;
  reset: () => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TransactionState>({ status: "idle" });

  const reset = useCallback(() => {
    setState({ status: "idle" });
  }, []);

  const donate = async (client: ReturnType<typeof createSigningClient>, address: string, amount: bigint, txId: string) => {
    setState({ status: "signing" });
    try {
      const hash = await contractDonate(client, address, amount, txId);
      setState({ status: "submitting" });
      setState({ status: "pending", hash, timestamp: Date.now() });
      return hash;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transaction failed";
      setState({ status: "failed", error: message });
      throw err;
    }
  };

  return (
    <TransactionContext.Provider value={{ state, donate, reset }}>
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

  return (
    <>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
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

function ToastContainer({ toasts, onDismiss }: { toasts: ToastMessage[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  const icons = {
    success: (
      <svg className="h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
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
      <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
  };

  const bgColors = {
    success: "bg-emerald-50 border-emerald-200",
    error: "bg-red-50 border-red-200",
    warning: "bg-amber-50 border-amber-200",
    info: "bg-blue-50 border-blue-200",
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 min-w-[300px] max-w-md shadow-lg animate-slide-in ${bgColors[toast.type]}`}
      role="alert"
    >
      <span className="flex-shrink-0 mt-0.5">{icons[toast.type]}</span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-zinc-950">{toast.title}</p>
        {toast.message && <p className="mt-1 text-sm text-zinc-600">{toast.message}</p>}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 text-xl leading-none text-zinc-400 hover:text-zinc-600"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}