import { describe, expect, it } from "vitest";
import {
  hasErrors,
  mergeFieldErrors,
  validateAsset,
  validateClient,
  validateLogin,
  validateProject,
  validateRegister,
  validateUser,
} from "./validation";

describe("validasi form (schema frontend = FormRequest backend)", () => {
  it("login mewajibkan email dan password", () => {
    expect(validateLogin({})).toEqual({
      email: "Email dan password wajib diisi.",
      password: "Email dan password wajib diisi.",
    });
    expect(validateLogin({ email: "a@b.co", password: "rahasia123" })).toEqual({});
  });

  it("register memeriksa konfirmasi password", () => {
    const errors = validateRegister({
      name: "Dewi",
      email: "dewi@example.com",
      password: "rahasia123",
      passwordConfirmation: "berbeda123",
    });
    expect(errors.password_confirmation).toBe("Konfirmasi password tidak cocok.");
  });

  it("client memeriksa nama dan format email", () => {
    expect(validateClient({ name: " ", email: "salah" })).toMatchObject({
      name: "Nama wajib diisi.",
      email: "Format email tidak valid.",
    });
    expect(validateClient({ name: "PT ABC", email: "halo@example.com" })).toEqual({});
  });

  it("project menolak tanggal selesai sebelum mulai", () => {
    const errors = validateProject({
      clientId: 1,
      name: "Proyek",
      startDate: "2026-12-01",
      endDate: "2026-11-01",
    });
    expect(errors.end_date).toContain("tidak boleh sebelum");
  });

  it("asset menolak expired_date sebelum start_date", () => {
    const errors = validateAsset({
      projectId: 1,
      type: "domain",
      name: "example.com",
      startDate: "2026-12-01",
      expiredDate: "2026-11-01",
    });
    expect(errors.expired_date).toContain("harus setelah tanggal mulai");
    expect(validateAsset({ type: "unknown" }).type).toBe("Tipe aset tidak valid.");
  });

  it("user mewajibkan client_id untuk peran client", () => {
    const errors = validateUser({
      name: "User",
      email: "user@example.com",
      password: "rahasia123",
      role: "client",
      clientId: "",
    });
    expect(errors.client_id).toContain("Klien wajib dipilih");
  });

  it("menggabungkan error server dan klien", () => {
    const merged = mergeFieldErrors(
      { name: ["Server: nama dipakai"], email: ["Server: email salah"] },
      { name: "Klien: nama wajib" }
    );
    expect(merged.name).toBe("Klien: nama wajib");
    expect(merged.email).toBe("Server: email salah");
    expect(hasErrors(merged)).toBe(true);
    expect(hasErrors({})).toBe(false);
  });
});
