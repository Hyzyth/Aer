/**
 * MapPanel.js - Gestion de la carte interactive avec thèmes personnalisés
 * Thèmes: CUSTOM (défaut), LIGHT, CLASSIC
 */

const MapPanel = {
    map: null,
    markers: {},
    selectedMarker: null,
    currentTheme: CONSTANTS.MAP.DEFAULT_TILE, // 'CUSTOM' par défaut
    tileLayer: null,
    
    /**
     * Initialise la carte et les contrôles
     */
    initialize() {
        console.log('[MapPanel] Initialisation...');
        const container = document.getElementById('map-container');
        
        // Créer les contrôles de thème
        this.createThemeControls(container);
        
        // Bornes pour la Bretagne
        const bretagneBounds = [
            [47.3, -5.2],
            [48.9, -1.0]
        ];
        
        // Initialiser la carte Leaflet
        this.map = L.map(container, {
            center: [CONSTANTS.MAP.CENTER_LAT, CONSTANTS.MAP.CENTER_LON],
            zoom: CONSTANTS.MAP.INITIAL_ZOOM,
            minZoom: CONSTANTS.MAP.MIN_ZOOM,
            maxZoom: CONSTANTS.MAP.MAX_ZOOM,
            maxBounds: bretagneBounds,
            maxBoundsViscosity: 1.0
        });
        
        // Ajouter la couche de tuiles par défaut
        this.setTileLayer(this.currentTheme);
        
        // Créer les marqueurs
        this.createMarkers();
        
        // Écouter les changements d'état
        AppState.addListener('zone', () => this.onZoneSelected());
        AppState.addListener('reset', () => this.onReset());
        
        console.log(`[MapPanel] Carte initialisée avec thème ${this.currentTheme}`);
    },
    
    /**
     * Crée les contrôles de thème de carte
     */
    createThemeControls(container) {
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'map-theme-controls';
        
        // Parcourir les thèmes disponibles
        Object.keys(CONSTANTS.MAP.TILES).forEach(themeKey => {
            const theme = CONSTANTS.MAP.TILES[themeKey];
            const btn = document.createElement('button');
            btn.className = 'theme-btn';
            if (this.currentTheme === themeKey) {
                btn.classList.add('active');
            }
            
            const img = document.createElement('img');
            img.src = `${CONSTANTS.PATHS.UI_ICONS}${theme.icon}`;
            img.alt = theme.label;
            img.onerror = () => {
                console.warn(`[MapPanel] Icône non trouvée: ${theme.icon}`);
                btn.textContent = theme.label[0];
            };
            
            btn.appendChild(img);
            btn.title = theme.label;
            btn.dataset.themeId = themeKey;
            
            btn.addEventListener('click', () => {
                this.currentTheme = themeKey;
                this.setTileLayer(themeKey);
                this.updateMarkerColors();
                this.updateThemeButtons();
                console.log(`[MapPanel] Thème changé: ${themeKey}`);
            });
            
            controlsDiv.appendChild(btn);
        });
        
        container.appendChild(controlsDiv);
    },
    
    /**
     * Met à jour les boutons de thème
     */
    updateThemeButtons() {
        const buttons = document.querySelectorAll('.theme-btn');
        buttons.forEach(btn => {
            if (btn.dataset.themeId === this.currentTheme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    },
    
    /**
     * Retourne les couleurs selon le thème actif
     */
    getThemeColors() {
        switch (this.currentTheme) {
            case 'CLASSIC':
                return {
                    tooltip: 'rgba(255, 255, 255, 0.95)',
                    tooltipText: '#2d4a2b',
                    markerStroke: '#333333'
                };
            case 'LIGHT':
                return {
                    tooltip: 'rgba(45, 74, 43, 0.95)',
                    tooltipText: '#ffffff',
                    markerStroke: '#2d4a2b'
                };
            case 'CUSTOM':
            default:
                return {
                    tooltip: 'rgba(45, 74, 43, 0.95)',
                    tooltipText: '#ffffff',
                    markerStroke: '#2d4a2b'
                };
        }
    },
    
    /**
     * Change la couche de tuiles de la carte
     */
    setTileLayer(themeKey) {
        if (this.tileLayer) {
            this.map.removeLayer(this.tileLayer);
        }
        
        const theme = CONSTANTS.MAP.TILES[themeKey];
        if (!theme) {
            console.error(`[MapPanel] Thème inconnu: ${themeKey}`);
            return;
        }
        
        this.tileLayer = L.tileLayer(theme.url, {
            attribution: theme.attribution,
            maxZoom: CONSTANTS.MAP.MAX_ZOOM
        }).addTo(this.map);
        
        console.log(`[MapPanel] Tuiles chargées: ${themeKey}`);
    },
    
    /**
     * Crée les marqueurs pour toutes les zones
     */
    createMarkers() {
        const themeColors = this.getThemeColors();
        let markerCount = 0;
        
        AppState.zones.forEach(zoneName => {
            const stats = DataLoader.getZoneStats(zoneName);
            if (!stats || !stats.coords) return;
            
            const color = getQualityColor(Math.round(stats.avgCodeQual));
            
            const marker = L.circleMarker([stats.coords.lat, stats.coords.lon], {
                radius: CONSTANTS.MAP.CIRCLE_RADIUS,
                fillColor: color,
                color: themeColors.markerStroke,
                weight: CONSTANTS.MAP.CIRCLE_WEIGHT,
                opacity: CONSTANTS.MAP.CIRCLE_OPACITY,
                fillOpacity: 0.6
            });
            
            marker.on('mouseover', (e) => {
                this.onMarkerHover(zoneName, e);
            });
            
            marker.on('mouseout', () => {
                this.onMarkerOut();
            });
            
            marker.on('mousemove', (e) => {
                Tooltip.update(e.originalEvent.clientX, e.originalEvent.clientY);
            });
            
            marker.on('click', () => {
                this.onMarkerClick(zoneName);
            });
            
            marker.addTo(this.map);
            this.markers[zoneName] = marker;
            markerCount++;
        });
        
        console.log(`[MapPanel] ${markerCount} marqueurs créés`);
    },
    
    /**
     * Met à jour les couleurs des marqueurs selon le thème
     */
    updateMarkerColors() {
        const themeColors = this.getThemeColors();
        
        Object.keys(this.markers).forEach(zoneName => {
            const marker = this.markers[zoneName];
            marker.setStyle({
                color: themeColors.markerStroke
            });
        });
    },
    
    /**
     * Gère le survol d'un marqueur
     */
    onMarkerHover(zoneName, event) {
        const stats = DataLoader.getZoneStats(zoneName);
        if (!stats) return;
        
        const themeColors = this.getThemeColors();
        
        Tooltip.showZoneInfo(
            event.originalEvent.clientX,
            event.originalEvent.clientY,
            stats,
            themeColors
        );
        
        const marker = this.markers[zoneName];
        if (marker) {
            marker.setStyle({
                radius: CONSTANTS.MAP.CIRCLE_RADIUS * 1.3,
                weight: CONSTANTS.MAP.CIRCLE_WEIGHT * 1.5
            });
        }
    },
    
    /**
     * Gère la sortie du survol d'un marqueur
     */
    onMarkerOut() {
        Tooltip.hide();
        
        Object.keys(this.markers).forEach(zoneName => {
            if (zoneName !== AppState.selectedZone) {
                this.markers[zoneName].setStyle({
                    radius: CONSTANTS.MAP.CIRCLE_RADIUS,
                    weight: CONSTANTS.MAP.CIRCLE_WEIGHT
                });
            }
        });
    },
    
    /**
     * Gère le clic sur un marqueur avec animation de pulsation
     */
    onMarkerClick(zoneName) {
        const marker = this.markers[zoneName];
        if (marker) {
            const originalRadius = CONSTANTS.MAP.CIRCLE_RADIUS;
            let pulseCount = 0;
            const maxPulses = 3;
            
            const pulse = () => {
                if (pulseCount >= maxPulses) {
                    AppState.setSelectedZone(zoneName);
                    return;
                }
                
                let step = 0;
                const steps = 10;
                const interval = setInterval(() => {
                    step++;
                    const progress = step / steps;
                    
                    if (progress < 0.5) {
                        const scale = 1 + progress;
                        marker.setStyle({ radius: originalRadius * scale });
                    } else {
                        const scale = 1 + (1 - progress);
                        marker.setStyle({ radius: originalRadius * scale });
                    }
                    
                    if (step >= steps) {
                        clearInterval(interval);
                        pulseCount++;
                        if (pulseCount < maxPulses) {
                            setTimeout(pulse, 50);
                        } else {
                            pulse();
                        }
                    }
                }, 30);
            };
            
            pulse();
        }
    },
    
    /**
     * Gère la sélection d'une zone
     */
    onZoneSelected() {
        const themeColors = this.getThemeColors();
        
        // Réinitialiser tous les marqueurs
        Object.keys(this.markers).forEach(zoneName => {
            const marker = this.markers[zoneName];
            const stats = DataLoader.getZoneStats(zoneName);
            const color = getQualityColor(Math.round(stats.avgCodeQual));
            
            marker.setStyle({
                radius: CONSTANTS.MAP.CIRCLE_RADIUS,
                weight: CONSTANTS.MAP.CIRCLE_WEIGHT,
                fillColor: color,
                color: themeColors.markerStroke
            });
        });
        
        // Mettre en évidence le marqueur sélectionné
        if (AppState.selectedZone) {
            const marker = this.markers[AppState.selectedZone];
            const stats = DataLoader.getZoneStats(AppState.selectedZone);
            
            if (marker && stats) {
                const color = getQualityColor(Math.round(stats.avgCodeQual));
                
                marker.setStyle({
                    radius: CONSTANTS.MAP.SELECTED_RADIUS,
                    weight: CONSTANTS.MAP.CIRCLE_WEIGHT * 2,
                    fillColor: color,
                    color: themeColors.markerStroke
                });
                
                // Zoomer sur la zone
                this.map.flyTo(
                    [stats.coords.lat, stats.coords.lon],
                    CONSTANTS.MAP.INITIAL_ZOOM + 1,
                    {
                        duration: 1.5,
                        easeLinearity: 0.5
                    }
                );
            }
        }
    },
    
    /**
     * Reset complet de la carte
     */
    onReset() {
        console.log('[MapPanel] Reset de la carte');
        
        // Retour au thème par défaut
        this.currentTheme = CONSTANTS.MAP.DEFAULT_TILE;
        this.setTileLayer(this.currentTheme);
        this.updateThemeButtons();
        
        // Retour à la vue initiale
        this.map.flyTo(
            [CONSTANTS.MAP.CENTER_LAT, CONSTANTS.MAP.CENTER_LON],
            CONSTANTS.MAP.INITIAL_ZOOM,
            {
                duration: 1.5,
                easeLinearity: 0.5
            }
        );
        
        // Réinitialiser tous les marqueurs
        const themeColors = this.getThemeColors();
        Object.keys(this.markers).forEach(zoneName => {
            const marker = this.markers[zoneName];
            const stats = DataLoader.getZoneStats(zoneName);
            const color = getQualityColor(Math.round(stats.avgCodeQual));
            
            marker.setStyle({
                radius: CONSTANTS.MAP.CIRCLE_RADIUS,
                weight: CONSTANTS.MAP.CIRCLE_WEIGHT,
                fillColor: color,
                color: themeColors.markerStroke
            });
        });
    }
};