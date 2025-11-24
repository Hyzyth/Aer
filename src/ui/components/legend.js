// Legend.js - Gestion des légendes (uniquement pour export)

const Legend = {
    /**
     * Initialise les légendes
     * En mode normal, aucune légende n'est affichée pour maximiser l'espace
     * @param {HTMLElement} container - Conteneur parent
     */
    initialize(container) {
        // Pas de légende en mode normal - tout l'espace pour la visualisation
    },
    
    /**
     * Obtient les informations complètes pour l'export
     * @returns {Object} Informations complètes
     */
    getExportInfo() {
        // Calculer l'intervalle de temps
        let timeInterval = 'Aucune donnée';
        if (AppState.currentMeasures.length > 0) {
            const firstDate = new Date(AppState.currentMeasures[0].date_ech);
            const lastDate = new Date(AppState.currentMeasures[AppState.currentMeasures.length - 1].date_ech);
            timeInterval = `${DataUtils.formatDate(firstDate, 'short')} - ${DataUtils.formatDate(lastDate, 'short')}`;
        }
        
        return {
            mode: this.getModeName(AppState.selectedMode),
            zone: AppState.selectedZone || 'Aucune',
            year: AppState.selectedYear || '-',
            timeInterval: timeInterval,
            activePollens: AppState.getActivePollens()
        };
    },
    
    getModeName(mode) {
        switch (mode) {
            case CONSTANTS.MODES.RADIAL:
                return 'Flux Radial';
            case CONSTANTS.MODES.GRID:
                return 'Grille';
            case CONSTANTS.MODES.AREA:
                return 'Flux d\'Aire';
            default:
                return 'Inconnu';
        }
    }
};