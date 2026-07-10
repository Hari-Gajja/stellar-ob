import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Wallet, LogOut, Loader2, Plus, LayoutGrid } from "lucide-react";
import { useWallet } from "./contexts/AppContext";
import { truncateAddress } from "./utils/format";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { address, connecting, connect, disconnect } = useWallet();

  return (
    <div className="min-h-screen bg-white text-zinc-950">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 pb-10 pt-5 lg:px-10">
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 text-sm">
          <button onClick={() => navigate("/")} className="font-semibold tracking-tight text-lg">
            StellarFund
          </button>
          <nav className="flex items-center gap-4 text-zinc-600">
            <button
              onClick={() => navigate("/")}
              className={`transition text-sm ${location.pathname === "/" ? "text-zinc-950 font-medium" : "hover:text-zinc-950"}`}
            >
              Campaigns
            </button>
            <button
              onClick={() => {
                if (!address) { connect(); return; }
                navigate("/create");
              }}
              className="inline-flex items-center gap-1 text-sm transition hover:text-zinc-950"
            >
              <Plus className="h-3.5 w-3.5" />
              Create
            </button>
          </nav>
          <div className="flex items-center gap-2">
            {address ? (
              <>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {truncateAddress(address)}
                </span>
                <button
                  onClick={disconnect}
                  className="inline-flex items-center gap-1 rounded-full border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                  title="Disconnect wallet"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <button
                onClick={connect}
                disabled={connecting}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-900 px-4 py-2 text-sm font-medium transition hover:bg-zinc-950 hover:text-white disabled:opacity-50"
              >
                {connecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wallet className="h-4 w-4" />
                )}
                {connecting ? "Connecting..." : "Connect wallet"}
              </button>
            )}
          </div>
        </header>

        <Outlet />

        <footer className="flex flex-col gap-3 border-t border-zinc-200 py-6 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between">
          <p>StellarFund - Multi-campaign crowdfunding on Soroban.</p>
          <div className="flex gap-4">
            <button onClick={() => navigate("/")} className="transition hover:text-zinc-950">
              Campaigns
            </button>
            <button
              onClick={() => {
                if (!address) { connect(); return; }
                navigate("/create");
              }}
              className="transition hover:text-zinc-950"
            >
              Create
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
