// Main.js - Point d'entrée principal de l'application

// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', () => {
    console.log('%cAer - Pollens en mouvement', 'color: #6b9464; font-size: 24px; font-weight: bold;');
    console.log('%cVisualisation des données polliniques de Bretagne', 'color: #2d4a2b; font-size: 14px;');
    
    // Vérifier les typographies AVANT d'initialiser l'application
    checkFonts().then(() => {
        // Initialiser l'application
        App.initialize();
    });
});

/**
 * Vérifie que toutes les typographies sont chargées correctement
 * @returns {Promise} Promesse résolue quand les fonts sont prêtes
 */
function checkFonts() {
    return document.fonts.ready.then(() => {
        console.log('%c[Fonts] 📝 Vérification des typographies PPLettraMono', 'color: #6b9464; font-weight: bold;');
        
        // Vérifier chaque variante
        const ultralightLoaded = document.fonts.check('200 16px PPLettraMono');
        const mediumLoaded = document.fonts.check('500 16px PPLettraMono');
        
        // Logs détaillés
        if (ultralightLoaded) {
            console.log('[Fonts] ✓ PPLettraMono Ultralight (weight 200) chargée');
        } else {
            console.error('[Fonts] ✗ PPLettraMono Ultralight (weight 200) NON CHARGÉE');
            console.error('[Fonts]   Vérifiez: assets/styles/font/PPLettraMono-Ultralight.otf');
        }
        
        if (mediumLoaded) {
            console.log('[Fonts] ✓ PPLettraMono Medium (weight 500) chargée');
        } else {
            console.error('[Fonts] ✗ PPLettraMono Medium (weight 500) NON CHARGÉE');
            console.error('[Fonts]   Vérifiez: assets/styles/font/PPLettraMono-Medium.otf');
        }
        
        if (!ultralightLoaded || !mediumLoaded) {
            console.warn('%c[Fonts] ⚠️ Certaines variantes de PPLettraMono ne sont pas chargées', 'color: #f8ab37; font-weight: bold;');
            console.warn('[Fonts] Les textes utiliseront la police de fallback (sans-serif)');
            
            // Lister toutes les fonts disponibles pour debug
            console.log('[Fonts] 📋 Fonts système disponibles:');
            const availableFonts = [];
            document.fonts.forEach(font => {
                availableFonts.push(`${font.family} (${font.weight})`);
            });
            console.log('[Fonts]', availableFonts.join(', '));
        } else {
            console.log('%c[Fonts] ✅ Toutes les typographies PPLettraMono sont correctement chargées!', 'color: #6b9464; font-weight: bold;');
        }
        
        return { ultralightLoaded, mediumLoaded };
    });
}

// Gestion de la fermeture/rafraîchissement de la page
window.addEventListener('beforeunload', () => {
    // Arrêter les animations en cours
    if (AppState.isPlaying) {
        AppState.stopPlaying();
    }
    
    // Nettoyer les listeners
    if (PollenPanel.animationFrame) {
        cancelAnimationFrame(PollenPanel.animationFrame);
    }
    
    if (Visuals.animationFrame) {
        cancelAnimationFrame(Visuals.animationFrame);
    }
});

// Gestion des erreurs globales
window.addEventListener('error', (event) => {
    console.error('Erreur non gérée:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promise rejetée non gérée:', event.reason);
});

// Exposition de l'API globale (utile pour le débogage)
window.AerApp = {
    state: AppState,
    constants: CONSTANTS,
    palette: PALETTE,
    utils: {
        color: ColorUtils,
        animation: AnimationUtils,
        data: DataUtils,
        geometry: GeometryUtils
    },
    
    // Méthodes de débogage
    debug: {
        logState() {
            console.log('État actuel:', {
                zone: AppState.selectedZone,
                year: AppState.selectedYear,
                mode: AppState.selectedMode,
                activePollens: AppState.getActivePollens(),
                measureIndex: AppState.currentMeasureIndex,
                totalMeasures: AppState.currentMeasures.length,
                isPlaying: AppState.isPlaying
            });
        },
        
        listZones() {
            console.log('Zones disponibles:', AppState.zones);
        },
        
        listYears() {
            console.log('Années disponibles:', AppState.years);
        },
        
        getZoneStats(zoneName) {
            const stats = DataLoader.getZoneStats(zoneName);
            console.log(`Statistiques pour ${zoneName}:`, stats);
            return stats;
        },
        
        exportData() {
            return {
                zones: AppState.zones,
                years: AppState.years,
                processedData: AppState.processedData
            };
        },
        
        /**
         * Teste le chargement d'un background
         */
        testBackground(filename) {
            const img = new Image();
            const path = `assets/background/${filename}`;
            
            console.log(`[Debug] Test chargement: ${path}`);
            
            img.onload = () => {
                console.log(`✓ ${filename} chargé avec succès (${img.width}x${img.height}px)`);
            };
            
            img.onerror = () => {
                console.error(`✗ ${filename} introuvable ou erreur de chargement`);
                console.error(`  Chemin testé: ${path}`);
            };
            
            img.src = path;
        },
        
        /**
         * Teste tous les backgrounds
         */
        testAllBackgrounds() {
            const backgrounds = [
                'leftBackground.png',
                'mapBackground.png',
                'pollenBackground.png',
                'filterBackground.png',
                'timeBackground.png',
                'timeBar.png',
                'timeDot.png',
                'pollenSeparation.png',
                'export_radial.png',
                'export_stream.png',
                'export_grid.png',
                'radial.png'
            ];
            
            console.log('[Debug] 🔍 Test de tous les backgrounds...');
            backgrounds.forEach(bg => this.testBackground(bg));
        }
    }
};

// Message de bienvenue dans la console
console.log('%c💨 Utilisez window.AerApp pour accéder à l\'API de débogage', 'color: #6b9464; font-style: italic;');
console.log('%cExemple: AerApp.debug.logState()', 'color: #999; font-size: 12px;');
console.log('%cTest backgrounds: AerApp.debug.testAllBackgrounds()', 'color: #999; font-size: 12px;');