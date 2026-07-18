# Project Source Of Truth

## One-Liner

A codebase-native prototype lab where PMs and designers shape production-like, branch-backed prototypes against the real repo - and which gets measurably better at matching a team's real design system every time it's used.

The collaboration loop is the product. The learning loop is the moat.

## Working Thesis

AI has made individual product, design, and engineering work faster, but the handoff between those functions is still slow and fragmented. Product intent starts as customer insight, meetings, rough notes, and Figma requests. Design turns that intent into prototypes. Engineering later translates those prototypes back into the codebase.

A codebase-native prototype lab closes that gap by making product, design, and engineering collaborate directly against the real product codebase, with the codebase - not Figma - as the shared source of truth.

That handoff problem is the **entry point**, not the defensible core. Codebase-native prototyping is now a contested category (see Competitive Landscape). What makes this venture-scale rather than a feature is the **moat**: a learning loop that compounds with use. Everything else in this document serves that.

## The Real Problem

Product teams have better AI tools for individual execution, but cross-functional delivery still depends on old handoff rituals:

- PMs hold the customer insight and product intent but cannot express it directly inside the production system.
- Designers are powerful in Figma, but Figma-to-code remains imperfect - AI tools still struggle with component mapping, layout structure, design-system usage, and repo-specific conventions.
- Engineers work in the codebase but receive context through documents, meetings, and design files that may not reflect implementation reality.
- Collaboration is spread across fragmented tools instead of one living environment.
- The final handoff forces engineers to reinterpret both product intent and design decisions before building can start.

**The sharpest, most under-served version of this pain - and the wedge:** every team reports that AI cannot touch their design system without hallucinating, and the tools that fix that (design-system platforms) demand a clean, well-named system and weeks of setup that almost nobody has. The de-facto design system that actually exists in the codebase is messy, partly undocumented, and lives in senior engineers' heads. No one serves that reality well. We do.

## Target Users (Who We Serve First)

Decided: **product and design teams** - the persona we understand and can win authentically. Agencies and sales-engineering are real expansion markets but are *not* the beachhead.

- **Product managers** who understand the problem and the desired flow but do not want to work in source code.
- **Product designers** who want to iterate using the real design system and production components instead of recreating every state in Figma.
- Engineering leads are the gatekeeper, not the first buyer - they must *trust* the output, but they are not who we sell to first.

**Lead persona mechanic - designer as governor.** Every competitor pitches "non-designers can now bypass the designer." That terrifies the one person whose buy-in adoption depends on, so it stalls in the org. We do the opposite: the designer becomes the governor whose corrections train the system everyone builds against. The designer goes from blocker to champion - and, not coincidentally, becomes our highest-value data source.

## Competitive Landscape

This category is real and contested. "Codebase-native handoff" is table stakes, not a wedge. Be honest about this on stage - naming competitors converts a plagiarism-disqualification risk into a credibility signal.

- **Greenfield generators - v0, Lovable, Bolt.** Generate new UIs from scratch with generic components. Off-system; don't touch the product you actually run.
- **Codebase-connected prototyping - Alloy, Lightsprint (closest competitors).** Alloy captures the live product or connects the codebase, prototypes on the design system, and pushes to a PR (with Codex/Claude MCP integration). Lightsprint (YC Spring 2026) makes agentic development collaborative on the existing codebase, with cloud agents, branch previews, and PR review - explicitly so PMs and designers ship, not just engineers. **They already do the loop in our One-Liner.** Our differentiation is not the loop; it is the moat.
- **Design-system platforms - Supernova, Knapsack, zeroheight.** Supernova has pivoted to AI prototyping with the design system as the on-brand "semantic foundation," PRD sync, and MCP code export. Knapsack positions as a System of Record with live prototyping on real components. **Their structural weakness:** they require a clean, governed design system and weeks of setup. Supernova's automation breaks on messy Figma naming. They assume the customer arrives already organized. Almost no one is.
- **Figma** owns design-side with near-total dominance and high satisfaction. We do **not** fight Figma. Code is our source of truth; Figma stays where it is.

**The unowned ground:** the messy, real, de-facto design system in code. Generators ignore it, Alloy/Lightsprint read a snapshot of it, the DS platforms require you to clean it first. We learn it.

## The Moat - "The Living System" (Primary / Acquisition)

A learning loop that gets better at matching a team's real, messy design-system-as-it-exists-in-code every time it ingests another codebase and every time a designer corrects a prototype - so we win the "does it match our system without hallucinating?" evaluation by a margin that **widens with use**.

This is a flywheel, not lock-in: more usage -> better fidelity -> wins the next evaluation -> more usage.

**Why it is defensible:**

- The corpus of accept/reject/edit corrections is the customer's own decisions against their own code - uncopyable from a snapshot or a Figma file, and it widens the longer a team stays.
- It is counter-positioned against all three rival classes at once: lighter and zero-setup vs. the DS platforms (whose documentation-first, clean-input DNA they can't shed); more design-system-faithful than the generators; never fighting Figma.
- The switching cost is *earned*, not imposed - leaving means returning to hallucinating AI and manual cleanup.

**The acquisition-vs-retention test (this is the important part).** A moat must win *new* customers, not only tax existing ones. Most "moats" are retention-only - they come back to the sales game. The Living System is the one mechanism here that shows up **in the evaluation, before the contract**: the prospect points us at their messy repo, asks "does it match our system without hallucinating?", and we win that bake-off by a margin that compounds with every codebase we've ingested. That is acquisition, not a tax.

**The honest edge (say this; don't overclaim).** At seed this is a *thesis with a credible mechanism*, not a finished moat. We have ingested zero repos; Supernova has more design-system data today. Our bet is **not** raw data volume - it is a learning loop tuned for the *messy real codebase* and sharpened by the designer in the loop, a training distribution the clean-design-system incumbents structurally do not optimize for. Owning that sentence is what makes a sharp judge believe it.

## The Expansion Moat - "Decision Memory" (Phase Two / Retention)

Same engine, second exhaust stream. As teams prototype, we also capture the *why*: the ideas tried, the variants, the feedback, what shipped and what was killed - all linked to the live prototype. Linear/Jira track *what* and *when*; Figma tracks pixels; no one owns the *why* tied to the actual artifact.

This is the **retention** layer: institutional memory that makes us the system of record for product decisions and deepens once a team is in. It is back-loaded (worth little until history accumulates), so it is not the demo and not the lead - it is the arc we grow into. Pitch order: lead with the moat that *acquires* (Living System), back it with the one that *retains* (Decision Memory).

## Core Value Proposition

We reduce the translation cost between product intent, design expression, and engineering implementation - and we do it on a foundation that competitors can't match: prototypes that are on-system from the first prompt and get more on-system over time.

- On-system output with no Figma cleanup and no weeks of setup - inferred from the real code.
- Sharper with every designer correction; the second prototype is better than the first.
- One prototype, accessible to PM (intent) and designer (visual), reviewable by engineering (branches, previews, diffs, PRs).
- Reuses the real design system and existing components.
- Closes the gap between "approved design" and "engineers can start building."

## The Demo (Single Magic Moment)

The entire pitch compresses into one beat: **the second prototype is smarter than the first.**

1. Point at a real repo - no setup.
2. PM prompts a feature in plain English.
3. Output is on-system because it inferred the actual components.
4. Designer tweaks one thing (a component, a token, a pattern).
5. The next prototype reflects that correction *unprompted*.

That "it learned" moment is the moat on screen in ten seconds - and it is something no generator demo can show.

## Pitch Narrative (Four Beats)

1. **Wedge fact** - in the market's own words: AI can't touch the design system without hallucinating, and the tools that fix it need a clean system and weeks of setup nobody has.
2. **Mechanism** - we infer the de-facto system from the real code; the designer corrects; the next prototype is sharper. Show the loop; don't assert it.
3. **Compounding claim + test** - we win the bake-off, and the margin widens with every codebase ingested. (Run the test: does the edge win new customers or only tax existing ones? Ours wins new ones.)
4. **Honest edge** - the bet is the training distribution (messy real code + designer corrections), not a data lead we don't have.

**Anchor one-liner:**
> "Everyone else reads your design system once and hallucinates the rest. We learn how your team actually builds - from your real code, sharpened by your designer - and the longer anyone uses us, the harder we are to catch."

## Hackathon Scope

Judged on: Q1 *Does it work?* (x2), Q2 *Market scale / differentiation* (x3), Q3 *Vibe check* (x1). Q2 is the heaviest lever and where most teams lose - so most of the win is decided by the moat, before any code runs. Q1 must be a real, live, scrappy-but-functional demo (a polished fake risks the "built before the hackathon" disqualifier; scrappy-but-real is rewarded).

**Build the learning beat. Simulate the infrastructure.** Repo analysis, real branch sync, preview-per-branch, and PR review are a months-long build - narrate them as roadmap, do not build them.

Minimum demo:

- A pre-connected repo with visible project context (analysis can be pre-baked).
- On-system prototype generation from a plain-English PM prompt.
- A designer correction step.
- **The second-prototype-is-smarter beat** (the only non-negotiable).
- A handoff summary: what changed, which components/files were touched, what engineers should review.
- Branches/previews may be simulated for the demo.

## What This Is Not

- Not a generic AI website builder.
- Not a replacement for engineers.
- Not a Figma clone, and not a fight against Figma.
- Not a design-system documentation tool (that's Supernova / zeroheight's lane).
- Not a lock-in-first product - the moat acquires before it retains.
- Not a fully automated merge-to-production system.

## High-Level Architecture

- **Repository connection** - connect to the team's main codebase.
- **Codebase analysis** - read structure, routes, components, styling patterns, and the *de-facto* design-system usage as it exists in code.
- **Generated working guide** - project-specific instructions for safe AI prototyping.
- **Sandbox environment** - a synced working environment mirroring the repo.
- **Branch per prototype / preview per branch** - each prototype isolated and shareable (simulated for the hackathon).
- **Correction store (the compounding component)** - every designer accept/reject/edit is captured as training signal that sharpens future generations. *This is the first-class object that makes the moat real; it is not an afterthought.*
- **Review path** - engineers inspect diffs, check component usage, and decide to merge, modify, or discard.

## Main Risks

- **Differentiation risk (now addressed):** "AI prototyping" is crowded and the loop is table stakes; the moat must be the Living System, stated as a flywheel, or we read as generic.
- **Moat-is-a-thesis risk:** the compounding edge needs usage volume to prove; frame it as a training-distribution bet, not a data lead.
- **Incumbent-adjacency risk:** Supernova (DS platform) and Lightsprint/Alloy (codebase prototyping) are close and funded; our bet is that their DNA (clean-input/setup-heavy, or generation-throughput-first) makes them slow to own the messy-code, prototyping-first wedge.
- **Plagiarism-perception / "built before" disqualifiers:** the concept overlaps Alloy/Lightsprint and an over-polished demo looks pre-built. Mitigate by naming competitors openly and keeping the demo scrappy-but-real.
- **Trust / code-quality risk:** engineers may reject PM-generated branches that create cleanup work; on-system fidelity is exactly what reduces this.
- **Scope risk:** building real repo analysis, sandboxing, previews, branching, and review is too much for a hackathon - build the learning beat, simulate the rest.

## Product Principles

- Codebase as source of truth.
- The design system is **learned from code, not required to be clean upfront**.
- Every designer correction is training signal.
- AI follows the repository's existing design system and component patterns.
- PMs and designers contribute without manually editing source code.
- Engineers retain control of production quality and merging.
- Every prototype produces both a visual preview and an engineering handoff.
- Lead with the moat that *acquires* (Living System); back it with the one that *retains* (Decision Memory).

## Resolved Decisions

- **First customer:** product + design teams. Agencies and sales-engineering are expansion, not beachhead.
- **Lead persona mechanic:** designer-as-governor + PM intent surface.
- **Primary moat:** Living System (acquisition flywheel). **Expansion moat:** Decision Memory (retention).
- **Hackathon build vs. simulate:** build the "it learned" beat; simulate branches/sync/PR.
- **Positioning:** name competitors openly; differentiate on the moat, not the loop.

## Current Decision

For this hackathon: make the moat legible and believable.

- Show the pain of the hallucinated design system and the fragmented handoff.
- Show the codebase-native prototype loop on a real repo.
- Land the second-prototype-is-smarter beat - the moat on screen.
- Name the competitive landscape honestly; lead Q2 with the flywheel.
- Keep it scrappy and real; avoid promising autonomous production merging.
