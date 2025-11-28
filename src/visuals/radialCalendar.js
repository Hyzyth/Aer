/**
 * radialCalendar.js - Visualisation en flux calendaire radial
 * Version avec nouvelle palette
 */

const RadialCalendar = {
    canvas: null,
    ctx: null,
    centerX: 0,
    centerY: 0,
    radius: 0,
    animator: null,
    tooltipElement: null,
    currentProgress: 0,
    radialImage: null,
    radialImageLoaded: false,
    
    /**
     * Initialise le canvas
     */
    initialize(container) {
        console.log('[RadialCalendar] 🎯 Initialisation...');
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        container.appendChild(this.canvas);
        
        this.createTooltip(container);
        this.loadRadialImage();
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => this.hideTooltip());
        
        this.animator = AnimationUtils.createAnimator(CONSTANTS.ANIMATION.TRANSITION_DURATION);
        console.log('[RadialCalendar] ✓ Initialisé');
    },
    
    /**
     * Charge l'image radiale
     */
    loadRadialImage() {
        this.radialImage = new Image();
        this.radialImage.onload = () => {
            this.radialImageLoaded = true;
            console.log('[RadialCalendar] ✓ Image radiale chargée');
        };
        this.radialImage.onerror = () => {
            console.warn('[RadialCalendar] ⚠️ Image radiale non trouvée');
            this.radialImageLoaded = false;
        };
        this.radialImage.src = CONSTANTS.PATHS.BACKGROUNDS + CONSTANTS.RADIAL.BACKGROUND_IMAGE;
    },
    
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.radius = this.calculateOptimalRadius();
    },
    
    createTooltip(container) {
        this.tooltipElement = document.createElement('div');
        this.tooltipElement.className = 'viz-tooltip';
        container.appendChild(this.tooltipElement);
    },
    
    /**
     * Gère le survol de la souris
     */
    handleMouseMove(e) {
        if (!AppState.selectedZone || AppState.currentMeasures.length === 0) {
            this.hideTooltip();
            return;
        }
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const dx = mouseX - this.centerX;
        const dy = mouseY - this.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        let angle = Math.atan2(dy, dx);
        
        angle = angle - CONSTANTS.RADIAL.START_ANGLE;
        if (angle < 0) angle += Math.PI * 2;
        
        const innerRadius = this.radius * CONSTANTS.RADIAL.INNER_RADIUS_RATIO;
        
        if (distance >= innerRadius && distance <= this.radius) {
            const activePollens = AppState.getActivePollens();
            const ringSpace = (this.radius - innerRadius) / activePollens.length;
            const ringIndex = Math.floor((distance - innerRadius) / ringSpace);
            
            if (ringIndex >= 0 && ringIndex < activePollens.length) {
                const pollen = activePollens[ringIndex];
                const yearProgress = angle / (Math.PI * 2);
                const measureIndex = Math.floor(yearProgress * AppState.currentMeasures.length);
                
                if (measureIndex > AppState.currentMeasureIndex) {
                    this.hideTooltip();
                    return;
                }
                
                if (measureIndex >= 0 && measureIndex < AppState.currentMeasures.length) {
                    const measure = AppState.currentMeasures[measureIndex];
                    const code = POLLEN_TO_CSV_CODE[pollen];
                    const value = measure[code] || 0;
                    
                    this.showTooltip(e.clientX, e.clientY, {
                        date: DataUtils.formatDate(measure.date_ech, 'full'),
                        pollen: pollen,
                        value: value,
                        fictional: measure.fictional || false
                    });
                } else {
                    this.hideTooltip();
                }
            } else {
                this.hideTooltip();
            }
        } else {
            this.hideTooltip();
        }
    },
    
    /**
     * Affiche le tooltip
     */
    showTooltip(x, y, data) {
        let html = `<div class="viz-tooltip-title">${data.date}</div>`;
        
        const color = getPollenColor(data.pollen);
        html += `<div class="viz-tooltip-row">
            <span style="display:inline-block; width:10px; height:10px; background:${color}; border-radius:50%; margin-right:5px;"></span>
            ${data.pollen.toUpperCase()}: ${data.value.toFixed(1)}
        </div>`;
        
        if (data.fictional) {
            html += `<div class="viz-tooltip-row" style="color: #999;">No Data</div>`;
        }
        
        this.tooltipElement.innerHTML = html;
        this.tooltipElement.classList.add('visible');
        this.tooltipElement.style.left = x + 'px';
        this.tooltipElement.style.top = y + 'px';
    },
    
    hideTooltip() {
        if (this.tooltipElement) {
            this.tooltipElement.classList.remove('visible');
        }
    },
    
    /**
     * Calcule le rayon optimal pour maximiser l'espace
     */
    calculateOptimalRadius() {
        // Utiliser la hauteur disponible complète
        const availableHeight = this.canvas.height;
        const availableWidth = this.canvas.width;
        
        // Prendre en compte l'espace pour les labels (8% de marge)
        return Math.min(availableWidth, availableHeight) * 0.42;
    },
    
    /**
     * Dessine le graphique
     */
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Fond
        this.ctx.fillStyle = PALETTE.UI.BG_COLOR;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!AppState.selectedZone || AppState.currentMeasures.length === 0) {
            this.drawPlaceholder();
            return;
        }
        
        this.currentProgress = AppState.currentMeasureIndex;
        this.radius = this.calculateOptimalRadius();
        
        // Image radiale
        if (this.radialImageLoaded && this.radialImage) {
            this.drawRadialImage();
        } else {
            this.drawMonthSegments();
        }
        
        // Anneaux de pollens
        const activePollens = AppState.getActivePollens();
        const measuresUpTo = DataUtils.getMeasuresUpTo(
            AppState.currentMeasures,
            AppState.currentMeasureIndex
        );
        
        activePollens.forEach((pollen, index) => {
            this.drawPollenRing(pollen, index, activePollens.length, measuresUpTo);
        });
        
        // Labels des mois
        this.drawMonthLabels();
    },
    
    /**
     * Dessine l'image radiale
     */
    drawRadialImage() {
        const imgSize = this.radius * 2.3;
        const imgX = this.centerX - imgSize / 2;
        const imgY = this.centerY - imgSize / 2;
        
        this.ctx.save();
        this.ctx.globalAlpha = 0.8;
        this.ctx.drawImage(this.radialImage, imgX, imgY, imgSize, imgSize);
        this.ctx.restore();
    },
    
    drawPlaceholder() {
        this.ctx.fillStyle = PALETTE.UI.TEXT_COLOR;
        this.ctx.font = '20px PPLettraMono';
        this.ctx.fontWeight = '200';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Sélectionnez une zone sur la carte', this.centerX, this.centerY);
    },
    
    /**
     * Dessine les segments mensuels (fallback)
     */
    drawMonthSegments() {
        const innerRadius = this.radius * CONSTANTS.RADIAL.INNER_RADIUS_RATIO;
        const startAngle = CONSTANTS.RADIAL.START_ANGLE;
        const angleStep = (Math.PI * 2) / CONSTANTS.RADIAL.SEGMENTS;
        
        for (let i = 0; i < CONSTANTS.RADIAL.SEGMENTS; i++) {
            const angle1 = startAngle + angleStep * i;
            
            this.ctx.strokeStyle = ColorUtils.toRgba(PALETTE.UI.TEXT_COLOR, 0.2);
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(
                this.centerX + innerRadius * Math.cos(angle1),
                this.centerY + innerRadius * Math.sin(angle1)
            );
            this.ctx.lineTo(
                this.centerX + this.radius * Math.cos(angle1),
                this.centerY + this.radius * Math.sin(angle1)
            );
            this.ctx.stroke();
        }
        
        const steps = 8;
        for (let i = 0; i <= steps; i++) {
            const r = innerRadius + (this.radius - innerRadius) * (i / steps);
            this.ctx.strokeStyle = ColorUtils.toRgba(PALETTE.UI.TEXT_COLOR, 0.08);
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, r, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    },
    
    /**
     * Dessine un anneau de pollen
     */
    drawPollenRing(pollenName, ringIndex, totalRings, measures) {
        const code = POLLEN_TO_CSV_CODE[pollenName];
        const color = getPollenColor(pollenName);
        
        const innerRadius = this.radius * CONSTANTS.RADIAL.INNER_RADIUS_RATIO;
        const ringSpace = (this.radius - innerRadius) / totalRings;
        const ringInnerRadius = innerRadius + ringIndex * ringSpace;
        const ringOuterRadius = ringInnerRadius + ringSpace * 0.95;
        
        const startAngle = CONSTANTS.RADIAL.START_ANGLE;
        const yearStart = new Date(measures[0].date_ech);
        const yearEnd = new Date(yearStart.getFullYear(), 11, 31, 23, 59, 59);
        const yearDuration = yearEnd - yearStart;
        
        const points = [];
        measures.forEach((measure) => {
            const date = new Date(measure.date_ech);
            const timeElapsed = date - yearStart;
            const yearProgress = timeElapsed / yearDuration;
            
            const angle = startAngle + yearProgress * Math.PI * 2;
            
            const value = measure[code] || 0;
            const intensity = value / CONSTANTS.DATA.CODE_QUAL_MAX;
            
            const radius = ringInnerRadius + (ringOuterRadius - ringInnerRadius) * intensity;
            
            const x = this.centerX + radius * Math.cos(angle);
            const y = this.centerY + radius * Math.sin(angle);
            
            points.push({ x, y, angle, radius, intensity });
        });
        
        if (points.length === 0) return;
        
        this.ctx.fillStyle = ColorUtils.toRgba(color, 0.4);
        this.ctx.strokeStyle = ColorUtils.toRgba(color, 0.8);
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        // Tracer le bord supérieur
        for (let i = 0; i < points.length; i++) {
            if (i === 0) {
                this.ctx.moveTo(points[i].x, points[i].y);
            } else {
                this.ctx.lineTo(points[i].x, points[i].y);
            }
        }
        
        // Tracer le bord inférieur
        if (points.length > 0) {
            const lastAngle = points[points.length - 1].angle;
            const firstAngle = points[0].angle;
            this.ctx.arc(this.centerX, this.centerY, ringInnerRadius, lastAngle, firstAngle, true);
        }
        
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // Cercles de guidage
        this.ctx.strokeStyle = ColorUtils.toRgba(color, 0.15);
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([3, 3]);
        
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, ringInnerRadius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, ringOuterRadius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
    },
    
    /**
     * Dessine les labels des mois
     */
    drawMonthLabels() {
        const labelRadius = this.radius * 1.08;
        const startAngle = CONSTANTS.RADIAL.START_ANGLE;
        const angleStep = (Math.PI * 2) / CONSTANTS.RADIAL.SEGMENTS;
        
        this.ctx.fillStyle = PALETTE.UI.TEXT_COLOR;
        this.ctx.font = '14px PPLettraMono';
        this.ctx.fontWeight = '200';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        for (let i = 0; i < CONSTANTS.RADIAL.SEGMENTS; i++) {
            const angle = startAngle + angleStep * (i + 0.5);
            const x = this.centerX + labelRadius * Math.cos(angle);
            const y = this.centerY + labelRadius * Math.sin(angle);
            
            this.ctx.save();
            this.ctx.translate(x, y);
            
            let textAngle = angle + Math.PI / 2;
            if (textAngle > Math.PI / 2 && textAngle < Math.PI * 1.5) {
                textAngle += Math.PI;
            }
            this.ctx.rotate(textAngle);
            
            this.ctx.fillText(CONSTANTS.MONTHS_SHORT[i], 0, 0);
            this.ctx.restore();
        }
    },
    
    destroy() {
        if (this.canvas && this.canvas.parentElement) {
            this.canvas.parentElement.removeChild(this.canvas);
        }
        if (this.tooltipElement && this.tooltipElement.parentElement) {
            this.tooltipElement.parentElement.removeChild(this.tooltipElement);
        }
        console.log('[RadialCalendar] 🗑️ Détruit');
    }
};