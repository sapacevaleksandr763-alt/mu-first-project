---
name: carousel
description: "Generate complete Instagram carousels — from topic to AirDrop-ready PNGs. Includes content writing, slide rendering, and delivery."
---

# /carousel

The mother skill — generate a complete Instagram carousel from topic to ready-to-post PNGs.

## Usage
`/carousel [topic or description]`

Examples:
- `/carousel 5 tools every agency owner needs`
- `/carousel how to automate client onboarding`
- `/carousel` (no topic — will ask what to create)

## Step 0 — First-Time Setup

Check for config at `~/.claude/skills/carousel/config.json`.

**If config exists AND `setupComplete` is true:** Load config, skip to Pipeline.

**If config does NOT exist:** Run the full brand setup wizard.

### Setup Wizard

```
Welcome to /carousel! Let's build your carousel template.

This takes about 10 minutes. You'll have a fully branded carousel system when we're done — cover slide, content slides, and CTA slide, all in your colors and style.
```

#### Part 1 — Brand Info

Ask these questions one at a time:

1. **What's your name or brand name?** (displayed on slides)
2. **What's your social handle?** (e.g. @yourbrand — shown in headers/footers)
3. **What's your niche/industry?** (e.g. "AI automation for agencies", "fitness coaching", "real estate investing")
4. **Describe your voice in 1-2 sentences.** (e.g. "Direct, no-BS, energetic. I tell it how it is but always give people hope." — If they have a `/brand-voice` config, offer to read from that instead)

#### Part 2 — Visual Identity

5. **Do you have a profile picture to use on slides?** If yes, get the file path. If no, slides will show the handle text only.

6. **Pick a color scheme** — show these presets OR let them go custom:

| Preset | Background | Text | Accent |
|---|---|---|---|
| **Cream & Terracotta** | #F4F3EE | #2A1F14 | #C15F3C |
| **Dark Mode** | #1A1A2E | #EAEAEA | #E94560 |
| **Midnight Blue** | #0F1923 | #E8E6E3 | #00D4AA |
| **Clean White** | #FFFFFF | #1A1A1A | #FF6B35 |
| **Warm Charcoal** | #2D2D2D | #F5F5F5 | #FFB800 |
| **Custom** | (ask for 3 hex codes) |

7. **Pick fonts** — show these presets OR let them go custom:

| Preset | Headlines | Code/Labels |
|---|---|---|
| **Modern Tech** | Space Grotesk | JetBrains Mono |
| **Bold Editorial** | Clash Display | IBM Plex Mono |
| **Clean Pro** | Plus Jakarta Sans | Fira Code |
| **Classic** | Playfair Display | Source Code Pro |
| **Custom** | (ask for 2 Google Font names) |

8. **Do you have character/mascot images?** If yes, get file paths for different poses (pointing, crossed arms, thumbs up, etc.). If no, slides will use a clean layout without characters. Minimum: 1 image. Ideal: 3-5 poses for variety.

#### Part 3 — Build Template Slides

Now build 3 template slides live with the user and get approval on each:

**Cover slide first:**
- Generate the HTML template with their brand colors, fonts, and handle
- Create a sample hook slide: bold headline with accent color, category pill, terminal preview
- Render it as PNG using Puppeteer (1080x1440)
- Open it in Preview: `open -a Preview [path]`
- Ask: "How does this cover slide look? Want to change anything — colors, font size, layout?"
- Iterate until approved

**Content slide next:**
- Build a sample step slide with headline, subline, terminal block, and character (if provided)
- Render and show
- Ask: "How about this content slide? Any tweaks?"
- Iterate until approved

**CTA/closing slide last:**
- Build the centered CTA layout with keyword box and follow prompt
- Render and show
- Ask: "And the closing slide — looks good?"
- Iterate until approved

#### Part 4 — Save Everything

Save config to `~/.claude/skills/carousel/config.json`:
```json
{
  "brandName": "Your Brand",
  "handle": "@yourbrand",
  "niche": "AI automation for agencies",
  "voice": "Direct, no-BS, energetic...",
  "profilePic": "/path/to/pic.jpg",
  "colors": {
    "bg": "#F4F3EE",
    "text": "#2A1F14",
    "accent": "#C15F3C"
  },
  "fonts": {
    "headline": "Space Grotesk",
    "mono": "JetBrains Mono"
  },
  "characters": [
    {"name": "pointing", "path": "/path/to/pointing.png"},
    {"name": "crossed", "path": "/path/to/crossed.png"}
  ],
  "slideSize": {"width": 1080, "height": 1440},
  "setupComplete": true,
  "setupDate": "2026-04-06"
}
```

Save the approved HTML template to `~/.claude/skills/carousel/slide-template.html`.
Save the approved build script to `~/.claude/skills/carousel/build-carousel.js`.

Copy any character images and profile pic into `~/.claude/skills/carousel/assets/`.

Install Puppeteer if not already installed:
```bash
cd ~/.claude/skills/carousel && npm init -y && npm install puppeteer
```

```
Setup complete! Your carousel template is ready.
Run /carousel with any topic to create your first carousel.
```

### Dependency Check

Before rendering, verify:
- **Node.js** — `which node` (required for Puppeteer)
- **Puppeteer** — check `~/.claude/skills/carousel/node_modules/puppeteer` exists
- If missing, provide install instructions and stop.

## Pipeline

### Step 1: Content (`/carousel-copy` logic)
Generate all slide content — headlines, sublines, terminal commands, character assignments.
- Load config for voice, niche, handle, available characters
- Show the user the slide breakdown for approval
- Wait for OK before rendering

### Step 2: Design (`/carousel-design` logic)
Render every slide as a 1080x1440 PNG using the saved template.
- Build script from template, run Puppeteer, save PNGs
- Verify output by reading a sample slide image

### Step 3: Deliver
Open Finder/file manager with all slides for easy sharing.
- List all files with sizes
- On Mac: Open Finder via AppleScript with files selected (for AirDrop)
- On other OS: print the output directory path

## Flow
1. If no topic provided, ask what the carousel should be about
2. Run `/carousel-copy` logic — generate slide JSON using config voice/niche
3. Present the slide breakdown for approval
4. On approval, run `/carousel-design` logic — render PNGs
5. Open files for delivery
6. Done

## Rules
- Always get approval on the copy BEFORE rendering
- If the user wants changes to specific slides, update the JSON and re-render only those
- The full pipeline should take under 2 minutes once copy is approved
- Never skip the approval step — always review copy first
- All config reads from `~/.claude/skills/carousel/config.json`
- All assets (characters, profile pic, bg pattern) live in `~/.claude/skills/carousel/assets/`
- Template HTML lives at `~/.claude/skills/carousel/slide-template.html`

## Related Skills
- `/carousel-idea` — brainstorm carousel topics
- `/carousel-copy` — just the content, no rendering
- `/carousel-design` — just the rendering, from existing JSON

---

Built by [@tenfoldmarc](https://instagram.com/tenfoldmarc). Follow for daily AI automation builds — real systems, not theory.
