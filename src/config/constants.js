/**
 * constants.js - Configuration centralisée du projet Aer
 * Optimisé et simplifié
 */

const CONSTANTS = {
    // Chemins des fichiers
    PATHS: {
        DATA: 'data/indice_pollen_bretagne_epci.csv',
        POLLEN_ICONS: 'assets/pollen_icons/',
        UI_ICONS: 'assets/icons/',
        LOADING_ANIMATION: 'assets/loading/aer.gif',
        BACKGROUNDS: 'assets/background/'
    },
    
    // Layout
    LAYOUT: {
        LEFT_PANEL_WIDTH: 0.7,
        MAP_PANEL_HEIGHT: 0.5
    },
    
    // Animation
    ANIMATION: {
        TRANSITION_DURATION: 400,
        EASING_DEFAULT: 'easeInOutCubic',
        AUTO_PLAY_SPEED: 100
    },
    
    // Carte
    MAP: {
        CENTER_LAT: 48.2020,
        CENTER_LON: -2.9326,
        INITIAL_ZOOM: 8,
        MAX_ZOOM: 11,
        MIN_ZOOM: 8,
        CIRCLE_RADIUS: 8,
        CIRCLE_WEIGHT: 2,
        CIRCLE_OPACITY: 0.7,
        SELECTED_RADIUS: 12,
        TILES: {
            CUSTOM: {
                url: 'https://hyzyth.github.io/aer_map_tiles/{z}/{x}/{y}.png',
                attribution: '© Custom Aer Map',
                icon: 'custom.png'
            },
            LIGHT: {
                url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
                attribution: '© OpenStreetMap, © CartoDB',
                icon: 'light.png'
            },
            CLASSIC: {
                url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                attribution: '© OpenStreetMap',
                icon: 'classic.png'
            }
        },
        DEFAULT_TILE: 'CUSTOM'
    },
    
    // Données
    DATA: {
        MIN_SAMPLES_FOR_AVERAGE: 10,
        CODE_QUAL_MAX: 4,
        DEFAULT_YEAR_MIN_MONTHS: 6
    },
    
    // Modes de visualisation
    MODES: {
        RADIAL: 'radial',
        GRID: 'grid',
        AREA: 'area'
    },
    DEFAULT_MODE: 'radial',
    
    // Configuration radial
    RADIAL: {
        SEGMENTS: 12,
        INNER_RADIUS_RATIO: 0.15,
        START_ANGLE: -Math.PI / 2,
        BACKGROUND_IMAGE: 'radial.png'
    },
    
    // Configuration grille
    GRID: {
        MONTHS: 12,
        HALF_MONTHS: 2
    },
    
    // Configuration stream graph
    AREA: {
        SMOOTHING_WINDOW: 5
    },
    
    // Export
    EXPORT: {
        QUALITY: 1.0,
        FILENAME_PREFIX: 'aer_export_'
    },
    
    // Mois
    MONTHS: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
             'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
    MONTHS_SHORT: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
                   'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    
    // Nombre d'icônes disponibles par famille
    POLLEN_ICON_COUNTS: {
        'ASTERACEES': 3,
        'BETULACEES': 3,
        'OLEACEES': 3,
        'POACEES': 4
    },
    
    // Configuration export GRID
    GRID_MONTHS: {
        image: 'grid_months.png',
        width: 3273,
        height: 150,
        offsetLeft: 368,
        monthsWidth: [241, 247, 238, 245, 240, 247, 235, 243, 241, 245, 237, 245]
    },
    
    GRID_POLLEN: {
        image: 'grid_pollen.png',
        width: 3273,
        height: 202,
        pollenLabelOffset: 364,
        halfMonths: [
            { h1: 120, h2: 120 }, { h1: 120, h2: 123 }, { h1: 122, h2: 118 },
            { h1: 123, h2: 123 }, { h1: 118, h2: 123 }, { h1: 121, h2: 123 },
            { h1: 118, h2: 121 }, { h1: 119, h2: 124 }, { h1: 120, h2: 120 },
            { h1: 122, h2: 122 }, { h1: 118, h2: 121 }, { h1: 123, h2: 126 }
        ]
    }
};

console.log('%c[Constants] ⚙️ Configuration chargée', 'color: #162B5E; font-weight: bold;');
console.log(`[Constants] Mode par défaut: ${CONSTANTS.DEFAULT_MODE}`);
console.log(`[Constants] Tile par défaut: ${CONSTANTS.MAP.DEFAULT_TILE}`);