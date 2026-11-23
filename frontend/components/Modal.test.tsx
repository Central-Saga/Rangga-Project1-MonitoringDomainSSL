import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("Modal", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function render(open: boolean, onClose: () => void, onConfirm: () => void) {
    act(() => {
      root.render(
        <Modal open={open} title="Konfirmasi hapus" onClose={onClose} confirmLabel="Hapus" onConfirm={onConfirm}>
          <p>Apakah Anda yakin?</p>
        </Modal>
      );
    });
  }

  it("tidak merender apa pun saat tertutup", () => {
    render(false, vi.fn(), vi.fn());
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("memiliki role dialog, aria-modal, dan label", () => {
    render(true, vi.fn(), vi.fn());
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute("aria-modal")).toBe("true");
    expect(dialog?.getAttribute("aria-labelledby")).toBe("modal-title");
    expect(container.querySelector("#modal-title")?.textContent).toBe("Konfirmasi hapus");
  });

  it("memfokus tombol konfirmasi dan menjebak Tab di dalam dialog", () => {
    render(true, vi.fn(), vi.fn());
    const buttons = Array.from(container.querySelectorAll("button"));
    const confirm = buttons.find((button) => button.textContent?.includes("Hapus"));
    expect(confirm).toBeDefined();
    expect(document.activeElement).toBe(confirm);

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    });
    expect(container.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).toBe(buttons.find((button) => button.getAttribute("aria-label") === "Tutup"));
  });

  it("menutup modal dengan Escape dan memanggil onConfirm", () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(true, onClose, onConfirm);

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    expect(onClose).toHaveBeenCalledTimes(1);

    const confirm = Array.from(container.querySelectorAll("button"))
      .find((button) => button.textContent?.includes("Hapus"));
    act(() => confirm?.click());
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("mengembalikan fokus ke pemicu setelah ditutup", () => {
    const trigger = document.createElement("button");
    trigger.textContent = "Hapus data";
    document.body.appendChild(trigger);
    trigger.focus();

    render(true, vi.fn(), vi.fn());
    expect(document.activeElement).not.toBe(trigger);

    act(() => {
      root.render(
        <Modal open={false} title="Konfirmasi hapus" onClose={vi.fn()}>
          <p>Apakah Anda yakin?</p>
        </Modal>
      );
    });
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});
