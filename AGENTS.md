# QuizMaster — AGENTS.md

## Overview
Zero-dependency vanilla HTML/CSS/JS quiz app. No build step, no package manager, no tests, no linter, no typechecker. Open `index.html` directly in a browser or serve with any static file server.

## Manifest regeneration
After adding/removing files in `questions/`, regenerate `questions/manifest.json`:
```powershell
.\generate-manifest.ps1
```

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

## Persistence
All quiz data stored in `localStorage` under key `quizmaster_quizzes`.

## Architecture notes
- No modules/imports — everything lives in global scope (`app.js`). HTML `onclick` attributes reference global functions (`showView`, `startQuiz`, etc.).
- Views are `<section>` elements toggled by `active` class.
- Question file discovery: loads `questions/manifest.json` first; falls back to pattern-based glob for `tttcm_part*`, `triet_hoc_part_*`, etc.
- Two question sets: `triet_hoc_part_*` (Vietnamese philosophy, 13 files) and `tttcm_part*` (Ho Chi Minh Ideology, 10 files).

## Edit preference
When editing a file, create a copy (e.g. `file_backup.js`) and make edits on the copy — never replace the original.