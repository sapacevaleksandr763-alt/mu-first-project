---
name: carousel-copy
description: "Generate structured carousel slide content in your voice for Instagram carousels."
---

# /carousel-copy

Generate structured carousel slide content for your brand's carousel template.

## Setup Check

Read config from `~/.claude/skills/carousel/config.json`. If it doesn't exist, tell the user:
```
You haven't set up your carousel template yet. Run /carousel first — it takes about 10 minutes and only happens once.
```
Then stop.

## Input
A topic, hook idea, video transcript, or brief description of what the carousel should be about.

## Output
A JSON array of slide objects ready for `/carousel-design`. Each object has:
```json
{
  "name": "slide1-hook",
  "slideNum": "01 / 07",
  "stepLabel": "CATEGORY",
  "headline": "BIG TEXT<br>WITH <span class=\"accent\">ACCENT</span>",
  "subline": "SUPPORTING TEXT IN ALL CAPS.",
  "activateLabel": "To Activate:",
  "terminal": "<div class=\"t-line\">...</div>",
  "character": "pointing",
  "isPill": false,
  "isHook": false,
  "isCTA": false
}
```

The `character` field maps to a character name from config (e.g. "pointing", "crossed"). If no characters are configured, omit this field entirely.

## Slide Structure Rules

### Number of slides
- Minimum 5, maximum 10 slides
- Don't force a specific count — let the content dictate
- Always have: Hook (1st), CTA (last). Middle slides are the content.

### Slide 1 — Hook (always)
- `isHook: true`, `isPill: true`
- Headline: provocative, attention-grabbing, creates curiosity
- One accent-colored word or phrase that hits hardest
- Subline: one sentence teasing what's coming
- Terminal: preview of the topic (command being run, key stat, etc.)
- stepLabel: category pill matching the user's niche (read from config)

**Hook formulas that work for carousels:**
- `[TOOL] just killed [PROFESSION]` — bold claim, visual-first
- `Here are [NUMBER] secret codes for [TOOL]` — perfect listicle format
- `You need to understand the [NUMBER] levels of [TOOL]` — framework/progression
- `[NUMBER] things you need to do immediately when you start using [TOOL]` — beginner listicle
- `You probably haven't unlocked the full [CAPABILITY] of [TOOL]` — viewer callout
- `Don't say [COMMON PHRASE], say [BETTER PHRASE]` — swaps format
- `You can now replace your entire [TEAM] with [TOOL]` — replacement claim

**Skip these for carousels (video-only energy):**
- POV/Meme formats
- Comment reply formats
- "Watch this" / speed tutorial rapid-fire
- Contrarian rants — needs tone of voice, not text
- Celebrity/news pegs — too time-sensitive

### Slide 2 — Transition (optional)
- Bridges the hook to the content
- "HERE'S HOW..." or "HERE'S WHAT YOU NEED..." type headline
- stepLabel: "THE METHOD" or similar

### Content Slides (middle)
- Each slide = one key point, step, or tool
- stepLabel: "STEP 01", "STEP 02", etc. OR descriptive labels
- Headline: 2-4 lines max, the KEY concept in accent color
- Subline: 1-2 sentences explaining WHY this matters
- activateLabel: "To Activate:", "To Install:", "To Set Up:", etc.
- Terminal: the actual command or code to run (must be REAL and CORRECT)
- Vary the character poses across slides — don't repeat the same one back-to-back

### Last Slide — CTA (always)
- `isCTA: true`, `slideNum: ""`
- Headline: "WANT THE [THING]?" with accent
- Subline: "COMMENT BELOW AND I'LL SEND IT TO YOU." or similar
- ctaKeyword: the word viewers comment (e.g. "WEBSITE", "AUTOMATE", "SETUP")
- No terminal, no character — everything centered

## Terminal Content Rules
- Use `.t-line` wrapper for each line
- `<span class="prompt">$</span>` for the prompt
- `<span class="cmd">command here</span>` for typed commands
- `<span class="check">✓</span>` for success messages
- `<span class="arrow">→</span>` for progress indicators
- Keep terminal content SHORT — 2-4 lines per slide
- Commands must be REAL and CORRECT — verify install commands exist

## Character Assignment
Read available characters from config. Map them to slide context:
- Use varied poses across slides — never repeat the same one back-to-back
- If no characters configured, leave the field empty (template renders without character)

## Headline Sizing
- 3 lines or fewer: use default size — no `headlineSize` needed
- 4 lines: set `headlineSize: "148px"`
- 5+ lines: set `headlineSize: "120px"`
- If headline has long words that might overflow, reduce size

## Voice & Style
Read voice description from config. Apply it to all copy:
- ALL CAPS for headlines and sublines
- Short punchy sentences
- Terminal commands must be real — never make up fake CLI tools
- Tailor the niche/examples to the user's industry from config

## After generating the JSON:
1. Print it formatted for review
2. Ask if anything needs adjusting
3. Once approved, offer to run `/carousel-design` with the data automatically

---

Built by [@tenfoldmarc](https://instagram.com/tenfoldmarc). Follow for daily AI automation builds — real systems, not theory.
