import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CampaignCard from "./CampaignCard";
import type { CampaignData } from "../types";

const mockCampaign: CampaignData = {
  id: 1,
  owner: "GCKFBEIYTKPXZJGKBB5HZ5QZKZJQKQKQKQKQKQKQKQKQKQKQKQKQKQKQ",
  name: "Test Campaign",
  description: "A test campaign for testing purposes",
  funding_goal: 100_000_000n,
  total_raised: 25_000_000n,
  contributor_count: 5,
  created_at: BigInt(Math.floor(Date.now() / 1000) - 86400),
  deadline: BigInt(Math.floor(Date.now() / 1000) + 86400 * 30),
  status: "Active",
};

describe("CampaignCard", () => {
  test("renders campaign name and description", () => {
    render(
      <CampaignCard
        campaign={mockCampaign}
        onView={vi.fn()}
        onDonate={vi.fn()}
      />,
    );
    expect(screen.getByText("Test Campaign")).toBeInTheDocument();
    expect(screen.getByText("A test campaign for testing purposes")).toBeInTheDocument();
  });

  test("shows progress bar with correct percentage", () => {
    render(
      <CampaignCard
        campaign={mockCampaign}
        onView={vi.fn()}
        onDonate={vi.fn()}
      />,
    );
    expect(screen.getByText("25%")).toBeInTheDocument();
  });

  test("shows donate button enabled for active campaign", () => {
    render(
      <CampaignCard
        campaign={mockCampaign}
        onView={vi.fn()}
        onDonate={vi.fn()}
      />,
    );
    const donateBtn = screen.getByText("Donate").closest("button");
    expect(donateBtn).not.toBeDisabled();
  });

  test("shows donate button disabled for closed campaign", () => {
    const closedCampaign = { ...mockCampaign, status: "Closed" as const };
    render(
      <CampaignCard
        campaign={closedCampaign}
        onView={vi.fn()}
        onDonate={vi.fn()}
      />,
    );
    const donateBtn = screen.getByText("Donate").closest("button");
    expect(donateBtn).toBeDisabled();
  });

  test("calls onView when view details is clicked", async () => {
    const onView = vi.fn();
    const user = userEvent.setup();
    render(
      <CampaignCard
        campaign={mockCampaign}
        onView={onView}
        onDonate={vi.fn()}
      />,
    );
    await user.click(screen.getByText("View details"));
    expect(onView).toHaveBeenCalledOnce();
  });

  test("calls onDonate when donate button is clicked", async () => {
    const onDonate = vi.fn();
    const user = userEvent.setup();
    render(
      <CampaignCard
        campaign={mockCampaign}
        onView={vi.fn()}
        onDonate={onDonate}
      />,
    );
    await user.click(screen.getByText("Donate"));
    expect(onDonate).toHaveBeenCalledOnce();
  });
});
