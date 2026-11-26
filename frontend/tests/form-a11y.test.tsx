import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { TextField } from "@/components/auth/TextField";
import { FieldError } from "@/components/shared/ui/FieldError";

function ControlledField({ error }: { error?: string }) {
  const [value, setValue] = useState("");
  return (
    <TextField
      label="Email"
      type="email"
      required
      value={value}
      onChange={setValue}
      error={error}
    />
  );
}

describe("aksesibilitas pesan error per field (audit #103, #116)", () => {
  it("menghubungkan pesan error ke input dan mengumumkannya ke pembaca layar", async () => {
    const user = userEvent.setup();
    render(<ControlledField error="Email wajib diisi." />);

    const input = screen.getByLabelText(/Email/);
    expect(input).toHaveAttribute("aria-invalid", "true");

    const message = screen.getByRole("alert");
    expect(message).toHaveTextContent("Email wajib diisi.");
    expect(input).toHaveAttribute("aria-describedby", message.id);

    await user.type(input, "admin@example.com");
    expect(input).toHaveValue("admin@example.com");
  });

  it("tidak menandai input valid sebagai invalid", () => {
    render(<ControlledField />);

    expect(screen.getByLabelText(/Email/)).not.toHaveAttribute("aria-invalid");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("FieldError pada form resource juga memakai role alert", () => {
    render(<FieldError message="Nama klien wajib diisi." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Nama klien wajib diisi.");
  });
});
