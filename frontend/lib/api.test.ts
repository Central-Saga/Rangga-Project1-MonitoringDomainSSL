import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  INVALIDATION_EVENT,
  UNAUTHORIZED_EVENT,
  api,
  errorMessage,
  firstMessages,
  invalidateApi,
  isNetworkError,
  isValidationError,
  resetUnauthorizedFlag,
  translateApiMessage,
} from "./api";

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (key: string) => (key.toLowerCase() === "content-type" ? "application/json" : null),
    },
    json: async () => body,
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
  resetUnauthorizedFlag();
  invalidateApi();
});

describe("api client", () => {
  it("menggabungkan GET bersamaan menjadi satu fetch", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const [first, second] = await Promise.all([api.get("/dedupe"), api.get("/dedupe")]);

    expect(first).toEqual({ ok: true });
    expect(second).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("mengubah kegagalan jaringan menjadi ApiError network", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.get("/offline")).rejects.toMatchObject({ status: 0, kind: "network" });
    try {
      await api.get("/offline-2");
    } catch (error) {
      expect(isNetworkError(error)).toBe(true);
      expect(errorMessage(error, "fallback")).toContain("Tidak dapat terhubung");
    }
  });

  it("mengklasifikasikan error validasi 422 beserta field errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      jsonResponse({ message: "The given data was invalid.", errors: { name: ["Nama wajib diisi."] } }, 422)
    ));

    expect(firstMessages({ name: ["Nama wajib diisi."] })).toEqual({ name: "Nama wajib diisi." });
    try {
      await api.post("/clients", { name: "" });
      throw new Error("tidak boleh berhasil");
    } catch (error) {
      expect(isValidationError(error)).toBe(true);
      expect((error as ApiError).status).toBe(422);
      expect((error as ApiError).errors).toEqual({ name: ["Nama wajib diisi."] });
    }
  });

  it("menangani 401 sekali lewat event global", async () => {
    window.history.replaceState({}, "", "/login");
    resetUnauthorizedFlag();
    const listener = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, listener);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      jsonResponse({ message: "Unauthenticated" }, 401)
    ));

    await expect(api.get("/private-a", { dedupe: false })).rejects.toMatchObject({
      status: 401,
      kind: "unauthorized",
    });
    await expect(api.get("/private-b", { dedupe: false })).rejects.toMatchObject({ status: 401 });

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(UNAUTHORIZED_EVENT, listener);
  });

  it("menerjemahkan pesan backend dan menyebarkan event invalidasi", () => {
    expect(translateApiMessage("Email atau password salah.")).toContain("Silakan coba lagi");
    expect(translateApiMessage("Unauthenticated")).toContain("Sesi berakhir");
    expect(translateApiMessage("Pesan lain")).toBe("Pesan lain");

    const listener = vi.fn();
    window.addEventListener(INVALIDATION_EVENT, listener);
    invalidateApi("/clients");
    expect(listener).toHaveBeenCalledTimes(1);
    expect((listener.mock.calls[0][0] as CustomEvent<string>).detail).toBe("/clients");
    window.removeEventListener(INVALIDATION_EVENT, listener);
  });
});
