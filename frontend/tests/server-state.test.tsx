import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { invalidateApi } from "@/lib/api";
import { useServerState } from "@/lib/server-state";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

interface Deferred {
  resolve: (body: unknown) => void;
  url: string;
}

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    headers: { get: () => "application/json" },
    json: async () => body,
  } as unknown as Response;
}

describe("useServerState", () => {
  let container: HTMLDivElement;
  let root: Root;
  let pending: Deferred[];

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    pending = [];
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => new Promise<Response>((resolve) => {
      pending.push({
        url,
        resolve: (body: unknown) => resolve(jsonResponse(body)),
      });
    })));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  function Probe({ path }: { path: string }) {
    const state = useServerState<{ value: string }>(path);
    return (
      <div>
        <span data-testid="value">{state.data?.value ?? "-"}</span>
        <span data-testid="loading">{String(state.loading)}</span>
      </div>
    );
  }

  function value() {
    return container.querySelector('[data-testid="value"]')?.textContent;
  }

  it("hanya memakai respons permintaan terakhir saat path berubah cepat", async () => {
    act(() => root.render(<Probe path="/race-a" />));
    act(() => root.render(<Probe path="/race-b" />));
    expect(pending).toHaveLength(2);

    await act(async () => {
      pending[1].resolve({ value: "B" });
    });
    expect(value()).toBe("B");

    await act(async () => {
      pending[0].resolve({ value: "A" });
    });
    expect(value()).toBe("B");
  });

  it("refetch otomatis setelah invalidasi", async () => {
    act(() => root.render(<Probe path="/items" />));
    await act(async () => {
      pending[0].resolve({ value: "awal" });
    });
    expect(value()).toBe("awal");

    await act(async () => {
      invalidateApi("/items");
    });
    expect(pending).toHaveLength(2);
    await act(async () => {
      pending[1].resolve({ value: "baru" });
    });
    expect(value()).toBe("baru");
  });
});
