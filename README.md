# Madhan Kumar — portfolio

Static site: open `index.html` through any web server, or upload the folder as-is
(Netlify, Vercel, GitHub Pages, cPanel…). No build step, no framework, no CDN.

```
index.html            page (first Tevatel artwork is rendered in the HTML)
css/site.css          all styles
js/projects.js        YOUR WORK: collections, formats, covers, links, films
js/site.js            gallery, players, page effects
assets/covers/        artwork (AVIF + WebP at 360/720/1080 px)
assets/logos/         client logos
assets/img/           portrait, tool icons, showreel poster
assets/video/         showreel.mp4 (loads only when Play is pressed)
assets/resume/        Madhan_Kumar_S_Resume.pdf
assets/fonts/         Inter + Instrument Serif (self-hosted)
tools/add-cover.py    swap any cover for new artwork
LINKS-TO-CONFIRM.md   four post links still to paste in
```

Quick local preview: `python3 -m http.server` in this folder, then open
http://localhost:8000. (Opening the file directly works too, but browsers block
some features on `file://`.)

Editing work: each piece is one line in `js/projects.js`. Films and videos are
the `FILMS` list at the bottom of the same file. A YouTube playlist link keeps
its playlist.
