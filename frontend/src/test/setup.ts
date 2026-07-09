import "@testing-library/jest-dom";
import { vi } from "vitest";

vi.mock("@creit.tech/stellar-wallets-kit/sdk", () => ({
  StellarWalletsKit: {
    init: vi.fn(),
    authModal: vi.fn().mockResolvedValue({ address: "GTESTADDRESS123456789012345678901234567890123" }),
    getAddress: vi.fn().mockResolvedValue({ address: "GTESTADDRESS123456789012345678901234567890123" }),
    disconnect: vi.fn(),
    signTransaction: vi.fn().mockResolvedValue({ signedTxXdr: "AAAA..." }),
    getWallets: vi.fn().mockReturnValue([
      { name: "Freighter", installed: true, icon: "" },
      { name: "xBull", installed: false, icon: "" },
    ]),
  },
}));

vi.mock("@creit.tech/stellar-wallets-kit/modules/utils", () => ({
  defaultModules: vi.fn().mockReturnValue([]),
}));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});