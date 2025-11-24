// DataUtils.js - Fonctions utilitaires pour le traitement des données

const DataUtils = {
    // Calculer la moyenne d'un tableau de valeurs
    average(values) {
        if (!values || values.length === 0) return 0;
        const sum = values.reduce((acc, val) => acc + val, 0);
        return sum / values.length;
    },
    
    // Normaliser une valeur entre 0 et 1
    normalize(value, min, max) {
        if (max === min) return 0;
        return (value - min) / (max - min);
    },
    
    // Dénormaliser une valeur
    denormalize(normalizedValue, min, max) {
        return normalizedValue * (max - min) + min;
    },
    
    // Calculer les moyennes mensuelles pour un pollen
    getMonthlyAverages(measures, pollenName) {
        const monthlyData = {};
        
        // Initialiser les mois
        for (let i = 0; i < 12; i++) {
            monthlyData[i] = [];
        }
        
        // Grouper par mois
        measures.forEach(measure => {
            if (measure.fictional) return;
            
            const date = new Date(measure.date_ech);
            const month = date.getMonth();
            const code = POLLEN_TO_CSV_CODE[pollenName];
            const value = measure[code] || 0;
            
            monthlyData[month].push(value);
        });
        
        // Calculer les moyennes
        const averages = {};
        for (let i = 0; i < 12; i++) {
            averages[i] = this.average(monthlyData[i]);
        }
        
        return averages;
    },
    
    // Calculer les moyennes par demi-mois
    getHalfMonthlyAverages(measures, pollenName) {
        const halfMonthData = {};
        
        // Initialiser les demi-mois (24 périodes)
        for (let i = 0; i < 24; i++) {
            halfMonthData[i] = [];
        }
        
        // Grouper par demi-mois
        measures.forEach(measure => {
            if (measure.fictional) return;
            
            const date = new Date(measure.date_ech);
            const month = date.getMonth();
            const day = date.getDate();
            const halfMonth = month * 2 + (day > 15 ? 1 : 0);
            
            const code = POLLEN_TO_CSV_CODE[pollenName];
            const value = measure[code] || 0;
            
            halfMonthData[halfMonth].push(value);
        });
        
        // Calculer les moyennes (avec seuil minimal de mesures)
        const averages = {};
        for (let i = 0; i < 24; i++) {
            if (halfMonthData[i].length < CONSTANTS.DATA.MIN_SAMPLES_FOR_AVERAGE) {
                averages[i] = 0; // No Data
            } else {
                averages[i] = this.average(halfMonthData[i]);
            }
        }
        
        return averages;
    },
    
    // Obtenir les mesures jusqu'à un index donné (pour animation progressive)
    getMeasuresUpTo(measures, index) {
        return measures.slice(0, index + 1);
    },
    
    // Grouper les mesures par période
    groupByPeriod(measures, periodType = 'month') {
        const grouped = {};
        
        measures.forEach(measure => {
            const date = new Date(measure.date_ech);
            let key;
            
            switch (periodType) {
                case 'day':
                    key = date.toISOString().split('T')[0];
                    break;
                case 'week':
                    const weekNum = this.getWeekNumber(date);
                    key = `${date.getFullYear()}-W${weekNum}`;
                    break;
                case 'month':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
                case 'year':
                    key = date.getFullYear().toString();
                    break;
                default:
                    key = date.toISOString();
            }
            
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(measure);
        });
        
        return grouped;
    },
    
    // Obtenir le numéro de semaine
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    },
    
    // Interpoler entre deux mesures
    interpolateMeasures(measure1, measure2, factor) {
        const interpolated = { ...measure1 };
        
        ALL_POLLENS.forEach(pollen => {
            const code = POLLEN_TO_CSV_CODE[pollen];
            const val1 = measure1[code] || 0;
            const val2 = measure2[code] || 0;
            interpolated[code] = val1 + (val2 - val1) * factor;
        });
        
        interpolated.code_qual = Math.round(
            measure1.code_qual + (measure2.code_qual - measure1.code_qual) * factor
        );
        
        return interpolated;
    },
    
    // Obtenir le pollen dominant pour une mesure
    getDominantPollen(measure) {
        let maxValue = 0;
        let dominant = null;
        
        ALL_POLLENS.forEach(pollen => {
            const code = POLLEN_TO_CSV_CODE[pollen];
            const value = measure[code] || 0;
            
            if (value > maxValue) {
                maxValue = value;
                dominant = pollen;
            }
        });
        
        return dominant;
    },
    
    // Formater une date
    formatDate(dateString, format = 'full') {
        const date = new Date(dateString);
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const monthName = CONSTANTS.MONTHS[date.getMonth()];
        const monthShort = CONSTANTS.MONTHS_SHORT[date.getMonth()];
        
        switch (format) {
            case 'full':
                return `${day} ${monthName} ${year}`;
            case 'short':
                return `${day}/${month}/${year}`;
            case 'month-year':
                return `${monthName} ${year}`;
            case 'day-month':
                return `${day} ${monthShort}`;
            default:
                return date.toLocaleDateString('fr-FR');
        }
    },
    
    // Obtenir les statistiques d'un ensemble de mesures
    getStatistics(measures, pollenName) {
        if (!measures || measures.length === 0) {
            return { min: 0, max: 0, avg: 0, sum: 0 };
        }
        
        const code = POLLEN_TO_CSV_CODE[pollenName];
        const values = measures
            .filter(m => !m.fictional)
            .map(m => m[code] || 0);
        
        if (values.length === 0) {
            return { min: 0, max: 0, avg: 0, sum: 0 };
        }
        
        const sum = values.reduce((acc, val) => acc + val, 0);
        const avg = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        return { min, max, avg, sum };
    },
    
    // Lisser les données avec une moyenne mobile
    smoothData(values, windowSize = 3) {
        if (values.length < windowSize) return values;
        
        const smoothed = [];
        const halfWindow = Math.floor(windowSize / 2);
        
        for (let i = 0; i < values.length; i++) {
            const start = Math.max(0, i - halfWindow);
            const end = Math.min(values.length, i + halfWindow + 1);
            const window = values.slice(start, end);
            smoothed.push(this.average(window));
        }
        
        return smoothed;
    }
};