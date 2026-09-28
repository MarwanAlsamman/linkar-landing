# LINKAR — Coming soon landing pages

Static pages for the LINKAR car-care marketplace launch (no build step).

| Page | What it is |
|---|---|
| `index.html` | First version — 2D, Arabic, scroll-driven PPF wrap |
| `index-3d.html` | 3D studio, scroll story: every scroll plays one full service scene (wash, polish, PPF, ceramic, tires, maintenance, interior, window film, wrap) |
| `index-3d-play.html` | Same 3D studio without the scroll story — scenes auto-play, with tabs and prev/pause/next |

- English by default, with an English / العربية tab (`?lang=ar` opens Arabic).
- Sign-up form is demo-only until `ENDPOINT` in the page script points at a backend.
- `index-3d-play.html` is generated: edit `index-3d.html`, then run `powershell -File build-play.ps1`.
- The 3D car is the three.js Ferrari sample model, a placeholder until a licensed, unbranded model is available.
