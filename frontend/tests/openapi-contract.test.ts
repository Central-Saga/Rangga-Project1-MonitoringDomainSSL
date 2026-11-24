import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Contract test statis: dokumentasi OpenAPI backend harus mengikuti route
 * yang benar-benar didaftarkan. Ini bukan pengganti test HTTP, tetapi
 * mencegah drift antara routes/api.php dan docs/openapi.yaml.
 */
const readRepoFile = (...segments: string[]) =>
  readFileSync(join(process.cwd(), "..", ...segments), "utf8");

const openapi = readRepoFile("backend/docs/openapi.yaml");
const routes = readRepoFile("backend/routes/api.php");

describe("kontrak OpenAPI vs route backend", () => {
  it("mendokumentasikan prefix kanonik dan alias legacy", () => {
    expect(openapi).toContain("url: http://localhost:8000/api/v1");
    expect(openapi).toContain("url: http://localhost:8000/api");
    expect(routes).toContain("Route::prefix('v1')");
  });

  it("mendokumentasikan endpoint create dengan header Location", () => {
    for (const path of ["/clients", "/projects", "/assets", "/users", "/auth/register"]) {
      expect(openapi, `path ${path} harus ada`).toContain(`  ${path}:`);
    }
    expect(openapi.match(/Location: \{ schema:/g)?.length).toBeGreaterThanOrEqual(5);
  });

  it("mencantumkan pembatasan parameter numerik di route dan dokumen", () => {
    expect(routes).toContain("whereNumber('asset')");
    expect(routes).toContain("whereNumber('id')");
    expect(openapi).toContain("schema: { type: integer }");
  });

  it("mendokumentasikan bentuk error seragam", () => {
    expect(openapi).toContain("ValidationError:");
    expect(openapi).toContain("Unauthorized:");
    expect(openapi).toContain("NotFound:");
  });
});
