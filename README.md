# Aer - Pollen Data Visualization

**Live Demo:** [https://hyzyth.github.io/Aer/](https://hyzyth.github.io/Aer/)

## About The Project

Aer is an interactive web-based data visualization platform designed to track and display pollen concentrations across the Brittany (Bretagne) region in France. The application provides users with an intuitive, animated interface to observe the evolution of various pollen types over time. 

By combining interactive mapping with creative data representations, Aer transforms raw CSV datasets into accessible, visually engaging insights regarding air quality and allergenic risks.

## Key Features

* **Interactive Regional Map:** A dynamic map powered by Leaflet allowing users to select and analyze specific zones within the Brittany region.
* **Time-Series Animation:** A built-in timeline with play, pause, and step-through controls that animates daily pollen data throughout a selected year.
* **Advanced Visualizations:** Multiple creative viewing modes developed with p5.js, including:
    * Radial Calendar
    * Planting Grid
    * Area Graph
* **Dynamic Filtering:** Toggle specific pollen types on and off to isolate data. Supported pollen groups include Ragweed (Ambroisie), Alder (Aulne), Mugwort (Armoise), Birch (Bouleau), Grasses (Graminées), and Olive (Olivier).
* **Seamless Data Interpolation:** The application automatically structures raw datasets and generates fictional "No Data" measures for missing dates, ensuring a smooth and continuous timeline animation.
* **Export Capabilities:** Built-in functionality to export the current state of the visualization.
* **Debug API:** A globally accessible developer API (`window.AerApp`) for state inspection, data verification, and asset testing directly from the browser console.

## Built With

This project is built purely with frontend web technologies and relies on robust external libraries for mapping, canvas rendering, and data parsing:

* **HTML5 / CSS3 / Vanilla JavaScript (ES6)**
* **p5.js:** Used for complex, canvas-based creative coding and data visualization.
* **Leaflet.js:** Used for rendering the interactive map interface.
* **PapaParse:** Used for fast and reliable client-side parsing of the CSV data source.

## Project Architecture

The codebase is organized in a modular structure to separate data logic, state management, UI components, and visualizations:

* `index.html`: The main entry point containing the application layout.
* `assets/`: Contains static resources including background images, icons, custom typography (`PPLettraMono`), and stylesheets.
* `data/`: Houses the core dataset (`indice_pollen_bretagne_epci.csv`) and related data generation scripts.
* `src/`:
    * `main.js`: Application bootstrapper, font loading verification, and error handling.
    * `app.js`: Core orchestration, UI initialization, and loading screen management.
    * `state.js`: Global state management for user selections, timeline, and active filters.
    * `dataLoader.js`: Handles CSV fetching, data cleaning, structuring, and continuous timeline generation.
    * `ui/`: Logic for interactive interface panels (Map, Filters, Export, Controls).
    * `visuals/`: p5.js visualization rendering logic (Radial, Grid, Area).
    * `utils/`: Helper functions for geometry, color mapping, animation, and data manipulation.

## Getting Started

To run this project locally for development or testing purposes, follow these steps:

### Prerequisites

Since the application uses asynchronous requests (via PapaParse) to load the CSV dataset and module-like script architectures, it must be served through a local web server. Opening `index.html` directly via the file system (`file://` protocol) will result in CORS errors.

### Installation

1.  Clone the repository:
    ```bash
    git clone [https://github.com/hyzyth/Aer.git](https://github.com/hyzyth/Aer.git)
    ```
2.  Navigate to the project directory:
    ```bash
    cd Aer
    ```
3.  Start a local development server. You can use Node.js, Python, or a VS Code extension:
    * *Using Node.js (http-server):*
        ```bash
        npx http-server
        ```
    * *Using Python 3:*
        ```bash
        python -m http.server 8000
        ```
    * *Using VS Code:* Install the "Live Server" extension and click "Go Live" from the `index.html` file.
4.  Open your browser and navigate to `http://localhost:8000` (or the port provided by your local server).

## Developer API (Debugging)

For debugging and testing, you can interact with the application state via the browser console using the `AerApp` object. 

Example commands:
* `AerApp.debug.logState()`: Outputs the current application state (selected zone, year, mode, active pollens, etc.).
* `AerApp.debug.getZoneStats("Zone Name")`: Retrieves statistics for a specific region.
* `AerApp.debug.testAllBackgrounds()`: Verifies that all image assets are properly loading.

## Data Source

The data driving this application represents the pollen index for the EPCI (Établissement Public de Coopération Intercommunale) zones within the Brittany region. It evaluates the concentration and allergenic impact of various pollen types over distinct periods.
