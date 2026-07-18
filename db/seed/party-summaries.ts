import type { NewPartySummary, PartySummarySource } from "@/db/schema";
import { DEMO_PARTIES } from "@/lib/parties";

type SeedSummary = {
  partyId: number;
  partyName: string;
  summary: string;
  bullets: string[];
  sources: PartySummarySource[];
};

/**
 * Curated starter summaries for demo ballot parties.
 * Shown immediately on "Learn about" until Exa refresh replaces them.
 */
export const PARTY_SUMMARY_SEEDS: SeedSummary[] = [
  {
    partyId: DEMO_PARTIES[0].id,
    partyName: DEMO_PARTIES[0].name,
    summary:
      "Harbor Alliance focuses on practical city services, waterfront resilience, and steady local growth. The party frames itself as pragmatic and neighborhood-first: keep ports and transit working, strengthen flood protection, and make permitting clearer for small businesses without abrupt policy swings.",
    bullets: [
      "Invest in ports, ferries, and coastal flood defenses",
      "Simplify local permitting for small businesses and housing repairs",
      "Maintain reliable trash, transit, and emergency services",
      "Support workforce training tied to harbor and logistics jobs",
      "Prefer incremental budgets over large experimental programs",
    ],
    sources: [],
  },
  {
    partyId: DEMO_PARTIES[1].id,
    partyName: DEMO_PARTIES[1].name,
    summary:
      "Civic Forward emphasizes transparent government, digital public services, and faster delivery of everyday needs. It argues that open data, clearer procurement, and modernized city tools can cut wait times for licenses, benefits, and infrastructure repairs while keeping spending accountable.",
    bullets: [
      "Publish budgets and contracts in plain, searchable formats",
      "Digitize licensing and benefits so residents wait less",
      "Modernize procurement to reduce waste and delays",
      "Expand civic tech apprenticeships and public-service careers",
      "Measure departments on service outcomes citizens can verify",
    ],
    sources: [],
  },
  {
    partyId: DEMO_PARTIES[2].id,
    partyName: DEMO_PARTIES[2].name,
    summary:
      "Green Commons prioritizes climate resilience, clean air, and shared public spaces. The party pairs environmental goals with affordability: expand transit and bike access, plant and protect community green space, and phase in cleaner energy while cushioning costs for lower-income households.",
    bullets: [
      "Accelerate transit, walking, and bike infrastructure",
      "Expand parks, tree canopy, and neighborhood commons",
      "Cut pollution near schools and dense housing",
      "Support clean-energy upgrades with low-income assistance",
      "Require climate resilience checks in major city projects",
    ],
    sources: [],
  },
  {
    partyId: DEMO_PARTIES[3].id,
    partyName: DEMO_PARTIES[3].name,
    summary:
      "Unity Independent presents itself as a cross-partisan option focused on fairness, anti-corruption, and consensus problem-solving. It stresses independent oversight, campaign-finance clarity, and policies that blend fiscal caution with targeted help for households under cost-of-living pressure.",
    bullets: [
      "Strengthen ethics rules and independent oversight",
      "Increase transparency around campaign and lobby funding",
      "Pursue cross-party deals on housing and transit bottlenecks",
      "Target cost-of-living relief without open-ended spending",
      "Keep ballot language and public notices easy to understand",
    ],
    sources: [],
  },
];

/** Long TTL so seeded demo content stays until an explicit Exa refresh. */
export const SEED_SUMMARY_TTL_DAYS = 365;

export function buildSeedPartySummaryRows(
  now = new Date(),
): NewPartySummary[] {
  const expiresAt = new Date(now);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + SEED_SUMMARY_TTL_DAYS);

  return PARTY_SUMMARY_SEEDS.map((seed) => ({
    partyId: seed.partyId,
    partyName: seed.partyName,
    summary: seed.summary,
    bullets: seed.bullets,
    sources: seed.sources,
    exaRequestId: null,
    model: "seed",
    generatedAt: now,
    expiresAt,
    createdAt: now,
    updatedAt: now,
  }));
}
