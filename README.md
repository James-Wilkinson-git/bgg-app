# James BGG Companion Tool

This app has two clear parts:

1. a personal collection browser for my BoardGameGeek collection
2. a discovery view for newly added games that are populated by a backend script and stored in the database

It is a React + TypeScript project built around making BoardGameGeek data more usable, searchable, and easier to browse.

## What the app does

### 1. My collection

The main collection view loads my BGG collection from the backend and renders it as a browsable grid of games. The app parses XML data from the BGG collection endpoint, normalizes it, and then presents it in a cleaner front-end interface.

This includes:

- fetching the collection from the API
- converting XML into typed game objects
- rendering cards for each game with metadata such as name, players, play time, and thumbnail
- keeping the collection in React context so it can be reused by multiple components

### 2. Browsing newly added games

The second major workflow is the discovery view for 2026 games that have been added through the backend indexing pipeline.

This is driven by the data returned from the backend endpoint:

- /api/games/2026

Those games are populated through scripts in the backend project, especially the scraper/indexing flow in the backend repository. The frontend then displays them with:

- filtering by category, mechanics, designers, publishers, artists, player counts, and age/play time
- a date filter showing when games were first indexed
- a toggle for “new since last run” so the user can view only games added in the latest scrape
- pagination for navigating large result sets

## Project structure

The app is organized around a route-based UI:

- /games for the personal collection browser
- /new-games for the newly indexed game discovery view
- a shared app shell and route layer through React Router

Key folders:

- src/context/BggGamesContext.tsx for shared collection state
- src/components/Filters/Filters.tsx for filtering logic
- src/components/GamesList/GamesList.tsx for the collection grid
- src/components/NewGames/NewGames.tsx for the backend-fed discovery experience
- src/pages/Games/Games.tsx and src/pages/Home/Home.tsx for page composition

## Tech stack

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- fast-xml-parser for collection XML parsing
- fetch-based API calls

## Backend relationship

This app is intentionally built on top of a companion backend service:

- GitHub: https://github.com/James-Wilkinson-git/bgg-app-backend

The frontend does not fetch raw BGG data directly in a way that exposes the credentials or messy XML to the client. Instead, it calls backend routes such as:

- /api/bgg/collection/:username
- /api/games/2026

The backend is responsible for:

- getting data from BoardGameGeek
- processing and normalizing it
- storing it in MongoDB
- exposing clean endpoints for the front end

This is a real two-layer architecture: the UI layer for browsing, and the backend layer for data acquisition and indexing.

## How the two parts fit together

The app is not just one feature. It is effectively two product surfaces:

- a personal library view for browsing my owned and tracked games
- a discovery dashboard for looking through newly indexed title data added by backend scripts

That distinction matters because it reflects the actual purpose of the app: it is designed both as a collection utility and as a source-data exploration tool.

## Getting started

### Prerequisites

- Node.js 20+
- npm

### Run locally

```bash
npm install
npm run dev
```

The frontend expects a backend API to be available, especially for:

- the collection data fetch
- the new games endpoint

## What this project demonstrates

This project shows that I can:

- build a React + TypeScript front-end application with a route-based structure
- handle XML parsing and data normalization from an external source
- design filter-driven browsing experiences around a real dataset
- manage shared state with React context
- connect the UI to a backend-powered data pipeline
- work with a project that has multiple user-facing workflows rather than a single page

## Summary

This app is really a compendium of two related experiences: my collection and newly added games. The collection view makes an existing library easier to browse, while the new-games view shows the backend’s indexed data in a filtered, searchable interface.

That is the actual product story of the app, and it is reflected in the code structure and route organization.
