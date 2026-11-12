# Jacob Monroe — Videographer

Portfolio and booking site. Plain HTML, CSS and JavaScript, no build step.

## Pages

- `index.html` — films, stills, the hourly video rate and the estimate builder
- `events.html`, `washington-dc.html`, `san-francisco.html` — photo galleries

## Editing

Everything you're likely to change is at the top of `js/site.js`:

- `FILMS` — YouTube video ids, titles and filter category. Films with a `clip` play in the hero; with one clip there is no slideshow.
- `RATES` — the hourly shoot rate, the editing-only rate, minimums, add-on prices, the Howard discount and the deposit percentage. If you change a price here, also update the matching number in the Rates section of `index.html`.
- `CONFIG` — Instagram handle, booking email, and deposit links (Stripe Payment Link, Cash App, Venmo, Zelle). Empty ones stay hidden on the site.

## Hero video clips

Put short muted loops in `videos/` (MP4, H.264, 1080p, about 8-12 seconds, under ~6 MB each). Then add `clip: 'videos/name.mp4'` to that film in `FILMS` and it plays behind the title in the hero.

## Client work clips

The Client Work section is driven by the `WORK` list in `js/site.js`. Each clip is a 720p file in `videos/web/` with a matching `.jpg` poster. Raw footage in `videos/client work/` is gitignored.

## Images

The site loads the resized copies in `images/web/` (1800px on the long edge). Full-resolution originals stay in `images/`.

## Preview locally

```bash
python -m http.server 4173
```
