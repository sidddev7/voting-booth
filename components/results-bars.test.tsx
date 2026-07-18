import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ResultsBars } from "@/components/results-bars";
import type { Party } from "@/lib/election-types";

const parties: Party[] = [
  { id: 0, name: "Harbor Alliance", shortCode: "HA", voteCount: 40 },
  { id: 1, name: "Civic Forward", shortCode: "CF", voteCount: 60 },
  { id: 2, name: "Green Commons", shortCode: "GC", voteCount: 0 },
];

describe("ResultsBars", () => {
  it("ranks parties by vote count descending", () => {
    render(<ResultsBars parties={parties} totalVotes={100} />);

    const names = screen.getAllByText(/Alliance|Forward|Commons/).map(
      (el) => el.textContent,
    );
    expect(names[0]).toBe("Civic Forward");
    expect(names[1]).toBe("Harbor Alliance");
    expect(names[2]).toBe("Green Commons");
  });

  it("shows percentage of total votes", () => {
    render(<ResultsBars parties={parties} totalVotes={100} />);
    expect(screen.getByText("60%")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("shows 0% for all parties when totalVotes is zero", () => {
    render(
      <ResultsBars
        parties={[{ id: 0, name: "Harbor Alliance", shortCode: "HA", voteCount: 0 }]}
        totalVotes={0}
      />,
    );
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("exposes accessible vote summaries", () => {
    render(<ResultsBars parties={parties} totalVotes={100} />);
    expect(
      screen.getByRole("img", {
        name: /Civic Forward: 60 votes, 60 percent/i,
      }),
    ).toBeInTheDocument();
  });
});
