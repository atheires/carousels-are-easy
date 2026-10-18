# Carousel workspace

Read `System/Master workflow.md` before carousel work. It is the current operational source of truth.

User workflow upgrade, 2026-09-12: accept copy and references together; generate the finished cover directly; cover approval triggers automatic generation and delivery of ALL remaining slides. Keep production instructions internal unless requested. Missing body references mean design from the approved cover, without asking. If no references or chosen brand are supplied, present the workspace's saved options from `Branding library.md` and ask which to reuse.

User workflow upgrade, 2026-10-08: read `System/Design principles reference.md` and `System/Design critic agent.md`. Use a separate critic subagent before generation and again on every actual rendered slide before user delivery. This explicitly authorizes delegation for this review. Incorporate pre-design guidance, repair required defects in internal drafts, then have the critic inspect the revised image. Preserve all versions. This supersedes the 2026-09-16 generate-once/no-autonomous-repair rule for internal candidates only. Never autonomously revise a slide already delivered to or approved by the user unless requested. Critic PASS is not user cover approval. Deliver the full remainder automatically after user cover approval.

Permanent cover rule: never use a two-line headline or a cover whose complete visible text consists of exactly two lines. Use one readable line or three or more meaningful lines; no filler, microscopic label, or separate-text-object workaround. Preserve approved copy. See the reference for detailed checks.

Design critic model: always spawn the critic with `model: "gpt-6.1-sol"`, `reasoning_effort: "medium"`, and `fork_turns: "none"`, supplying its operating prompt and job context explicitly. This user-selected reviewer overrides economical Luna routing for design criticism. Do not silently substitute another model/effort if unavailable; report the limitation.

Asset discovery is confined to this workspace. External references are used only when supplied by the user; never enumerate external collections or browser folders.

These instructions supersede older skill and memory rules requiring manual image building, no generated typography, mandatory body-reference questions, or per-slide approval stops.

For writing or rewriting, read `System/Carousel writing workflow.md`, its complete referenced playbook, and `Memory/Copy feedback log.md`. Writing is authorized; deliver complete copy drafts when requested.

App lane, 2026-10-08: a job from the carousel app (`../App/`) arrives with approved copy already saved in its carousel folder and a brand already chosen. The brand's approval at onboarding stands in for cover approval, so produce the cover and every remaining slide in one pass, never ask a question, and stop after the cover only when the job says so. Brand kits made by the app live in `Brands/<folder>/` (`Branding.md`, `References/`, `Sample cover.png`, `Feedback.md`); a client can own more than one. Editing a kit changes that same kit; it never becomes a new one. App speed rules, 2026-10-09 (the operator's instruction, they override the critic gate for app jobs only): no design critic, no review agent, no self-review pass and no revision rounds, because the operator reviews the slides in the app. From 9th October 2026 the app starts one run per slide, all at the same moment, so a run makes only the slide it is given, one attempt, and matches the deck by following the kit's `Branding.md` and its sample images; it writes no notes, reviews, ledgers or ZIP (the app packs the ZIP). Before designing, read `Feedback.md` in the chosen brand's folder if it exists; the app appends the operator's slide feedback there and every line is a standing rule for that branding.

Location: this vault is the `Designer/` half of the Carousels Are Easy folder. Carousel copy is written in the sibling `Writer/` vault.

App lane, brand kits, 2026-10-11: a brand kit job from the carousel app follows `System/Brand kit build guide.md` only. It is built by Claude in reviewed parts (brief and cover, then the other sample slides), and the operator is the reviewer, so no critic and no review round runs in that lane.
