/**
 * areaGraph.js - Visualisation en stream graph avec lissage adaptatif
 * Animation progressive de gauche à droite, point par point
 * Lissage par moyenne mobile pour améliorer la lisibilité
 */

const AreaGraph = {
    canvas: null,
    ctx: null,
    tooltipElement: null,
    cursorX: null,
    hoveredPollenIndex: null,
    smoothedData: null, // Données lissées pour l'affichage
    
    /**
     * Initialise le canvas et les composants
     */
    initialize(container) {
        console.log('[AreaGraph] Initialisation...');
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        container.appendChild(this.canvas);
        
        this.createTooltip(container);
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Événements de souris
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
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
     * Lisse les données avec une moyenne mobile
     * @param {Array} measures - Mesures brutes
     * @param {Array} activePollens - Pollens actifs
     * @returns {Array} Mesures lissées
     */
    smoothData(measures, activePollens) {
        const windowSize = CONSTANTS.AREA.SMOOTHING_WINDOW;
        const halfWindow = Math.floor(windowSize / 2);
        const smoothed = [];
        
        for (let i = 0; i < measures.length; i++) {
            const smoothedMeasure = {
                ...measures[i],
                smoothed: true
            };
            
            // Pour chaque pollen, calculer la moyenne mobile
            activePollens.forEach(pollen => {
                const code = POLLEN_TO_CSV_CODE[pollen];
                const start = Math.max(0, i - halfWindow);
                const end = Math.min(measures.length, i + halfWindow + 1);
                
                let sum = 0;
                let count = 0;
                
                for (let j = start; j < end; j++) {
                    if (!measures[j].fictional) {
                        sum += measures[j][code] || 0;
                        count++;
                    }
                }
                
                smoothedMeasure[code] = count > 0 ? sum / count : 0;
            });
            
            smoothed.push(smoothedMeasure);
        }
        
        return smoothed;
    },
    
    /**
     * Gère le survol de la souris - tooltip collé au curseur
     */
    handleMouseMove(e) {
        if (!AppState.selectedZone || AppState.currentMeasures.length === 0) {
            this.hideTooltip();
            this.cursorX = null;
            this.hoveredPollenIndex = null;
            return;
        }
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const padding = 40;
        const labelSpace = 150;
        const chartWidth = this.canvas.width - padding * 2 - labelSpace;
        const chartHeight = this.canvas.height - padding * 2;
        
        // Calculer l'index de mesure correspondant au curseur
        const relativeX = mouseX - padding;
        const totalMeasures = AppState.currentMeasures.length;
        const measureIndexAtCursor = Math.floor((relativeX / chartWidth) * totalMeasures);
        
        // Vérifier si le curseur est dans une zone avec des données
        if (measureIndexAtCursor < 0 || 
            measureIndexAtCursor > AppState.currentMeasureIndex ||
            mouseX < padding || 
            mouseX > padding + chartWidth ||
            mouseY < padding || 
            mouseY > padding + chartHeight) {
            
            this.hideTooltip();
            this.cursorX = null;
            this.hoveredPollenIndex = null;
            return;
        }
        
        // Zone valide avec des données
        this.cursorX = mouseX;
        
        const measure = this.smoothedData ? 
            this.smoothedData[measureIndexAtCursor] : 
            AppState.currentMeasures[measureIndexAtCursor];
        const activePollens = AppState.getActivePollens();
        
        // Déterminer quel pollen est survolé
        this.hoveredPollenIndex = this.getHoveredPollenIndex(mouseY, activePollens, measureIndexAtCursor);
        
        // Collecter les valeurs
        const pollenValues = {};
        activePollens.forEach(pollen => {
            const code = POLLEN_TO_CSV_CODE[pollen];
            pollenValues[pollen] = measure[code] || 0;
        });
        
        // Tooltip collé au curseur
        this.showTooltip(e.clientX, e.clientY, {
            date: DataUtils.formatDate(measure.date_ech, 'full'),
            pollens: pollenValues,
            fictional: measure.fictional || false,
            smoothed: measure.smoothed || false
        });
    },
    
    /**
     * Détermine quel pollen est survolé selon la position Y du curseur
     */
    getHoveredPollenIndex(mouseY, activePollens, measureIndex) {
        const padding = 40;
        const chartHeight = this.canvas.height - padding * 2;
        const centerY = padding + chartHeight / 2;
        
        const stackedValues = this.getStackedValues(activePollens, measureIndex);
        
        for (let i = 0; i < activePollens.length; i++) {
            const startY = centerY + (stackedValues[i].start / CONSTANTS.DATA.CODE_QUAL_MAX) * (chartHeight / 3);
            const endY = centerY + (stackedValues[i].end / CONSTANTS.DATA.CODE_QUAL_MAX) * (chartHeight / 3);
            
            if (mouseY >= Math.min(startY, endY) && mouseY <= Math.max(startY, endY)) {
                return i;
            }
        }
        
        return null;
    },
    
    /**
     * Obtient les valeurs empilées pour un index de mesure donné
     */
    getStackedValues(activePollens, measureIndex) {
        const measures = this.smoothedData || AppState.currentMeasures;
        const measure = measures[measureIndex];
        const values = [];
        
        let total = 0;
        activePollens.forEach(pollen => {
            const code = POLLEN_TO_CSV_CODE[pollen];
            const value = measure[code] || 0;
            total += value;
        });
        
        let cumulative = -total / 2;
        activePollens.forEach(pollen => {
            const code = POLLEN_TO_CSV_CODE[pollen];
            const value = measure[code] || 0;
            values.push({
                pollen,
                start: cumulative,
                end: cumulative + value
            });
            cumulative += value;
        });
        
        return values;
    },
    
    handleMouseLeave() {
        this.hideTooltip();
        this.cursorX = null;
        this.hoveredPollenIndex = null;
    },
    
    /**
     * Affiche le tooltip collé au curseur
     */
    showTooltip(x, y, data) {
        let html = `<div class="viz-tooltip-title" style="font-family: PPLettraMono; font-weight: 500;">${data.date}</div>`;
        
        if (data.smoothed) {
            html += `<div class="viz-tooltip-row" style="color: #aaa; font-size: 10px; font-family: PPLettraMono; font-weight: 200;">(lissé)</div>`;
        }
        
        if (data.fictional) {
            html += `<div class="viz-tooltip-row" style="color: #999; font-family: PPLettraMono; font-weight: 200;">No Data</div>`;
        } else {
            Object.keys(data.pollens).forEach(pollen => {
                const value = data.pollens[pollen];
                const color = getPollenColor(pollen);
                html += `<div class="viz-tooltip-row" style="font-family: PPLettraMono; font-weight: 200;">
                    <span style="display:inline-block; width:10px; height:10px; background:${color}; border-radius:50%; margin-right:5px;"></span>
                    ${pollen.toUpperCase()}: ${value.toFixed(1)}
                </div>`;
            });
        }
        
        this.tooltipElement.innerHTML = html;
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
     * Dessine le graphique
     */
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Fond
        this.ctx.fillStyle = '#d0dcd8';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!AppState.selectedZone || AppState.currentMeasures.length === 0) {
            this.drawPlaceholder();
            return;
        }
        
        const activePollens = AppState.getActivePollens();
        if (activePollens.length === 0) {
            this.drawPlaceholder();
            return;
        }
        
        // Lisser les données
        this.smoothedData = this.smoothData(AppState.currentMeasures, activePollens);
        
        // Dessiner le stream graph
        this.drawStreamGraph(activePollens);
        
        // Dessiner la barre verticale du curseur
        if (this.cursorX !== null) {
            this.drawCursorBar();
        }
    },
    
    drawPlaceholder() {
        this.ctx.fillStyle = PALETTE.UI.NATURE_DARK;
        this.ctx.font = '20px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Sélectionnez une zone sur la carte', this.canvas.width / 2, this.canvas.height / 2);
    },
    
    /**
     * Dessine le stream graph progressivement avec données lissées
     */
    drawStreamGraph(activePollens) {
        const padding = 40;
        const labelSpace = 150;
        const chartWidth = this.canvas.width - padding * 2 - labelSpace;
        const chartHeight = this.canvas.height - padding * 2;
        const centerY = padding + chartHeight / 2;
        
        const totalMeasures = AppState.currentMeasures.length;
        const currentIndex = AppState.currentMeasureIndex;
        
        if (currentIndex < 1) return;
        
        // Utiliser les données lissées
        const measures = this.smoothedData.slice(0, currentIndex + 1);
        
        // Calculer les valeurs empilées
        const stackedData = [];
        for (let i = 0; i < measures.length; i++) {
            const measure = measures[i];
            
            let total = 0;
            activePollens.forEach(pollen => {
                const code = POLLEN_TO_CSV_CODE[pollen];
                const value = measure[code] || 0;
                total += value;
            });
            
            stackedData[i] = { total, pollens: [] };
            
            let cumulative = -total / 2;
            activePollens.forEach(pollen => {
                const code = POLLEN_TO_CSV_CODE[pollen];
                const value = measure[code] || 0;
                stackedData[i].pollens.push({
                    pollen,
                    start: cumulative,
                    end: cumulative + value
                });
                cumulative += value;
            });
        }
        
        const dataLength = stackedData.length;
        
        // Dessiner chaque flux de pollen
        activePollens.forEach((pollen, pollenIndex) => {
            const color = getPollenColor(pollen);
            
            // Opacité selon si survolé
            let fillOpacity, strokeOpacity;
            if (this.hoveredPollenIndex === null) {
                fillOpacity = 0.7;
                strokeOpacity = 0.9;
            } else if (this.hoveredPollenIndex === pollenIndex) {
                fillOpacity = 0.9;
                strokeOpacity = 1.0;
            } else {
                fillOpacity = 0.2;
                strokeOpacity = 0.3;
            }
            
            this.ctx.fillStyle = ColorUtils.toRgba(color, fillOpacity);
            this.ctx.strokeStyle = ColorUtils.toRgba(color, strokeOpacity);
            this.ctx.lineWidth = this.hoveredPollenIndex === pollenIndex ? 2.5 : 1.5;
            
            this.ctx.beginPath();
            
            // Tracer le bord supérieur
            for (let i = 0; i < dataLength; i++) {
                const x = padding + (i / (totalMeasures - 1)) * chartWidth;
                const yOffset = stackedData[i].pollens[pollenIndex].end;
                const y = centerY + (yOffset / CONSTANTS.DATA.CODE_QUAL_MAX) * (chartHeight / 3);
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            
            // Tracer le bord inférieur (en sens inverse)
            for (let i = dataLength - 1; i >= 0; i--) {
                const x = padding + (i / (totalMeasures - 1)) * chartWidth;
                const yOffset = stackedData[i].pollens[pollenIndex].start;
                const y = centerY + (yOffset / CONSTANTS.DATA.CODE_QUAL_MAX) * (chartHeight / 3);
                this.ctx.lineTo(x, y);
            }
            
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
        });
        
        // Dessiner les labels qui suivent le graphique
        const currentRightEdge = padding + (currentIndex / (totalMeasures - 1)) * chartWidth;
        this.drawPollenLabels(activePollens, stackedData[dataLength - 1], centerY, chartHeight, currentRightEdge);
    },
    
    /**
     * Dessine les labels des pollens
     */
    drawPollenLabels(activePollens, lastStack, centerY, chartHeight, rightEdge) {
        const x = rightEdge + 15;
        const minLabelSpacing = 40;
        
        this.ctx.font = 'bold 12px PPLettraMono';
        this.ctx.fontWeight = '500'; // Medium
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';

        
        const idealPositions = activePollens.map((pollen, index) => {
            const pollenData = lastStack.pollens[index];
            const yOffset = (pollenData.start + pollenData.end) / 2;
            return centerY + (yOffset / CONSTANTS.DATA.CODE_QUAL_MAX) * (chartHeight / 3);
        });
        
        const adjustedPositions = this.adjustLabelPositions(idealPositions, minLabelSpacing);
        
        activePollens.forEach((pollen, index) => {
            const y = adjustedPositions[index];
            const color = getPollenColor(pollen);
            
            let opacity = 1.0;
            if (this.hoveredPollenIndex !== null && this.hoveredPollenIndex !== index) {
                opacity = 0.3;
            }
            
            const idealY = idealPositions[index];
            if (Math.abs(y - idealY) > 2) {
                this.ctx.strokeStyle = ColorUtils.toRgba(color, opacity * 0.3);
                this.ctx.lineWidth = 1;
                this.ctx.setLineDash([2, 2]);
                this.ctx.beginPath();
                this.ctx.moveTo(rightEdge, idealY);
                this.ctx.lineTo(x - 5, y);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
            
            this.ctx.fillStyle = ColorUtils.toRgba(color, opacity);
            this.ctx.beginPath();
            this.ctx.arc(x - 5, y, 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = ColorUtils.toRgba(PALETTE.UI.NATURE_DARK, opacity);
            this.ctx.fillText(pollen.toUpperCase(), x + 5, y);
        });
    },
    
    /**
     * Ajuste les positions des labels
     */
    adjustLabelPositions(positions, minSpacing) {
        const adjusted = [...positions];
        const iterations = 50;
        
        for (let iter = 0; iter < iterations; iter++) {
            let hasOverlap = false;
            
            for (let i = 0; i < adjusted.length; i++) {
                for (let j = i + 1; j < adjusted.length; j++) {
                    const distance = Math.abs(adjusted[j] - adjusted[i]);
                    
                    if (distance < minSpacing) {
                        hasOverlap = true;
                        const overlap = minSpacing - distance;
                        const push = overlap / 2;
                        
                        if (adjusted[i] < adjusted[j]) {
                            adjusted[i] -= push * 0.5;
                            adjusted[j] += push * 0.5;
                        } else {
                            adjusted[i] += push * 0.5;
                            adjusted[j] -= push * 0.5;
                        }
                    }
                }
                
                const ideal = positions[i];
                const pull = (ideal - adjusted[i]) * 0.1;
                adjusted[i] += pull;
            }
            
            if (!hasOverlap) break;
        }
        
        return adjusted;
    },
    
    /**
     * Dessine la barre verticale du curseur
     */
    drawCursorBar() {
        const padding = 40;
        const chartHeight = this.canvas.height - padding * 2;
        
        const bandWidth = 6;
        this.ctx.fillStyle = ColorUtils.toRgba(PALETTE.UI.NATURE_DARK, 0.1);
        this.ctx.fillRect(
            this.cursorX - bandWidth / 2,
            padding,
            bandWidth,
            chartHeight
        );
        
        this.ctx.strokeStyle = ColorUtils.toRgba(PALETTE.UI.NATURE_DARK, 0.6);
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.cursorX, padding);
        this.ctx.lineTo(this.cursorX, padding + chartHeight);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    },
    
    destroy() {
        if (this.canvas && this.canvas.parentElement) {
            this.canvas.parentElement.removeChild(this.canvas);
        }
        if (this.tooltipElement && this.tooltipElement.parentElement) {
            this.tooltipElement.parentElement.removeChild(this.tooltipElement);
        }
        console.log('[AreaGraph] Détruit');
    }
};