# Master workflow

Current process, upgraded by user request on 2026-10-08. The assistant generates finished carousel images, with an independent critic before design and before delivery. The user supplies a brief and approves the cover. This guide supersedes older instruction-only, mandatory body-reference, no-generated-text, per-slide stop, and generate-once rules for internal drafts in skills and historical logs. Preserve delivered/approved images unless the user requests revision.

## 1. Receive copy and references together

Accept copy, cover references, optional body references, and context in one intake. Read relevant feedback logs. For writing/revision, first read `Carousel writing workflow.md` and its complete playbook. For supplied copy, use `Copy check with the 10 laws.md` and `../Carousel Cheatsheet.md`.


Keep routine checks in working notes; mention material issues briefly without a routine copy-approval gate. Supplied copy is authorized for design, not falsely marked as passing every check. Honor explicit user overrides. Preserve exact words, capitalization, punctuation, order and slide count unless revision is requested. Ask only if an unresolved issue prevents faithful production.

Create the next unused carousel folder, or use the one identified by the user. Save `Copy.md` with source copy and honest status. Never overwrite an unrelated post.

## 2. Select the visual direction

- Cover references supplied: inspect them, combine compatible qualities, and create a fresh visual concept tied to this copy.
- Saved brand already selected: use it without asking again.
- No references or chosen brand: refresh `../Branding library.md` from workspace `Carousels/*/Branding.md`. Show all saved options with descriptions and available local previews, then ask which to reuse. If selection is delegated, choose and proceed.
- Body references are optional. If omitted, derive body designs from the cover without asking for them.
- If only body references are supplied, derive a coherent cover from their visual language.
- A full inspiration carousel gets the analysis in `Carousel deconstruction guide.md` and an entry in `../Style library.md`. Cover-only references do not establish unseen body rules.

Discover assets ONLY inside this `Designer/` folder. Never browse external folders or browser collections for inspiration. Use external images only when supplied by the user. A selected local brand authorizes reading its branding file and local examples.

## 3. Generate the cover

Before generating, read `Design principles reference.md` and give a separate critic subagent the operating prompt in `Design critic agent.md`, exact copy, audience/goal/mood, reference or brand paths, proposed grouping/layering/attention route and must-keep constraints. This workflow explicitly authorizes the critic delegation. Obtain BEFORE DESIGN guidance and incorporate relevant recommendations; record deliberate omissions. Reuse this critic for actual-image reviews. Do not create a separate user-owned chat for internal review.

Include relevant user feedback, explicit approval/rejection status and available approved/rejected images in the fresh critic's brief. Convert the stated complaints into observable acceptance checks. Do not omit this history and assume a generic checklist will reproduce the user's taste. Rejected candidates cannot be promoted merely because an isolated review passes.

Required critic configuration: `model: "gpt-6.1-sol"`, `reasoning_effort: "medium"`, `fork_turns: "none"`. The user selected this model; it overrides economical Luna routing for design criticism. Provide a self-contained brief and the critic file paths. No silent model/effort fallback.

Hard cover rule: no two-line headline and no cover consisting of exactly two visible text lines. Use one line or at least three meaningful lines without filler or evasive labels. Preserve exact approved words and readable scale. A reference's two-line layout does not override this rule.

Follow `Cover slide edit instructions guide.md`. Prepare the detailed design brief internally; optionally save concise production instructions/prompts in `Design notes.md`, not as a routine chat response.

Use the available image-generation tool and imagegen skill. Generate finished typography as part of the image. Default to 3:4. Save each candidate immediately under the carousel's `Drafts/` directory with slide number and version. Inspect it, then send its actual local image path to the critic in REVIEW IMAGE mode. Full-size and phone-size inspection are required. Repair P0/P1 defects in new versions and obtain actual-image rechecks before presentation. Follow the bounded repair/recovery rules in the critic prompt. Do not claim an unsupported model identity or a critic pass that did not happen. If independent review is unavailable, report that limitation and do not claim this gate was completed.

After critic PASS, record the saved image and preview SHA-256 values and measured dimensions in `Design review.md`. Copy the chosen candidate to the final slide filename and confirm its hash matches the reviewed bytes, then show the cover and wait for user approval. Critic PASS never substitutes for this approval. Generate requested revisions directly from feedback, retain prior versions, and run the same critic checks before presenting the revision. Do not ask the user to rebuild or re-upload images already available.

## 4. Cover approval triggers the full remainder

A clear approval such as "approved", "looks good", or "great" in cover-review context authorizes the rest unless the user says to pause. Immediately extract the approved cover into `Branding.md` using `Branding extraction guide.md`, incorporating supplied body references and distinguishing cover-only rules.

Read the body and CTA guides and logs. Plan ALL remaining slides, including the closing slide. Lock repeated step templates, palette, type roles and margins; adapt meaningful illustrations per slide.

Send the body/CTA plan to the critic before generation. For every generated slide, run actual-image review and any necessary internal repair/recheck before final delivery. The cover's pass does not certify body slides. Cover line-count restrictions apply to covers; body text may use as many lines as faithful readable copy requires.


Generate the entire remainder in the same turn without requesting "next", body references, or batch approval. Use one image request per slide and parallelize independent requests where supported. Anchor each request to stable approved local reference paths and the same brand specification, so concurrent outputs cannot accidentally become references. Inspect local reference images before passing them.

Handle every result individually and preserve internal candidates immediately. The user authorizes repairing required critic defects before presentation, even after an internal candidate has been saved. Once a slide has been delivered to or approved by the user, do not revise it without a user request. Do not stop after slide 2. Keep full copy readable; if it cannot fit, identify the specific conflict before changing text or slide count.

## 5. Check, package and deliver

Visually inspect every slide for spelling, omissions, unintended words, clipping, readability, aspect ratio and brand consistency. Check the count and order against `Copy.md`. Never report all done while a slide is missing or defective.

Have the critic compare the entire current final deck together for repeated roles, palette, margins, icon treatment, sequence and useful visual variation. Record this separately from per-slide reviews. Confirm final hashes still match the reviewed versions before packaging. `Verify design delivery.py` can check a recorded JSON ledger for identity and gate errors; it cannot replace visual judgments or authenticate self-reported reviewer assertions. These are instructions executed by the designer, not an installed automatic interceptor outside this workflow.

Save flat in `Carousels/[name]/` immediately as each successful slide finishes:
- `Copy.md`: source copy and true status.
- `Branding.md`: approved cover system and body adaptations.
- `Slide 1.png` through `Slide N.png`: final set.
- `Design notes.md` when useful: production briefs/prompts, reference paths, approval and completion status; not private reasoning.
- `Design review.md`: pre-design constraints, each version's actual critic verdict, visible defects, repairs and verified result. Store concise professional rationale, not private reasoning.
- `Drafts/`: versioned internal candidates; never include these in the final ZIP.
- A ZIP containing final slide images only in numbered order.

Copy generated outputs into the workspace as they finish. Promote critic-passed candidates to final numbered filenames before delivery; preserve all previous versions and never overwrite unrelated assets. Package final passed images only. After the complete set passes internal review, show the numbered slides/folder and wait for the user's review. Do not perform unsolicited revisions to user-delivered slides. Only apply later edits or regenerations from explicit user feedback, with critic review again before delivery. Then provide the ZIP link. If blocked, specify exactly which slides remain and which defects are unresolved.

Refresh `../Branding library.md` after production; distinguish generated completion from user approval. Append permanent user feedback to the appropriate log and mark superseded historical rules.

No generation-chat link is required for images made here. Preserve external chat links if supplied, at the bottom of `Copy.md` as **Chat** where these images were created: [URL]. Never interrupt delivery to ask for one.

## Interaction defaults

App lane: when the carousel app sends the job, the copy is approved, the folder and `Copy.md` already exist and the brand is chosen. Run sections 3 to 5 in one pass without waiting for cover approval unless the job says to stop after the cover. App jobs skip the design critic and every review or revision round, generate all slides in parallel, and obey the brand folder's `Feedback.md` (see the app speed rules in `AGENTS.md`). Onboarding jobs write `Brands/<client>/Branding.md` with `Branding extraction guide.md` and produce one `Sample cover.png` there.

Normal user decisions: select a saved brand only when needed, then approve the cover. All remaining production is automatic. Detailed instructions are shown only on request. User requests to pause or work on a specific subset override this default.
