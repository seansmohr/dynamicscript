# Mohr Insurance — Dynamic Sales Script

A branching version of the Mohr Insurance Medicare sales script. The agent answers
questions as the client answers them, and the script routes itself: the right avatar,
the right paragraphs, the right closing steps, and an umbrella price calculated from
the needs assessment.

## What's here

| File | What it is |
|---|---|
| `index.html` | The interactive script. One self-contained file — open it in any browser, no install, works offline. |
| `reference/dynamic-script-reference.html` | Printable branched version of the whole script. |
| `reference/Mohr_Dynamic_Script_Reference.pdf` | The same thing as a PDF, for printing or keeping open as a backup. |

To use it: download `index.html` and double-click it. Everything typed during a call is
saved to that browser, so a refresh or an accidental tab close doesn't lose the call.
"New call" clears it.

## Standing compliance rule

**A client who is 65 or older in California cannot be sold cancer / heart attack / stroke
cover or skilled nursing cover.** Since neither can be sold, the tool does not embed either
exposure: the major-exposures set-up, the CHS conversation and the skilled nursing
conversation are skipped entirely on both tracks that carry them.

**Dental can still be sold.** The dental question is still asked as normal and still prices
$50 into the Medicare Supplement umbrella. That leaves the Advantage umbrella at $0, since
an Advantage plan already bundles dental.

Gold / Silver / Bronze *is* cancer, heart attack and stroke cover, so it cannot be sold
either. On the employer track there is no Medicare plan to offer in its place, so that call
ends after the delay recommendation and the CMS L564 education.

The zip code and date of birth decide all of this. Overrides are switched off while the
restriction applies; correcting a wrong zip or date of birth is the only way it clears.

## The four tracks

The route is decided automatically from the client's own answers, in this order:

1. **Currently on Medicare** — Parts A & B active. Exits right after the goals loop.
2. **Employer coverage** — still working, **over 20 employees**. Exits at the work-status question.
3. **T65 — on Social Security** — not on Medicare, drawing Social Security
4. **T65 — not on Social Security** — everyone else

An employer plan with **20 or fewer employees** means they must transition to Medicare, so
those clients stay in the needs assessment and run the T65 track. The agent can override
the route on the CNA close screen.

### Each track has its own questions

Because two of the tracks exit before the shared needs assessment, they ask their own:

- **Employer** — Social Security status, whether the plan is through the employer, carrier,
  HMO/PPO, premium, max out of pocket, and whether they've hit it. Then delay Medicare →
  CMS L564 → Gold / Silver / Bronze. No Supplement, Advantage or umbrella on this track.
  Drawing Social Security changes the recommendation to "delay Part B only" and the L564
  instructions to the Part B application alone.
- **Already on Medicare** — zip, date of birth, carrier, HMO/PPO, premium, max out of
  pocket, whether they've hit it, dental, cancer/heart/stroke and skilled nursing. Then
  the client chooses whether they want the Supplement vs Advantage rundown at all, and the
  call closes on the 3 step close.
- **T65** — the full needs assessment, then the Medicare education. On SS gets the
  automatic-enrollment paragraph and "deducted from your check"; not on SS gets the
  manual-enrollment paragraph and "billed for the first quarter." Closes on Scenario A or B.

## Umbrella pricing

Three answers in the needs assessment price the umbrella. Nothing else touches it.

| CNA answer | Medicare Supplement | Medicare Advantage |
|---|---|---|
| Cancer / heart attack / stroke is a concern | +$50 | +$50 |
| Skilled nursing is a concern | +$50 | +$100 |
| Dental is important to them | +$50 | included with the plan |
| **Maximum** | **$150** | **$150** |
| **California, 65+** — cancer and skilled nursing removed | **$0 or $50** | **$0** |

Dental only prices into the Supplement side, because an Advantage plan already bundles it.
Under the California restriction only the dental component survives, and the override is switched off.

The quoted price is then:

- **Supplement** = Plan G premium + Part D (≈ $10) + umbrella
- **Advantage** = MAPD premium (usually $0) + umbrella

Both totals stay on screen from the moment the concerns are captured, so the number is
already computed when the agent reaches the pricing section. The agent can override
either umbrella on the pricing screen; "Reset to calculated" puts it back.

## Dates

Dates are typed, not picked. The agent types `03141961` and the slashes appear on
their own — no date-picker segments, no fighting the year. Pasting `3/14/1961`,
`03141961` or `1961-03-14` all work, and typing the slashes by hand is fine too.

A four-digit year is required: `031461` stays unfinished rather than guessing at a
century, because the California rule keys off the age. An unfinished or impossible
date leaves the age blank, shows a message under the field, and turns the field red
once the agent moves on.

## Other things it does

- Captures the opening goals loop and reads every goal back in the formal recommendation
- Flags the compliance stops: the California ancillary rule, no Scope of Appointment, and
  a client who doesn't make their own healthcare decisions
- Builds a copy-paste call summary at the end, downloadable as a text file
