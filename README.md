---
name: "Proposition Mapper"
description: "Extracts propositions and connections from text and turns them into an interactive concept map."
categories: [interactive-learning-objects, web-app, built-by-ai, powered-by-ai]
updated: 2026-07-16
deployments:
  Appsite:
    "Proposition Mapper": https://propositionmapper.edutools.fyi/
---
# Proposition Mapper

Turn any text into an interactive concept map with the power of the Google Gemini API. This tool analyzes your text to extract key terms, defines them in context, and visualizes the relationships between them as a dynamic, interactive graph.

## Key Features

- **AI-Powered Mapping**: Automatically extracts key concepts and their relationships from any given text using advanced prompts for the Gemini API.
- **Multiple Visualization Modes**:
  - **Concept Map**: An interactive, force-directed graph that visually represents terms and their connections.
  - **Proposition List**: A clean, sortable table view of all subject-predicate-object propositions.
  - **KWIC (Key Word in Context)**: A powerful search view that shows every occurrence of a term in its original context within the source text.
- **Advanced Filtering & Search**:
  - Granular filtering options for the Map and List views (All, Subject/Object, Subject Only, Object Only, Predicate).
  - Part-word and full-word search modes for the KWIC view.
- **Interactive Graph Controls**:
  - Zoom, pan, and drag nodes to explore the map.
  - Click a node to center it on the screen.
  - Dynamically adjust node spacing with a "Spread" slider to improve readability for dense graphs.
- **Iterative & Manual Refinement**:
  - Use the "Generate More" button to intelligently expand the map with new propositions from the text.
  - Manually add new propositions (subject, predicate, object) to curate the map, with auto-suggestions for existing terms.
- **Persistent Sessions & History**:
  - All generated maps are automatically saved to your browser's local storage.
  - Load any previous map to continue working on it.
  - Edit map names for better organization.
- **Full Import/Export**:
  - Export individual concept maps as a `.json` file.
  - Export your entire map history for backup or transfer.
  - Import map or history files to restore your sessions.
- **Customizable Experience**:
  - Set the approximate number of propositions to generate initially.
  - Seamlessly switch between Light and Dark modes.

## How It Works

The application uses a two-stage process with the Gemini API to build the concept map:

1.  **Term Extraction**: First, it sends the text to Gemini with a prompt designed to identify the most important terms and generate a concise, context-aware definition for each.
2.  **Relationship Extraction**: Next, it sends the original text *and* the list of extracted terms back to Gemini, prompting it to identify the relationships between those specific terms and format them as subject-predicate-object triples.

This approach ensures the resulting graph is both comprehensive and directly relevant to the source material.

## Getting Started (Local Development)

To run this application locally, you'll need a modern web browser and a Google Gemini API key.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/proposition-mapper.git
cd proposition-mapper
```

### 2. Install and run

Use Node 22.18 or newer. Run `npm ci` and `npm run dev`. Enter your own Gemini API key in the page when generating propositions. The key stays in memory; Clear key removes it and stops further requests. Saved maps, manual editing and import/export work without a key.

### 3. Build for static hosting

Run `npm test`, `npm run typecheck` and `npm run build`. Publish `dist/` on Cloudflare Pages or another static host with build command `npm run build`. No environment key, server or Cloud Run proxy is required. Automated tests use synthetic provider responses; live API/CORS checks and switching the existing address remain separate release steps.

## Technology Stack

- **Frontend**: React, TypeScript
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API (`@google/genai`)
- **Data Visualization**: D3.js (for the force-directed graph)

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
