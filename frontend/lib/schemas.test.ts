import { describe, expect, it } from "vitest";
import { normalizeApiPath, responseSchemaFor } from "./schemas";

describe("normalizeApiPath", () => {
  it("membuang query string", () => {
    expect(normalizeApiPath("/clients?page=2&search=acme")).toBe("/clients");
  });

  it("mengganti segmen id angka dan uuid", () => {
    expect(normalizeApiPath("/assets/42")).toBe("/assets/:id");
    expect(normalizeApiPath("/assets/3f2504e0-4f89-11d3-9a0c-0305e82c3301/renewals"))
      .toBe("/assets/:id/renewals");
  });

  it("tidak mengubah segmen literal", () => {
    expect(normalizeApiPath("/notifications/read-all")).toBe("/notifications/read-all");
  });

  it("menyamakan prefix v1 dengan route legacy", () => {
    expect(normalizeApiPath("/v1/clients/7")).toBe("/clients/:id");
    expect(responseSchemaFor("GET", "/v1/clients/7"))
      .toBe(responseSchemaFor("GET", "/clients/7"));
  });
});

describe("responseSchemaFor", () => {
  it("memilih skema spesifik per method dan path", () => {
    const me = responseSchemaFor("GET", "/auth/me");
    expect(me.safeParse({ data: { id: 1 } }).success).toBe(false);
    expect(me.safeParse({
      data: {
        id: 1,
        name: "Admin",
        email: "admin@example.com",
        role: "admin",
        role_label: "Admin",
        client_id: null,
      },
    }).success).toBe(true);
  });

  it("memakai skema yang sama untuk id dinamis", () => {
    const first = responseSchemaFor("GET", "/clients/1");
    const second = responseSchemaFor("GET", "/clients/999");
    const client = {
      id: 1,
      name: "Acme",
      company: null,
      email: null,
      phone: null,
      address: null,
    };

    expect(first.safeParse({ data: client }).success).toBe(true);
    expect(second.safeParse({ data: { ...client, name: 123 } }).success).toBe(false);
  });

  it("fallback zod tetap menolak nilai bukan objek", () => {
    const fallback = responseSchemaFor("GET", "/belum-terdaftar");

    expect(fallback.safeParse({ arbitrary: "objek" }).success).toBe(true);
    expect(fallback.safeParse(["array"]).success).toBe(false);
    expect(fallback.safeParse(null).success).toBe(false);
  });

  it("mencakup seluruh endpoint JSON yang dipakai aplikasi", () => {
    const endpoints = [
      "GET /auth/me",
      "POST /auth/login",
      "POST /auth/register",
      "POST /auth/logout",
      "POST /auth/change-password",
      "GET /dashboard/summary",
      "GET /clients",
      "GET /clients/:id",
      "POST /clients",
      "PUT /clients/:id",
      "GET /projects",
      "GET /projects/:id",
      "POST /projects",
      "PUT /projects/:id",
      "GET /assets",
      "GET /assets/:id",
      "POST /assets",
      "PUT /assets/:id",
      "GET /assets/:id/renewals",
      "POST /assets/:id/renewals",
      "GET /renewals/:id",
      "PUT /renewals/:id",
      "GET /users",
      "GET /users/:id",
      "POST /users",
      "PUT /users/:id",
      "GET /notifications",
      "POST /notifications/:id/read",
      "POST /notifications/read-all",
    ];

    for (const endpoint of endpoints) {
      const [method, path] = endpoint.split(" ");
      expect(responseSchemaFor(method ?? "", path ?? "").safeParse({}).success, endpoint)
        .toBe(false);
    }
  });
});
