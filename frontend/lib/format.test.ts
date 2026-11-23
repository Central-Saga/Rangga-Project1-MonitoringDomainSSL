import { describe, expect, it } from "vitest";
import {
  LOCALE,
  TIME_ZONE,
  assetTypeColor,
  expiryColor,
  expiryText,
  formatDate,
  formatDateTime,
  formatNumber,
  formatRupiah,
  statusColor,
} from "./format";

const normalize = (value: string) => value.replace(/\u00a0/g, " ");

describe("format", () => {
  it("memakai locale dan timezone yang konsisten", () => {
    expect(LOCALE).toBe("id-ID");
    expect(TIME_ZONE).toBe("Asia/Makassar");
  });

  it("memformat mata uang dan angka dengan Intl", () => {
    expect(normalize(formatRupiah(125000))).toContain("125.000");
    expect(normalize(formatNumber(1250000))).toContain("1.250.000");
    expect(formatRupiah("bukan-angka")).toBe("Rp 0");
    expect(formatNumber(null)).toBe("0");
  });

  it("memformat tanggal dan menangani nilai kosong/invalid", () => {
    expect(formatDate(null)).toBe("-");
    expect(formatDateTime("invalid")).toBe("-");
    expect(formatDate("2026-11-23T00:00:00Z")).not.toBe("-");
  });

  it("memberi teks dan warna kedaluwarsa", () => {
    expect(expiryText(-3)).toContain("Lewat 3 hari");
    expect(expiryText(0)).toBe("Hari ini");
    expect(expiryText(9)).toBe("9 hari lagi");
    expect(expiryColor(-1, "active")).toContain("text-danger");
    expect(expiryColor(10, "active")).toContain("text-warn");
    expect(expiryColor(60, "active")).toContain("text-ok");
    expect(expiryColor(60, "expired")).toContain("text-danger");
  });

  it("memetakan seluruh status dan tipe aset", () => {
    expect(Object.keys(statusColor)).toEqual([
      "active",
      "expired",
      "suspended",
      "on_hold",
      "completed",
      "paid",
      "pending",
    ]);
    expect(Object.keys(assetTypeColor)).toEqual(["domain", "hosting", "ssl", "vps"]);
  });
});
