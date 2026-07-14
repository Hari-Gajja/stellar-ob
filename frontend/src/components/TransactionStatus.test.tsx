import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TransactionStatus from "./TransactionStatus";
import type { TransactionState } from "../types";

describe("TransactionStatus", () => {
  test("renders nothing when idle", () => {
    const state: TransactionState = { status: "idle" };
    const { container } = render(
      <TransactionStatus state={state} onDismiss={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  test("shows signing status", () => {
    const state: TransactionState = { status: "signing" };
    render(<TransactionStatus state={state} onDismiss={vi.fn()} />);
    expect(screen.getByText("Signing transaction...")).toBeInTheDocument();
  });

  test("shows submitting status", () => {
    const state: TransactionState = { status: "submitting" };
    render(<TransactionStatus state={state} onDismiss={vi.fn()} />);
    expect(screen.getByText("Submitting transaction...")).toBeInTheDocument();
  });

  test("shows confirmed with hash", () => {
    const state: TransactionState = {
      status: "confirmed",
      hash: "abc123",
      timestamp: Date.now(),
    };
    render(<TransactionStatus state={state} onDismiss={vi.fn()} />);
    expect(screen.getByText("Transaction confirmed")).toBeInTheDocument();
    expect(screen.getByText(/abc123/)).toBeInTheDocument();
  });

  test("shows failed with error message", () => {
    const state: TransactionState = {
      status: "failed",
      error: "Insufficient balance",
    };
    render(<TransactionStatus state={state} onDismiss={vi.fn()} />);
    expect(screen.getByText("Transaction failed")).toBeInTheDocument();
    expect(screen.getByText("Insufficient balance")).toBeInTheDocument();
  });

  test("calls onDismiss when close button is clicked", async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    const state: TransactionState = {
      status: "confirmed",
      hash: "abc123",
      timestamp: Date.now(),
    };
    render(<TransactionStatus state={state} onDismiss={onDismiss} />);
    const closeBtn = screen.getByLabelText("Dismiss");
    await user.click(closeBtn);
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
