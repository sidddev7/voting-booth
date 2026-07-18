export type ElectionState = "NotStarted" | "Registration" | "Active" | "Closed";

export type Party = {
  id: number;
  name: string;
  shortCode: string;
  description?: string;
  voteCount: number;
};

export type ElectionSnapshot = {
  state: ElectionState;
  parties: Party[];
  totalVotes: number;
  title: string;
  closesAtLabel?: string;
};
