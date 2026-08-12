---
name: carousel-idea
description: "Generate 5-10 Instagram carousel ideas tailored to your niche and brand."
---

# /carousel-idea

Generate 5-10 Instagram carousel ideas tailored to your niche.

## Setup Check

Read config from `~/.claude/skills/carousel/config.json`. If it doesn't exist, tell the user:
```
You haven't set up your carousel template yet. Run /carousel first — it takes about 10 minutes and only happens once.
```
Then stop.

Load `niche`, `voice`, and `handle` from config.

## Process
1. Consider the user's niche (from config) and what's currently relevant in their space
2. Think about what's trending, what pain points their audience has, what tools/methods they teach
3. Generate ideas that work as carousel format: step-by-step, listicle, how-to, myth-busting, tool breakdowns, frameworks

## Output format
For each idea, provide:
- **Hook** — the slide 1 headline (provocative, curiosity-driven, ALL CAPS)
- **Category pill** — e.g. "AI AUTOMATION", "PRODUCTIVITY", matches their niche
- **Slide count** — recommended number of slides (5-10)
- **Structure** — brief outline of what each slide covers
- **CTA keyword** — what viewers comment to get the resource
- **Terminal angle** — what commands/code/data would appear in the terminals (or what visual element replaces terminal if their niche isn't tech)

## Content Formats That Work as Carousels
1. **Step-by-step tutorials** — "Do X in [N] steps"
2. **Listicles** — "[N] tools/tips/secrets for [outcome]"
3. **Frameworks** — "The [N] levels of [skill]"
4. **Myth busting** — "Stop doing [common thing]. Do [better thing] instead."
5. **Tool breakdowns** — specific tools/setups that save time
6. **Before/after** — showing transformation
7. **Swaps** — "Don't say X, say Y"

## Voice
Read voice description from config. Apply it to all hook writing:
- Match the user's tone — if they're direct, write direct hooks
- If they're educational, lean into teaching hooks
- If they're provocative, lean into bold claims
- ALL CAPS for headlines — this is Instagram carousel format

## After generating
Ask which ideas they want to turn into carousels. Once they pick one, offer to run `/carousel-copy` with that idea to generate the full slide content.

---

Built by [@tenfoldmarc](https://instagram.com/tenfoldmarc). Follow for daily AI automation builds — real systems, not theory.
