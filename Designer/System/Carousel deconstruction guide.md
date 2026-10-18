# Carousel deconstruction guide

How I analyze every inspiration carousel you share, what I write down, where it goes,
and how it gets used when you decide to build in that style.

The point is not "this post is good." The point is: **if you say "build me one like that
Tesla one," I already know exactly how to make every slide** — the cover AND the eight
slides after it — without you re-explaining the look.

## Where it lives

One file per analyzed carousel, sitting directly in `Analysis/`. Nothing else goes in that
folder — no subfolders, no attachments, only analyzed carousel files.

The rolling index `Style library.md` lives at the vault root, on its own. It's a short table
of every style I've deconstructed, so you can skim and say "use style #4."

## Naming convention (fixed)

`Style [what the cover is] with [what the body is].md`

Sentence case after "Style". No em-dashes, no parentheses, no creator names, no colons.
The name describes the *design*, not the post's topic — the topic is irrelevant once the
style is extracted.

Reference: `Style Illustrated-portrait cover with diagram panel reference body.md`

## What I analyze — the fixed 8-part template

Every deconstruction answers the same 8 questions in the same order, so styles are
comparable side by side.

### 1. Build method (the most important question)
What IS this thing, physically? I pick one and say why:
- **Pure typography** — flat color/texture field, type is the entire design
- **Hand-drawn / sketch** — marker, pen, whiteboard, notebook feel
- **Vector illustration** — flat or line illustration, drawn assets
- **3D render** — glossy objects, soft studio shadows, toy-world
- **Photography + type** — real photo background, type set on top
- **Photo-real AI scene** — staged/rendered scene pretending to be a photo
- **Diagram-led** — the visual is an information graphic, type supports it
- **Screenshot / UI collage** — real screens, tables, chat windows
- **Hybrid** — which two, and which one leads

And critically: **what was generated vs what was set by hand.** (Almost always: the
background/illustration is generated, the type is set manually. That distinction is what
makes a style reproducible.)

### 2. Cover construction
- The lockup: every line, its size tier, its alignment, its weight
- The scale ratios between tiers (e.g. punch word ≈ 5× the connector)
- Where the text block sits, what negative space it's protecting
- The hook device (number promise, authority face, curiosity gap, contrarian claim)
- Any "trick" — letter swap, nesting, parentheses, arrow-and-label callout

### 3. Body slide format — the template that repeats
This is the part I under-analyzed before. For the body I record the **slot structure**:
the fixed set of zones every body slide fills, in order. Example, from the Tesla post:

`[visual panel] → [index tag] → [title] → [one-line definition] → [labelled step list] → [application line]`

Then: which slots are mandatory, which are optional, and what changes slide to slide.

### 4. Visual treatment of the body
- Does the body use the same build method as the cover, or a different one? (Very often
  the cover is illustrated/photographic and the body drops to type + diagram — that
  switch is a design decision, and I name it.)
- If there are diagrams: what kind (cycle, tree, pie, matrix, table, exploded chain),
  what style (hand-drawn, vector, screenshot), where they sit, how big
- How diagrams are contained (panel, card, full-bleed, floating)

### 5. Type system
Families, roles, tiers, case, and the exact rule for emphasis (weight vs color vs italic).
Same six-role frame I use in Branding: punch / title / connector / body / label / handle.

### 6. Color + texture system
Background, text colors, how many accents, where accent is allowed, texture/grain,
shadows. Plus: **does color enter the body slides that wasn't on the cover?**

### 7. Continuity mechanics — how slide 2 stays related to slide 1
The specific devices that make it read as one post:
- Repeated frame/panel geometry
- A numbering system (#1–#7, 1/–6/)
- A recurring cast or motif (the turtle and hare; the books; the fridge props)
- A fixed background that never changes
- A consistent margin/safe zone
This section is what I read from when generating slides 2–N.

### 8. Reproduction kit
The payoff section. Written as instructions, not observations:
- A generation prompt skeleton for the cover visual
- A generation prompt skeleton for a body visual
- The manual type spec (what I'd never let a generator bake in)
- The per-slide checklist to keep the set consistent
- Known failure modes ("this style dies if the diagrams aren't hand-drawn")

I also log an honest **weaknesses** note — where the original slipped — so if we copy the
style we don't copy the mistake.

## How it gets used downstream

- **When you pick a style:** I read that one deconstruction file and treat section 8 as
  the brief. It replaces guesswork on body slides.
- **Cover stage:** section 2 + 8 drive the cover edit instructions.
- **Branding stage:** sections 5, 6, 7 pre-fill the Branding block — extracted from OUR
  locked cover, but sanity-checked against the reference style.
- **Body/CTA stage:** sections 3, 4, 7 are the actual template. This is the gap that
  caused the old workflow to guess at body slides.

## Habit rule

When you share an inspiration carousel, I deconstruct it into this template automatically
and add a row to `Style library.md`. I don't ask first. I never save reference images —
the analysis is written so it works from words alone.
