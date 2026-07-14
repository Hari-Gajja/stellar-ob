import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Home from "./pages/Home";
import CampaignDetail from "./pages/CampaignDetail";
import CreateCampaign from "./pages/CreateCampaign";
import Dashboard from "./pages/Dashboard";
import MyCampaigns from "./pages/MyCampaigns";
import MyDonations from "./pages/MyDonations";
import WalletBalance from "./pages/WalletBalance";
import { WalletProvider, ToastProvider, TransactionProvider } from "./contexts/AppContext";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <WalletProvider>
          <TransactionProvider>
          <Routes>
            <Route element={<App />}>
              <Route path="/" element={<Home />} />
              <Route path="/campaign/:id" element={<CampaignDetail />} />
              <Route path="/create" element={<CreateCampaign />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/my-campaigns" element={<MyCampaigns />} />
              <Route path="/dashboard/my-donations" element={<MyDonations />} />
              <Route path="/dashboard/wallet" element={<WalletBalance />} />
              <Route path="*" element={<Home />} />
            </Route>
          </Routes>
          </TransactionProvider>
        </WalletProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
