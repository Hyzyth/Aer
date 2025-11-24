/**
 * exportPanel.js - Gestion de l'export des visualisations
 * 
 * CORRECTIONS:
 * - Légende pollens HORIZONTALE (en ligne) à droite
 * - Visualisation maximale dans la zone utile
 * - Code nettoyé (suppression références obsolètes)
 */

const ExportPanel = {
    // Cache pour les assets
    loadedAssets: {
        exportBackgrounds: {},
        radialImage: null
    },
    
    // Configurations d'export par mode
    EXPORT_CONFIGS: {
        radial: {
            width: 2480,
            height: 3508,
            background: 'export_radial.png',
            zones: {
                legendTop: {
                    leftMargin: 5,
                    usableWidth: 90,
                    rightMargin: 5,
                    height: 3,
                    contentStart: 97
                },
                legendRight: {
                    width: 4.65,
                    topMargin: 30,
                    usableHeight: 65,
                    bottomMargin: 5,
                    contentEnd: 95.35
                },
                legendBottom: {
                    leftMargin: 5,
                    usableWidth: 90,
                    rightMargin: 5,
                    height: 3.25,
                    contentEnd: 96.75
                },
                visual: {
                    topMargin: 35,
                    bottomMargin: 5,
                    leftMargin: 6,
                    rightMargin: 6,
                    usableHeight: 60,
                    usableWidth: 88
                }
            }
        },
        area: {
            width: 3508,
            height: 2480,
            background: 'export_stream.png',
            zones: {}
        },
        grid: {
            width: 3508,
            height: 2480,
            background: 'export_grid.png',
            zones: {}
        }
    },
    
    /**
     * Point d'entrée pour l'export
     */
    async exportVisualization() {
        console.log('[ExportPanel] 🎨 Démarrage de l\'export...');
        
        if (!AppState.selectedZone) {
            alert('Veuillez sélectionner une zone avant d\'exporter');
            return;
        }
        
        const activePollens = AppState.getActivePollens();
        if (activePollens.length === 0) {
            alert('Veuillez activer au moins un pollen dans les filtres avant d\'exporter');
            return;
        }
        
        const savedIndex = AppState.currentMeasureIndex;
        AppState.currentMeasureIndex = AppState.currentMeasures.length - 1;
        
        try {
            const config = this.EXPORT_CONFIGS[AppState.selectedMode];
            if (!config) {
                throw new Error(`Configuration d'export non définie pour le mode ${AppState.selectedMode}`);
            }
            
            console.log(`[ExportPanel] 📐 Configuration: ${config.width}x${config.height}px (${config.background})`);
            
            await this.loadExportAssets(AppState.selectedMode);
            
            const exportCanvas = document.createElement('canvas');
            exportCanvas.width = config.width;
            exportCanvas.height = config.height;
            const ctx = exportCanvas.getContext('2d');
            
            this.drawExportBackground(ctx, config);
            
            if (AppState.selectedMode === 'radial') {
                await this.exportRadial(ctx, config);
            } else if (AppState.selectedMode === 'area') {
                await this.exportArea(ctx, config);
            } else if (AppState.selectedMode === 'grid') {
                await this.exportGrid(ctx, config);
            }
            
            this.downloadImage(exportCanvas);
            
            console.log('[ExportPanel] ✅ Export terminé avec succès');
        } catch (error) {
            console.error('[ExportPanel] ❌ Erreur lors de l\'export:', error);
            alert('Erreur lors de l\'export. Consultez la console pour plus de détails.');
        } finally {
            AppState.currentMeasureIndex = savedIndex;
            AppState.notifyChange('timeline');
        }
    },
    
    /**
     * Charge les assets nécessaires pour l'export
     */
    async loadExportAssets(mode) {
        console.log('[ExportPanel] 📦 Chargement des assets d\'export...');
        
        const config = this.EXPORT_CONFIGS[mode];
        
        if (!this.loadedAssets.exportBackgrounds[mode]) {
            this.loadedAssets.exportBackgrounds[mode] = await this.loadImage(
                CONSTANTS.PATHS.BACKGROUNDS + config.background
            );
            console.log(`[ExportPanel] ✓ Background d'export chargé: ${config.background}`);
        }
        
        if (mode === 'radial') {
            const radialName = CONSTANTS.RADIAL.BACKGROUND_IMAGE;
            if (!this.loadedAssets.radialImage) {
                try {
                    this.loadedAssets.radialImage = await this.loadImage(
                        CONSTANTS.PATHS.BACKGROUNDS + radialName
                    );
                    console.log(`[ExportPanel] ✓ Image radiale chargée: ${radialName}`);
                } catch (e) {
                    console.warn(`[ExportPanel] ⚠️ Image radiale non disponible: ${radialName}`);
                }
            }
        }
    },
    
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load: ${src}`));
            img.src = src;
        });
    },
    
    drawExportBackground(ctx, config) {
        const bg = this.loadedAssets.exportBackgrounds[AppState.selectedMode];
        if (bg) {
            ctx.drawImage(bg, 0, 0, config.width, config.height);
            console.log('[ExportPanel] ✓ Background d\'export dessiné');
        } else {
            ctx.fillStyle = PALETTE.UI.NATURE_LIGHT;
            ctx.fillRect(0, 0, config.width, config.height);
            console.warn('[ExportPanel] ⚠️ Background d\'export non disponible, utilisation fallback');
        }
    },
    
    /**
     * Export mode RADIAL avec légendes
     */
    async exportRadial(ctx, config) {
        console.log('[ExportPanel] 🎯 Export mode RADIAL');
        
        this.drawRadialTopLegend(ctx, config);
        this.drawRadialRightLegendHorizontal(ctx, config); // MODIFIÉ: horizontale
        this.drawRadialBottomLegend(ctx, config);
        await this.drawRadialVisualizationMaximized(ctx, config); // MODIFIÉ: maximisée
        
        console.log('[ExportPanel] ✓ Export radial terminé');
    },
    
    /**
     * LÉGENDE HAUTE: "Pollens en mouvement" | "AIRBREZH" | zone
     */
    drawRadialTopLegend(ctx, config) {
        const legend = config.zones.legendTop;
        const x = (legend.leftMargin / 100) * config.width;
        const y = 0;
        const width = (legend.usableWidth / 100) * config.width;
        const height = (legend.height / 100) * config.height;
        
        ctx.font = '48px PPLettraMono';
        ctx.fontWeight = '500';
        ctx.fillStyle = PALETTE.UI.NATURE_DARK;
        ctx.textBaseline = 'middle';
        
        ctx.textAlign = 'left';
        ctx.fillText('Pollens en mouvement', x + 40, y + height / 2);
        
        ctx.textAlign = 'center';
        ctx.font = '42px PPLettraMono';
        ctx.fillText('AIRBREZH', x + width / 2, y + height / 2);
        
        ctx.textAlign = 'right';
        ctx.font = '36px PPLettraMono';
        ctx.fontWeight = '200';
        ctx.fillText(AppState.selectedZone || 'Zone', x + width - 40, y + height / 2);
        
        console.log('[ExportPanel] ✓ Légende haute dessinée');
    },
    
        /**
     * LÉGENDE DROITE HORIZONTALE: Liste des pollens EN LIGNE
     * Tournée à 90° vers la droite, lecture en tournant la tête
     */
    drawRadialRightLegendHorizontal(ctx, config) {
        const legend = config.zones.legendRight;
        const x = config.width - (legend.width / 100) * config.width;
        const yStart = (legend.topMargin / 100) * config.height;
        const height = (legend.usableHeight / 100) * config.height;
        const width = (legend.width / 100) * config.width;
        
        const activePollens = AppState.getActivePollens();
        
        ctx.save();
        
        // Se positionner au centre de la bande droite
        ctx.translate(x + width / 2, yStart + height / 2);
        
        // Rotation de 90° vers la DROITE
        ctx.rotate(Math.PI / 2);
        
        // Police
        ctx.font = '24px PPLettraMono';
        ctx.fontWeight = '200';
        ctx.textAlign = 'left';     // aligner le texte à gauche pour le placer après la puce
        ctx.textBaseline = 'middle';
        
        const totalWidth = height;
        const itemSpacing = totalWidth / (activePollens.length + 1);
        
        activePollens.forEach((pollen, index) => {
            const xPos = -totalWidth / 2 + (index + 1) * itemSpacing;
            const color = getPollenColor(pollen);
            
            const bulletSize = 20;
            const bulletOffsetX = -bulletSize / 2;
            
            // Puce colorée (20x20)
            ctx.fillStyle = color;
            ctx.fillRect(xPos + bulletOffsetX, -bulletSize / 2, bulletSize, bulletSize);
            
            // Texte à droite de la puce
            const textOffsetX = bulletSize / 2 + 10; // espace de 10px entre puce et texte
            
            ctx.fillStyle = PALETTE.UI.NATURE_DARK;
            ctx.fillText(pollen.toUpperCase(), xPos + textOffsetX, 0);
        });
        
        ctx.restore();
        
        console.log('[ExportPanel] ✓ Légende droite dessinée (horizontale, texte à côté des puces)');
    },

    
    /**
     * LÉGENDE BASSE: pollens actifs | année | généré par aer-date
     */
    drawRadialBottomLegend(ctx, config) {
        const legend = config.zones.legendBottom;
        const x = (legend.leftMargin / 100) * config.width;
        const y = config.height - (legend.height / 100) * config.height;
        const width = (legend.usableWidth / 100) * config.width;
        const height = (legend.height / 100) * config.height;
        
        ctx.font = '28px PPLettraMono';
        ctx.fontWeight = '200';
        ctx.fillStyle = PALETTE.UI.NATURE_DARK;
        ctx.textBaseline = 'middle';
        
        const activePollens = AppState.getActivePollens();
        const pollensText = activePollens.map(p => p.toUpperCase()).join(', ');
        
        ctx.textAlign = 'left';
        ctx.fillText(pollensText, x + 40, y + height / 2);
        
        ctx.textAlign = 'center';
        ctx.font = '32px PPLettraMono';
        ctx.fontWeight = '500';
        ctx.fillText(`Année ${AppState.selectedYear}`, x + width / 2, y + height / 2);
        
        ctx.textAlign = 'right';
        ctx.font = '24px PPLettraMono';
        ctx.fontWeight = '200';
        const date = new Date().toLocaleDateString('fr-FR');
        ctx.fillText(`Généré par Aer - ${date}`, x + width - 40, y + height / 2);
        
        console.log('[ExportPanel] ✓ Légende basse dessinée');
    },
    
    /**
     * Dessine la visualisation radiale MAXIMISÉE dans la zone utile
     */
    async drawRadialVisualizationMaximized(ctx, config) {
        const zones = config.zones.visual;
        
        const vizX = (zones.leftMargin / 100) * config.width;
        const vizY = (zones.topMargin / 100) * config.height;
        const vizWidth = (zones.usableWidth / 100) * config.width;
        const vizHeight = (zones.usableHeight / 100) * config.height;
        
        const centerX = vizX + vizWidth / 2;
        const centerY = vizY + vizHeight / 2;
        
        // Rayon MAXIMUM pour remplir l'espace
        const radius = Math.min(vizWidth, vizHeight) * 0.45; // 45% pour maximiser
        
        console.log(`[ExportPanel] 📐 Zone visualisation: ${Math.round(vizWidth)}x${Math.round(vizHeight)}px`);
        console.log(`[ExportPanel] 📐 Rayon visualisation: ${Math.round(radius)}px (maximisé)`);
        
        ctx.save();
        
        ctx.beginPath();
        ctx.rect(vizX, vizY, vizWidth, vizHeight);
        ctx.clip();
        
        if (this.loadedAssets.radialImage) {
            const imgSize = radius * 2.3;
            const imgX = centerX - imgSize / 2;
            const imgY = centerY - imgSize / 2;
            ctx.globalAlpha = 0.8;
            ctx.drawImage(this.loadedAssets.radialImage, imgX, imgY, imgSize, imgSize);
            ctx.globalAlpha = 1.0;
        } else {
            this.drawMonthSegments(ctx, centerX, centerY, radius);
        }
        
        const activePollens = AppState.getActivePollens();
        const measures = AppState.currentMeasures;
        
        activePollens.forEach((pollen, index) => {
            this.drawPollenRing(ctx, pollen, index, activePollens.length, measures, centerX, centerY, radius);
        });
        
        ctx.font = '36px PPLettraMono'; // Plus grand pour visibilité
        ctx.fontWeight = '200';
        this.drawMonthLabels(ctx, centerX, centerY, radius);
        
        ctx.restore();
        
        console.log('[ExportPanel] ✓ Visualisation radiale dessinée (maximisée)');
    },
    
    /**
     * Export mode AREA (à implémenter)
     */
    async exportArea(ctx, config) {
        console.log('[ExportPanel] 🌊 Export mode AREA (paysage)');
        console.warn('[ExportPanel] ⚠️ Zones pour mode AREA non définies');
    },
    
    /**
     * Export mode GRID (à implémenter)
     */
    async exportGrid(ctx, config) {
        console.log('[ExportPanel] 📊 Export mode GRID (paysage)');
        console.warn('[ExportPanel] ⚠️ Zones pour mode GRID non définies');
    },
    
    // === MÉTHODES AUXILIAIRES RADIAL ===
    
    drawMonthSegments(ctx, centerX, centerY, radius) {
        const innerRadius = radius * CONSTANTS.RADIAL.INNER_RADIUS_RATIO;
        const startAngle = CONSTANTS.RADIAL.START_ANGLE;
        const angleStep = (Math.PI * 2) / CONSTANTS.RADIAL.SEGMENTS;
        
        for (let i = 0; i < CONSTANTS.RADIAL.SEGMENTS; i++) {
            const angle1 = startAngle + angleStep * i;
            
            ctx.strokeStyle = ColorUtils.toRgba(PALETTE.UI.NATURE_DARK, 0.2);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(
                centerX + innerRadius * Math.cos(angle1),
                centerY + innerRadius * Math.sin(angle1)
            );
            ctx.lineTo(
                centerX + radius * Math.cos(angle1),
                centerY + radius * Math.sin(angle1)
            );
            ctx.stroke();
        }
        
        const steps = 8;
        for (let i = 0; i <= steps; i++) {
            const r = innerRadius + (radius - innerRadius) * (i / steps);
            ctx.strokeStyle = ColorUtils.toRgba(PALETTE.UI.NATURE_DARK, 0.08);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
            ctx.stroke();
        }
    },
    
    drawPollenRing(ctx, pollenName, ringIndex, totalRings, measures, centerX, centerY, radius) {
        const code = POLLEN_TO_CSV_CODE[pollenName];
        const color = getPollenColor(pollenName);
        
        const innerRadius = radius * CONSTANTS.RADIAL.INNER_RADIUS_RATIO;
        const ringSpace = (radius - innerRadius) / totalRings;
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
            
            const rad = ringInnerRadius + (ringOuterRadius - ringInnerRadius) * intensity;
            
            const x = centerX + rad * Math.cos(angle);
            const y = centerY + rad * Math.sin(angle);
            
            points.push({ x, y, angle });
        });
        
        if (points.length === 0) return;
        
        ctx.fillStyle = ColorUtils.toRgba(color, 0.4);
        ctx.strokeStyle = ColorUtils.toRgba(color, 0.8);
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        points.forEach((point, i) => {
            if (i === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        
        if (points.length > 0) {
            const lastAngle = points[points.length - 1].angle;
            const firstAngle = points[0].angle;
            ctx.arc(centerX, centerY, ringInnerRadius, lastAngle, firstAngle, true);
        }
        
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    },
    
    drawMonthLabels(ctx, centerX, centerY, radius) {
        const labelRadius = radius * 1.08;
        const startAngle = CONSTANTS.RADIAL.START_ANGLE;
        const angleStep = (Math.PI * 2) / CONSTANTS.RADIAL.SEGMENTS;
        
        ctx.fillStyle = PALETTE.UI.NATURE_DARK;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        for (let i = 0; i < CONSTANTS.RADIAL.SEGMENTS; i++) {
            const angle = startAngle + angleStep * (i + 0.5);
            const x = centerX + labelRadius * Math.cos(angle);
            const y = centerY + labelRadius * Math.sin(angle);
            
            ctx.save();
            ctx.translate(x, y);
            
            let textAngle = angle + Math.PI / 2;
            if (textAngle > Math.PI / 2 && textAngle < Math.PI * 1.5) {
                textAngle += Math.PI;
            }
            ctx.rotate(textAngle);
            
            ctx.fillText(CONSTANTS.MONTHS_SHORT[i], 0, 0);
            ctx.restore();
        }
    },
    
    /**
     * Télécharge l'image
     */
    downloadImage(canvas) {
        const timestamp = new Date().getTime();
        const modeName = AppState.selectedMode;
        const filename = `aer_export_${modeName}_${timestamp}.png`;
        
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            console.log(`[ExportPanel] ✓ Export sauvegardé: ${filename}`);
        }, 'image/png', 1.0);
    }
};