# Letter Loom

Letter Loom is an EdTech web platform for preschool and primary school children. It teaches literacy through drag-and-drop word building, speech feedback and lightweight game mechanics.

## Core idea

- Multilingual literacy learning in Kyrgyz, Russian and English
- Drag-and-drop interaction for building words from letters
- Audio reinforcement through browser speech synthesis
- Motivation through stickers, achievements and saved progress
- Offline-ready frontend through a registered service worker

## Target users

- Parents
- Private learning centers
- Public schools
- Early childhood education projects in the SCO region

## Tech stack

- React
- Node.js + Express
- PostgreSQL
- `@dnd-kit/core`
- `canvas-confetti`
- Web Speech API

## Startup positioning

Letter Loom addresses the shortage of modern interactive tools for Kyrgyz language literacy while keeping the same product quality for Russian and English. The platform is lightweight, browser-based and suitable for tablets and desktop devices without heavy installation requirements.

## MVP status

- Word assembly and validation are implemented
- Dynamic dictionary and image loading are served from the backend API
- Progress is saved per user and per language
- Achievements and sticker album are integrated
- Admin panel for user management is available
- PWA manifest and service worker are enabled

## Commands

### `npm start`

Runs the frontend in development mode.

### `npm run build`

Builds the production bundle.

### `npm test`

Runs the test suite.
