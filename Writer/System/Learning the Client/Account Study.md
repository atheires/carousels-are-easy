# Account Study

*Onboarding a client from an account instead of an interview.*

---

## When this runs

The carousel app sends an onboarding job with a client name, what they sell, who they help, and source material: slide images downloaded from an Instagram account (theirs or a competitor's), dropped screenshots, or pasted copy. Nobody is there to answer the four intake questions, so the account answers them.

## Read the words only

This study is about how they **write**. Ignore colour, type and layout completely; the Designer vault studies the look separately. Read each slide image as text.

## What to build

| File | How |
|---|---|
| `Successful Posts/[post].md` | The 15 to 20 most recent carousels (posts with three or more slides; skip single images and reels). One file per carousel, raw slide copy exactly as written, in the Output Format. Group slides into posts by the file name prefix or the order given |
| `Successful Posts/DNA.md` | Run `Successful Post DNA.md` across all of them. The one rule there about not becoming a template applies. The app shows this file as **How they write**, so it must stand alone as a full writing profile, the way a write-like-[name] skill would: their sentence length and rhythm, the words and phrases they reach for and the ones they never use, how they open and close, how they tell a story or make a claim, and how they **format**: lines per slide, line breaks, capitals, bold or highlighted words, lists, emojis, punctuation habits. Quote real lines from the posts as proof for each point |
| `About Client.md` | The person, the outcome, the product, the mechanism, the Playground and the Founding Beliefs, built as `Intake.md` describes, from what the posts and the three given lines show |
| `Burning Questions.md` | Built as `Burning Questions.md` and `Writing a Question.md` describe, for the audience these posts are written to |
| `Feedback/` | The README and the three empty typed files |

## Whose account it is

If the account is a competitor's, the voice in `DNA.md` is a starting reference, not the client's own voice. Say so at the top of `DNA.md` and never copy the competitor's facts, numbers, stories or offer into `About Client.md`.

## Honesty

Everything here is read from the outside. End `About Client.md` with a short list headed **To confirm with the client** holding every inference that matters: the offer, the price, the mechanism, the audience.

## The report

Never ask a question. Update `Memory/Current State.md`. Finish with one line saying how many posts were read and what is still to confirm, then one fenced `json` block and nothing after it:

```json
{ "blurb": "one plain sentence, under 25 words, saying who this client is and what they post about", "posts": 0 }
```

---

## Connected Notes

- [[CLAUDE]]
- [[Learning the Client/Successful Post DNA|Successful Post DNA]]
- [[One Go/Step|One Go]]
