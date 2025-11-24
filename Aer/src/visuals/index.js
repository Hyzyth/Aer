// Visuals Index - Gestionnaire central des visualisations

const Visuals = {
    container: null,
    currentVisual: null,
    animationFrame: null,
    
    initialize() {
        this.container = document.getElementById('visualization-container');
        
        // Initialiser les légendes
        Legend.initialize(this.container);
        
        // Écouter les changements
        AppState.addListener('mode', () => this.switchMode());
        AppState.addListener('zone', () => this.refresh());
        AppState.addListener('year', () => this.refresh());
        AppState.addListener('measures', () => this.refresh());
        AppState.addListener('timeline', () => this.refresh());
        AppState.addListener('pollens', () => this.refresh());
        
        // Initialiser le mode par défaut
        this.switchMode();
        
        // Démarrer la boucle d'animation
        this.startAnimationLoop();
    },
    
    switchMode() {
        // Détruire le visuel actuel
        if (this.currentVisual && this.currentVisual.destroy) {
            this.currentVisual.destroy();
        }
        
        // Nettoyer le container (sauf les légendes)
        const children = Array.from(this.container.children);
        children.forEach(child => {
            if (!child.classList.contains('legend-box')) {
                this.container.removeChild(child);
            }
        });
        
        // Créer le nouveau visuel selon le mode
        switch (AppState.selectedMode) {
            case CONSTANTS.MODES.RADIAL:
                this.currentVisual = Object.create(RadialCalendar);
                this.currentVisual.initialize(this.container);
                break;
                
            case CONSTANTS.MODES.GRID:
                this.currentVisual = Object.create(PlantingGrid);
                this.currentVisual.initialize(this.container);
                break;
                
            case CONSTANTS.MODES.AREA:
                this.currentVisual = Object.create(AreaGraph);
                this.currentVisual.initialize(this.container);
                break;
                
            default:
                console.warn('Mode inconnu:', AppState.selectedMode);
        }
        
        this.refresh();
    },
    
    refresh() {
        // Le rafraîchissement se fera dans la boucle d'animation
    },
    
    startAnimationLoop() {
        const animate = () => {
            if (this.currentVisual && this.currentVisual.draw) {
                this.currentVisual.draw();
            }
            
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        animate();
    },
    
    stopAnimationLoop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    },
    
    destroy() {
        this.stopAnimationLoop();
        
        if (this.currentVisual && this.currentVisual.destroy) {
            this.currentVisual.destroy();
        }
    }
};