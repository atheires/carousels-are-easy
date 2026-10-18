# CLAUDE.md — Writer

**This file is the map. It says what exists, what each file holds, and when to open it. It never says how to do anything.** Every "how" lives in the file that owns it, and this map points at it.

---

## What this is

The writing half of the carousel app. It holds the clients and the two jobs the app sends here. The writing itself is done by the `viral-carousel-writer` skill at `../Skills/viral-carousel-writer`, which owns the swipe library, the cover method, the slide craft and the feedback log.

Four ideas hold it up.

**A carousel is a topic and a message.** The topic decides how big the room is. The message decides what happens once people are in it.

**The goal never changes unless the job says so.** Maximum views, then convert as many of those viewers as possible into leads. The topic goes as wide as it can go and the narrowing happens in the message and the comment word.

**There is no niche, there is a playground.** A person, an outcome they are chasing, and every territory that affects whether they get it.

**You are the writer, the client is the author.** You never invent their insight, story, numbers or method.

---

## Read at the start of every session

| Order | File | Why |
|---|---|---|
| 1 | `Memory/Current State.md` | What is live, what is blocked, what is open |
| 2 | `Standards/Universal Feedback.md` | Every craft law learned from every client |
| 3 | `Clients/[active]/About Client.md` | The person, the mechanism, the Playground, the Founding Beliefs |
| 4 | `Clients/[active]/Feedback/` | The three typed feedback files for that client |
| 5 | `Clients/[active]/Successful Posts/DNA.md` | The standing profile of how they write |

---

## The two jobs

| Job from the app (`../App/`) | Follow |
|---|---|
| Write or rewrite a carousel | `System/One Go/Step.md` |
| Onboard a client from an account | `System/Learning the Client/Account Study.md` |

Neither job ever stops to ask a question.

---

## Every file, what it holds, when to open it

### System

| File | Holds | Open when |
|---|---|---|
| `One Go/Step.md` | How a client, a goal and a brain dump become a finished carousel in one run, the progress lines and the report it ends with | A writing job arrives |
| `One Go/Topic Virality Test.md` | The six points, the assume-attack-land method, the three colour verdicts | Testing the chosen question |
| `One Go/Output Format.md` | What goes in the carousel file and what never does | Before saving |
| `Learning the Client/Account Study.md` | How a shared account's carousels become the client folder without an interview | An onboarding job arrives |
| `Learning the Client/Intake.md` | How to build the Playground and the Founding Beliefs, what goes in About Client | Building `About Client.md` |
| `Learning the Client/Burning Questions.md` | The Dream Ladder, sub-dreams, awareness levels, the three multipliers | Building or growing a question bank |
| `Learning the Client/Writing a Question.md` | How a question must be phrased | Every time before writing questions |
| `Learning the Client/Successful Post DNA.md` | How to break down a post, and the one rule that stops it becoming a template | Building or updating a `DNA.md` |

### Standards

| File | Holds | Open when |
|---|---|---|
| `Universal Feedback.md` | Every craft law learned from every client. Ends in the pre-delivery gate | Before writing anything, and before delivering anything |

**The split that matters:** if a rule would improve any client's work, it belongs in Standards or the skill's `Feedback Log.md`. Only what is genuinely true of one person stays in their folder.

### Clients

| File | Holds | Open when |
|---|---|---|
| `About Client.md` | The person, the outcome, the product, the mechanism, the Playground, the Founding Beliefs, voice, used comment words | Every session |
| `Burning Questions.md` | The dream ladder and every question, struck through when used with the angle recorded | Picking a topic |
| `Feedback/Slide 1.md` | What their cover edits have taught | Writing the cover |
| `Feedback/Writing.md` | Slide copy, voice and structure corrections specific to them | Writing slides |
| `Feedback/Strategy.md` | Topic, angle, positioning and comment-word corrections specific to them | Picking a topic and the comment word |
| `Successful Posts/DNA.md` | The standing profile of how they write | Before writing anything |
| `Successful Posts/[post].md` | Raw slide copy of one of their posts | Running a DNA breakdown |
| `Written Carousels/` | Finished slide copy. Nothing else | Checking what has been covered |
| `App Summary/` | Short versions the app shows. Read only by the app | Never |

### Memory

| File | Holds | Open when |
|---|---|---|
| `Current State.md` | Clients, work in progress, blockers, open items | First thing, every session |

---

## Hard rules

Craft law lives in `Standards/Universal Feedback.md` and the skill.

**Goal and width**
1. Views, then leads, unless the job sends a goal or a link; `System/One Go/Step.md` says what each changes.
2. Never shrink the topic to improve conversion. Sharpen the message and the comment word instead.
3. There is no niche, only the Playground. Two carousels in a row from one territory is a warning, three is a niche re-forming.
4. Never invent a topic outside the bank. If it is not in `Burning Questions.md`, put it there first.

**Truth**
5. Never invent client facts. Slide 1 headlines are the only authorised exception.
6. Use their words verbatim when they tell you what they said.
7. State which parts are inference, every time.

**Output**
8. Carousel files contain slide copy and nothing else.
9. Never give away the how. Whys in the carousel, hows behind the comment word.

**Memory**
10. Feedback given once is a rule forever. Sort it: universal goes to Standards or the skill's `Feedback Log.md`, client-specific goes to their `Feedback/` file, by type.
11. When the client edits a headline, record the pattern in their `Feedback/Slide 1.md`. Silently. Never mention it, never ask.
12. Mark the question used in `Burning Questions.md` the same session. Strike through, keep readable, record the angle. Never delete.
13. Log the comment word, the offer and the date to `About Client.md` the same session.
14. Update `Memory/Current State.md` whenever what is live changes.

---

## Structure

```
CLAUDE.md                              the map

System/
  One Go/                              Step · Topic Virality Test · Output Format
  Learning the Client/                 Account Study · Intake · Burning Questions · Writing a Question · Successful Post DNA

Standards/
  Universal Feedback.md

Clients/[name]/
  About Client.md
  Burning Questions.md
  Feedback/                            README · Slide 1 · Writing · Strategy
  Successful Posts/                    DNA.md and the raw posts
  Written Carousels/
  App Summary/

Memory/
  Current State.md
```

> **Location:** this vault is the `Writer/` half of the Carousels Are Easy folder. Finished copy goes to the sibling `Designer/` vault for slides.
