import { describe, test, expect } from "vitest";
import { formatRelativeTime, truncateAddress } from "../utils/format";

describe("format utilities", () => {
  test("truncateAddress shortens long addresses", () => {
    const address = "GCKFBEIYTKPXZJGKBB5HZ5QZKZJQKQKQKQKQKQKQKQKQKQKQKQKQKQKQ";
    expect(truncateAddress(address)).toBe("GCKFBE...KQKQ");
  });

  test("truncateAddress handles short addresses", () => {
    const address = "GSHORT";
    expect(truncateAddress(address)).toBe("GSHORT");
  });

  test("formatRelativeTime shows just now for recent times", () => {
    const now = Date.now();
    const secondsAgo = Math.floor((now - 5000) / 1000);
    expect(formatRelativeTime(BigInt(secondsAgo))).toBe("Just now");
  });

  test("formatRelativeTime shows minutes for older times", () => {
    const now = Date.now();
    const minutesAgo = Math.floor((now - 300000) / 1000);
    expect(formatRelativeTime(BigInt(minutesAgo))).toBe("5m ago");
  });

  test("formatRelativeTime shows hours for even older times", () => {
    const now = Date.now();
    const hoursAgo = Math.floor((now - 7200000) / 1000);
    expect(formatRelativeTime(BigInt(hoursAgo))).toBe("2h ago");
  });

  test("formatRelativeTime shows days for very old times", () => {
    const now = Date.now();
    const daysAgo = Math.floor((now - 172800000) / 1000);
    expect(formatRelativeTime(BigInt(daysAgo))).toBe("2d ago");
  });
});