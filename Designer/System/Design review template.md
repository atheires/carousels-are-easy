# Design review

Copy this into the carousel folder as `Design review.md`. Record brief decisions and observable evidence, not private reasoning. Do not fill unchecked fields with PASS.

## Brief

- Audience / communication goal / mood:
- Exact copy source:
- Brand / inspected reference paths:
- Format / intended viewing size:
- Must keep / hard user constraints:
- Relevant user feedback / approved and rejected image anchors / derived observable checks:
- Proposed entry → explanation → finish:
- Proposed text groups / common edges / layer order:
- Cover line plan: one or three-plus meaningful lines; no two-line headline.

## Before design

- Critic agent identity and date:
- Required critic model / effort: GPT-6.1 Sol / medium.
- Applicable principles and preventive constraints:
- Risks and required changes to the plan:
- Intentionally omitted techniques and why:
- Acceptance checks:

## Candidate review — repeat for each slide/version

- Slide / version / absolute image path:
- Full image SHA-256 / measured width and height / review date:
- Preview absolute path / SHA-256 / measured width and height:
- Actual reviewer model / effort:
- Full-size and phone-size evidence inspected:
- Verdict: PASS / REVISE / REVIEW INCOMPLETE
- Actual dominant element / likely route:

| Priority | Location and visible defect | Principle | Communication effect | Exact repair | Recheck evidence/status |
|---|---|---|---|---|---|

- Elements to preserve:
- Required repair order:
- Checklist results: copy; cover line rule; hierarchy; grouping/similarity; alignment; macro/micro space; grid/balance; flow; contrast; layering; rhythm/interest; intentional omissions; production checks; independent current-image review.
- For each item use PASS / FAIL / NOT APPLICABLE (reason) / UNVERIFIED.

## Final delivery gate

- [ ] Every current final image inspected by the independent critic.
- [ ] No unresolved P0 or P1 defects; latest revised versions rechecked.
- [ ] Final filenames match passed candidate versions.
- [ ] Final image hashes match reviewed bytes; previews represent those exact versions.
- [ ] Complete current deck compared together for branding, repeated roles, sequence and pace.
- [ ] Existing delivered/approved versions preserved.
- [ ] Cover user-approval status recorded separately from critic verdict.
- [ ] All required slides present, exact copy and slide order checked.
- [ ] ZIP includes final numbered images only, no drafts or notes.

Unresolved issues / limitations:

Optional machine-checkable ledger: record these same assertions in a JSON manifest using the schema in `Verify design delivery.py`, then run that script before presentation/body start/deck delivery. It checks file identity, dimensions, evidence records, count and approval stage. It does not independently judge design, authenticate the model, read copy or prove a recorded PASS is truthful. Visual review remains mandatory.
