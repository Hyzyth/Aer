/**
 * PlantingGrid.js - Visualisation en grille de plantation moderne
 * Affiche les données polliniques dans une grille mensuelle avec style contemporain
 * Toutes les dimensions sont calculées pour s'adapter au panel sans débordement
 */

const PlantingGrid = {
    canvas: null,
    ctx: null,
    animator: null,
    currentProgress: 0,
    tooltipElement: null,
    
    /**
     * Initialise le canvas et les composants
     */
    initialize(container) {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        container.appendChild(this.canvas);
        
        this.createTooltip(container);
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Événements de souris pour le tooltip
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => this.hideTooltip());
        
        this.animator = AnimationUtils.createSmoothTransition(0);
    },
    
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    },
    
    createTooltip(container) {
        this.tooltipElement = document.createElement('div');
        this.tooltipElement.className = 'viz-tooltip';
        container.appendChild(this.tooltipElement);
    },
    
    /**
     * Gère le survol de la souris avec tooltip collé au curseur
     */
    handleMouseMove(e) {
        if (!AppState.selectedZone || AppState.currentMeasures.length === 0) {
            this.hideTooltip();
            return;
        }
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculer les dimensions optimales de la grille
        const activePollens = AppState.getActivePollens();
        const gridMetrics = this.calculateGridMetrics(activePollens.length);
        
        const startX = gridMetrics.startX;
        const startY = gridMetrics.startY;
        const colWidth = gridMetrics.colWidth;
        const rowHeight = gridMetrics.rowHeight;
        const gridWidth = gridMetrics.gridWidth;
        const gridHeight = gridMetrics.gridHeight;
        
        // Vérifier si la souris est dans la grille
        if (mouseX >= startX && mouseX <= startX + gridWidth &&
            mouseY >= startY && mouseY <= startY + gridHeight) {
            
            const col = Math.floor((mouseX - startX) / colWidth);
            const row = Math.floor((mouseY - startY) / rowHeight);
            const halfMonth = Math.floor(((mouseX - startX) % colWidth) / (colWidth / 2));
            
            if (row >= 0 && row < activePollens.length && col >= 0 && col < CONSTANTS.GRID.MONTHS) {
                const cellProgress = (col + halfMonth / CONSTANTS.GRID.HALF_MONTHS) / CONSTANTS.GRID.MONTHS;
                
                if (cellProgress > this.currentProgress) {
                    this.hideTooltip();
                    return;
                }
                
                const pollen = activePollens[row];
                const halfMonthIndex = col * 2 + halfMonth;
                
                const halfMonthlyData = DataUtils.getHalfMonthlyAverages(
                    AppState.currentMeasures,
                    pollen
                );
                
                const value = halfMonthlyData[halfMonthIndex] || 0;
                
                // Tooltip collé au curseur
                this.showTooltip(e.clientX, e.clientY, {
                    pollen: pollen,
                    month: CONSTANTS.MONTHS[col],
                    period: halfMonth === 0 ? '1-15' : '16-fin',
                    quality: value,
                    qualityLabel: this.getQualityLabel(value)
                });
            } else {
                this.hideTooltip();
            }
        } else {
            this.hideTooltip();
        }
    },
    
    getQualityLabel(value) {
        if (value === 0) return 'No Data';
        if (value <= 1) return 'Bon';
        if (value <= 2) return 'Moyen';
        if (value <= 3) return 'Dégradé';
        return 'Mauvais';
    },
    
    /**
     * Affiche le tooltip collé au curseur (offset 0px)
     */
    showTooltip(x, y, data) {
        this.tooltipElement.innerHTML = `
            <div class="viz-tooltip-title">${data.pollen.toUpperCase()}</div>
            <div class="viz-tooltip-row">${data.month} (${data.period})</div>
            <div class="viz-tooltip-row">Qualité: ${data.quality.toFixed(1)} - ${data.qualityLabel}</div>
        `;
        
        this.tooltipElement.classList.add('visible');
        
        // Collé au curseur
        this.tooltipElement.style.left = x + 'px';
        this.tooltipElement.style.top = y + 'px';
    },
    
    hideTooltip() {
        if (this.tooltipElement) {
            this.tooltipElement.classList.remove('visible');
        }
    },
    
    /**
     * Calcule les métriques de la grille de manière optimale
     * Toutes les dimensions sont calculées pour éviter tout débordement
     */
    calculateGridMetrics(numPollens) {
        const padding = 50;
        const labelWidth = 120; // Largeur des labels de pollens à gauche
        const legendWidth = 110; // Largeur de la légende à droite
        const headerHeight = 35; // Hauteur des en-têtes
        
        const availableWidth = this.canvas.width - padding * 2 - labelWidth - legendWidth;
        const availableHeight = this.canvas.height - padding * 2 - headerHeight - 20;
        
        // Calculer la largeur de colonne pour remplir l'espace
        const colWidth = availableWidth / CONSTANTS.GRID.MONTHS;
        
        // Calculer la hauteur de ligne pour remplir l'espace
        const rowHeight = Math.min(
            availableHeight / numPollens,
            70 // Hauteur maximale pour éviter les lignes trop grandes
        );
        
        const gridWidth = colWidth * CONSTANTS.GRID.MONTHS;
        const gridHeight = rowHeight * numPollens;
        
        // Position de départ avec labels à gauche
        const startX = padding + labelWidth;
        const startY = (this.canvas.height - gridHeight) / 2 + headerHeight;
        
        return {
            colWidth,
            rowHeight,
            gridWidth,
            gridHeight,
            startX,
            startY,
            labelWidth,
            legendWidth,
            headerHeight,
            padding
        };
    },
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Fond plus sombre
        this.ctx.fillStyle = '#d8e0d8';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!AppState.selectedZone || AppState.currentMeasures.length === 0) {
            this.drawPlaceholder();
            return;
        }
        
        // Mettre à jour la progression
        const targetProgress = AppState.currentMeasureIndex / AppState.currentMeasures.length;
        this.animator.setTarget(targetProgress);
        this.currentProgress = this.animator.update();
        
        const activePollens = AppState.getActivePollens();
        const metrics = this.calculateGridMetrics(activePollens.length);
        
        // Dessiner les en-têtes des mois
        this.drawMonthHeaders(metrics);
        
        // Dessiner chaque ligne de pollen
        activePollens.forEach((pollen, rowIndex) => {
            this.drawPollenRow(pollen, rowIndex, metrics);
        });
        
        // Dessiner la ligne de progression
        this.drawProgressLine(metrics);
        
        // Dessiner la légende de qualité
        this.drawQualityLegend(metrics);
    },
    
    drawPlaceholder() {
        this.ctx.fillStyle = PALETTE.UI.NATURE_DARK;
        this.ctx.font = '20px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Sélectionnez une zone sur la carte', this.canvas.width / 2, this.canvas.height / 2);
    },
    
    /**
     * Dessine les en-têtes de mois modernes
     */
    drawMonthHeaders(metrics) {
        const { startX, startY, colWidth, headerHeight } = metrics;
        const headerY = startY - headerHeight - 5;
        
        this.ctx.font = 'bold 12px PPLettraMono';
        this.ctx.fontWeight = '500'; // Medium
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        for (let month = 0; month < CONSTANTS.GRID.MONTHS; month++) {
            const cellX = startX + month * colWidth;
            
            // Fond avec dégradé subtil
            const gradient = this.ctx.createLinearGradient(cellX, headerY, cellX, headerY + headerHeight);
            gradient.addColorStop(0, ColorUtils.toRgba(PALETTE.UI.NATURE_ACCENT, 0.25));
            gradient.addColorStop(1, ColorUtils.toRgba(PALETTE.UI.NATURE_ACCENT, 0.15));
            this.ctx.fillStyle = gradient;
            
            // Coins arrondis
            this.roundRect(cellX + 2, headerY, colWidth - 4, headerHeight, 6);
            this.ctx.fill();
            
            // Bordure légère
            this.ctx.strokeStyle = ColorUtils.toRgba(PALETTE.UI.NATURE_DARK, 0.2);
            this.ctx.lineWidth = 1;
            this.roundRect(cellX + 2, headerY, colWidth - 4, headerHeight, 6);
            this.ctx.stroke();
            
            // Texte
            this.ctx.fillStyle = PALETTE.UI.NATURE_DARK;
            this.ctx.fillText(CONSTANTS.MONTHS_SHORT[month], cellX + colWidth / 2, headerY + headerHeight / 2);
        }
    },
    
    /**
     * Dessine une ligne de pollen avec style moderne
     */
    drawPollenRow(pollenName, rowIndex, metrics) {
        const { startX, startY, colWidth, rowHeight, padding, labelWidth } = metrics;
        const y = startY + rowIndex * rowHeight;
        
        const pollenColor = getPollenColor(pollenName);
        
        // Label du pollen à gauche avec design moderne
        const labelX = padding;
        const labelY = y + 4;
        const labelW = labelWidth - 10;
        const labelH = rowHeight - 8;
        
        // Fond avec dégradé
        const gradient = this.ctx.createLinearGradient(labelX, labelY, labelX + labelW, labelY);
        gradient.addColorStop(0, ColorUtils.toRgba(pollenColor, 0.15));
        gradient.addColorStop(1, ColorUtils.toRgba(pollenColor, 0.05));
        this.ctx.fillStyle = gradient;
        
        this.roundRect(labelX, labelY, labelW, labelH, 8);
        this.ctx.fill();
        
        // Bordure accentuée
        this.ctx.strokeStyle = ColorUtils.toRgba(pollenColor, 0.6);
        this.ctx.lineWidth = 2.5;
        this.roundRect(labelX, labelY, labelW, labelH, 8);
        this.ctx.stroke();
        
        // Texte du label
        this.ctx.fillStyle = PALETTE.UI.NATURE_DARK;
        this.ctx.font = 'bold 12px PPLettraMono';
        this.ctx.fontWeight = '500'; // Medium
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(pollenName.toUpperCase(), labelX + labelW - 8, y + rowHeight / 2);
        
        // Calculer les moyennes par demi-mois
        const halfMonthlyData = DataUtils.getHalfMonthlyAverages(
            AppState.currentMeasures,
            pollenName
        );
        
        // Dessiner les cellules avec style moderne
        for (let month = 0; month < CONSTANTS.GRID.MONTHS; month++) {
            // Ligne de séparation entre mois
            this.ctx.strokeStyle = ColorUtils.toRgba(PALETTE.UI.NATURE_DARK, 0.25);
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(startX + month * colWidth, y);
            this.ctx.lineTo(startX + month * colWidth, y + rowHeight);
            this.ctx.stroke();
            
            for (let half = 0; half < CONSTANTS.GRID.HALF_MONTHS; half++) {
                const halfMonthIndex = month * CONSTANTS.GRID.HALF_MONTHS + half;
                const value = halfMonthlyData[halfMonthIndex] || 0;
                
                const cellProgress = (month + half / CONSTANTS.GRID.HALF_MONTHS) / CONSTANTS.GRID.MONTHS;
                if (cellProgress > this.currentProgress) continue;
                
                const cellX = startX + month * colWidth + (half * colWidth / 2);
                const cellY = y + 4;
                const cellWidth = colWidth / 2 - 6;
                const cellHeight = rowHeight - 8;
                
                const cellColor = this.getQualityColor(value);
                
                // Dégradé subtil pour les cellules
                const cellGradient = this.ctx.createLinearGradient(cellX, cellY, cellX, cellY + cellHeight);
                cellGradient.addColorStop(0, cellColor);
                cellGradient.addColorStop(1, ColorUtils.darken(cellColor, 0.1));
                this.ctx.fillStyle = cellGradient;
                
                // Coins arrondis pour les cellules
                this.roundRect(cellX, cellY, cellWidth, cellHeight, 4);
                this.ctx.fill();
                
                // Bordure légère
                this.ctx.strokeStyle = half === 0 
                    ? ColorUtils.toRgba(PALETTE.UI.NATURE_DARK, 0.3)
                    : ColorUtils.toRgba(PALETTE.UI.NATURE_DARK, 0.15);
                this.ctx.lineWidth = half === 0 ? 1.5 : 1;
                this.roundRect(cellX, cellY, cellWidth, cellHeight, 4);
                this.ctx.stroke();
            }
        }
        
        // Ligne finale
        this.ctx.strokeStyle = ColorUtils.toRgba(PALETTE.UI.NATURE_DARK, 0.25);
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(startX + CONSTANTS.GRID.MONTHS * colWidth, y);
        this.ctx.lineTo(startX + CONSTANTS.GRID.MONTHS * colWidth, y + rowHeight);
        this.ctx.stroke();
    },
    
    /**
     * Fonction utilitaire pour dessiner des rectangles aux coins arrondis
     */
    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    },
    
    getQualityColor(value) {
        if (value === 0) return PALETTE.QUALITY[0].color;
        
        value = Math.max(1, Math.min(4, value));
        
        const lowerIndex = Math.floor(value);
        const upperIndex = Math.ceil(value);
        
        if (lowerIndex === upperIndex) {
            return PALETTE.QUALITY[lowerIndex].color;
        }
        
        const factor = value - lowerIndex;
        
        return ColorUtils.interpolateColor(
            PALETTE.QUALITY[lowerIndex].color,
            PALETTE.QUALITY[upperIndex].color,
            factor
        );
    },
    
    /**
     * Ligne de progression moderne
     */
    drawProgressLine(metrics) {
        const { startX, startY, gridWidth, gridHeight } = metrics;
        const lineX = startX + gridWidth * this.currentProgress;
        
        // Ombre de la ligne
        this.ctx.strokeStyle = ColorUtils.toRgba('#000000', 0.1);
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([6, 4]);
        this.ctx.beginPath();
        this.ctx.moveTo(lineX + 1, startY - 25);
        this.ctx.lineTo(lineX + 1, startY + gridHeight + 10);
        this.ctx.stroke();
        
        // Ligne principale
        this.ctx.strokeStyle = PALETTE.UI.NATURE_ACCENT;
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([6, 4]);
        this.ctx.beginPath();
        this.ctx.moveTo(lineX, startY - 25);
        this.ctx.lineTo(lineX, startY + gridHeight + 10);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Point en haut avec ombre
        this.ctx.fillStyle = ColorUtils.toRgba('#000000', 0.2);
        this.ctx.beginPath();
        this.ctx.arc(lineX + 1, startY - 25, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = PALETTE.UI.NATURE_ACCENT;
        this.ctx.beginPath();
        this.ctx.arc(lineX, startY - 25, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Bordure blanche
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(lineX, startY - 25, 6, 0, Math.PI * 2);
        this.ctx.stroke();
    },
    
    /**
     * Légende de qualité moderne - positionnée dans l'espace réservé
     */
    drawQualityLegend(metrics) {
        const { startX, startY, gridWidth, gridHeight, legendWidth } = metrics;
        const x = startX + gridWidth + 15;
        const legendHeight = Math.min(200, gridHeight);
        const y = startY + (gridHeight - legendHeight) / 2;
        
        // Fond avec ombre
        this.ctx.fillStyle = ColorUtils.toRgba('#000000', 0.05);
        this.roundRect(x + 2, y + 2, legendWidth - 20, legendHeight, 8);
        this.ctx.fill();
        
        this.ctx.fillStyle = ColorUtils.toRgba('#ffffff', 0.95);
        this.roundRect(x, y, legendWidth - 20, legendHeight, 8);
        this.ctx.fill();
        
        // Bordure
        this.ctx.strokeStyle = ColorUtils.toRgba(PALETTE.UI.NATURE_DARK, 0.2);
        this.ctx.lineWidth = 1.5;
        this.roundRect(x, y, legendWidth - 20, legendHeight, 8);
        this.ctx.stroke();
        
        // Titre
        this.ctx.fillStyle = PALETTE.UI.NATURE_DARK;
        this.ctx.font = 'bold 11px PPLettraMono';
        this.ctx.fontWeight = '500'; // Medium
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Qualité', x + 10, y + 18);
        
        const itemHeight = (legendHeight - 35) / 5;
        
        for (let i = 0; i <= 4; i++) {
            const qualityLevel = 4 - i;
            const itemY = y + 30 + i * itemHeight;
            const color = PALETTE.QUALITY[qualityLevel].color;
            const label = PALETTE.QUALITY[qualityLevel].label;
            
            // Carré de couleur avec coins arrondis
            this.ctx.fillStyle = color;
            this.roundRect(x + 10, itemY, 28, itemHeight - 4, 3);
            this.ctx.fill();
            
            this.ctx.strokeStyle = ColorUtils.toRgba(PALETTE.UI.NATURE_DARK, 0.3);
            this.ctx.lineWidth = 1;
            this.roundRect(x + 10, itemY, 28, itemHeight - 4, 3);
            this.ctx.stroke();
            
            // Texte compact
            this.ctx.fillStyle = PALETTE.UI.NATURE_DARK;
            this.ctx.font = '9px PPLettraMono';
            this.ctx.fontWeight = '200'; // Ultralight
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`${qualityLevel}`, x + 42, itemY + (itemHeight - 4) / 2);
            this.ctx.fillText(label, x + 50, itemY + (itemHeight - 4) / 2);
        }
    },
    
    destroy() {
        if (this.canvas && this.canvas.parentElement) {
            this.canvas.parentElement.removeChild(this.canvas);
        }
        if (this.tooltipElement && this.tooltipElement.parentElement) {
            this.tooltipElement.parentElement.removeChild(this.tooltipElement);
        }
    }
};