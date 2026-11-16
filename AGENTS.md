# QuizMaster — AGENTS.md

## Overview
Zero-dependency vanilla HTML/CSS/JS quiz app. No build step, no package manager, no tests, no linter, no typechecker. Open `index.html` directly in a browser or serve statically: `node server.js` → http://localhost:8000 (20-line node-stdlib server, no deps, sends `Cache-Control: no-cache`).

## Live vs. legacy files
- Live UI: `index.html` + `style_cute.css` + `app_cute.js` (cute sticker design, Baloo 2 font, confetti/bounce animations via CSS + `burstConfetti`/`confettiRain` in `app_cute.js`).
- `style.css` + `app.js` are the pre-redesign originals, kept as backups per the edit preference — do not delete; `index.html` no longer loads them.
- `manifest_backup.json` is stale (references deleted quizzes); not read by the app.

## Manifest regeneration
After adding/removing files in `questions/`, regenerate `questions/manifest.json`:
```powershell
.\generate-manifest.ps1
```
The script writes a **JSON array, UTF-8 without BOM**. Both properties are mandatory:
- A bare string (when only one file remains) or a BOM byte prefix makes browsers' `JSON.parse` fail → the app falls back to pattern-globbing, finds nothing, and **purges all imported quizzes from localStorage** (dashboard goes empty). This already bit once.

## Question JSON format
Two accepted shapes:
- **Bare array** of question objects (quiz name derived from first question)
- **Object** `{ "name": "...", "questions": [...] }`

Each question:
```json
{
  "question": "string",
  "options": ["A", "B", "C", "D"],
  "correct": 0
}
```
`correct` is **0-based index** into `options`.

## Question sets
- `tctt_part1–5.json` — TTTCM final exam, 44 questions split 10/10/10/10/4, each part named "… (Phần N)". (Replaced the single `tctt_final.json` and the deleted `gdqp_*` sets.)
- Question files must be committed — Vercel serves whatever is in git.

## Persistence
All quiz data stored in `localStorage` under key `quizmaster_quizzes`. Imported quizzes have ids `q_<filename-without-.json>`; on load the app removes imported quizzes whose files no longer exist in the manifest. localStorage is per-origin — localhost, file://, and Vercel each have separate stores.

## Architecture notes
- No modules/imports — everything lives in global scope (`app_cute.js`). HTML `onclick` attributes reference global functions (`showView`, `startQuiz`, etc.).
- Views are `<section>` elements toggled by `active` class.
- Question file discovery: loads `questions/manifest.json` first; falls back to pattern-based glob for `tttcm_part*`, `triet_hoc_part_*`, etc.

## Edit preference
When editing a file, create a copy (e.g. `file_backup.js`) and make edits on the copy — never replace the original.
