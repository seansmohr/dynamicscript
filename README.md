# Mohr Insurance — Dynamic Sales Script

A branching version of the Mohr Insurance Medicare sales script. The agent answers
questions as the client answers them, and the script routes itself: the right avatar,
the right paragraphs, the right closing steps, and an umbrella price calculated from
the needs assessment.

## What's here

| File | What it is |
|---|---|
| `public/index.html` | The interactive script. One self-contained file — open it in any browser, no install, works offline. |
| `public/reference/dynamic-script-reference.html` | Printable branched version of the whole script. |
| `public/reference/Mohr_Dynamic_Script_Reference.pdf` | The same thing as a PDF, for printing or keeping open as a backup. |
| `server.js` | Dependency-free static server used for hosting. |

To use it without hosting anything: download `public/index.html` and double-click it.
Everything typed during a call is saved to that browser, so a refresh or an accidental tab
close doesn't lose the call. "New call" clears it.

## Deploying

The app is one static HTML file, so `server.js` just hands out `public/` and nothing else.
There are **no dependencies** — no install step, no build step, nothing to keep patched.

Run it locally:

```bash
npm start            # http://localhost:3000
PORT=8080 npm start  # or pick a port
```

### Railway

1. New Project → Deploy from GitHub repo → pick this repo and the branch.
2. That's it. `railway.json` pins the start command and the health check, and Nixpacks
   picks up Node from `package.json` and `.node-version`.
3. Settings → Networking → **Generate Domain** to get the public URL.

The server binds `0.0.0.0` on Railway's injected `PORT`, answers `/healthz` for the health
check, and shuts down cleanly on `SIGTERM` so redeploys don't cut off a call in progress.

### Putting a password on it

Anyone with the URL can open the script. No client data ever reaches the server — it all
stays in the agent's browser — but the script itself is yours. To require a login, set a
Railway variable:

```
APP_PASSWORD = <something long>
APP_USERNAME = mohr          # optional, defaults to "mohr"
```

Leave `APP_PASSWORD` unset and the site stays open. The health check is never gated, so
Railway can still reach it either way.

### Updating the script

Push to the branch and Railway redeploys. `index.html` is served `no-cache`, so agents get
the new version on their next reload — no cache-busting to think about.

## Standing compliance rule

**A client who is 65 or older in California cannot be sold cancer / heart attack / stroke
cover or skilled nursing cover.** Since neither can be sold, the tool does not embed either
exposure: the major-exposures set-up, the CHS conversation and the skilled nursing
conversation are skipped entirely on both tracks that carry them.

**On the T65 track, dental can still be sold.** The dental question is still asked as normal
and still prices $50 into the Medicare Supplement umbrella. That leaves the Advantage
umbrella at $0, since an Advantage plan already bundles dental.

On the already-on-Medicare track the product is Gold / Silver / Bronze, so a restricted
client gets the California variant close instead: on the Advantage side the October review
appointment is the deliverable, and on the Supplement side the supplement move itself is
the sale.

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
- **Already on Medicare** — zip, date of birth and carrier, then a second branch point:
  *"is that a Medicare Advantage or Medicare Supplement plan?"* Each side is self-contained
  and does not run the Supplement vs Advantage education or the pricing comparison.
  - **4A Advantage** — HMO/PPO, premium, max out of pocket, the cancer/heart/stroke
    exposure, then a timing check. Anything changed recently, or mail about the plan
    changing, or today falling inside Oct 15 – Dec 7, routes them to the in-AEP close;
    otherwise they are locked until October. Outside AEP closes in two steps (umbrella
    today, October review booked live); in AEP it closes in three (umbrella, full review
    inside 48 hours, effective date).
  - **4B Supplement** — premium, then the federal standardization pitch: a Plan G is a
    Plan G by law, so the only difference is price. The agent types the carrier and price
    they would move them to and the tool works out the monthly and annual saving. Closes in
    three steps, with the emphasis that nothing gets cancelled until the new plan is active.
- **T65** — the full needs assessment, then the Medicare education. On SS gets the
  automatic-enrollment paragraph and "deducted from your check"; not on SS gets the
  manual-enrollment paragraph and "billed for the first quarter." Closes on Scenario A or B.

## Umbrella pricing

Three answers in the needs assessment price the umbrella. Nothing else touches it.

This applies to the **T65 track only**. Employer-coverage clients and clients already on
Medicare are sold Gold / Silver / Bronze ($150 / $100 / $50) instead.

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

## Working on it

The browser tests use Playwright, which is not a dependency of the app:

```bash
npm i -D playwright && npx playwright install chromium
```

## Other things it does

- Captures the opening goals loop and reads every goal back in the formal recommendation
- Flags the compliance stops: the California ancillary rule, no Scope of Appointment, and
  a client who doesn't make their own healthcare decisions
- Builds a copy-paste call summary at the end, downloadable as a text file
