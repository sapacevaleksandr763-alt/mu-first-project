---
name: carousel-design
description: "Render Instagram carousel slides as PNGs from structured slide data using your branded template."
---

# /carousel-design

Render Instagram carousel slides as PNGs from structured slide data using your branded Puppeteer template.

## Setup Check

Read config from `~/.claude/skills/carousel/config.json`. If it doesn't exist, tell the user:
```
You haven't set up your carousel template yet. Run /carousel first — it takes about 10 minutes and only happens once.
```
Then stop.

Also verify:
- `~/.claude/skills/carousel/slide-template.html` exists (the approved HTML template)
- `~/.claude/skills/carousel/node_modules/puppeteer` exists (Puppeteer installed)

If template missing: "Your slide template is missing. Run `/carousel` to rebuild it."
If Puppeteer missing: Run `cd ~/.claude/skills/carousel && npm install puppeteer`

## Input
Accepts a JSON array of slide objects (from `/carousel-copy`). Each slide has:
- `name` — filename (e.g. "slide1-hook")
- `slideNum` — e.g. "01 / 07" (empty string for CTA slide)
- `stepLabel` — e.g. "STEP 01", "THE METHOD"
- `headline` — HTML string with `<br>` for line breaks and `<span class="accent">` for accent-colored text
- `subline` — all caps description text
- `activateLabel` — text above terminal (empty string to hide)
- `terminal` — HTML for terminal body using `.t-line`, `.prompt`, `.cmd`, `.check`, `.arrow` classes
- `character` — character name from config (e.g. "pointing") or empty if none
- `isPill` (optional, boolean) — render stepLabel as a pill badge
- `isHook` (optional, boolean) — add corner accents to the slide
- `isCTA` (optional, boolean) — centered layout with keyword box, no terminal/character
- `headlineSize` (optional) — override headline font size
- `ctaKeyword` (optional) — the keyword for CTA slide box

If no JSON input is provided, ask the user for it or check if `/carousel-copy` output exists.

## Template Design Spec (from config)

Read all values from config. The template was built and approved during setup:
- **Size:** from `config.slideSize` (default 1080x1440, 4:5 Instagram carousel)
- **Background:** from `config.colors.bg` with optional pattern overlay
- **Fonts:** from `config.fonts.headline` and `config.fonts.mono` (loaded via Google Fonts)
- **Colors:** from `config.colors` — text, accent, bg
- **Handle:** from `config.handle`
- **Profile pic:** from `config.profilePic` (or handle text if none)
- **Characters:** from `config.characters` array — map character name to file path

## CRITICAL: Spacing Rule
The main content area uses `display: flex; flex-direction: column; justify-content: space-evenly` to distribute headline/subline and terminal sections with EQUAL spacing. This ensures short and long headlines both look properly spaced. NEVER use absolute positioning for the subline or terminal — they must flow inside the flex container.

## Slide Types

1. **Hook slide** (`isHook: true, isPill: true`): Corner accents in accent color, pill badge for category, profile pic + arrow at bottom
2. **Content slides** (default): Step label, activate label, terminal + character, profile pic + arrow at bottom
3. **CTA slide** (`isCTA: true`): Everything centered, keyword box with accent border, "FOLLOW [HANDLE]", no arrow, no terminal, no character

## Rendering Process

1. Read the HTML template from `~/.claude/skills/carousel/slide-template.html`
2. Read config for colors, fonts, handle, character paths, profile pic
3. For each slide:
   a. Replace template placeholders with slide data
   b. Map `character` name to actual file path from config
   c. Apply slide-type-specific modifications (hook corners, CTA centered layout, etc.)
   d. Handle `headlineSize` overrides
   e. Hide activate label if empty
4. Generate a build script (JavaScript) that uses Puppeteer to screenshot each slide
5. Run the build script via Node.js
6. Save PNGs to `~/.claude/skills/carousel/output/`
7. Verify output by reading a sample slide image
8. Report the file paths when done

## Build Script Structure

Generate a Node.js script similar to this pattern:
```javascript
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const template = fs.readFileSync(path.resolve(__dirname, 'slide-template.html'), 'utf8');
const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'config.json'), 'utf8'));

const slides = [/* slide data injected here */];

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const outputDir = path.resolve(__dirname, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  for (const slide of slides) {
    let html = template
      .replace('{{SLIDE_NUM}}', slide.slideNum)
      .replace('{{STEP_LABEL}}', slide.stepLabel)
      .replace('{{HEADLINE}}', slide.headline)
      .replace('{{SUBLINE}}', slide.subline)
      .replace('{{ACTIVATE_LABEL}}', slide.activateLabel)
      .replace('{{TERMINAL}}', slide.terminal);

    // Map character name to path from config
    if (slide.character && config.characters) {
      const charConfig = config.characters.find(c => c.name === slide.character);
      if (charConfig) {
        html = html.replace('{{CHARACTER}}', charConfig.path);
      }
    }

    // Apply hook, pill, CTA, headlineSize modifications...
    // (same logic as the template build from setup)

    const page = await browser.newPage();
    await page.setViewport({
      width: config.slideSize?.width || 1080,
      height: config.slideSize?.height || 1440
    });
    const htmlPath = path.resolve(outputDir, slide.name + '.html');
    fs.writeFileSync(htmlPath, html);
    await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0', timeout: 15000 });
    await page.screenshot({ path: path.resolve(outputDir, slide.name + '.png'), type: 'png' });
    console.log('Done: ' + slide.name);
    await page.close();
  }

  await browser.close();
  console.log('All slides rendered!');
})();
```

The actual build script should include the full slide-type logic (hook corners, pill badges, CTA override) as established during the setup phase.

## Important Rules
- **NEVER** regenerate character images or background patterns — they were set up once and live in `~/.claude/skills/carousel/assets/`
- Headline text should fill ~40-50% of the slide — adjust `headlineSize` if needed
- Terminal must NOT be at the very bottom — keep proper spacing via flexbox
- Activate label must be clearly ABOVE the terminal
- CTA slide: everything centered, no arrow, no character
- Always verify output by reading a PNG before reporting completion
- All file paths are relative to `~/.claude/skills/carousel/`

---

Built by [@tenfoldmarc](https://instagram.com/tenfoldmarc). Follow for daily AI automation builds — real systems, not theory.
