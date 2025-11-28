/**
 * exportPanel.js - Gestion de l'export des visualisations
 * Version avec nouvelle palette
 */

const ExportPanel = {
    loadedAssets: {
        exportBackgrounds: {},
        radialImage: null,
        gridMonthsImage: null,
        gridPollenImage: null
    },
    
    EXPORT_CONFIGS: {
        radial: {
            width: 2480,
            height: 3508,
            background: 'export_radial.png',
            zones: {
                legendTop: {
                    leftMargin: 5,
                    usableWidth: 90,
                    height: 3,
                    contentStart: 97
                },
                legendRight: {
                    width: 4.65,
                    topMargin: 30,
                    usableHeight: 65,
                    contentEnd: 95.35
                },
                legendBottom: {
                    leftMargin: 5,
                    usableWidth: 90,
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
            zones: {
                legendTop: {
                    leftMargin: 3.5,
                    rightMargin: 34,
                    height: 4.5,
                    usableWidth: 62.5,
                    contentStart: 3.5
                },
                legendBottom: {
                    leftMargin: 3.5,
                    rightMargin: 3.5,
                    topMargin: 95,
                    height: 4.5,
                    usableWidth: 93
                },
                visual: {
                    leftMargin: 3.3,
                    rightMargin: 3.3,
                    topMargin: 38.3,
                    bottomMargin: 6.8,
                    usableWidth: 93.4,
                    usableHeight: 54.9
                }
            }
        }
    },
    
    /**
     * Export principal
     */
    async exportVisualization() {
        console.log('[ExportPanel] 📥 Démarrage export...');
        
        if (!AppState.selectedZone) {
            alert('Veuillez sélectionner une zone avant d\'exporter');
            return;
        }
        
        const activePollens = AppState.getActivePollens();
        if (activePollens.length === 0) {
            alert('Veuillez activer au moins un pollen');
            return;
        }
        
        const savedIndex = AppState.currentMeasureIndex;
        AppState.currentMeasureIndex = AppState.currentMeasures.length - 1;
        
        try {
            const config = this.EXPORT_CONFIGS[AppState.selectedMode];
            if (!config) {
                throw new Error(`Configuration non définie: ${AppState.selectedMode}`);
            }
            
            console.log(`[ExportPanel] 📐 ${config.width}x${config.height}px`);
            
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
            
            console.log('[ExportPanel] ✓ Export terminé');
        } catch (error) {
            console.error('[ExportPanel] ❌ Erreur:', error);
            alert('Erreur lors de l\'export');
        } finally {
            AppState.currentMeasureIndex = savedIndex;
            AppState.notifyChange('timeline');
        }
    },
    
    /**
     * Charge les assets d'export
     */
    async loadExportAssets(mode) {
        console.log('[ExportPanel] 📦 Chargement assets...');
        
        const config = this.EXPORT_CONFIGS[mode];
        
        if (!this.loadedAssets.exportBackgrounds[mode]) {
            this.loadedAssets.exportBackgrounds[mode] = await this.loadImage(
                CONSTANTS.PATHS.BACKGROUNDS + config.background
            );
            console.log(`[ExportPanel] ✓ ${config.background}`);
        }
        
        if (mode === 'radial') {
            if (!this.loadedAssets.radialImage) {
                try {
                    this.loadedAssets.radialImage = await this.loadImage(
                        CONSTANTS.PATHS.BACKGROUNDS + CONSTANTS.RADIAL.BACKGROUND_IMAGE
                    );
                    console.log('[ExportPanel] ✓ radial.png');
                } catch (e) {
                    console.warn('[ExportPanel] ⚠️ radial.png manquant');
                }
            }
        }
        
        if (mode === 'grid') {
            if (!this.loadedAssets.gridMonthsImage) {
                this.loadedAssets.gridMonthsImage = await this.loadImage(
                    CONSTANTS.PATHS.BACKGROUNDS + CONSTANTS.GRID_MONTHS.image
                );
                console.log('[ExportPanel] ✓ grid_months.png');
            }
            
            if (!this.loadedAssets.gridPollenImage) {
                this.loadedAssets.gridPollenImage = await this.loadImage(
                    CONSTANTS.PATHS.BACKGROUNDS + CONSTANTS.GRID_POLLEN.image
                );
                console.log('[ExportPanel] ✓ grid_pollen.png');
            }
        }
    },
    
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed: ${src}`));
            img.src = src;
        });
    },
    
    drawExportBackground(ctx, config) {
        const bg = this.loadedAssets.exportBackgrounds[AppState.selectedMode];
        if (bg) {
            ctx.drawImage(bg, 0, 0, config.width, config.height);
        } else {
            ctx.fillStyle = PALETTE.UI.BG_COLOR;
            ctx.fillRect(0, 0, config.width, config.height);
        }
    },
    
    /**
     * Export RADIAL
     */
    async exportRadial(ctx, config) {
        console.log('[ExportPanel] 🎯 Export RADIAL');
        
        this.drawRadialTopLegend(ctx, config);
        this.drawRadialRightLegendHorizontal(ctx, config);
        this.drawRadialBottomLegend(ctx, config);
        await this.drawRadialVisualizationMaximized(ctx, config);
    },
    
    drawRadialTopLegend(ctx, config) {
        const legend = config.zones.legendTop;
        const x = (legend.leftMargin / 100) * config.width;
        const y = 0;
        const width = (legend.usableWidth / 100) * config.width;
        const height = (legend.height / 100) * config.height;
        
        ctx.font = '500 48px PPLettraMono';
        ctx.fillStyle = PALETTE.UI.TEXT_COLOR;
        ctx.textBaseline = 'middle';
        
        ctx.textAlign = 'left';
        ctx.fillText('Pollens en mouvement', x + 40, y + height / 2);
        
        ctx.textAlign = 'center';
        ctx.font = '500 42px PPLettraMono';
        ctx.fillText('AIRBREZH', x + width / 2, y + height / 2);
        
        ctx.textAlign = 'right';
        ctx.font = '200 36px PPLettraMono';
        ctx.fillText(AppState.selectedZone || 'Zone', x + width - 40, y + height / 2);
    },
    
    drawRadialRightLegendHorizontal(ctx, config) {
        const legend = config.zones.legendRight;
        const x = config.width - (legend.width / 100) * config.width;
        const yStart = (legend.topMargin / 100) * config.height;
        const height = (legend.usableHeight / 100) * config.height;
        const width = (legend.width / 100) * config.width;
        
        const activePollens = AppState.getActivePollens();
        
        ctx.save();
        ctx.translate(x + width / 2, yStart + height / 2);
        ctx.rotate(Math.PI / 2);
        
        ctx.font = '200 24px PPLettraMono';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        const totalWidth = height;
        const itemSpacing = totalWidth / (activePollens.length + 1);
        
        activePollens.forEach((pollen, index) => {
            const xPos = -totalWidth / 2 + (index + 1) * itemSpacing;
            const color = getPollenColor(pollen);
            
            const bulletSize = 20;
            ctx.fillStyle = color;
            ctx.fillRect(xPos - bulletSize / 2, -bulletSize / 2, bulletSize, bulletSize);
            
            ctx.fillStyle = PALETTE.UI.TEXT_COLOR;
            ctx.fillText(pollen.toUpperCase(), xPos + bulletSize / 2 + 10, 0);
        });
        
        ctx.restore();
    },
    
    drawRadialBottomLegend(ctx, config) {
        const legend = config.zones.legendBottom;
        const x = (legend.leftMargin / 100) * config.width;
        const y = config.height - (legend.height / 100) * config.height;
        const width = (legend.usableWidth / 100) * config.width;
        const height = (legend.height / 100) * config.height;
        
        ctx.font = '200 28px PPLettraMono';
        ctx.fillStyle = PALETTE.UI.TEXT_COLOR;
        ctx.textBaseline = 'middle';
        
        const activePollens = AppState.getActivePollens();
        const pollensText = activePollens.map(p => p.toUpperCase()).join(', ');
        
        ctx.textAlign = 'left';
        ctx.fillText(pollensText, x + 40, y + height / 2);
        
        ctx.textAlign = 'center';
        ctx.font = '500 32px PPLettraMono';
        ctx.fillText(`Année ${AppState.selectedYear}`, x + width / 2, y + height / 2);
        
        ctx.textAlign = 'right';
        ctx.font = '200 24px PPLettraMono';
        const date = new Date().toLocaleDateString('fr-FR');
        ctx.fillText(`Généré par Aer - ${date}`, x + width - 40, y + height / 2);
    },
    
    async drawRadialVisualizationMaximized(ctx, config) {
        const zones = config.zones.visual;
        
        const vizX = (zones.leftMargin / 100) * config.width;
        const vizY = (zones.topMargin / 100) * config.height;
        const vizWidth = (zones.usableWidth / 100) * config.width;
        const vizHeight = (zones.usableHeight / 100) * config.height;
        
        const centerX = vizX + vizWidth / 2;
        const centerY = vizY + vizHeight / 2;
        const radius = Math.min(vizWidth, vizHeight) * 0.45;
        
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
        
        ctx.font = '200 36px PPLettraMono';
        this.drawMonthLabels(ctx, centerX, centerY, radius);
        
        ctx.restore();
    },
    
    /**
     * Export AREA (non implémenté)
     */
    async exportArea(ctx, config) {
        console.log('[ExportPanel] 🌊 Export AREA (non implémenté)');
    },
    
    /**
     * Export GRID
     */
    async exportGrid(ctx, config) {
        console.log('[ExportPanel] 📊 Export GRID');
        
        this.drawGridTopLegend(ctx, config);
        this.drawGridBottomLegend(ctx, config);
        await this.drawGridVisualization(ctx, config);
    },
    
    drawGridTopLegend(ctx, config) {
        const legend = config.zones.legendTop;
        const x = (legend.contentStart / 100) * config.width;
        const y = (legend.topMargin || 0 / 100) * config.height;
        const width = (legend.usableWidth / 100) * config.width;
        const height = (legend.height / 100) * config.height;
        
        ctx.fillStyle = PALETTE.UI.TEXT_COLOR;
        ctx.textBaseline = 'middle';
        const centerY = y + height / 2;
        
        const thirdWidth = width / 3;
        
        ctx.font = '500 52px PPLettraMono';
        ctx.textAlign = 'center';
        ctx.fillText('Pollens en mouvement', x + thirdWidth / 2, centerY);
        ctx.fillText('AIRBREZH', x + thirdWidth + thirdWidth / 2, centerY);
        
        ctx.font = '200 48px PPLettraMono';
        ctx.fillText('Région Bretagne', x + 2 * thirdWidth + thirdWidth / 2, centerY);
    },
    
    drawGridBottomLegend(ctx, config) {
        const legend = config.zones.legendBottom;
        const x = (legend.leftMargin / 100) * config.width;
        const y = (legend.topMargin / 100) * config.height;
        const width = (legend.usableWidth / 100) * config.width;
        const height = (legend.height / 100) * config.height;
        
        ctx.textBaseline = 'middle';
        ctx.fillStyle = PALETTE.UI.TEXT_COLOR;
        const centerY = y + height / 2;
        
        const quarterWidth = width / 4;
        
        this.drawQualityLegendInline(ctx, x + 40, centerY, height);
        
        ctx.font = '500 36px PPLettraMono';
        ctx.textAlign = 'center';
        ctx.fillText(`Année ${AppState.selectedYear}`, x + quarterWidth + quarterWidth / 2, centerY);
        
        ctx.font = '200 32px PPLettraMono';
        ctx.fillText(AppState.selectedZone || 'Zone', x + 2 * quarterWidth + quarterWidth / 2, centerY);
        
        const date = new Date().toLocaleDateString('fr-FR');
        ctx.font = '200 28px PPLettraMono';
        ctx.textAlign = 'right';
        ctx.fillText(`Généré par Aer - ${date}`, x + width - 40, centerY);
    },
    
    drawQualityLegendInline(ctx, startX, centerY, height) {
        const bulletSize = 16;
        const spacing = 10;
        
        ctx.font = '200 24px PPLettraMono';
        ctx.textAlign = 'left';
        
        let currentX = startX;
        
        for (let code = 4; code >= 0; code--) {
            const color = PALETTE.QUALITY[code].color;
            const label = PALETTE.QUALITY[code].label;
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(currentX + bulletSize / 2, centerY, bulletSize / 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = PALETTE.UI.TEXT_COLOR;
            ctx.fillText(label, currentX + bulletSize + spacing, centerY);
            
            const textWidth = ctx.measureText(label).width;
            currentX += bulletSize + spacing + textWidth + 20;
        }
    },
    
    async drawGridVisualization(ctx, config) {
        const zones = config.zones.visual;
        
        const vizX = (zones.leftMargin / 100) * config.width;
        const vizY = (zones.topMargin / 100) * config.height;
        const vizWidth = (zones.usableWidth / 100) * config.width;
        const vizHeight = (zones.usableHeight / 100) * config.height;
        
        const activePollens = AppState.getActivePollens();
        
        const gridMonthsHeight = CONSTANTS.GRID_MONTHS.height;
        const gridPollenHeight = CONSTANTS.GRID_POLLEN.height;
        const totalGridHeight = gridMonthsHeight + (gridPollenHeight * activePollens.length);
        
        const scale = Math.min(vizWidth / CONSTANTS.GRID_MONTHS.width, vizHeight / totalGridHeight);
        
        const scaledGridWidth = CONSTANTS.GRID_MONTHS.width * scale;
        const scaledMonthsHeight = gridMonthsHeight * scale;
        const scaledPollenHeight = gridPollenHeight * scale;
        
        const startX = vizX + (vizWidth - scaledGridWidth) / 2;
        let currentY = vizY + 50;
        
        const monthsY = currentY;
        currentY += scaledMonthsHeight;
        
        // Layer 1: Cellules
        console.log('[ExportPanel] Layer 1: Cellules');
        activePollens.forEach((pollen, pollenIndex) => {
            const pollenY = currentY + (pollenIndex * scaledPollenHeight);
            this.drawGridPollenCells(ctx, pollen, startX, pollenY, scaledPollenHeight, scale);
        });
        
        // Layer 2: grid_months.png
        console.log('[ExportPanel] Layer 2: grid_months.png');
        ctx.drawImage(
            this.loadedAssets.gridMonthsImage,
            startX,
            monthsY,
            scaledGridWidth,
            scaledMonthsHeight
        );
        
        this.drawGridMonthLabels(ctx, startX, monthsY, scaledMonthsHeight, scale);
        
        // Layer 3: grid_pollen.png
        console.log('[ExportPanel] Layer 3: grid_pollen.png');
        activePollens.forEach((pollen, pollenIndex) => {
            const pollenY = currentY + (pollenIndex * scaledPollenHeight);
            
            ctx.drawImage(
                this.loadedAssets.gridPollenImage,
                startX,
                pollenY,
                scaledGridWidth,
                scaledPollenHeight
            );
            
            this.drawGridPollenLabel(ctx, pollen, startX, pollenY, scaledPollenHeight, scale);
        });
    },
    
    drawGridMonthLabels(ctx, startX, startY, height, scale) {
        const offsetLeft = CONSTANTS.GRID_MONTHS.offsetLeft;
        let currentX = startX + (offsetLeft * scale);
        
        ctx.font = `200 ${Math.round(28 * scale)}px PPLettraMono`;
        ctx.fillStyle = PALETTE.UI.TEXT_COLOR;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const centerY = startY + height / 2;
        
        for (let month = 0; month < 12; month++) {
            const monthWidth = CONSTANTS.GRID_MONTHS.monthsWidth[month] * scale;
            const monthCenterX = currentX + monthWidth / 2;
            
            ctx.fillText(CONSTANTS.MONTHS_SHORT[month], monthCenterX, centerY);
            
            currentX += monthWidth;
        }
    },
    
    drawGridPollenLabel(ctx, pollen, startX, startY, height, scale) {
        const labelX = startX + (CONSTANTS.GRID_POLLEN.pollenLabelOffset * scale);
        const labelY = startY + height / 2;
        
        ctx.font = `500 ${Math.round(32 * scale)}px PPLettraMono`;
        ctx.fillStyle = PALETTE.UI.TEXT_COLOR;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        
        ctx.fillText(pollen.toUpperCase(), labelX - 20 * scale, labelY);
    },
    
    drawGridPollenCells(ctx, pollen, startX, startY, height, scale) {
        const halfMonthlyData = DataUtils.getHalfMonthlyAverages(
            AppState.currentMeasures,
            pollen
        );
        
        const offsetLeft = CONSTANTS.GRID_POLLEN.pollenLabelOffset;
        let currentX = startX + (offsetLeft * scale);
        
        for (let month = 0; month < 12; month++) {
            const monthConfig = CONSTANTS.GRID_POLLEN.halfMonths[month];
            
            const h1Index = month * 2;
            const h1Value = halfMonthlyData[h1Index] || 0;
            const h1Width = monthConfig.h1 * scale;
            
            this.drawGridCell(ctx, currentX, startY, h1Width, height, h1Value);
            currentX += h1Width;
            
            const h2Index = month * 2 + 1;
            const h2Value = halfMonthlyData[h2Index] || 0;
            const h2Width = monthConfig.h2 * scale;
            
            this.drawGridCell(ctx, currentX, startY, h2Width, height, h2Value);
            currentX += h2Width;
        }
    },
    
    drawGridCell(ctx, x, y, width, height, value) {
        const color = this.getQualityColor(value);
        const margin = 2;
        
        ctx.fillStyle = color;
        ctx.fillRect(
            x + margin,
            y + margin,
            width - margin * 2,
            height - margin * 2
        );
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
    
    // Méthodes auxiliaires RADIAL
    
    drawMonthSegments(ctx, centerX, centerY, radius) {
        const innerRadius = radius * CONSTANTS.RADIAL.INNER_RADIUS_RATIO;
        const startAngle = CONSTANTS.RADIAL.START_ANGLE;
        const angleStep = (Math.PI * 2) / CONSTANTS.RADIAL.SEGMENTS;
        
        for (let i = 0; i < CONSTANTS.RADIAL.SEGMENTS; i++) {
            const angle1 = startAngle + angleStep * i;
            
            ctx.strokeStyle = ColorUtils.toRgba(PALETTE.UI.TEXT_COLOR, 0.2);
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
            ctx.strokeStyle = ColorUtils.toRgba(PALETTE.UI.TEXT_COLOR, 0.08);
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
        
        ctx.fillStyle = PALETTE.UI.TEXT_COLOR;
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
            
            console.log(`[ExportPanel] ✓ ${filename}`);
        }, 'image/png', 1.0);
    }
};