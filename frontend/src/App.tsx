import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Wallet, SignOut, Spinner, Plus, Layout, List } from "@phosphor-icons/react";
import { useWallet } from "./contexts/AppContext";
import { truncateAddress } from "./utils/format";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { address, connecting, connect, disconnect } = useWallet();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isHome = location.pathname === "/";
  const isCreate = location.pathname === "/create";
  const isDashboard = location.pathname.startsWith("/dashboard");
  const isWallet = location.pathname === "/dashboard/wallet";

  const mobileNavItems = [
    { label: "Campaigns", path: "/", show: true },
    { label: "Dashboard", path: "/dashboard", show: !!address },
    { label: "Wallet", path: "/dashboard/wallet", show: !!address },
    { label: "Create", path: "/create", show: true },
  ];

  const handleMobileNav = (path: string) => {
    if (path === "/create" && !address) { connect(); setMobileNavOpen(false); return; }
    navigate(path);
    setMobileNavOpen(false);
  };

  const isActive = (path: string) => {
    if (path === "/") return isHome;
    if (path === "/dashboard") return isDashboard;
    if (path === "/dashboard/wallet") return isWallet;
    if (path === "/create") return isCreate;
    return false;
  };

  return (
    <div className="min-h-[100dvh] text-[#111111]">
      <div className="shell">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:text-[#111111] focus:border focus:border-[#EAEAEA]"
        >
          Skip to content
        </a>

        <header className="nav-bar">
          <button onClick={() => navigate("/")} className="brand-mark" type="button">
            <span className="brand-mark__icon" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5L13.5 4.75V11.25L8 14.5L2.5 11.25V4.75L8 1.5Z" stroke="#111111" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M5.5 8H10.5M8 5.5V10.5" stroke="#111111" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-base font-semibold tracking-tight text-[#111111]">StellarFund</span>
          </button>

          <nav className="hidden items-center gap-1 sm:flex" aria-label="Primary">
            <button type="button" onClick={() => navigate("/")} className={`nav-link ${isHome ? "nav-link--active" : ""}`}>
              Campaigns
            </button>
            {address && (
              <button type="button" onClick={() => navigate("/dashboard")} className={`nav-link inline-flex items-center gap-1.5 ${isDashboard ? "nav-link--active" : ""}`}>
                <Layout size={14} />
                Dashboard
              </button>
            )}
            {address && (
              <button type="button" onClick={() => navigate("/dashboard/wallet")} className={`nav-link inline-flex items-center gap-1.5 ${isWallet ? "nav-link--active" : ""}`}>
                <Wallet size={14} />
                Wallet
              </button>
            )}
            <button type="button" onClick={() => { if (!address) { connect(); return; } navigate("/create"); }} className={`nav-link inline-flex items-center gap-1.5 ${isCreate ? "nav-link--active" : ""}`}>
              <Plus size={14} />
              Create
            </button>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <button type="button" onClick={() => setMobileNavOpen(true)} className="btn-ghost sm:hidden" aria-label="Open navigation menu">
              <List size={18} />
            </button>

            {address ? (
              <>
                <span className="wallet-chip">
                  <span className="wallet-chip__dot" />
                  <span className="font-mono text-xs tabular sm:text-sm">{truncateAddress(address)}</span>
                </span>
                <button type="button" onClick={disconnect} className="btn-danger-ghost" title="Disconnect wallet" aria-label="Disconnect wallet">
                  <SignOut size={16} />
                </button>
              </>
            ) : (
              <button type="button" onClick={connect} disabled={connecting} className="btn-primary">
                {connecting ? <Spinner size={16} className="animate-spin" /> : <Wallet size={16} />}
                <span className="hidden sm:inline">{connecting ? "Connecting..." : "Connect wallet"}</span>
                <span className="sm:hidden">{connecting ? "..." : "Connect"}</span>
              </button>
            )}
          </div>
        </header>

        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 sm:hidden">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)} />
            <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl border border-[#EAEAEA] bg-white p-6 pb-10 shadow-xl">
              <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-[#EAEAEA]" />
              <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
                {mobileNavItems.filter((i) => i.show).map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => handleMobileNav(item.path)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-left text-sm font-semibold transition-all duration-200 ${
                      isActive(item.path) ? "bg-black/[0.06] text-[#111111]" : "text-[#787774] hover:bg-black/[0.04] hover:text-[#111111]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
              {!address && (
                <button
                  type="button"
                  onClick={() => { connect(); setMobileNavOpen(false); }}
                  className="btn-primary mt-4 w-full"
                >
                  <Wallet size={16} /> Connect wallet
                </button>
              )}
              {address && (
                <button
                  type="button"
                  onClick={() => { disconnect(); setMobileNavOpen(false); }}
                  className="btn-danger-ghost mt-4 w-full justify-center"
                >
                  <SignOut size={16} /> Disconnect
                </button>
              )}
            </div>
          </div>
        )}

        <main id="main-content" className="flex-1 outline-none">
          <Outlet />
        </main>

        <footer className="footer-bar">
          <p>StellarFund — Multi-campaign crowdfunding on Soroban.</p>
          <div className="flex flex-wrap gap-1">
            <button type="button" onClick={() => navigate("/")} className="nav-link">Campaigns</button>
            {address && <button type="button" onClick={() => navigate("/dashboard")} className={`nav-link ${isDashboard ? "nav-link--active" : ""}`}>Dashboard</button>}
            <button type="button" onClick={() => { if (!address) { connect(); return; } navigate("/create"); }} className="nav-link">Create</button>
            <span className="mx-1 text-[#EAEAEA]" aria-hidden>/</span>
            <button type="button" onClick={() => window.open("https://stellar.org/privacy", "_blank")} className="nav-link">Privacy</button>
            <button type="button" onClick={() => window.open("https://stellar.org/terms", "_blank")} className="nav-link">Terms</button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
