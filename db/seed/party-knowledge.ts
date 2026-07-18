import { DEMO_PARTIES } from "@/lib/parties";
import { PARTY_SUMMARY_SEEDS } from "@/db/seed/party-summaries";

/**
 * Curated election knowledge base used to ground voter Q&A.
 * Keep aligned with DEMO_PARTIES / on-chain party ids.
 */
export const PARTY_KNOWLEDGE_SEEDS: {
  partyId: number;
  partyName: string;
  knowledge: string;
}[] = [
  {
    partyId: DEMO_PARTIES[0].id,
    partyName: DEMO_PARTIES[0].name,
    knowledge: `Party: Harbor Alliance (HA)

Overview:
Harbor Alliance is a pragmatic, neighborhood-first civic slate. It focuses on reliable city services, waterfront resilience, and steady local growth rather than large experimental programs.

Priorities:
- Ports, ferries, and coastal flood defenses
- Simpler local permitting for small businesses and housing repairs
- Reliable trash, transit, and emergency services
- Workforce training tied to harbor and logistics jobs
- Incremental budgets and cautious spending

Economy & jobs:
Supports logistics, maritime, and small-business jobs near the waterfront. Prefers targeted workforce programs over broad new spending.

Housing & permitting:
Wants faster, clearer permits for repairs and small projects. Does not center large upzoning fights; emphasizes predictability for homeowners and shopkeepers.

Climate & resilience:
Frames climate mainly as flood protection and coastal infrastructure, not as a full energy transition platform.

Governance style:
Practical, service-delivery oriented, skeptical of abrupt policy swings.`,
  },
  {
    partyId: DEMO_PARTIES[1].id,
    partyName: DEMO_PARTIES[1].name,
    knowledge: `Party: Civic Forward (CF)

Overview:
Civic Forward emphasizes transparent government, digital public services, and faster delivery of everyday resident needs. It argues open data and modern city tools improve accountability.

Priorities:
- Publish budgets and contracts in plain, searchable formats
- Digitize licensing and benefits to cut wait times
- Modernize procurement to reduce waste and delays
- Civic tech apprenticeships and public-service careers
- Measure departments on outcomes residents can verify

Technology & services:
Strong focus on online licensing, benefits status, and service tracking. Sees technology as a way to reduce bureaucracy, not replace public workers entirely.

Transparency:
Pushes for open contracts, open budgets, and clearer procurement logs.

Economy:
Indirectly supports growth by cutting friction for residents and businesses dealing with city paperwork.

Governance style:
Reformist, metrics-driven, pro-modernization.`,
  },
  {
    partyId: DEMO_PARTIES[2].id,
    partyName: DEMO_PARTIES[2].name,
    knowledge: `Party: Green Commons (GC)

Overview:
Green Commons prioritizes climate resilience, clean air, and shared public spaces, while trying to keep costs manageable for lower-income households.

Priorities:
- Transit, walking, and bike infrastructure
- Parks, tree canopy, and neighborhood commons
- Cut pollution near schools and dense housing
- Clean-energy upgrades with low-income assistance
- Climate resilience checks on major city projects

Environment:
Core identity is environmental health and public green space. Supports phasing in cleaner energy with affordability cushions.

Transportation:
Prefers shifting trips to transit, walking, and bikes over expanding car-first infrastructure.

Housing & equity:
Links climate policy to equity — assistance for upgrades so costs do not fall hardest on lower-income residents.

Governance style:
Values-led on climate and commons, with explicit affordability guardrails.`,
  },
  {
    partyId: DEMO_PARTIES[3].id,
    partyName: DEMO_PARTIES[3].name,
    knowledge: `Party: Unity Independent (UI)

Overview:
Unity Independent presents as a cross-partisan option focused on fairness, anti-corruption, and consensus problem-solving. It blends fiscal caution with targeted cost-of-living help.

Priorities:
- Stronger ethics rules and independent oversight
- Transparency around campaign and lobby funding
- Cross-party deals on housing and transit bottlenecks
- Targeted cost-of-living relief without open-ended spending
- Plain-language ballots and public notices

Integrity & ethics:
Strongest brand is anti-corruption, ethics, and independent oversight rather than a single left/right ideology.

Housing & transit:
Willing to broker compromise packages across factions to unblock housing and transit projects.

Fiscal approach:
Cautious on permanent new spending; prefers targeted relief.

Governance style:
Consensus-seeking, process-focused, anti-corruption.`,
  },
];

/** Combine curated knowledge with the cached/seed summary for grounding. */
export function buildPartyKnowledgeText(partyId: number): string | null {
  const knowledge = PARTY_KNOWLEDGE_SEEDS.find((k) => k.partyId === partyId);
  const summary = PARTY_SUMMARY_SEEDS.find((s) => s.partyId === partyId);
  if (!knowledge && !summary) return null;

  const parts: string[] = [];
  if (knowledge) {
    parts.push(knowledge.knowledge.trim());
  }
  if (summary) {
    parts.push(`Short voter brief:\n${summary.summary}`);
    if (summary.bullets.length > 0) {
      parts.push(
        `Key points:\n${summary.bullets.map((b) => `- ${b}`).join("\n")}`,
      );
    }
  }
  return parts.join("\n\n");
}
