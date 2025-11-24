/**
 * State.js - Gestion centralisée de l'état de l'application
 * Centralise toutes les données et sélections actives
 * Implémente un système d'événements pour la réactivité
 */
const AppState = {
    // Données brutes et traitées
    rawData: null,
    processedData: {},
    zones: [],
    years: [],
    
    // Sélections actives de l'utilisateur
    selectedZone: null,
    selectedYear: null,
    selectedMode: CONSTANTS.DEFAULT_MODE, // Mode par défaut depuis constantes
    
    // Filtres de pollens actifs (par famille)
    activePollenFamilies: new Set(ORDERED_FAMILIES),
    
    // État de la timeline
    currentMeasureIndex: 0,
    currentMeasures: [],
    isPlaying: false,
    playInterval: null,
    
    // État de l'interface
    tooltipVisible: false,
    tooltipData: null,
    
    /**
     * Initialise l'état avec les valeurs par défaut
     */
    initialize() {
        this.activePollenFamilies = new Set(ORDERED_FAMILIES);
        this.selectedMode = CONSTANTS.DEFAULT_MODE;
        this.currentMeasureIndex = 0;
        this.isPlaying = false;
        console.log('[AppState] État initialisé');
    },
    
    /**
     * Obtient la liste des pollens individuels actifs
     * @returns {Array<string>} Liste des noms de pollens actifs
     */
    getActivePollens() {
        const pollens = [];
        this.activePollenFamilies.forEach(family => {
            pollens.push(...getFamilyPollens(family));
        });
        return pollens;
    },
    
    /**
     * Active ou désactive une famille de pollens
     * @param {string} family - Nom de la famille à toggle
     */
    togglePollenFamily(family) {
        if (this.activePollenFamilies.has(family)) {
            this.activePollenFamilies.delete(family);
            console.log(`[AppState] Famille désactivée: ${family}`);
        } else {
            this.activePollenFamilies.add(family);
            console.log(`[AppState] Famille activée: ${family}`);
        }
        this.notifyChange('pollens');
    },
    
    /**
     * Définit la zone sélectionnée et charge ses mesures
     * @param {string} zoneName - Nom de la zone à sélectionner
     */
    setSelectedZone(zoneName) {
        this.selectedZone = zoneName;
        this.loadZoneMeasures();
        this.notifyChange('zone');
        console.log(`[AppState] Zone sélectionnée: ${zoneName}`);
    },
    
    /**
     * Définit l'année sélectionnée et conserve la date exacte (jour/mois)
     * @param {number} year - Année à sélectionner
     */
    setSelectedYear(year) {
        // Sauvegarder la date exacte actuelle (jour et mois)
        let targetDayOfYear = null;
        if (this.currentMeasures.length > 0 && this.currentMeasureIndex >= 0) {
            const currentMeasure = this.currentMeasures[this.currentMeasureIndex];
            const currentDate = new Date(currentMeasure.date_ech);
            const start = new Date(currentDate.getFullYear(), 0, 0);
            const diff = currentDate - start;
            const oneDay = 1000 * 60 * 60 * 24;
            targetDayOfYear = Math.floor(diff / oneDay);
        }
        
        this.selectedYear = year;
        
        if (this.selectedZone) {
            this.loadZoneMeasures();
            
            // Trouver la mesure la plus proche de la même date dans la nouvelle année
            if (targetDayOfYear !== null && this.currentMeasures.length > 0) {
                let closestIndex = 0;
                let minDiff = Infinity;
                
                this.currentMeasures.forEach((measure, index) => {
                    const measureDate = new Date(measure.date_ech);
                    const start = new Date(measureDate.getFullYear(), 0, 0);
                    const diff = measureDate - start;
                    const oneDay = 1000 * 60 * 60 * 24;
                    const dayOfYear = Math.floor(diff / oneDay);
                    
                    const dateDiff = Math.abs(dayOfYear - targetDayOfYear);
                    if (dateDiff < minDiff) {
                        minDiff = dateDiff;
                        closestIndex = index;
                    }
                });
                
                this.setMeasureIndex(closestIndex);
            }
        }
        
        this.notifyChange('year');
        console.log(`[AppState] Année sélectionnée: ${year}`);
    },
    
    /**
     * Définit le mode de visualisation
     * @param {string} mode - Mode à activer
     */
    setMode(mode) {
        this.selectedMode = mode;
        this.notifyChange('mode');
        console.log(`[AppState] Mode changé: ${mode}`);
    },
    
    /**
     * Charge les mesures pour la zone/année sélectionnée
     */
    loadZoneMeasures() {
        if (!this.selectedZone || !this.selectedYear) {
            this.currentMeasures = [];
            return;
        }
        
        const zoneData = this.processedData[this.selectedZone];
        if (!zoneData) {
            this.currentMeasures = [];
            return;
        }
        
        const yearData = zoneData[this.selectedYear];
        if (!yearData) {
            this.currentMeasures = [];
            return;
        }
        
        this.currentMeasures = yearData;
        this.currentMeasureIndex = 0;
        this.notifyChange('measures');
        console.log(`[AppState] ${this.currentMeasures.length} mesures chargées`);
    },
    
    // Navigation temporelle
    nextMeasure() {
        if (this.currentMeasureIndex < this.currentMeasures.length - 1) {
            this.currentMeasureIndex++;
            this.notifyChange('timeline');
            return true;
        }
        return false;
    },
    
    previousMeasure() {
        if (this.currentMeasureIndex > 0) {
            this.currentMeasureIndex--;
            this.notifyChange('timeline');
            return true;
        }
        return false;
    },
    
    setMeasureIndex(index) {
        index = Math.max(0, Math.min(index, this.currentMeasures.length - 1));
        if (this.currentMeasureIndex !== index) {
            this.currentMeasureIndex = index;
            this.notifyChange('timeline');
        }
    },
    
    getCurrentMeasure() {
        return this.currentMeasures[this.currentMeasureIndex] || null;
    },
    
    // Lecture automatique
    startPlaying() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.playInterval = setInterval(() => {
            if (!this.nextMeasure()) {
                this.stopPlaying();
            }
        }, CONSTANTS.ANIMATION.AUTO_PLAY_SPEED);
        
        this.notifyChange('playing');
        console.log('[AppState] Lecture démarrée');
    },
    
    stopPlaying() {
        if (!this.isPlaying) return;
        
        this.isPlaying = false;
        if (this.playInterval) {
            clearInterval(this.playInterval);
            this.playInterval = null;
        }
        
        this.notifyChange('playing');
        console.log('[AppState] Lecture arrêtée');
    },
    
    togglePlaying() {
        if (this.isPlaying) {
            this.stopPlaying();
        } else {
            this.startPlaying();
        }
    },
    
    /**
     * Reset complet de l'application - CORRIGÉ
     * Réinitialise : zone, carte (zoom/position/thème), pollens, année, mode, intervalle de temps
     */
    reset() {
        console.log('[AppState] Reset complet de l\'application');
        
        // Arrêter la lecture
        this.stopPlaying();
        
        // Réinitialiser la zone
        this.selectedZone = null;
        
        // Réinitialiser l'année par défaut
        this.selectedYear = this.getDefaultYear();
        
        // Réinitialiser le mode de visualisation au mode par défaut
        this.selectedMode = CONSTANTS.DEFAULT_MODE;
        
        // Réinitialiser tous les pollens (tous actifs)
        this.activePollenFamilies = new Set(ORDERED_FAMILIES);
        
        // Réinitialiser l'intervalle de temps (début de l'année)
        this.currentMeasureIndex = 0;
        this.currentMeasures = [];
        
        // Notifier tous les changements
        this.notifyChange('reset');
        this.notifyChange('zone');
        this.notifyChange('pollens');
        this.notifyChange('year');
        this.notifyChange('mode');
        this.notifyChange('measures');
        
        console.log('[AppState] Reset terminé');
    },
    
    /**
     * Obtenir l'année par défaut
     * Basée uniquement sur les mesures RÉELLES (pas les données fictives)
     * @returns {number} Année par défaut
     */
    getDefaultYear() {
        if (!this.years || this.years.length === 0) return null;
        
        // Dernière année avec au moins 6 mois de données RÉELLES
        for (let i = this.years.length - 1; i >= 0; i--) {
            const year = this.years[i];
            const monthsWithRealData = new Set();
            
            Object.values(this.processedData).forEach(zoneData => {
                if (zoneData[year]) {
                    zoneData[year].forEach(measure => {
                        // Ne compter que les mesures réelles
                        if (!measure.fictional) {
                            const date = new Date(measure.date_ech);
                            monthsWithRealData.add(date.getMonth());
                        }
                    });
                }
            });
            
            if (monthsWithRealData.size >= CONSTANTS.DATA.DEFAULT_YEAR_MIN_MONTHS) {
                return year;
            }
        }
        
        return this.years[this.years.length - 1];
    },
    
    // Listeners pour les changements
    listeners: {},
    
    addListener(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    },
    
    notifyChange(event) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback());
        }
        if (this.listeners['*']) {
            this.listeners['*'].forEach(callback => callback(event));
        }
    }
};

// Initialiser l'état au chargement
AppState.initialize();