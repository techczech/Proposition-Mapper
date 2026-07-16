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

### 2. Set Up Your API Key

The application is configured to use the Gemini API key from an environment variable. Create a `.env` file in the root of the project directory and add your key:

```
API_KEY=YOUR_GEMINI_API_KEY_HERE
```

*(Note: In the provided development environment, this key is managed for you. For local setup, you must provide your own.)*

### 3. Run the Application

This project uses modern JavaScript features like import maps, so it doesn't require a complex build setup like Webpack or Vite for development. You can run it with any simple local web server.

A common method is to use Python's built-in server:

```bash
# If you have Python 3
python -m http.server
```

Or use `npx`, which is included with Node.js:

```bash
npx serve
```

Once the server is running, open your browser and navigate to the provided local address (e.g., `http://localhost:8000` or `http://localhost:3000`).

## Technology Stack

- **Frontend**: React, TypeScript
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API (`@google/genai`)
- **Data Visualization**: D3.js (for the force-directed graph)

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
