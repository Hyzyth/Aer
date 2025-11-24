/**
 * radialCalendar.js - Visualisation en flux calendaire radial
 * Affiche les données polliniques dans un format circulaire annuel
 * Utilise radial.png comme zone stylisée pour les mois
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
    radialImage: null, // Image du cercle des mois
    radialImageLoaded: false,
    
    /**
     * Initialise le canvas et les composants
     */
    initialize(container) {
        console.log('[RadialCalendar] Initialisation...');
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        container.appendChild(this.canvas);
        
        this.createTooltip(container);
        this.loadRadialImage();
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Événements de souris pour le tooltip
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => this.hideTooltip());
        
        this.animator = AnimationUtils.createAnimator(CONSTANTS.ANIMATION.TRANSITION_DURATION);
    },
    
    /**
     * Charge l'image du cercle des mois
     */
    loadRadialImage() {
        this.radialImage = new Image();
        this.radialImage.onload = () => {
            this.radialImageLoaded = true;
            console.log('[RadialCalendar] Image radiale chargée: radial.png');
        };
        this.radialImage.onerror = () => {
            console.warn('[RadialCalendar] Image radiale non trouvée: radial.png');
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
        
        // Calculer la position polaire de la souris
        const dx = mouseX - this.centerX;
        const dy = mouseY - this.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        let angle = Math.atan2(dy, dx);
        
        // Ajuster l'angle pour correspondre au système du calendrier
        angle = angle - CONSTANTS.RADIAL.START_ANGLE;
        if (angle < 0) angle += Math.PI * 2;
        
        const innerRadius = this.radius * CONSTANTS.RADIAL.INNER_RADIUS_RATIO;
        
        // Vérifier si la souris est dans la zone du calendrier
        if (distance >= innerRadius && distance <= this.radius) {
            const activePollens = AppState.getActivePollens();
            
            // Calculer l'anneau survolé
            const ringSpace = (this.radius - innerRadius) / activePollens.length;
            const ringIndex = Math.floor((distance - innerRadius) / ringSpace);
            
            if (ringIndex >= 0 && ringIndex < activePollens.length) {
                const pollen = activePollens[ringIndex];
                
                // Calculer la date correspondant à l'angle
                const yearProgress = angle / (Math.PI * 2);
                const measureIndex = Math.floor(yearProgress * AppState.currentMeasures.length);
                
                // Vérifier si cette mesure a déjà été affichée
                if (measureIndex > AppState.currentMeasureIndex) {
                    this.hideTooltip();
                    return;
                }
                
                if (measureIndex >= 0 && measureIndex < AppState.currentMeasures.length) {
                    const measure = AppState.currentMeasures[measureIndex];
                    const code = POLLEN_TO_CSV_CODE[pollen];
                    const value = measure[code] || 0;
                    
                    // Afficher le tooltip collé au curseur
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
     * Affiche le tooltip collé au curseur
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
     * Calcule le rayon optimal pour maximiser l'espace disponible
     */
    calculateOptimalRadius() {
        return Math.min(this.canvas.width, this.canvas.height) * 0.42;
    },
    
    /**
     * Dessine le graphique
     */
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Fond
        this.ctx.fillStyle = '#c8d4d0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!AppState.selectedZone || AppState.currentMeasures.length === 0) {
            this.drawPlaceholder();
            return;
        }
        
        this.currentProgress = AppState.currentMeasureIndex;
        this.radius = this.calculateOptimalRadius();
        
        // Dessiner l'image radiale si chargée (zone des mois)
        if (this.radialImageLoaded && this.radialImage) {
            this.drawRadialImage();
        } else {
            // Fallback: segments mensuels basiques
            this.drawMonthSegments();
        }
        
        // Dessiner les anneaux de pollens
        const activePollens = AppState.getActivePollens();
        const measuresUpTo = DataUtils.getMeasuresUpTo(
            AppState.currentMeasures,
            AppState.currentMeasureIndex
        );
        
        activePollens.forEach((pollen, index) => {
            this.drawPollenRing(pollen, index, activePollens.length, measuresUpTo);
        });
        
        // Dessiner les labels des mois PAR DESSUS l'image
        this.drawMonthLabels();
    },
    
    /**
     * Dessine l'image radiale (cercle stylisé des mois)
     */
    drawRadialImage() {
        const imgSize = this.radius * 2.3; // Taille de l'image
        const imgX = this.centerX - imgSize / 2;
        const imgY = this.centerY - imgSize / 2;
        
        this.ctx.save();
        this.ctx.globalAlpha = 0.8; // Légère transparence pour voir les données dessous
        this.ctx.drawImage(this.radialImage, imgX, imgY, imgSize, imgSize);
        this.ctx.restore();
    },
    
    drawPlaceholder() {
        this.ctx.fillStyle = PALETTE.UI.NATURE_DARK;
        this.ctx.font = '20px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Sélectionnez une zone sur la carte', this.centerX, this.centerY);
    },
    
    /**
     * Dessine les segments mensuels (fallback si pas d'image)
     */
    drawMonthSegments() {
        const innerRadius = this.radius * CONSTANTS.RADIAL.INNER_RADIUS_RATIO;
        const startAngle = CONSTANTS.RADIAL.START_ANGLE;
        const angleStep = (Math.PI * 2) / CONSTANTS.RADIAL.SEGMENTS;
        
        for (let i = 0; i < CONSTANTS.RADIAL.SEGMENTS; i++) {
            const angle1 = startAngle + angleStep * i;
            
            this.ctx.strokeStyle = ColorUtils.toRgba(PALETTE.UI.NATURE_DARK, 0.2);
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
            this.ctx.strokeStyle = ColorUtils.toRgba(PALETTE.UI.NATURE_DARK, 0.08);
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, r, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    },
    
    /**
     * Dessine un anneau de pollen avec toutes les mesures
     */
    drawPollenRing(pollenName, ringIndex, totalRings, measures) {
        const code = POLLEN_TO_CSV_CODE[pollenName];
        const color = getPollenColor(pollenName);
        
        // Calculer les rayons de l'anneau
        const innerRadius = this.radius * CONSTANTS.RADIAL.INNER_RADIUS_RATIO;
        const ringSpace = (this.radius - innerRadius) / totalRings;
        const ringInnerRadius = innerRadius + ringIndex * ringSpace;
        const ringOuterRadius = ringInnerRadius + ringSpace * 0.95;
        
        const startAngle = CONSTANTS.RADIAL.START_ANGLE;
        const yearStart = new Date(measures[0].date_ech);
        const yearEnd = new Date(yearStart.getFullYear(), 11, 31, 23, 59, 59);
        const yearDuration = yearEnd - yearStart;
        
        // Créer les points pour toutes les mesures
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
        
        // Dessiner l'aire
        this.ctx.fillStyle = ColorUtils.toRgba(color, 0.4);
        this.ctx.strokeStyle = ColorUtils.toRgba(color, 0.8);
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        
        // Tracer le contour extérieur
        points.forEach((point, i) => {
            if (i === 0) {
                this.ctx.moveTo(point.x, point.y);
            } else {
                this.ctx.lineTo(point.x, point.y);
            }
        });
        
        // Fermer en repassant par le rayon intérieur
        if (points.length > 0) {
            const lastAngle = points[points.length - 1].angle;
            const firstAngle = points[0].angle;
            
            this.ctx.arc(this.centerX, this.centerY, ringInnerRadius, lastAngle, firstAngle, true);
        }
        
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // Cercles de guidage (optionnel, légèrement visibles)
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
     * Dessine les labels des mois (PAR DESSUS l'image radiale)
     */
    drawMonthLabels() {
    const labelRadius = this.radius * 1.08;
    const startAngle = CONSTANTS.RADIAL.START_ANGLE;
    const angleStep = (Math.PI * 2) / CONSTANTS.RADIAL.SEGMENTS;
    
    this.ctx.fillStyle = PALETTE.UI.NATURE_DARK;
    this.ctx.font = '14px PPLettraMono';
    this.ctx.fontWeight = '200'; // Ultralight
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
        console.log('[RadialCalendar] Détruit');
    }
};