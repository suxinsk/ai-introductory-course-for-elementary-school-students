# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An interactive slide deck (17 slides) teaching AI fundamentals to elementary school students. Built as a single-page Next.js app with a monolithic `Course.tsx` component containing all slide data and interaction logic.

**Language**: UI and content are in Chinese (zh-CN).

## Commands

```bash
npm run dev       # Start dev server on localhost:3000
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run Next.js linter
```

No test framework is configured.

## Architecture

- **`app/page.tsx`** - Entry point, renders the `<SlideDeck />` component centered on screen.
- **`app/layout.tsx`** - Root layout with `lang="zh-CN"`, loads `globals.css`.
- **`app/globals.css`** - Tailwind directives + CSS variables for light/dark background gradients.
- **`components/Course.tsx`** (~1060 lines) - The entire application. Contains:
  - All React state and refs for interactive features (card reveals, feeding game, voice voting, drawing canvas, etc.)
  - A `slides` array (line ~238) defining each slide's `id`, `type`, and `bgColor`
  - A `renderContent()` function that switches on slide type to render each slide
  - Navigation controls (prev/next buttons with slide counter)
- **`public/videos/ai-intro.mp4`** - Intro video for slide 2.

### Interactive Features

- **P3 (reveal)**: Click-to-reveal card flip animation
- **P5 (feeding)**: Click-to-feed data counter game
- **P6 (chat)**: Word guessing with correct/wrong states
- **P7 (tiger)**: Cat vs tiger feature recognition test
- **P8 (neural-network)**: Microphone-based voice voting with Web Audio API (`AudioContext`, `AnalyserNode`) for real-time volume meter + manual +/- fallback
- **P11 (drawing)**: HTML Canvas drawing board with mouse events and clear function
- **P13 (hierarchy)**: Auto-playing step animation

### Adding/Modifying Slides

Slides are defined in the `slides` array starting at line ~238. Each slide object has `{ id, type, bgColor }`. To add a new slide:

1. Add an entry to the `slides` array
2. Add a matching `case` in the `renderContent()` switch statement
3. Add any new state variables and reset logic in the `useEffect` that handles slide transitions

## Tech Stack

- Next.js 15 (App Router) with React 19
- TypeScript (strict mode)
- Tailwind CSS 3 with custom animations (see `tailwind.config.ts`)
- Lucide React icons
- Path alias: `@/*` maps to project root
