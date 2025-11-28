/**
 * mapPanel.js - Gestion de la carte interactive
 * Version avec nouvelle palette et contrôles simplifiés
 */

const MapPanel = {
    map: null,
    markers: {},
    selectedMarker: null,
    currentTheme: CONSTANTS.MAP.DEFAULT_TILE,
    tileLayer: null,
    
    /**
     * Initialise la carte
     */
    initialize() {
        console.log('[MapPanel] 🗺️ Initialisation...');
        const container = document.getElementById('map-container');
        
        this.createThemeControls(container);
        
        const bretagneBounds = [
            [47.3, -5.2],
            [48.9, -1.0]
        ];
        
        this.map = L.map(container, {
            center: [CONSTANTS.MAP.CENTER_LAT, CONSTANTS.MAP.CENTER_LON],
            zoom: CONSTANTS.MAP.INITIAL_ZOOM,
            minZoom: CONSTANTS.MAP.MIN_ZOOM,
            maxZoom: CONSTANTS.MAP.MAX_ZOOM,
            maxBounds: bretagneBounds,
            maxBoundsViscosity: 1.0
        });
        
        this.setTileLayer(this.currentTheme);
        this.createMarkers();
        
        AppState.addListener('zone', () => this.onZoneSelected());
        AppState.addListener('reset', () => this.onReset());
        
        console.log(`[MapPanel] ✓ Carte initialisée (${this.currentTheme})`);
    },
    
    /**
     * Crée les contrôles de thème (icônes uniquement)
     */
    createThemeControls(container) {
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'map-theme-controls';
        
        Object.keys(CONSTANTS.MAP.TILES).forEach(themeKey => {
            const theme = CONSTANTS.MAP.TILES[themeKey];
            const btn = document.createElement('button');
            btn.className = 'theme-btn';
            if (this.currentTheme === themeKey) {
                btn.classList.add('active');
            }
            
            const img = document.createElement('img');
            img.src = `${CONSTANTS.PATHS.UI_ICONS}${theme.icon}`;
            img.alt = themeKey;
            img.onerror = () => console.warn(`[MapPanel] ⚠️ Icône manquante: ${theme.icon}`);
            
            btn.appendChild(img);
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
            btn.classList.toggle('active', btn.dataset.themeId === this.currentTheme);
        });
    },
    
    /**
     * Change la couche de tuiles
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
    },
    
    /**
     * Crée les marqueurs pour toutes les zones
     */
    createMarkers() {
        let markerCount = 0;
        
        AppState.zones.forEach(zoneName => {
            const stats = DataLoader.getZoneStats(zoneName);
            if (!stats || !stats.coords) return;
            
            const color = getQualityColor(Math.round(stats.avgCodeQual));
            
            const marker = L.circleMarker([stats.coords.lat, stats.coords.lon], {
                radius: CONSTANTS.MAP.CIRCLE_RADIUS,
                fillColor: color,
                color: PALETTE.UI.TEXT_COLOR,
                weight: CONSTANTS.MAP.CIRCLE_WEIGHT,
                opacity: CONSTANTS.MAP.CIRCLE_OPACITY,
                fillOpacity: 0.6
            });
            
            marker.on('mouseover', (e) => this.onMarkerHover(zoneName, e));
            marker.on('mouseout', () => this.onMarkerOut());
            marker.on('mousemove', (e) => Tooltip.update(e.originalEvent.clientX, e.originalEvent.clientY));
            marker.on('click', () => this.onMarkerClick(zoneName));
            
            marker.addTo(this.map);
            this.markers[zoneName] = marker;
            markerCount++;
        });
        
        console.log(`[MapPanel] ✓ ${markerCount} marqueurs créés`);
    },
    
    /**
     * Met à jour les couleurs des marqueurs
     */
    updateMarkerColors() {
        Object.keys(this.markers).forEach(zoneName => {
            const marker = this.markers[zoneName];
            marker.setStyle({
                color: PALETTE.UI.TEXT_COLOR
            });
        });
    },
    
    /**
     * Gère le survol d'un marqueur
     */
    onMarkerHover(zoneName, event) {
        const stats = DataLoader.getZoneStats(zoneName);
        if (!stats) return;
        
        Tooltip.showZoneInfo(
            event.originalEvent.clientX,
            event.originalEvent.clientY,
            stats
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
     * Gère la sortie du survol
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
     * Gère le clic sur un marqueur (avec animation pulsation)
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
        // Réinitialiser tous les marqueurs
        Object.keys(this.markers).forEach(zoneName => {
            const marker = this.markers[zoneName];
            const stats = DataLoader.getZoneStats(zoneName);
            const color = getQualityColor(Math.round(stats.avgCodeQual));
            
            marker.setStyle({
                radius: CONSTANTS.MAP.CIRCLE_RADIUS,
                weight: CONSTANTS.MAP.CIRCLE_WEIGHT,
                fillColor: color,
                color: PALETTE.UI.TEXT_COLOR
            });
        });
        
        // Mettre en évidence la zone sélectionnée
        if (AppState.selectedZone) {
            const marker = this.markers[AppState.selectedZone];
            const stats = DataLoader.getZoneStats(AppState.selectedZone);
            
            if (marker && stats) {
                const color = getQualityColor(Math.round(stats.avgCodeQual));
                
                marker.setStyle({
                    radius: CONSTANTS.MAP.SELECTED_RADIUS,
                    weight: CONSTANTS.MAP.CIRCLE_WEIGHT * 2,
                    fillColor: color,
                    color: PALETTE.UI.TEXT_COLOR
                });
                
                // Zoom sur la zone
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
     * Reset de la carte
     */
    onReset() {
        console.log('[MapPanel] 🔄 Reset de la carte');
        
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
        Object.keys(this.markers).forEach(zoneName => {
            const marker = this.markers[zoneName];
            const stats = DataLoader.getZoneStats(zoneName);
            const color = getQualityColor(Math.round(stats.avgCodeQual));
            
            marker.setStyle({
                radius: CONSTANTS.MAP.CIRCLE_RADIUS,
                weight: CONSTANTS.MAP.CIRCLE_WEIGHT,
                fillColor: color,
                color: PALETTE.UI.TEXT_COLOR
            });
        });
    }
};