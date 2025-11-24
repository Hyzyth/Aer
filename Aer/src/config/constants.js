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