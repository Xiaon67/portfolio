# KhronosAion

A personal introduction website for **KhronosAion** — an independent exploration of
artificial intelligence, technology, and ideas.

> Exploring intelligence, one experiment at a time.

Built as a static site with **plain HTML, CSS, and vanilla JavaScript** — no
frameworks, no build step. Designed to feel calm, premium, and quietly futuristic:
generous whitespace, large typography, restrained motion.

## Running it

Open `index.html` directly in a browser, or serve the folder locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Project structure

```
/
├── index.html      # All page content and copy (edit text here)
├── style.css       # Design system + all styling (edit colors/fonts in :root)
├── script.js       # Nav behavior, scroll reveals, Lab cards, marquee
└── assets/         # Images and icons (empty until you add some)
```

## Editing your content

| What                          | Where                                              |
| ----------------------------- | -------------------------------------------------- |
| Headings, paragraphs, quotes  | `index.html` — each `<section>` is labeled         |
| Lab experiment cards          | `script.js` — `CONFIG.experiments` array           |
| Experiment statuses/colors    | `script.js` — `CONFIG.STATUS_COLORS`               |
| Colors, fonts, spacing        | `style.css` — `:root` variables                    |
| Footer links                  | `index.html` — footer block (GitHub is prepared but commented out) |

Only real links are included; add your GitHub profile URL in the footer when ready.
No achievements, employers, or credentials are claimed anywhere — the site is
intentionally honest about being self-directed learning.

## Design notes

- **Palette:** off-white `#FAFAF8` background, near-black `#171717` text, muted
  gray secondary text, hairline borders. Blue / violet / orange / green accents
  appear only strategically.
- **Type:** Inter with system fallbacks; fluid type scale via `clamp()`.
- **Motion:** slow gradient washes (36–42s), CSS-transform orbit animation,
  IntersectionObserver reveals, hover lifts. Everything respects
  `prefers-reduced-motion` and degrades to static content.
- **Performance:** no libraries, no images required, transform-only animations,
  passive listeners, reveal observers that unobserve after firing.
- **Accessibility:** semantic landmarks, single H1 hierarchy, visible focus
  rings (`:focus-visible`), skip link, keyboard-friendly mobile menu with Escape
  support, ARIA labels where needed.

## License

Personal project. Content © KhronosAion.
