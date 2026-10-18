# Student Finance Tracker

A mobile-first, accessible expense tracker built using only HTML, CSS and JavaScript.

## Features
- Add, edit and delete expenses with confirmation
- Four validation rules plus advanced duplicate-word back-reference
- Live regex search, safe compilation, case toggle and highlighted matches
- Date, description and amount sorting
- Four dashboard statistics, seven-day CSS bar chart and monthly budget warning
- localStorage persistence, validated JSON import/export
- Manual USD → RWF/EUR display conversions; amounts stored in USD
- Responsive cards on phones and a table on larger screens

## Setup
Run `python -m http.server 5500` from the project directory, then open `http://localhost:5500`.

## Seed data
Open `seed.json`, import it through Settings → Import JSON. Import **replaces** existing records after confirmation.

## Regex catalog
| Rule | Pattern | Example |
|---|---|---|
| Description | `^\S(?:.*\S)?$` | `Lunch at school` passes; ` Lunch` fails |
| Amount | `^(0|[1-9]\d*)(\.\d{1,2})?$` | `12.50` passes; `12.345` fails |
| Date | `^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$` | `2026-10-07` passes; `2026-13-07` fails; calendar check also rejects `2026-02-30` |
| Category | `^[A-Za-z]+(?:[ -][A-Za-z]+)*$` | `School-Fees` passes; `Food123` fails |
| Advanced back-reference | `\b(\w+)\s+\1\b` with `i` | `coffee coffee` fails |
| Double spaces | `\s{2,}` replaced with one space | `Coffee  shop` becomes `Coffee shop` |

Search examples: `(coffee|tea)`, `\bFood\b`, `\.\d{2}\b`. An invalid expression such as `(` shows an error rather than crashing.

## Tests
Visit `/tests.html` on the local server; all assertions should show PASS. Also manually test malformed imports, keyboard navigation, refresh persistence, 360/768/1024px screens, and an exceeded budget.

## GitHub Pages
**Repository:** https://github.com/Vladimir-Ndayisaba/Student-finance-tracker

**Live URL:** https://github.com/Vladimir-Ndayisaba

## Demo video
**Unlisted video:** REPLACE_WITH_YOUR_DEMO_VIDEO_URL

Show keyboard navigation, invalid input, advanced regex, sorting, editing, deleting, import/export, responsive layouts, and budget warning in 2–3 minutes.

## Milestones
M1 specification → M2 semantic HTML/CSS → M3 validation/tests → M4 render/sort/search/edit → M5 stats/budget → M6 persistence/settings → M7 audit/deployment.
