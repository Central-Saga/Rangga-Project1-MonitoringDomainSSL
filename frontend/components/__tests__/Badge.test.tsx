import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Badge } from "../Badge";

describe("Badge", () => {
  it("renders its label", () => {
    render(<Badge label="Domain" />);

    expect(screen.getByText("Domain")).toBeInTheDocument();
  });

  it("applies the default accent palette", () => {
    render(<Badge label="Domain" />);

    expect(screen.getByText("Domain")).toHaveClass(
      "bg-accent-soft",
      "text-accent",
    );
  });

  it("lets callers override the palette and append extra classes", () => {
    render(
      <Badge
        label="Expired"
        color="bg-danger-soft text-danger"
        className="ml-2"
      />,
    );

    const badge = screen.getByText("Expired");
    expect(badge).toHaveClass("bg-danger-soft", "text-danger", "ml-2");
    expect(badge).not.toHaveClass("bg-accent-soft");
  });
});
