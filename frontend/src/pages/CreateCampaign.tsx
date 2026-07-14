import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Spinner, Wallet } from "@phosphor-icons/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet, useToast } from "../contexts/AppContext";
import { createCampaign } from "../services/contract";
import { xlmToStroops } from "../utils/format";

export default function CreateCampaign() {
  const navigate = useNavigate();
  const { address, connect } = useWallet();
  const toast = useToast();
  const reduceMotion = useReducedMotion();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!address) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
        <div className="card-shell max-w-md">
          <div className="card-shell__inner flex flex-col items-center px-8 py-10">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-black/[0.04] text-[#787774]"><Wallet size={20} /></span>
            <p className="mt-5 text-lg font-bold tracking-tight text-[#111111]">Connect your wallet</p>
            <p className="mt-2 text-sm text-[#787774]">You need to connect a wallet to create a campaign.</p>
            <button type="button" onClick={connect} className="btn-primary mt-6"><Wallet size={16} />Connect wallet</button>
          </div>
        </div>
      </div>
    );
  }

  const minDeadline = new Date();
  minDeadline.setDate(minDeadline.getDate() + 1);
  const minDeadlineStr = minDeadline.toISOString().split("T")[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Title required", "Enter a campaign title"); return; }
    if (!description.trim()) { toast.error("Description required", "Enter a campaign description"); return; }
    const goal = parseFloat(goalAmount);
    if (isNaN(goal) || goal <= 0) { toast.error("Invalid goal", "Enter a valid funding goal in XLM"); return; }
    if (!deadlineDate) { toast.error("Deadline required", "Select a campaign deadline"); return; }
    const deadlineUnix = Math.floor(new Date(deadlineDate).getTime() / 1000);

    setSubmitting(true);
    try {
      const tx = await createCampaign(address, title.trim(), description.trim(), xlmToStroops(goal), BigInt(deadlineUnix));
      const sent: any = await tx.signAndSend();
      const newId = typeof sent === "number" ? sent : Number(sent);
      toast.success("Campaign created", `Campaign #${newId} is now live`);
      navigate(`/campaign/${newId}`);
    } catch { toast.error("Failed to create campaign"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="flex-1 pb-20 pt-6 sm:pt-10">
      <motion.div initial={reduceMotion ? false : { opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
        <button type="button" onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-1 text-xs font-semibold tracking-wide text-[#787774] transition-colors duration-200 hover:text-[#111111]">
          <ArrowLeft size={12} />
          Back
        </button>
      </motion.div>

      <motion.div initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="mx-auto max-w-2xl">
        <div className="card-shell">
          <div className="card-shell__inner">
            <div className="mb-8">
              <p className="section-kicker mb-2">Launch</p>
              <h1 className="text-2xl font-bold tracking-tight text-[#111111] sm:text-3xl">Create a campaign</h1>
              <p className="mt-2 text-sm text-[#787774]">Fill in the details below to launch your campaign on Stellar.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="field-label">Campaign title</label>
                <input id="title" type="text" placeholder="e.g. Build an open-source trading bot" value={title} onChange={(e) => setTitle(e.target.value)} className="field" required />
              </div>

              <div>
                <label htmlFor="description" className="field-label">Description</label>
                <textarea id="description" rows={4} placeholder="Describe what you're building and why it matters" value={description} onChange={(e) => setDescription(e.target.value)} className="field resize-none" required />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="goal" className="field-label">Funding goal (XLM)</label>
                  <input id="goal" type="number" min="0" step="0.1" placeholder="e.g. 1000" value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} className="field" required />
                </div>
                <div>
                  <label htmlFor="deadline" className="field-label">Deadline</label>
                  <input id="deadline" type="date" min={minDeadlineStr} value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} className="field" required />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => navigate("/")} className="btn-secondary px-6 py-3">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary px-8 py-3">
                  {submitting ? <Spinner size={16} className="animate-spin" /> : null}
                  {submitting ? "Launching..." : "Launch campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
