import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/components/auth/LoginForm";
import { ApiError } from "@/lib/api";

const login = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({ user: null, loading: false, login }),
}));

describe("alur login keyboard-only (audit #116)", () => {
  beforeEach(() => {
    login.mockReset();
    replace.mockReset();
    login.mockResolvedValue(undefined);
  });

  it("tab dari field ke field lalu Enter mengirim kredensial", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    // Tombol login cepat (3) datang lebih dulu; keyboard user bisa melewatinya.
    for (let i = 0; i < 3; i++) {
      await user.tab();
    }
    await user.tab();
    const email = screen.getByLabelText(/Email/);
    expect(document.activeElement).toBe(email);

    await user.clear(email);
    await user.type(email, "staff@example.com");

    await user.tab();
    const password = screen.getByLabelText(/Password/);
    expect(document.activeElement).toBe(password);
    await user.clear(password);
    await user.type(password, "rahasia");

    await user.tab();
    const submit = screen.getByRole("button", { name: "Masuk" });
    expect(document.activeElement).toBe(submit);

    await user.keyboard("{Enter}");
    await waitFor(() => expect(login).toHaveBeenCalledWith("staff@example.com", "rahasia", "/dashboard"));
  });

  it("tombol submit punya status kirim saat permintaan berlangsung", async () => {
    let resolveLogin: () => void = () => undefined;
    login.mockImplementation(() => new Promise<void>((resolve) => {
      resolveLogin = resolve;
    }));

    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Masuk" }));

    const busy = screen.getByRole("button", { name: "Masuk..." });
    expect(busy).toBeDisabled();

    resolveLogin();
    await waitFor(() => expect(screen.getByRole("button", { name: "Masuk" })).toBeEnabled());
  });

  it("menampilkan error 422 server di field yang bersangkutan", async () => {
    login.mockRejectedValue(new ApiError(422, "Validasi gagal.", {
      email: ["Email tidak dikenal."],
      password: ["Password terlalu pendek."],
    }));

    const user = userEvent.setup();
    render(<LoginForm />);
    await user.click(screen.getByRole("button", { name: "Masuk" }));

    const email = screen.getByLabelText(/Email/);
    const password = screen.getByLabelText(/Password/);

    await waitFor(() => {
      expect(email).toHaveAttribute("aria-describedby");
      expect(document.getElementById(email.getAttribute("aria-describedby")!)).toHaveTextContent("Email tidak dikenal.");
      expect(document.getElementById(password.getAttribute("aria-describedby")!)).toHaveTextContent("Password terlalu pendek.");
    });
    expect(screen.getAllByRole("alert")).toHaveLength(2);
  });
});
