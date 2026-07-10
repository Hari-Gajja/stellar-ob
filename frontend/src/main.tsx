import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Home from "./pages/Home";
import CampaignDetail from "./pages/CampaignDetail";
import CreateCampaign from "./pages/CreateCampaign";
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
              <Route path="*" element={<Home />} />
            </Route>
          </Routes>
          </TransactionProvider>
        </WalletProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
