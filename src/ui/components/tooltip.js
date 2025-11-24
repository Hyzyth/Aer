// Tooltip.js - Gestion des infobulles

const Tooltip = {
    element: null,
    
    initialize() {
        // Créer l'élément tooltip
        this.element = document.createElement('div');
        this.element.className = 'map-tooltip';
        document.body.appendChild(this.element);
    },
    
    show(x, y, data) {
        if (!this.element) this.initialize();
        
        // Construire le contenu
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
        
        // Positionner
        const offsetX = CONSTANTS.TOOLTIP.OFFSET_X;
        const offsetY = CONSTANTS.TOOLTIP.OFFSET_Y;
        
        let left = x + offsetX;
        let top = y + offsetY;
        
        // Ajuster si le tooltip sort de l'écran
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
    
    hide() {
        if (this.element) {
            this.element.classList.remove('visible');
        }
    },
    
    showZoneInfo(x, y, zoneStats, themeColors) {
        const bgColor = themeColors?.tooltip || PALETTE.UI.TOOLTIP_BG;
        const textColor = themeColors?.tooltipText || PALETTE.UI.TOOLTIP_TEXT;
        
        // Mettre à jour les couleurs du tooltip
        if (this.element) {
            this.element.style.background = bgColor;
            this.element.style.color = textColor;
        }
        
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
    
    update(x, y) {
        if (this.element && this.element.classList.contains('visible')) {
            const offsetX = CONSTANTS.TOOLTIP.OFFSET_X;
            const offsetY = CONSTANTS.TOOLTIP.OFFSET_Y;
            
            this.element.style.left = `${x + offsetX}px`;
            this.element.style.top = `${y + offsetY}px`;
        }
    }
};