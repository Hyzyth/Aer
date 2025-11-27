/**
 * exportPanel.js - Gestion de l'export des visualisations
 * 
 * Modes supportés:
 * - RADIAL: Portrait avec légendes complètes
 * - AREA: Paysage avec stream graph
 * - GRID: Paysage avec grille mensuelle + backgrounds grid_months/grid_pollen
 */

const ExportPanel = {
    // Cache pour les assets
    loadedAssets: {
        exportBackgrounds: {},
        radialImage: null,
        gridMonthsImage: null,
        gridPollenImage: null
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
            zones: {
                // Légende haute: "Pollens en mouvement - AIRBREZH - Région Bretagne"
                legendTop: {
                    leftMargin: 3.5,
                    rightMargin: 34,
                    topMargin: 0,
                    bottomMargin: 95.5,
                    height: 4.5,
                    usableWidth: 100 - 3.5 - 34,
                    contentStart: 3.5
                },
                // Légende basse: qualité | année | région
                legendBottom: {
                    leftMargin: 3.5,
                    rightMargin: 3.5,
                    topMargin: 95,
                    bottomMargin: 0,
                    height: 4.5,
                    usableWidth: 100 - 3.5 * 2
                },
                // Zone visuelle (grilles mois + pollens)
                visual: {
                    leftMargin: 3.3,
                    rightMargin: 3.3,
                    topMargin: 38.3,
                    bottomMargin: 6.8,
                    usableWidth: 100 - 3.3 * 2,
                    usableHeight: 100 - 38.3 - 6.8
                }
            }
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
        
        // Background principal
        if (!this.loadedAssets.exportBackgrounds[mode]) {
            this.loadedAssets.exportBackgrounds[mode] = await this.loadImage(
                CONSTANTS.PATHS.BACKGROUNDS + config.background
            );
            console.log(`[ExportPanel] ✓ Background d'export chargé: ${config.background}`);
        }
        
        // Assets spécifiques au mode RADIAL
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
        
        // Assets spécifiques au mode GRID
        if (mode === 'grid') {
            // Charger grid_months.png
            if (!this.loadedAssets.gridMonthsImage) {
                try {
                    this.loadedAssets.gridMonthsImage = await this.loadImage(
                        CONSTANTS.PATHS.BACKGROUNDS + CONSTANTS.GRID_MONTHS.image
                    );
                    console.log(`[ExportPanel] ✓ Image grid_months chargée: ${CONSTANTS.GRID_MONTHS.image} (${CONSTANTS.GRID_MONTHS.width}x${CONSTANTS.GRID_MONTHS.height}px)`);
                } catch (e) {
                    console.error(`[ExportPanel] ✗ Erreur chargement grid_months.png:`, e);
                    throw new Error('grid_months.png requis pour export GRID');
                }
            }
            
            // Charger grid_pollen.png
            if (!this.loadedAssets.gridPollenImage) {
                try {
                    this.loadedAssets.gridPollenImage = await this.loadImage(
                        CONSTANTS.PATHS.BACKGROUNDS + CONSTANTS.GRID_POLLEN.image
                    );
                    console.log(`[ExportPanel] ✓ Image grid_pollen chargée: ${CONSTANTS.GRID_POLLEN.image} (${CONSTANTS.GRID_POLLEN.width}x${CONSTANTS.GRID_POLLEN.height}px)`);
                } catch (e) {
                    console.error(`[ExportPanel] ✗ Erreur chargement grid_pollen.png:`, e);
                    throw new Error('grid_pollen.png requis pour export GRID');
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
        this.drawRadialRightLegendHorizontal(ctx, config);
        this.drawRadialBottomLegend(ctx, config);
        await this.drawRadialVisualizationMaximized(ctx, config);
        
        console.log('[ExportPanel] ✓ Export radial terminé');
    },
    
    drawRadialTopLegend(ctx, config) {
        const legend = config.zones.legendTop;
        const x = (legend.leftMargin / 100) * config.width;
        const y = 0;
        const width = (legend.usableWidth / 100) * config.width;
        const height = (legend.height / 100) * config.height;
        
        ctx.font = '500 48px PPLettraMono';
        ctx.fillStyle = PALETTE.UI.NATURE_DARK;
        ctx.textBaseline = 'middle';
        
        ctx.textAlign = 'left';
        ctx.fillText('Pollens en mouvement', x + 40, y + height / 2);
        
        ctx.textAlign = 'center';
        ctx.font = '500 42px PPLettraMono';
        ctx.fillText('AIRBREZH', x + width / 2, y + height / 2);
        
        ctx.textAlign = 'right';
        ctx.font = '200 36px PPLettraMono';
        ctx.fillText(AppState.selectedZone || 'Zone', x + width - 40, y + height / 2);
        
        console.log('[ExportPanel] ✓ Légende haute dessinée');
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
            const bulletOffsetX = -bulletSize / 2;
            
            ctx.fillStyle = color;
            ctx.fillRect(xPos + bulletOffsetX, -bulletSize / 2, bulletSize, bulletSize);
            
            const textOffsetX = bulletSize / 2 + 10;
            ctx.fillStyle = PALETTE.UI.NATURE_DARK;
            ctx.fillText(pollen.toUpperCase(), xPos + textOffsetX, 0);
        });
        
        ctx.restore();
        
        console.log('[ExportPanel] ✓ Légende droite dessinée');
    },
    
    drawRadialBottomLegend(ctx, config) {
        const legend = config.zones.legendBottom;
        const x = (legend.leftMargin / 100) * config.width;
        const y = config.height - (legend.height / 100) * config.height;
        const width = (legend.usableWidth / 100) * config.width;
        const height = (legend.height / 100) * config.height;
        
        ctx.font = '200 28px PPLettraMono';
        ctx.fillStyle = PALETTE.UI.NATURE_DARK;
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
        
        console.log('[ExportPanel] ✓ Légende basse dessinée');
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
        
        console.log(`[ExportPanel] 📐 Zone visualisation: ${Math.round(vizWidth)}x${Math.round(vizHeight)}px`);
        console.log(`[ExportPanel] 📐 Rayon visualisation: ${Math.round(radius)}px`);
        
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
        
        console.log('[ExportPanel] ✓ Visualisation radiale dessinée');
    },
    
    /**
     * Export mode AREA (à implémenter)
     */
    async exportArea(ctx, config) {
        console.log('[ExportPanel] 🌊 Export mode AREA (paysage)');
        console.warn('[ExportPanel] ⚠️ Zones pour mode AREA non définies');
    },
    
    /**
     * Export mode GRID avec grid_months.png et grid_pollen.png
     */
    async exportGrid(ctx, config) {
        console.log('[ExportPanel] 📊 Export mode GRID (paysage)');
        
        // Dessiner les légendes
        this.drawGridTopLegend(ctx, config);
        this.drawGridBottomLegend(ctx, config);
        
        // Dessiner la visualisation avec backgrounds
        await this.drawGridVisualization(ctx, config);
        
        console.log('[ExportPanel] ✓ Export grid terminé');
    },
    
    /**
     * Légende haute GRID: "Pollens en mouvement - AIRBREZH - Région Bretagne"
     * Équilibrée avec espacement homogène
     */
    drawGridTopLegend(ctx, config) {
        const legend = config.zones.legendTop;
        const x = (legend.contentStart / 100) * config.width;
        const y = (legend.topMargin / 100) * config.height;
        const width = (legend.usableWidth / 100) * config.width;
        const height = (legend.height / 100) * config.height;
        
        ctx.fillStyle = PALETTE.UI.NATURE_DARK;
        ctx.textBaseline = 'middle';
        const centerY = y + height / 2;
        
        // Diviser en 3 zones égales
        const thirdWidth = width / 3;
        
        // Zone 1: "Pollens en mouvement"
        ctx.font = '52px PPLettraMono';
        ctx.fontWeight = '500';
        ctx.textAlign = 'center';
        ctx.fillText('Pollens en mouvement', x + thirdWidth / 2, centerY);
        
        // Zone 2: "AIRBREZH"
        ctx.fillText('AIRBREZH', x + thirdWidth + thirdWidth / 2, centerY);
        
        // Zone 3: "Région Bretagne"
        ctx.font = '48px PPLettraMono';
        ctx.fontWeight = '200';
        ctx.fillText('Région Bretagne', x + 2 * thirdWidth + thirdWidth / 2, centerY);
        
        console.log('[ExportPanel] ✓ Légende haute GRID dessinée (équilibrée)');
    },
    
    /**
     * Légende basse GRID: [Légende qualité] | Année | Zone | Généré par Aer - date
     */
    drawGridBottomLegend(ctx, config) {
        const legend = config.zones.legendBottom;
        const x = (legend.leftMargin / 100) * config.width;
        const y = (legend.topMargin / 100) * config.height;
        const width = (legend.usableWidth / 100) * config.width;
        const height = (legend.height / 100) * config.height;
        
        ctx.textBaseline = 'middle';
        ctx.fillStyle = PALETTE.UI.NATURE_DARK;
        const centerY = y + height / 2;
        
        // Diviser en 4 zones
        const quarterWidth = width / 4;
        
        // Zone 1: Légende qualité avec puces
        this.drawQualityLegendInline(ctx, x + 40, centerY, height);
        
        // Zone 2: Année
        ctx.font = '36px PPLettraMono';
        ctx.fontWeight = '500';
        ctx.textAlign = 'center';
        ctx.fillText(`Année ${AppState.selectedYear}`, x + quarterWidth + quarterWidth / 2, centerY);
        
        // Zone 3: Zone sélectionnée
        ctx.font = '32px PPLettraMono';
        ctx.fontWeight = '200';
        ctx.fillText(AppState.selectedZone || 'Zone', x + 2 * quarterWidth + quarterWidth / 2, centerY);
        
        // Zone 4: Généré par
        const date = new Date().toLocaleDateString('fr-FR');
        ctx.font = '28px PPLettraMono';
        ctx.textAlign = 'right';
        ctx.fillText(`Généré par Aer - ${date}`, x + width - 40, centerY);
        
        console.log('[ExportPanel] ✓ Légende basse GRID dessinée (format correct)');
    },
    
    /**
     * Dessine la légende de qualité en ligne avec puces colorées
     * Format: [●] Mauvais [●] Dégradé [●] Moyen [●] Bon [●] No Data
     */
    drawQualityLegendInline(ctx, startX, centerY, height) {
        const bulletSize = 16;
        const spacing = 10;
        
        ctx.font = '24px PPLettraMono';
        ctx.fontWeight = '200';
        ctx.textAlign = 'left';
        
        let currentX = startX;
        
        // Ordre inversé : 4 → 0
        for (let code = 4; code >= 0; code--) {
            const color = PALETTE.QUALITY[code].color;
            const label = PALETTE.QUALITY[code].label;
            
            // Puce colorée
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(currentX + bulletSize / 2, centerY, bulletSize / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Texte
            ctx.fillStyle = PALETTE.UI.NATURE_DARK;
            ctx.fillText(label, currentX + bulletSize + spacing, centerY);
            
            // Mesurer la largeur du texte pour avancer
            const textWidth = ctx.measureText(label).width;
            currentX += bulletSize + spacing + textWidth + 20; // 20px entre items
        }
    },
    
    /**
     * Visualisation GRID avec grid_months.png et grid_pollen.png
     * ORDRE CORRECT: données d'abord, puis images par-dessus
     */
    async drawGridVisualization(ctx, config) {
        const zones = config.zones.visual;
        
        const vizX = (zones.leftMargin / 100) * config.width;
        const vizY = (zones.topMargin / 100) * config.height;
        const vizWidth = (zones.usableWidth / 100) * config.width;
        const vizHeight = (zones.usableHeight / 100) * config.height;
        
        console.log(`[ExportPanel] 📐 Zone visualisation GRID: ${Math.round(vizWidth)}x${Math.round(vizHeight)}px`);
        
        const activePollens = AppState.getActivePollens();
        
        // Calculer les dimensions
        const gridMonthsHeight = CONSTANTS.GRID_MONTHS.height;
        const gridPollenHeight = CONSTANTS.GRID_POLLEN.height;
        const totalGridHeight = gridMonthsHeight + (gridPollenHeight * activePollens.length);
        
        // Échelle pour remplir l'espace
        const scale = Math.min(vizWidth / CONSTANTS.GRID_MONTHS.width, vizHeight / totalGridHeight);
        
        const scaledGridWidth = CONSTANTS.GRID_MONTHS.width * scale;
        const scaledMonthsHeight = gridMonthsHeight * scale;
        const scaledPollenHeight = gridPollenHeight * scale;
        
        // Centrer horizontalement
        const startX = vizX + (vizWidth - scaledGridWidth) / 2;
        let currentY = vizY + 50; // Marge top
        
        const monthsY = currentY;
        currentY += scaledMonthsHeight;
        
        // LAYER 1: Dessiner TOUTES les cellules de données d'abord
        console.log('[ExportPanel] 🎨 Layer 1: Dessin des cellules de données');
        activePollens.forEach((pollen, pollenIndex) => {
            const pollenY = currentY + (pollenIndex * scaledPollenHeight);
            this.drawGridPollenCells(ctx, pollen, startX, pollenY, scaledPollenHeight, scale);
        });
        
        // LAYER 2: Dessiner grid_months.png PAR-DESSUS
        console.log('[ExportPanel] 🎨 Layer 2: Dessin de grid_months.png');
        ctx.drawImage(
            this.loadedAssets.gridMonthsImage,
            startX,
            monthsY,
            scaledGridWidth,
            scaledMonthsHeight
        );
        
        // Dessiner les labels des mois
        this.drawGridMonthLabels(ctx, startX, monthsY, scaledMonthsHeight, scale);
        
        // LAYER 3: Dessiner grid_pollen.png PAR-DESSUS pour chaque pollen
        console.log('[ExportPanel] 🎨 Layer 3: Dessin des grid_pollen.png');
        activePollens.forEach((pollen, pollenIndex) => {
            const pollenY = currentY + (pollenIndex * scaledPollenHeight);
            
            // Image grid_pollen
            ctx.drawImage(
                this.loadedAssets.gridPollenImage,
                startX,
                pollenY,
                scaledGridWidth,
                scaledPollenHeight
            );
            
            // Label du pollen
            this.drawGridPollenLabel(ctx, pollen, startX, pollenY, scaledPollenHeight, scale);
        });
        
        console.log('[ExportPanel] ✓ Visualisation GRID dessinée (layers dans le bon ordre)');
    },
    
    /**
     * Dessine les labels des mois sur grid_months
     */
    drawGridMonthLabels(ctx, startX, startY, height, scale) {
        const offsetLeft = CONSTANTS.GRID_MONTHS.offsetLeft;
        let currentX = startX + (offsetLeft * scale);
        
        ctx.font = `${Math.round(28 * scale)}px PPLettraMono`;
        ctx.fontWeight = '200';
        ctx.fillStyle = PALETTE.UI.NATURE_DARK;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const centerY = startY + height / 2;
        
        for (let month = 0; month < 12; month++) {
            const monthWidth = CONSTANTS.GRID_MONTHS.monthsWidth[month] * scale;
            const monthCenterX = currentX + monthWidth / 2;
            
            ctx.fillText(CONSTANTS.MONTHS_SHORT[month], monthCenterX, centerY);
            
            currentX += monthWidth;
        }
        
        console.log('[ExportPanel] ✓ Labels des mois dessinés');
    },
    
    /**
     * Dessine le label d'un pollen dans la grille
     */
    drawGridPollenLabel(ctx, pollen, startX, startY, height, scale) {
        const labelX = startX + (CONSTANTS.GRID_POLLEN.pollenLabelOffset * scale);
        const labelY = startY + height / 2;
        
        ctx.font = `500 ${Math.round(32 * scale)}px PPLettraMono`;
        ctx.fillStyle = PALETTE.UI.NATURE_DARK;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        
        ctx.fillText(pollen.toUpperCase(), labelX - 20 * scale, labelY);
    },
    
    /**
     * Dessine les cellules de données d'un pollen
     */
    drawGridPollenCells(ctx, pollen, startX, startY, height, scale) {
        const halfMonthlyData = DataUtils.getHalfMonthlyAverages(
            AppState.currentMeasures,
            pollen
        );
        
        const offsetLeft = CONSTANTS.GRID_POLLEN.pollenLabelOffset;
        let currentX = startX + (offsetLeft * scale);
        
        // Parcourir les 12 mois
        for (let month = 0; month < 12; month++) {
            const monthConfig = CONSTANTS.GRID_POLLEN.halfMonths[month];
            
            // H1 (1-15)
            const h1Index = month * 2;
            const h1Value = halfMonthlyData[h1Index] || 0;
            const h1Width = monthConfig.h1 * scale;
            
            this.drawGridCell(ctx, currentX, startY, h1Width, height, h1Value);
            currentX += h1Width;
            
            // H2 (16-fin)
            const h2Index = month * 2 + 1;
            const h2Value = halfMonthlyData[h2Index] || 0;
            const h2Width = monthConfig.h2 * scale;
            
            this.drawGridCell(ctx, currentX, startY, h2Width, height, h2Value);
            currentX += h2Width;
        }
    },
    
    /**
     * Dessine une cellule de la grille avec couleur selon valeur
     */
    drawGridCell(ctx, x, y, width, height, value) {
        const color = this.getQualityColor(value);
        
        // Marge intérieure pour ne pas déborder sur les bordures
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
    
    /**
     * Calcule la qualité moyenne de la zone
     */
    calculateAverageQuality() {
        if (!AppState.currentMeasures || AppState.currentMeasures.length === 0) {
            return 'N/A';
        }
        
        let sum = 0;
        let count = 0;
        
        AppState.currentMeasures.forEach(measure => {
            if (!measure.fictional) {
                sum += measure.code_qual || 0;
                count++;
            }
        });
        
        if (count === 0) return 'N/A';
        
        const avg = sum / count;
        const label = getQualityLabel(Math.round(avg));
        
        return label;
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