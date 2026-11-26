import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GlobalError from "../app/error";
import NotFound from "../app/not-found";

describe("halaman 404/500 tidak menampilkan white screen (audit #104)", () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("404 menampilkan pesan dan tautan kembali ke dashboard", () => {
    render(<NotFound />);

    expect(screen.getByText(/404/)).toBeInTheDocument();
    const back = screen.getByRole("link", { name: /dashboard/i });
    expect(back).toHaveAttribute("href", "/dashboard");
  });

  it("error boundary menampilkan tombol coba lagi dan muat ulang", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    render(<GlobalError error={new Error("boom")} reset={reset} />);

    expect(screen.getByText(/Terjadi kesalahan/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Coba lagi" }));
    expect(reset).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Muat ulang" })).toBeInTheDocument();
  });
});
