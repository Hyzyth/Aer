/**
 * tooltip.js - Gestion des infobulles
 * Version avec nouvelle palette
 */
const Tooltip = {
    element: null,
    
    /**
     * Initialise le tooltip
     */
    initialize() {
        this.element = document.createElement('div');
        this.element.className = 'map-tooltip';
        document.body.appendChild(this.element); // CORRECTION ICI
        console.log('[Tooltip] ✓ Initialisé');
    },
    
    /**
     * Affiche le tooltip avec des données
     */
    show(x, y, data) {
        if (!this.element) this.initialize();
        
        let html = '';
        
        if (data.title) {
            html += `<div class="tooltip-title">${data.title}</div>`;
        }
        
        if (data.rows) {
            data.rows.forEach(row => {
                html += `<div class="tooltip-row">${row}</div>`;
            });
        }
        
        this.element.innerHTML = html;
        
        const offsetX = 15;
        const offsetY = 15;
        
        let left = x + offsetX;
        let top = y + offsetY;
        
        this.element.classList.add('visible');
        const rect = this.element.getBoundingClientRect();
        
        if (left + rect.width > window.innerWidth) {
            left = x - rect.width - offsetX;
        }
        if (top + rect.height > window.innerHeight) {
            top = y - rect.height - offsetY;
        }
        
        this.element.style.left = `${left}px`;
        this.element.style.top = `${top}px`;
    },
    
    /**
     * Masque le tooltip
     */
    hide() {
        if (this.element) {
            this.element.classList.remove('visible');
        }
    },
    
    /**
     * Affiche les informations d'une zone
     */
    showZoneInfo(x, y, zoneStats) {
        const data = {
            title: zoneStats.name,
            rows: [
                `Coordonnées: ${zoneStats.coords.lat.toFixed(4)}°N, ${zoneStats.coords.lon.toFixed(4)}°E`,
                `Dernière mesure: ${DataUtils.formatDate(zoneStats.lastDate, 'short')}`,
                `Qualité moyenne: ${getQualityLabel(Math.round(zoneStats.avgCodeQual))}`,
                `Pollen dominant: ${zoneStats.dominantPollen ? zoneStats.dominantPollen.toUpperCase() : 'Aucun'}`
            ]
        };
        
        this.show(x, y, data);
    },
    
    /**
     * Met à jour la position du tooltip
     */
    update(x, y) {
        if (this.element && this.element.classList.contains('visible')) {
            const offsetX = 15;
            const offsetY = 15;
            
            this.element.style.left = `${x + offsetX}px`;
            this.element.style.top = `${y + offsetY}px`;
        }
    }
};