import { describe, expect, it } from "vitest";
import { responseSchemaFor } from "@/lib/schemas";
import dump from "./fixtures/api-responses.json";

/**
 * Fixture hasil probe nyata terhadap backend Laravel (sqlite, admin + satu
 * klien/proyek/aset/renewal/notifikasi). Menjaga agar skema zod tidak melenceng
 * dari kontrak API saat backend berubah (audit 1.4).
 */
const responses = dump as Record<string, unknown>;

describe("skema zod vs respons API nyata", () => {
  it("mencakup seluruh endpoint yang diprobes", () => {
    expect(Object.keys(responses).length).toBeGreaterThanOrEqual(12);
  });

  for (const [endpoint, payload] of Object.entries(responses)) {
    it(`${endpoint} diterima skema`, () => {
      const [method, path] = endpoint.split(" ");
      const parsed = responseSchemaFor(method ?? "", path ?? "").safeParse(payload);

      expect(parsed.success, endpoint).toBe(true);
    });
  }
});
