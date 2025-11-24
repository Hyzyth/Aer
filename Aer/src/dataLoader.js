// DataLoader.js - Chargement et structuration des données CSV

const DataLoader = {
    /**
     * Charge les données depuis le fichier CSV
     * Mesure et affiche le temps de chargement dans la console
     * @returns {Promise} Promesse résolue avec les données traitées
     */
    async loadData() {
        const startTime = performance.now();
        
        return new Promise((resolve, reject) => {
            Papa.parse(CONSTANTS.PATHS.DATA, {
                download: true,
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                delimitersToGuess: [',', '\t', ';'],
                complete: (results) => {
                    const endTime = performance.now();
                    const elapsed = endTime - startTime;
                    const timeString = this.formatLoadTime(elapsed);
                    
                    console.log(`CSV chargé: ${results.data.length} lignes en ${timeString}`);
                    
                    this.processData(results.data);
                    resolve(AppState.processedData);
                },
                error: (error) => {
                    console.error('Erreur de chargement CSV:', error);
                    reject(error);
                }
            });
        });
    },
    
    /**
     * Formate le temps de chargement en format lisible
     * @param {number} ms - Temps en millisecondes
     * @returns {string} Temps formaté (ex: "1.5s", "2m 30.5s")
     */
    formatLoadTime(ms) {
        if (ms < 1000) {
            return `${ms.toFixed(0)}ms`;
        } else if (ms < 60000) {
            const seconds = (ms / 1000).toFixed(2);
            return `${seconds}s`;
        } else if (ms < 3600000) {
            const minutes = Math.floor(ms / 60000);
            const seconds = ((ms % 60000) / 1000).toFixed(2);
            return `${minutes}m ${seconds}s`;
        } else if (ms < 86400000) {
            const hours = Math.floor(ms / 3600000);
            const minutes = Math.floor((ms % 3600000) / 60000);
            const seconds = ((ms % 60000) / 1000).toFixed(2);
            return `${hours}h ${minutes}m ${seconds}s`;
        } else {
            const days = Math.floor(ms / 86400000);
            const hours = Math.floor((ms % 86400000) / 3600000);
            const minutes = Math.floor((ms % 3600000) / 60000);
            return `${days}j ${hours}h ${minutes}m`;
        }
    },
    
    /**
     * Traiter et structurer les données
     * Crée des mesures fictives pour les jours manquants
     */
    processData(rawData) {
        AppState.rawData = rawData;
        
        const dataByZone = {};
        const zonesSet = new Set();
        const yearsSet = new Set();
        
        rawData.forEach(row => {
            // Nettoyer les données
            const cleanRow = this.cleanRow(row);
            if (!cleanRow) return;
            
            const zone = cleanRow.lib_zone;
            const date = new Date(cleanRow.date_ech);
            const year = date.getFullYear();
            
            zonesSet.add(zone);
            yearsSet.add(year);
            
            // Structurer par zone > année > mesures
            if (!dataByZone[zone]) {
                dataByZone[zone] = {};
            }
            if (!dataByZone[zone][year]) {
                dataByZone[zone][year] = [];
            }
            
            dataByZone[zone][year].push(cleanRow);
        });
        
        // Trier les mesures par date
        Object.keys(dataByZone).forEach(zone => {
            Object.keys(dataByZone[zone]).forEach(year => {
                dataByZone[zone][year].sort((a, b) => {
                    return new Date(a.date_ech) - new Date(b.date_ech);
                });
            });
        });
        
        // Ajouter des mesures fictives pour créer une timeline continue jour par jour
        Object.keys(dataByZone).forEach(zone => {
            Object.keys(dataByZone[zone]).forEach(year => {
                dataByZone[zone][year] = this.createContinuousTimeline(
                    dataByZone[zone][year],
                    zone,
                    parseInt(year)
                );
            });
        });
        
        AppState.processedData = dataByZone;
        AppState.zones = Array.from(zonesSet).sort();
        AppState.years = Array.from(yearsSet).sort((a, b) => a - b);
        
        console.log('Données traitées:', AppState.zones.length, 'zones,', AppState.years.length, 'années');
    },
    
    /**
     * Nettoyer une ligne de données
     */
    cleanRow(row) {
        // Vérifier les colonnes essentielles
        if (!row.date_ech || !row.x_wgs84 || !row.y_wgs84) {
            return null;
        }
        
        // Nettoyer lib_zone
        if (!row.lib_zone || row.lib_zone === '' || row.lib_zone === null) {
            row.lib_zone = 'UNKNOWN';
        }
        
        // Nettoyer code_qual
        row.code_qual = this.cleanNumericValue(row.code_qual, 0);
        
        // Nettoyer les codes de pollens
        row.code_ambroisie = this.cleanNumericValue(row.code_ambroisie, 0);
        row.code_aulne = this.cleanNumericValue(row.code_aulne, 0);
        row.code_armoise = this.cleanNumericValue(row.code_armoise, 0);
        row.code_bouleau = this.cleanNumericValue(row.code_bouleau, 0);
        row.code_graminees = this.cleanNumericValue(row.code_graminees, 0);
        row.code_olivier = this.cleanNumericValue(row.code_olivier, 0);
        
        // Nettoyer les coordonnées
        row.x_wgs84 = parseFloat(row.x_wgs84);
        row.y_wgs84 = parseFloat(row.y_wgs84);
        
        if (isNaN(row.x_wgs84) || isNaN(row.y_wgs84)) {
            return null;
        }
        
        // Nettoyer lib_qual et coul_qual
        if (!row.lib_qual || row.lib_qual === '') {
            row.lib_qual = getQualityLabel(row.code_qual);
        }
        if (!row.coul_qual || row.coul_qual === '') {
            row.coul_qual = getQualityColor(row.code_qual);
        }
        
        return row;
    },
    
    /**
     * Nettoyer une valeur numérique
     */
    cleanNumericValue(value, defaultValue = 0) {
        if (value === null || value === undefined || value === '' || value === 'NaN') {
            return defaultValue;
        }
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
    },
    
    /**
     * Crée une timeline continue jour par jour pour une année
     * Ajoute des mesures fictives "No Data" pour les jours manquants
     * @param {Array} measures - Mesures réelles triées par date
     * @param {string} zone - Nom de la zone
     * @param {number} year - Année concernée
     * @returns {Array} Timeline complète avec mesures réelles et fictives
     */
    createContinuousTimeline(measures, zone, year) {
        if (measures.length === 0) return measures;
        
        const timeline = [];
        
        // Obtenir la première et dernière date réelles
        const firstRealDate = new Date(measures[0].date_ech);
        const lastRealDate = new Date(measures[measures.length - 1].date_ech);
        
        // Définir le début et la fin de l'année
        const yearStart = new Date(year, 0, 1); // 1er janvier
        const yearEnd = new Date(year, 11, 31); // 31 décembre
        
        // Template pour créer des mesures fictives
        const template = measures[0];
        
        // Créer un index des mesures réelles par date (format YYYY-MM-DD)
        const realMeasuresMap = {};
        measures.forEach(measure => {
            const date = new Date(measure.date_ech);
            const dateKey = this.getDateKey(date);
            if (!realMeasuresMap[dateKey]) {
                realMeasuresMap[dateKey] = [];
            }
            realMeasuresMap[dateKey].push(measure);
        });
        
        // Parcourir chaque jour de l'année
        let currentDate = new Date(yearStart);
        
        while (currentDate <= yearEnd) {
            const dateKey = this.getDateKey(currentDate);
            
            if (realMeasuresMap[dateKey]) {
                // Des mesures réelles existent pour ce jour
                timeline.push(...realMeasuresMap[dateKey]);
            } else {
                // Pas de mesure pour ce jour - créer une mesure fictive
                timeline.push(this.createFictionalMeasure(new Date(currentDate), zone, template));
            }
            
            // Passer au jour suivant
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return timeline;
    },
    
    /**
     * Obtient une clé de date au format YYYY-MM-DD
     * @param {Date} date - Date à convertir
     * @returns {string} Clé de date
     */
    getDateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    
    /**
     * Crée une mesure fictive "No Data"
     * @param {Date} date - Date de la mesure fictive
     * @param {string} zone - Nom de la zone
     * @param {Object} templateMeasure - Mesure réelle servant de modèle (pour coordonnées)
     * @returns {Object} Mesure fictive
     */
    createFictionalMeasure(date, zone, templateMeasure) {
        return {
            date_ech: date.toISOString(),
            code_qual: 0,
            lib_qual: 'No Data',
            coul_qual: getQualityColor(0),
            lib_zone: zone,
            code_ambroisie: 0,
            code_aulne: 0,
            code_armoise: 0,
            code_bouleau: 0,
            code_graminees: 0,
            code_olivier: 0,
            x_wgs84: templateMeasure.x_wgs84,
            y_wgs84: templateMeasure.y_wgs84,
            fictional: true
        };
    },
    
    /**
     * Obtient les statistiques d'une zone (basées uniquement sur les mesures RÉELLES)
     * @param {string} zoneName - Nom de la zone
     * @returns {Object} Statistiques de la zone
     */
    getZoneStats(zoneName) {
        const zoneData = AppState.processedData[zoneName];
        if (!zoneData) return null;
        
        let totalMeasures = 0;
        let lastDate = null;
        const pollenAverages = {};
        let avgCodeQual = 0;
        let coords = null;
        
        ALL_POLLENS.forEach(pollen => {
            pollenAverages[pollen] = 0;
        });
        
        Object.values(zoneData).forEach(yearMeasures => {
            yearMeasures.forEach(measure => {
                // Ignorer les mesures fictives pour les statistiques
                if (!measure.fictional) {
                    totalMeasures++;
                    avgCodeQual += measure.code_qual;
                    
                    ALL_POLLENS.forEach(pollen => {
                        const code = POLLEN_TO_CSV_CODE[pollen];
                        pollenAverages[pollen] += measure[code] || 0;
                    });
                    
                    if (!coords) {
                        coords = {
                            lat: measure.y_wgs84,
                            lon: measure.x_wgs84
                        };
                    }
                    
                    const measureDate = new Date(measure.date_ech);
                    if (!lastDate || measureDate > lastDate) {
                        lastDate = measureDate;
                    }
                }
            });
        });
        
        if (totalMeasures > 0) {
            avgCodeQual /= totalMeasures;
            ALL_POLLENS.forEach(pollen => {
                pollenAverages[pollen] /= totalMeasures;
            });
        }
        
        // Trouver le pollen dominant
        let dominantPollen = null;
        let maxAvg = 0;
        ALL_POLLENS.forEach(pollen => {
            if (pollenAverages[pollen] > maxAvg) {
                maxAvg = pollenAverages[pollen];
                dominantPollen = pollen;
            }
        });
        
        return {
            name: zoneName,
            totalMeasures,
            lastDate,
            avgCodeQual,
            pollenAverages,
            dominantPollen,
            coords
        };
    }
};