/**
 * app.js - Orchestration principale de l'application Aer
 * 
 * Responsabilités :
 * - Chargement des données CSV
 * - Création des containers de background externes
 * - Initialisation des composants UI
 * - Gestion de l'écran de chargement avec animation
 */

const App = {
    initialized: false,
    
    /**
     * Initialise l'application complète
     * Attend le chargement des données ET l'animation minimale de chargement
     */
    async initialize() {
        if (this.initialized) return;
        
        console.log('%c[App] 🚀 Initialisation de l\'application Aer...', 'color: #162B5E; font-weight: bold;');
        
        try {
            const minLoadTime = 2150; // Durée minimale d'animation (ms)
            const startTime = Date.now();
            
            // Afficher l'écran de chargement
            this.showLoadingMessage();
            
            // Variables de contrôle pour synchronisation
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
                
                // Temps minimum écoulé
                if (elapsed >= minLoadTime) {
                    minTimeReached = true;
                    clearInterval(progressInterval);
                    
                    // Si données déjà chargées, terminer
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
            
            // Créer les containers de background externes
            console.log('[App] 🎨 Création des containers de background...');
            this.createBackgroundContainers();
            
            // Initialiser les composants UI
            console.log('[App] 🎨 Initialisation des composants UI...');
            this.initializeComponents();
            
            // Si le temps minimum est écoulé, terminer
            if (minTimeReached) {
                this.completeInitialization();
            }
            
        } catch (error) {
            console.error('[App] ❌ Erreur lors de l\'initialisation:', error);
            this.showErrorMessage(error);
        }
    },
    
    /**
     * Crée les containers de background externes pour garantir leur visibilité
     * 
     * Architecture :
     * - leftBackground.png : cadre du panel gauche (bordure rectangulaire)
     * - mapBackground.png : cadre du panel carte
     * - filterBackground.png : cadre du panel filtres (FIXE, suit le scroll)
     */
    createBackgroundContainers() {
        // 1. Background pour le panel gauche (leftBackground.png)
        // Cadre rectangulaire appliqué sur TOUT le panel via ::after
        const leftPanel = document.getElementById('left-panel');
        if (leftPanel && !leftPanel.querySelector('.left-background-container')) {
            // Le background est déjà appliqué via CSS ::after
            console.log('[App] ✓ leftBackground.png appliqué via CSS');
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
        // Position fixe qui suit le panel même au scroll
        const filtersPanel = document.getElementById('filters-panel');
        if (filtersPanel && !document.querySelector('.filters-background-container')) {
            // Envelopper le contenu existant
            const content = document.createElement('div');
            content.className = 'filters-content';
            while (filtersPanel.firstChild) {
                content.appendChild(filtersPanel.firstChild);
            }
            
            // Créer le background fixe dans le body
            const filtersBg = document.createElement('div');
            filtersBg.className = 'filters-background-container';
            
            /**
             * Met à jour la position du background fixe pour qu'il suive le panel
             */
            const updateFiltersBgPosition = () => {
                const rect = filtersPanel.getBoundingClientRect();
                filtersBg.style.left = rect.left + 'px';
                filtersBg.style.top = rect.top + 'px';
                filtersBg.style.width = rect.width + 'px';
                filtersBg.style.height = rect.height + 'px';
            };
            
            // Ajouter au body (position fixed nécessite d'être dans body)
            document.body.appendChild(filtersBg);
            filtersPanel.appendChild(content);
            
            // Mettre à jour position initialement et sur événements
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
        console.log('%c[App] ✅ Application initialisée avec succès!', 'color: #162B5E; font-weight: bold;');
        console.log(`[App] 📍 ${AppState.zones.length} zones chargées`);
        console.log(`[App] 📅 ${AppState.years.length} années disponibles`);
    },
    
    /**
     * Initialise tous les composants de l'interface
     * Ordre important : Tooltip → Controls → Panels → Visuals
     */
    initializeComponents() {
        // Composants UI de base
        Tooltip.initialize();
        Controls.initialize();
        
        // Panels
        MapPanel.initialize();
        FiltersPanel.initialize();
        PollenPanel.initialize();
        
        // Visualisations
        Visuals.initialize();
        
        console.log('[App] ✓ Tous les composants sont initialisés');
    },
    
    /**
     * Affiche l'écran de chargement avec animation GIF
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
    
    /**
     * Masque l'écran de chargement avec transition douce
     */
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
    
    /**
     * Affiche un message d'erreur en cas de problème lors du chargement
     * @param {Error} error - L'erreur survenue
     */
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
            <p style="color: #162B5E; margin-bottom: 20px;">
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
     * Détruit tous les composants et réinitialise l'état
     */
    destroy() {
        if (Visuals) Visuals.destroy();
        if (PollenPanel) PollenPanel.destroy();
        AppState.stopPlaying();
        this.initialized = false;
        console.log('[App] 🗑️ Application détruite');
    }
};