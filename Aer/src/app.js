/**
 * app.js - Initialisation et orchestration de l'application
 * 
 * Gère:
 * - Chargement des données
 * - Création des containers de background externes
 * - Initialisation des composants UI
 * - Animation de chargement
 */

const App = {
    initialized: false,
    
    /**
     * Initialise l'application
     * Attend le chargement des données ET l'animation minimale
     */
    async initialize() {
        if (this.initialized) return;
        
        console.log('%c[App] 🚀 Initialisation de l\'application Aer...', 'color: #6b9464; font-weight: bold;');
        
        try {
            const minLoadTime = 2150; // Durée minimale d'animation
            const startTime = Date.now();
            
            // Afficher le message de chargement avec animation
            this.showLoadingMessage();
            
            // Variables de contrôle
            let dataLoaded = false;
            let minTimeReached = false;
            
            // Animation de la barre de progression
            const progressInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const timeProgress = Math.min(1, elapsed / minLoadTime);
                
                const progressBar = document.getElementById('loading-progress');
                if (progressBar) {
                    progressBar.style.width = (timeProgress * 100) + '%';
                }
                
                if (elapsed >= minLoadTime) {
                    minTimeReached = true;
                    clearInterval(progressInterval);
                    
                    if (dataLoaded) {
                        this.completeInitialization();
                    }
                }
            }, 50);
            
            // Charger les données en parallèle
            console.log('[App] 📊 Chargement des données...');
            await DataLoader.loadData();
            dataLoaded = true;
            
            // Initialiser l'année par défaut
            const defaultYear = AppState.getDefaultYear();
            AppState.setSelectedYear(defaultYear);
            
            // NOUVEAU: Créer les containers de background externes
            console.log('[App] 🎨 Création des containers de background...');
            this.createBackgroundContainers();
            
            // Initialiser les composants UI
            console.log('[App] 🎨 Initialisation des composants UI...');
            this.initializeComponents();
            
            // Si le temps minimum est écoulé, on continue
            if (minTimeReached) {
                this.completeInitialization();
            }
            
        } catch (error) {
            console.error('[App] ❌ Erreur lors de l\'initialisation:', error);
            this.showErrorMessage(error);
        }
    },
    
    /**
     * NOUVEAU: Crée les containers de background externes pour garantir leur visibilité
     * Les backgrounds sont des "cadres" avec bordures de 3-4px
     */
    createBackgroundContainers() {
        // 1. Background pour le panel gauche (leftBackground.png)
        const leftPanel = document.getElementById('left-panel');
        if (leftPanel && !leftPanel.querySelector('.left-background-container')) {
            const leftBg = document.createElement('div');
            leftBg.className = 'left-background-container';
            leftPanel.appendChild(leftBg);
            console.log('[App] ✓ Container background créé: leftBackground.png');
        }
        
        // 2. Background pour la carte (mapBackground.png)
        const mapPanel = document.getElementById('map-panel');
        if (mapPanel && !mapPanel.querySelector('.map-background-container')) {
            const mapBg = document.createElement('div');
            mapBg.className = 'map-background-container';
            mapPanel.appendChild(mapBg);
            console.log('[App] ✓ Container background créé: mapBackground.png');
        }
        
        // 3. Background FIXE pour le panel filtres (filterBackground.png)
        const filtersPanel = document.getElementById('filters-panel');
        if (filtersPanel && !filtersPanel.querySelector('.filters-background-container')) {
            // Envelopper le contenu existant
            const content = document.createElement('div');
            content.className = 'filters-content';
            while (filtersPanel.firstChild) {
                content.appendChild(filtersPanel.firstChild);
            }
            
            // Créer le background fixe
            const filtersBg = document.createElement('div');
            filtersBg.className = 'filters-background-container';
            
            // Fonction pour mettre à jour la position du background
            const updateFiltersBgPosition = () => {
                const rect = filtersPanel.getBoundingClientRect();
                filtersBg.style.left = rect.left + 'px';
                filtersBg.style.top = rect.top + 'px';
                filtersBg.style.width = rect.width + 'px';
                filtersBg.style.height = rect.height + 'px';
            };
            
            // Ajouter les éléments
            filtersPanel.appendChild(filtersBg);
            filtersPanel.appendChild(content);
            
            // Mettre à jour la position initialement et sur scroll/resize
            updateFiltersBgPosition();
            filtersPanel.addEventListener('scroll', updateFiltersBgPosition);
            window.addEventListener('resize', updateFiltersBgPosition);
            
            console.log('[App] ✓ Container background fixe créé: filterBackground.png');
        }
    },
    
    /**
     * Termine l'initialisation et masque l'écran de chargement
     */
    completeInitialization() {
        this.hideLoadingMessage();
        
        this.initialized = true;
        console.log('%c[App] ✅ Application initialisée avec succès!', 'color: #6b9464; font-weight: bold;');
        console.log(`[App] 📍 ${AppState.zones.length} zones chargées`);
        console.log(`[App] 📅 ${AppState.years.length} années disponibles`);
    },
    
    /**
     * Initialise tous les composants de l'interface
     */
    initializeComponents() {
        // UI Components
        Tooltip.initialize();
        Controls.initialize();
        
        // Panels
        MapPanel.initialize();
        FiltersPanel.initialize();
        PollenPanel.initialize();
        
        // Visualizations
        Visuals.initialize();
        
        console.log('[App] ✓ Tous les composants sont initialisés');
    },
    
    /**
     * Affiche l'écran de chargement avec animation
     */
    showLoadingMessage() {
        const container = document.getElementById('app-container');
        const loading = document.createElement('div');
        loading.id = 'loading-message';
        loading.className = 'loading-screen';
        loading.innerHTML = `
            <div class="loading-animation-container">
                <img src="assets/loading/aer.gif" alt="Aer" class="loading-animation" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <div class="loading-title-fallback">Aer</div>
            </div>
            <p class="loading-text">Chargement des données polliniques...</p>
            <div class="loading-bar">
                <div class="loading-progress" id="loading-progress"></div>
            </div>
        `;
        container.appendChild(loading);
    },
    
    hideLoadingMessage() {
        const loading = document.getElementById('loading-message');
        if (loading) {
            loading.style.transition = 'opacity 0.5s';
            loading.style.opacity = '0';
            setTimeout(() => {
                if (loading.parentElement) {
                    loading.parentElement.removeChild(loading);
                }
            }, 500);
        }
    },
    
    showErrorMessage(error) {
        const container = document.getElementById('app-container');
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            text-align: center;
            max-width: 500px;
            z-index: 10000;
        `;
        errorDiv.innerHTML = `
            <h2 style="color: #FF6B6B; margin-bottom: 20px;">Erreur de chargement</h2>
            <p style="color: #2d4a2b; margin-bottom: 20px;">
                Une erreur s'est produite lors du chargement des données.
            </p>
            <p style="color: #666; font-size: 14px; font-family: monospace;">
                ${error.message}
            </p>
            <button onclick="location.reload()" style="
                margin-top: 20px;
                padding: 10px 20px;
                background: #6b9464;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
            ">
                Recharger
            </button>
        `;
        container.appendChild(errorDiv);
    },
    
    /**
     * Nettoie l'application (utile pour les tests)
     */
    destroy() {
        if (Visuals) Visuals.destroy();
        if (PollenPanel) PollenPanel.destroy();
        AppState.stopPlaying();
        this.initialized = false;
    }
};