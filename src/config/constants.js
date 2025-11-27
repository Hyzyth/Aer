/**
 * constants.js - Configuration globale du projet Aer
 * Centralise tous les paramètres configurables
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
    
    // Dimensions et mise en page
    LAYOUT: {
        LEFT_PANEL_WIDTH: 0.7,
        MAP_PANEL_HEIGHT: 0.5
    },
    
    // Paramètres d'animation
    ANIMATION: {
        TRANSITION_DURATION: 400,
        EASING_DEFAULT: 'easeInOutCubic',
        FRAME_RATE: 30,
        AUTO_PLAY_SPEED: 100
    },
    
    // Configuration de la carte
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
        // Configuration des tuiles
        TILES: {
            CUSTOM: {
                url: 'https://hyzyth.github.io/aer_map_tiles/{z}/{x}/{y}.png',
                attribution: '© Custom Aer Map',
                icon: 'custom.png',
                label: 'Custom'
            },
            LIGHT: {
                url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
                attribution: '© OpenStreetMap contributors, © CartoDB',
                icon: 'light.png',
                label: 'Clair'
            },
            CLASSIC: {
                url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                attribution: '© OpenStreetMap contributors',
                icon: 'classic.png',
                label: 'Classic'
            }
        },
        DEFAULT_TILE: 'CUSTOM'
    },
    
    // Paramètres des données
    DATA: {
        MISSING_DATA_THRESHOLD: 7,
        MIN_SAMPLES_FOR_AVERAGE: 10,
        CODE_QUAL_MIN: 0,
        CODE_QUAL_MAX: 4,
        DEFAULT_YEAR_MIN_MONTHS: 6
    },
    
    // Modes de visualisation
    MODES: {
        RADIAL: 'radial',
        GRID: 'grid',
        AREA: 'area'
    },
    
    // Mode par défaut
    DEFAULT_MODE: 'radial',
    
    // Configuration du calendrier radial
    RADIAL: {
        SEGMENTS: 12,
        INNER_RADIUS_RATIO: 0.15,
        OUTER_RADIUS_RATIO: 0.85,
        RING_SPACING: 0.08,
        LABEL_OFFSET: 1.1,
        START_ANGLE: -Math.PI / 2,
        BACKGROUND_IMAGE: 'radial.png'
    },
    
    // Configuration de la grille
    GRID: {
        MONTHS: 12,
        HALF_MONTHS: 2,
        ROW_HEIGHT: 40,
        COL_WIDTH: 60,
        PADDING: 20,
        CELL_MARGIN: 2
    },
    
    // Configuration du stream graph
    AREA: {
        MARGIN: { top: 40, right: 40, bottom: 60, left: 60 },
        SMOOTHING_WINDOW: 5
    },
    
    // Configuration de l'export
    EXPORT: {
        FORMAT: 'png',
        QUALITY: 1.0,
        FILENAME_PREFIX: 'aer_export_'
    },
    
    // Configuration des légendes
    LEGEND: {
        POLLEN_ITEM_HEIGHT: 25,
        MAX_WIDTH: 200,
        PADDING: 15
    },
    
    // Configuration des tooltips
    TOOLTIP: {
        OFFSET_X: 15,
        OFFSET_Y: 15,
        MAX_WIDTH: 250
    },
    
    // Colonnes CSV utilisées
    CSV_COLUMNS: {
        DATE: 'date_ech',
        CODE_QUAL: 'code_qual',
        LIB_QUAL: 'lib_qual',
        COUL_QUAL: 'coul_qual',
        LIB_ZONE: 'lib_zone',
        CODE_AMBROISIE: 'code_ambroisie',
        CODE_AULNE: 'code_aulne',
        CODE_ARMOISE: 'code_armoise',
        CODE_BOULEAU: 'code_bouleau',
        CODE_GRAMINEES: 'code_graminees',
        CODE_OLIVIER: 'code_olivier',
        X_WGS84: 'x_wgs84',
        Y_WGS84: 'y_wgs84'
    },
    
    // Noms des mois
    MONTHS: [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ],
    
    // Noms des mois abrégés
    MONTHS_SHORT: [
        'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
        'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
    ],
    
    // Nombre d'icônes disponibles par famille
    POLLEN_ICON_COUNTS: {
        'ASTERACEES': 3,
        'BETULACEES': 3,
        'OLEACEES': 3,
        'POACEES': 4
    },
    
    // Configuration des assets pour export GRID
    GRID_MONTHS: {
        image: 'grid_months.png',
        width: 3280,
        height: 142,
        offsetLeft: 365,
        // Largeurs successives des 12 mois (en pixels)
        monthsWidth: [
            238, 238, 240, 250, 242, 245,
            235, 253, 248, 243, 237, 246
        ]
    },
    
    GRID_POLLEN: {
        image: 'grid_pollen.png',
        width: 3280,
        height: 206,
        pollenLabelOffset: 358,
        // Pour chaque mois : largeur H1 (1-15) et H2 (16-fin)
        halfMonths: [
            { h1: 121, h2: 117 }, // Janvier
            { h1: 120, h2: 117 }, // Février
            { h1: 123, h2: 118 }, // Mars
            { h1: 129, h2: 118 }, // Avril
            { h1: 121, h2: 121 }, // Mai
            { h1: 118, h2: 124 }, // Juin
            { h1: 124, h2: 120 }, // Juillet
            { h1: 123, h2: 123 }, // Août
            { h1: 120, h2: 125 }, // Septembre
            { h1: 117, h2: 129 }, // Octobre
            { h1: 124, h2: 119 }, // Novembre
            { h1: 123, h2: 128 }  // Décembre
        ]
    },
    
    // Ordre des layers pour l'export
    EXPORT_LAYERS: {
        grid: [
            {
                id: 'background',
                description: 'Background export_grid.png',
                type: 'image',
                source: 'export_grid.png'
            },
            {
                id: 'structure',
                description: 'Placement des backgrounds grid_months et grid_pollen',
                type: 'image'
            },
            {
                id: 'content',
                description: 'Textes, légendes, données des cellules',
                type: 'draw'
            }
        ]
    }
};

/**
 * Fonction utilitaire pour accéder aux constantes via un chemin
 * @param {string} path - Chemin vers la constante (ex: "MAP.CENTER_LAT")
 * @returns {*} Valeur de la constante
 */
const getConstant = (path) => {
    return path.split('.').reduce((obj, key) => obj?.[key], CONSTANTS);
};

// Log des constantes au chargement
console.log('%c[Constants] ⚙️ Configuration chargée', 'color: #6b9464; font-weight: bold;');
console.log(`[Constants] Mode par défaut: ${CONSTANTS.DEFAULT_MODE}`);
console.log(`[Constants] Tile par défaut: ${CONSTANTS.MAP.DEFAULT_TILE}`);
console.log(`[Constants] Lissage stream graph: fenêtre de ${CONSTANTS.AREA.SMOOTHING_WINDOW} mesures`);
console.log(`[Constants] ✓ GRID_MONTHS configuré: ${CONSTANTS.GRID_MONTHS.image} (${CONSTANTS.GRID_MONTHS.width}x${CONSTANTS.GRID_MONTHS.height}px)`);
console.log(`[Constants] ✓ GRID_POLLEN configuré: ${CONSTANTS.GRID_POLLEN.image} (${CONSTANTS.GRID_POLLEN.width}x${CONSTANTS.GRID_POLLEN.height}px)`);