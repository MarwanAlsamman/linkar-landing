# LINKAR — Coming soon landing pages

Static pages for the LINKAR car-care marketplace launch (no build step).

| Page | What it is |
|---|---|
| `landing-v3.html` | V3 landing: content from "Landing Page V3.pdf" (hero + sign-up, about, 5 services, 3 steps, why LINKAR, light 3D showcase of the 5 services, FAQ). AR default, EN tab |
| `customer-service.html` | Customer-service portal: follow up sign-ups (status, services needed, preferred date/time, notes, follow-ups, CSV export) |
| `coming-soon.html` | Exact build of the "Landing Page.pdf" design only (desktop + mobile, customer / service-provider form) |
| `index.html` | First version — 2D, Arabic, scroll-driven PPF wrap |
| `index-3d.html` | 3D studio, scroll story: every scroll plays one full service scene (wash, polish, PPF, ceramic, tires, maintenance, interior, window film, wrap) |
| `index-3d-play.html` | Same 3D studio without the scroll story — scenes auto-play, with tabs and prev/pause/next |

- English by default, with an English / العربية tab (`?lang=ar` opens Arabic).
- Sign-up form is demo-only until `ENDPOINT` in the page script points at a backend.
- `index-3d-play.html` is generated: edit `index-3d.html`, then run `powershell -File build-play.ps1`.
- The 3D car is the three.js Ferrari sample model, a placeholder until a licensed, unbranded model is available.

## Registrations

`landing-v3.html` saves sign-ups through `linkar-store.js`, and `customer-service.html` reads them. With `API_BASE` empty (demo) the data lives in the visitor's own browser, so the portal only sees sign-ups made in the same browser. Set `API_BASE` to a backend (GET/POST `/registrations`, PUT `/registrations/{id}`) to share them with the whole team.
