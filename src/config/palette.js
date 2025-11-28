/**
 * palette.js - Définition centralisée des couleurs du projet Aer
 * Palette optimisée selon les nouvelles spécifications
 */

const PALETTE = {
    // Couleurs de base
    UI: {
        BG_COLOR: '#ECEBE7',      // Background universel + No Data
        TEXT_COLOR: '#162B5E',    // Texte universel
        ACCENT: '#6b9464'         // Accent (éléments interactifs)
    },
    
    // Couleurs par type de pollen
    POLLENS: {
        ambroisie: '#AAB9B6',
        aulne: '#B8B96B',
        armoise: '#C6E6F1',
        bouleau: '#CFE68B',
        graminees: '#D49A8F',
        olivier: '#E3D7E8'
    },
    
    // Couleurs par famille de pollens
    FAMILIES: {
        ASTERACEES: '#BED5D4',  // Moyenne ambroisie + armoise
        BETULACEES: '#C4D2AA',  // Moyenne aulne + bouleau
        OLEACEES: '#E3D7E8',
        POACEES: '#D49A8F'
    },
    
    // Qualité de l'air (conservées pour compatibilité code_qual)
    QUALITY: {
        0: { color: '#ECEBE7', label: 'No Data' },
        1: { color: '#50CCAA', label: 'Bon' },
        2: { color: '#88D66C', label: 'Moyen' },
        3: { color: '#f8ab37ff', label: 'Dégradé' },
        4: { color: '#ee4343ff', label: 'Mauvais' }
    }
};

// Fonctions utilitaires
const getPollenColor = (pollenName) => PALETTE.POLLENS[pollenName] || PALETTE.UI.BG_COLOR;
const getQualityColor = (codeQual) => PALETTE.QUALITY[parseInt(codeQual) || 0]?.color || PALETTE.QUALITY[0].color;
const getQualityLabel = (codeQual) => PALETTE.QUALITY[parseInt(codeQual) || 0]?.label || 'No Data';
const getFamilyColor = (familyName) => PALETTE.FAMILIES[familyName] || PALETTE.UI.BG_COLOR;

console.log('%c[Palette] ✓ Nouvelle palette chargée', 'color: #162B5E; font-weight: bold;');