import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ElectionStatusBadge } from "@/components/election-status-badge";

describe("ElectionStatusBadge", () => {
  it("renders the active voting label with a live indicator", () => {
    render(<ElectionStatusBadge state="Active" />);
    expect(screen.getByText("Voting open")).toBeInTheDocument();
  });

  it("renders closed state label", () => {
    render(<ElectionStatusBadge state="Closed" />);
    expect(screen.getByText("Voting closed")).toBeInTheDocument();
  });

  it("applies an optional className", () => {
    const { container } = render(
      <ElectionStatusBadge state="Registration" className="extra-class" />,
    );
    expect(container.firstChild).toHaveClass("extra-class");
    expect(screen.getByText("Registration open")).toBeInTheDocument();
  });
});
