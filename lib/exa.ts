import Exa from "exa-js";

let exa: Exa | null = null;

/** Exa AI client for party research (server-side only). */
export function getExa(): Exa {
  if (exa) {
    return exa;
  }

  const apiKey = process.env.EXA_API_KEY;

  if (!apiKey) {
    throw new Error("EXA_API_KEY is not set. Configure Exa before using getExa().");
  }

  exa = new Exa(apiKey);
  return exa;
}
