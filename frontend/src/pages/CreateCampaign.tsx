import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet, useToast } from "../contexts/AppContext";
import { createCampaign } from "../services/contract";
import { xlmToStroops } from "../utils/format";

const CATEGORIES = [
  { value: "", label: "Select category (optional)" },
  { value: "Technology", label: "Technology" },
  { value: "Education", label: "Education" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Environment", label: "Environment" },
  { value: "Open Source", label: "Open Source" },
  { value: "Other", label: "Other" },
];

export default function CreateCampaign() {
  const navigate = useNavigate();
  const { address, connect } = useWallet();
  const toast = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!address) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-zinc-700">Connect your wallet</p>
        <p className="mt-2 text-sm text-zinc-500">You need a Stellar wallet to create a campaign.</p>
        <button
          onClick={connect}
          className="mt-6 rounded-full bg-zinc-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          Connect wallet
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Required", "Campaign title is required");
      return;
    }
    if (!description.trim()) {
      toast.error("Required", "Campaign description is required");
      return;
    }
    const goal = Number(goalAmount);
    if (!goalAmount || isNaN(goal) || goal <= 0) {
      toast.error("Invalid goal", "Please enter a positive goal amount");
      return;
    }
    if (!deadlineDate) {
      toast.error("Required", "Please select a deadline");
      return;
    }

    const deadlineMs = new Date(deadlineDate).getTime();
    if (deadlineMs <= Date.now()) {
      toast.error("Invalid deadline", "Deadline must be in the future");
      return;
    }

    const deadlineSeconds = BigInt(Math.floor(deadlineMs / 1000));

    try {
      setSubmitting(true);
      toast.info("Creating campaign", "Please confirm the transaction in your wallet");

      const tx = await createCampaign(
        address,
        title.trim(),
        description.trim(),
        xlmToStroops(goal),
        deadlineSeconds,
      );
      const sent = await tx.signAndSend();
      const campId = tx.result;

      toast.success("Campaign created!", `Campaign #${campId} is now live`);
      navigate(`/campaign/${campId}`);
    } catch (err) {
      console.error("Failed to create campaign:", err);
      const msg = err instanceof Error ? err.message : "Transaction failed";
      toast.error("Failed to create campaign", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const minDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return (
    <div className="flex-1 py-8 lg:py-12">
      <button
        onClick={() => navigate("/")}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-950"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to campaigns
      </button>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto max-w-xl"
      >
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.22em] text-zinc-500">New campaign</p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Create a campaign</h1>
        <p className="mt-3 text-base leading-7 text-zinc-600">
          Launch a crowdfunding campaign on Stellar. Set your goal, describe your project, and start receiving donations.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Campaign title *</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Open-source tooling fund"
              className="w-full rounded-2xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-zinc-950"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Description *</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project, what you're building, and how funds will be used..."
              rows={4}
              className="w-full rounded-2xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-zinc-950 resize-vertical"
              required
            />
          </label>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Goal amount (XLM) *</span>
              <input
                type="number"
                step="any"
                min="0.0000001"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                placeholder="e.g. 1000"
                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-zinc-950"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">Deadline *</span>
              <input
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                min={minDeadline}
                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-zinc-950"
                required
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-2xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-zinc-950 bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Creating campaign..." : "Create campaign"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
