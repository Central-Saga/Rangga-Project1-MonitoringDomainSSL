import { describe, expect, it } from "vitest";

import {
  assetTypeColor,
  expiryColor,
  expiryText,
  formatDate,
  formatRupiah,
  statusColor,
} from "../format";

describe("formatRupiah", () => {
  it("formats numbers with Indonesian thousand separators", () => {
    expect(formatRupiah(1_500_000)).toBe("Rp 1.500.000");
  });

  it("formats numeric strings coming straight from the API", () => {
    expect(formatRupiah("250000.00")).toBe("Rp 250.000");
  });

  it("falls back to zero for null/undefined values", () => {
    expect(formatRupiah(null)).toBe("Rp 0");
    expect(formatRupiah(undefined)).toBe("Rp 0");
  });
});

describe("formatDate", () => {
  it("returns a dash when the value is missing", () => {
    expect(formatDate(null)).toBe("-");
    expect(formatDate("")).toBe("-");
  });

  it("renders an ISO date in the Indonesian short format", () => {
    expect(formatDate("2026-01-15")).toBe("15 Jan 2026");
  });
});

describe("expiryText", () => {
  it("describes past, current-day and future expiries", () => {
    expect(expiryText(-3)).toBe("Lewat 3 hari");
    expect(expiryText(0)).toBe("Hari ini");
    expect(expiryText(12)).toBe("12 hari lagi");
  });
});

describe("expiryColor", () => {
  it("uses the danger palette for expired or overdue assets", () => {
    expect(expiryColor(-1, "active")).toBe("bg-danger-soft text-danger");
    expect(expiryColor(30, "expired")).toBe("bg-danger-soft text-danger");
    expect(expiryColor(5, "active")).toBe("bg-danger-soft text-danger");
  });

  it("uses warn within a month and ok beyond that", () => {
    expect(expiryColor(21, "active")).toBe("bg-warn-soft text-warn");
    expect(expiryColor(90, "active")).toBe("bg-ok-soft text-ok");
  });
});

describe("color maps", () => {
  it("exposes a palette entry for every supported asset type", () => {
    expect(Object.keys(assetTypeColor)).toEqual([
      "domain",
      "hosting",
      "ssl",
      "vps",
    ]);
  });

  it("maps the lifecycle statuses used by the app", () => {
    expect(statusColor.expired).toBe("bg-danger-soft text-danger");
    expect(statusColor.active).toBe("bg-ok-soft text-ok");
  });
});
