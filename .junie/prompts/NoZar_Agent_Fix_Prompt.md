# NoZar Website — Individual Gap Fix Prompt
# Version: 1.0 | April 2026
# Target Agent: Kofi / Zuri (NoZar codebase — Next.js / Vercel)
# Scope: Consumer-facing landing page (no-zar-r66j.vercel.app) — Individual protocol gaps only

---

## ROLE & CONTEXT

You are a senior full-stack developer working on the NoZar codebase — a South African peer-to-peer barter platform built on Next.js and deployed on Vercel. You are tasked with resolving a prioritised set of UX, content, and architectural gaps on the consumer-facing landing page (app/page.tsx or equivalent). The platform uses no money — it is a pure barter exchange. Do not introduce any payment logic.

The site currently has critical gaps that will hurt conversion and user trust on launch. Work through the following tasks in priority order. For each task, read the existing component structure first, then apply the minimal effective change. Do not refactor working code unnecessarily.

---

## TASK 01 — FIX BROKEN STAT COUNTERS [CRITICAL]
**File target:** The hero/stats section of the landing page
**Problem:** The stats section currently renders "0+ Early Beta Spots", "0 Core Hubs", "0 ZAR Subscription Cost". The first two values show literal zeros, which looks broken.
**Fix:**
- Replace "0+ Early Beta Spots" with "150+ Early Beta Spots"
- Replace "0 Core Hubs (JHB/CPT)" with "2 Core Hubs (JHB/CPT)"
- Keep "0 ZAR Subscription Cost" as-is — this is intentional
- If the stats are driven by a data fetch or a config object, update the config values, not hardcoded JSX

---

## TASK 02 — DEFINE THE TRADE RADIUS [CRITICAL]
**File target:** The "How The Matrix Works" section and any FAQ entries referencing radius
**Problem:** "Hyper-Local Indexing" is described as "Physical goods are restricted to your geographic radius" — but the radius is never defined. Users don't know what to expect.
**Fix:**
- Update the "Hyper-Local Indexing" feature description to read:
  "Physical goods are matched within your chosen radius (default 15km, adjustable from 3km to 50km depending on your tier). Digital services are open to national exchange — no radius restriction."
- Update FAQ entry [06] ("What areas do you cover?") to include at the end: "Your local matching radius defaults to 15km from your home area and can be adjusted between 3km and 50km in your profile settings."
- Do not change any routing logic — this is a copy/content fix only

---

## TASK 03 — SUBSTANTIATE THE SAFE ZONE FEATURE [HIGH]
**File target:** The "Staged Trust Architecture" section — specifically Stage 03
**Problem:** Stage 03 states the system routes users to "a computationally vetted, well-lit public perimeter (e.g., partnered petrol stations)" — implying formal partnerships that do not yet exist.
**Fix:**
- Update Stage 03 description to: "Our AI suggests 3 verified safe meetup options near both parties — forecourts, shopping centre entrances, and public spaces. Both parties confirm the location before any contact details are shared. For high-value exchanges, a buddy check-in SMS is triggered to your pre-registered trusted contact."
- Remove the phrase "partnered petrol stations" entirely — replace with "verified public spaces"
- Do not imply existing formal business partnerships

---

## TASK 04 — CLARIFY THE VALUE PARITY ENGINE [HIGH]
**File target:** The "Value Parity Engine" feature card in "How The Matrix Works"
**Problem:** Describing the tiers as "hidden" creates distrust. Users need to understand the fairness mechanism.
**Fix:**
- Update the Value Parity Engine description to: "Every listing is placed in a transparent value band anchored to real SA market conditions — from Micro (under R300) to Luxury (R75,000+). You see only trades at your band and one adjacent band, so every match is a fair exchange. You set your own declared value; the community keeps it honest."
- If there is a tooltip or expandable element on this card, add a "View Value Bands" link that opens a simple modal or scrolls to a new section (you can stub this with a placeholder #value-bands anchor for now)

---

## TASK 05 — DEFINE BOOST TOKENS [HIGH]
**File target:** The Pricing section — Trader Plus and Business tier cards
**Problem:** "Boost tokens" are listed as a premium feature but never explained. This undermines pricing trust.
**Fix:**
- Add a small descriptive line below "2 boost tokens/mo" on the Trader Plus card: "(Boost pins your listing to the top of local search results for 48 hours)"
- Add the same explanation below "10 boost tokens/mo" on the Business card and "30 boost tokens/mo" on the Enterprise card
- Keep it brief — one line per card, same consistent copy

---

## TASK 06 — ADD DISPUTE RESOLUTION TO FAQ [HIGH]
**File target:** The FAQ section
**Problem:** There is no FAQ entry about what happens when a trade goes wrong. This is a critical trust signal missing for higher-value trades.
**Fix:**
- Add a new FAQ entry after entry [05] (contact exchange):
  Question: "What happens if a trade goes wrong?"
  Answer: "NoZar operates a three-tier resolution process. First, the platform automatically checks trade records — most issues are resolved instantly. If not, both parties submit their account via a structured in-app form and a NoZar moderator reviews the evidence within 2–5 business days. For higher-value trades involving fraud or theft, we preserve all records and provide a SAPS case reference pathway. Our goal is resolution, not blame — the system is designed to protect honest traders on both sides."
- Match the existing FAQ accordion component style exactly — do not introduce new UI components

---

## TASK 07 — CLARIFY CONTACT EXPIRY LOGIC [MEDIUM]
**File target:** FAQ entry [05] ("How does contact exchange work?")
**Problem:** The 72-hour auto-expiry is mentioned but creates anxiety — what if the trade takes longer to arrange?
**Fix:**
- Add one sentence after the existing FAQ [05] answer: "If your trade is marked as 'in progress' by both parties, the expiry window is automatically extended until completion — your contact details stay live for the duration of your active trade."

---

## TASK 08 — ADD MOBILE APP MENTION [MEDIUM]
**File target:** The footer section and/or the hero section
**Problem:** No mention of mobile app plans. This platform's use case lives on mobile — users will wonder.
**Fix:**
- In the footer, below the "Connect" links, add a new line: "📱 Mobile apps for iOS & Android — coming soon"
- Optionally, if there is a secondary CTA or feature row in the hero, add a single line: "Full mobile experience launching soon — web app fully responsive now."
- Do not imply the app exists yet — "coming soon" framing only

---

## TASK 09 — ADD CIPC DISCLAIMER FOR BUSINESS TIER [MEDIUM]
**File target:** The Business pricing card and/or the B2B section ("B2B Liquidity Protocol")
**Problem:** "CIPC Verification Badge" is listed as a live feature but verification is currently manual. This may mislead business users expecting automated API verification.
**Fix:**
- Below the "CIPC verification badge" line item on the Business pricing card, add a small muted note: "(Verified via document submission — automated CIPC API integration in progress)"
- In the Enterprise Protocol feature description for the website ("Verified CIPC Badges"), add the same note inline
- Style the note in the existing muted/secondary text colour used elsewhere in the component

---

## TASK 10 — ADD REFERRAL MECHANIC CTA [LOW — but high leverage]
**File target:** The bottom CTA section ("Bypass The Fiat")
**Problem:** No referral or invite mechanic is visible. This is a two-sided marketplace — supply-side seeding is critical pre-launch.
**Fix:**
- Below the existing "Get Started Free" CTA, add a secondary line: "Know someone with something to trade? Invite them and you both get 1 free boost token — no strings."
- Link this to /register?ref=invite (you can stub the referral logic — just make the URL parameter available for the register page to read later)
- Style as a secondary/ghost CTA button, not the primary style

---

## GENERAL CONSTRAINTS

- Do not change the overall page layout, section order, or component architecture
- Do not introduce new npm packages for these fixes
- Do not change the auth flow, dashboard, or any page other than the main landing page (/) and the FAQ accordion
- Preserve all existing aria-labels and accessibility attributes
- After each task, confirm in a comment: `// TASK XX COMPLETE` so the diff is traceable
- If any task's target element cannot be found (component name differs), stop and report the exact component structure you find, then await clarification before proceeding
- All copy must use South African English spelling (e.g., "organised" not "organized", "recognised" not "recognized")
- The tone must match the existing NoZar brand voice: technical, confident, SA-native — no corporate filler language

---

## DELIVERABLES

1. Modified landing page file(s) with all tasks applied
2. A brief change log listing each task, the file modified, and the line range changed
3. Any stubbed routes or anchor IDs that require follow-up implementation noted separately

---
END OF PROMPT
