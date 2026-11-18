import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TextField } from "../auth/TextField";

describe("TextField", () => {
  it("renders an accessible label bound to the input", () => {
    render(<TextField label="Email" value="" onChange={() => {}} />);

    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("type", "text");
  });

  it("marks required fields and forwards the input type", () => {
    render(
      <TextField
        label="Password"
        type="password"
        value=""
        onChange={() => {}}
        required
      />,
    );

    const input = screen.getByLabelText(/Password/);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("type", "password");
  });

  it("emits the typed value through onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TextField label="Email" value="" onChange={onChange} />);

    await user.type(screen.getByLabelText("Email"), "ops");

    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.at(-1)?.[0]).toBe("s");
  });

  it("surfaces a server-side field error to assistive tech", () => {
    render(
      <TextField
        label="Email"
        value=""
        onChange={() => {}}
        error="Email sudah digunakan"
      />,
    );

    expect(screen.getByText("Email sudah digunakan")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});
