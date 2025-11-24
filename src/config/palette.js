// Palette.js - Définition de toutes les couleurs du projet

const PALETTE = {
    // Couleurs de qualité de l'air (code_qual 0-4)
    QUALITY: {
        0: { color: '#9E9E9E', label: 'No Data' },
        1: { color: '#50CCAA', label: 'Bon' },
        2: { color: '#88D66C', label: 'Moyen' },
        3: { color: '#f8ab37ff', label: 'Dégradé' },
        4: { color: '#ee4343ff', label: 'Mauvais' }
    },
    
    // Couleurs par type de pollen (cohérentes dans toute l'application)
    POLLENS: {
        ambroisie: '#E63946',
        aulne: '#2A9D8F',
        armoise: '#F77F00',
        bouleau: '#06D6A0',
        graminees: '#FFD23F',
        olivier: '#8338EC'
    },
    
    // Couleurs par famille de pollens (pour le filtre)
    FAMILIES: {
        ASTERACEES: '#E85D75',
        BETULACEES: '#1D9A89',
        OLEACEES: '#8338EC',
        POACEES: '#F4C430'
    },
    
    // Couleurs de l'interface
    UI: {
        NATURE_LIGHT: '#f5f9f0',
        NATURE_MEDIUM: '#e8f3dc',
        NATURE_DARK: '#2d4a2b',
        NATURE_ACCENT: '#6b9464',
        CONTROLS_BG: '#4a5d47',
        CONTROLS_TEXT: '#ffffff',
        LEGEND_BG: 'rgba(45, 74, 43, 0.9)',
        LEGEND_TEXT: '#ffffff',
        TOOLTIP_BG: 'rgba(45, 74, 43, 0.95)',
        TOOLTIP_TEXT: '#ffffff'
    },
    
    // Dégradés pour les visualisations
    GRADIENTS: {
        // Dégradé de qualité (du bon au mauvais)
        QUALITY_SCALE: [
            '#50CCAA',
            '#88D66C',
            '#C8E86D',
            '#FFB84D',
            '#FF6B6B'
        ],
        
        // Dégradés nature pour les fonds
        NATURE_BG: [
            '#f5f9f0',
            '#e8f3dc',
            '#d4ead1',
            '#c0e0c7'
        ]
    },
    
    // Opacités standards
    OPACITY: {
        FULL: 1.0,
        HIGH: 0.8,
        MEDIUM: 0.6,
        LOW: 0.4,
        VERY_LOW: 0.2,
        INACTIVE: 0.3
    }
};

// Fonction pour obtenir la couleur d'un pollen
const getPollenColor = (pollenName) => {
    return PALETTE.POLLENS[pollenName] || '#999999';
};

// Fonction pour obtenir la couleur de qualité
const getQualityColor = (codeQual) => {
    const code = parseInt(codeQual) || 0;
    return PALETTE.QUALITY[code]?.color || PALETTE.QUALITY[0].color;
};

// Fonction pour obtenir le label de qualité
const getQualityLabel = (codeQual) => {
    const code = parseInt(codeQual) || 0;
    return PALETTE.QUALITY[code]?.label || 'No Data';
};

// Fonction pour obtenir une couleur avec opacité
const colorWithOpacity = (color, opacity) => {
    if (color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return color;
};

// Fonction pour obtenir la couleur d'une famille
const getFamilyColor = (familyName) => {
    return PALETTE.FAMILIES[familyName] || '#999999';
};