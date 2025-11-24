/**
 * app.js - Initialisation et orchestration de l'application Aer
 * 
 * Gère:
 * - Chargement des données CSV
 * - Création des containers de background (cadres visuels)
 * - Initialisation des composants UI
 * - Animation de chargement avec barre de progression
 * - Séparations visuelles entre sections
 * 
 * Architecture des backgrounds:
 * - leftBackground.png: cadre englobant TOUT le panel gauche
 * - pollenSeparation.png: séparateurs entre les 3 zones du panel gauche
 * - filterBackground.png: cadre de la zone filtres (panel droit)
 */

const App = {
    initialized: false,
    loadedAssets: {
        backgrounds: {},
        separators: {}
    },
    
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
            console.log('[App] 📊 Chargement des données CSV...');
            await DataLoader.loadData();
            dataLoaded = true;
            console.log('[App] ✓ Données chargées avec succès');
            
            // Initialiser l'année par défaut
            const defaultYear = AppState.getDefaultYear();
            AppState.setSelectedYear(defaultYear);
            console.log(`[App] 📅 Année par défaut: ${defaultYear}`);
            
            // Créer les containers de background avec séparations
            console.log('[App] 🎨 Création des containers de background...');
            await this.createBackgroundContainers();
            
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
     * Crée les containers de background et séparations
     * Architecture:
     * - Panel gauche: leftBackground.png (cadre englobant) + pollenSeparation.png (séparateurs)
     * - Panel filtres: filterBackground.png (cadre fixe)
     */
    async createBackgroundContainers() {
        console.log('[App] 🖼️  Configuration des backgrounds et séparations...');
        
        // 1. PANEL GAUCHE - Background englobant
        await this.createLeftPanelBackground();
        
        // 2. PANEL GAUCHE - Séparations entre zones
        this.createLeftPanelSeparations();
        
        // 3. PANEL FILTRES - Background fixe
        await this.createFiltersBackground();
        
        console.log('[App] ✅ Tous les backgrounds et séparations créés');
    },
    
    /**
     * Crée le background englobant du panel gauche
     * leftBackground.png encadre TOUTE la zone (controls-top + visualization + controls-bottom)
     */
    async createLeftPanelBackground() {
        const leftPanel = document.getElementById('left-panel');
        if (!leftPanel) {
            console.error('[App] ❌ Panel gauche introuvable');
            return;
        }
        
        // Vérifier si le container existe déjà
        if (leftPanel.querySelector('.left-background-container')) {
            console.log('[App] ℹ️  Container background gauche déjà existant');
            return;
        }
        
        // Créer le container de background
        const leftBg = document.createElement('div');
        leftBg.className = 'left-background-container';
        
        // Charger l'image pour vérification
        try {
            const img = await this.loadImage(CONSTANTS.PATHS.BACKGROUNDS + 'leftBackground.png');
            this.loadedAssets.backgrounds.left = img;
            console.log(`[App] ✓ leftBackground.png chargé (${img.width}x${img.height}px)`);
        } catch (e) {
            console.warn('[App] ⚠️  leftBackground.png introuvable, utilisation fallback');
        }
        
        // Insérer le background AVANT le contenu (z-index géré par CSS)
        leftPanel.insertBefore(leftBg, leftPanel.firstChild);
        console.log('[App] ✓ Container background gauche créé');
    },
    
    /**
     * Crée les séparations visuelles dans le panel gauche
     * pollenSeparation.png entre:
     * - controls-top et visualization-container
     * - visualization-container et controls-bottom
     */
    createLeftPanelSeparations() {
        const leftPanel = document.getElementById('left-panel');
        if (!leftPanel) return;
        
        const controlsTop = document.getElementById('controls-top');
        const visualization = document.getElementById('visualization-container');
        const controlsBottom = document.getElementById('controls-bottom');
        
        if (!controlsTop || !visualization || !controlsBottom) {
            console.error('[App] ❌ Zones du panel gauche introuvables');
            return;
        }
        
        // Séparation 1: après controls-top
        const sep1 = this.createSeparator('top-separator');
        controlsTop.insertAdjacentElement('afterend', sep1);
        console.log('[App] ✓ Séparateur top créé (après controls-top)');
        
        // Séparation 2: après visualization-container
        const sep2 = this.createSeparator('bottom-separator');
        visualization.insertAdjacentElement('afterend', sep2);
        console.log('[App] ✓ Séparateur bottom créé (après visualization)');
    },
    
    /**
     * Crée un élément séparateur avec pollenSeparation.png
     * @param {string} className - Classe CSS à appliquer
     * @returns {HTMLElement} Élément séparateur
     */
    createSeparator(className) {
        const separator = document.createElement('div');
        separator.className = `panel-separator ${className}`;
        
        // Charger l'image de séparation
        const img = new Image();
        img.onload = () => {
            this.loadedAssets.separators[className] = img;
            console.log(`[App] ✓ pollenSeparation.png chargé pour ${className} (${img.width}x${img.height}px)`);
        };
        img.onerror = () => {
            console.warn(`[App] ⚠️  pollenSeparation.png introuvable pour ${className}`);
        };
        img.src = CONSTANTS.PATHS.BACKGROUNDS + 'pollenSeparation.png';
        
        return separator;
    },
    
    /**
     * Crée le background FIXE du panel filtres
     * filterBackground.png suit le scroll du panel
     */
    async createFiltersBackground() {
        const filtersPanel = document.getElementById('filters-panel');
        if (!filtersPanel) {
            console.error('[App] ❌ Panel filtres introuvable');
            return;
        }
        
        // Vérifier si le container existe déjà
        if (filtersPanel.querySelector('.filters-background-container')) {
            console.log('[App] ℹ️  Container background filtres déjà existant');
            return;
        }
        
        // Envelopper le contenu existant
        const content = document.createElement('div');
        content.className = 'filters-content';
        while (filtersPanel.firstChild) {
            content.appendChild(filtersPanel.firstChild);
        }
        
        // Créer le background fixe
        const filtersBg = document.createElement('div');
        filtersBg.className = 'filters-background-container';
        
        // Charger l'image pour vérification
        try {
            const img = await this.loadImage(CONSTANTS.PATHS.BACKGROUNDS + 'filterBackground.png');
            this.loadedAssets.backgrounds.filters = img;
            console.log(`[App] ✓ filterBackground.png chargé (${img.width}x${img.height}px)`);
        } catch (e) {
            console.warn('[App] ⚠️  filterBackground.png introuvable, utilisation fallback');
        }
        
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
        
        console.log('[App] ✓ Container background filtres créé (fixe avec scroll)');
    },
    
    /**
     * Charge une image de manière asynchrone
     * @param {string} src - Chemin de l'image
     * @returns {Promise<Image>} Image chargée
     */
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Échec chargement: ${src}`));
            img.src = src;
        });
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
        
        // Log des assets chargés
        this.logLoadedAssets();
    },
    
    /**
     * Log détaillé des assets chargés
     */
    logLoadedAssets() {
        console.log('%c[App] 📦 Assets chargés:', 'color: #6b9464; font-weight: bold;');
        
        // Backgrounds
        const bgCount = Object.keys(this.loadedAssets.backgrounds).length;
        console.log(`  🖼️  Backgrounds: ${bgCount}/2`);
        if (this.loadedAssets.backgrounds.left) {
            console.log('    ✓ leftBackground.png');
        } else {
            console.log('    ✗ leftBackground.png');
        }
        if (this.loadedAssets.backgrounds.filters) {
            console.log('    ✓ filterBackground.png');
        } else {
            console.log('    ✗ filterBackground.png');
        }
        
        // Séparateurs
        const sepCount = Object.keys(this.loadedAssets.separators).length;
        console.log(`  🔗 Séparateurs: ${sepCount}/2`);
        if (this.loadedAssets.separators['top-separator']) {
            console.log('    ✓ pollenSeparation.png (top)');
        } else {
            console.log('    ✗ pollenSeparation.png (top)');
        }
        if (this.loadedAssets.separators['bottom-separator']) {
            console.log('    ✓ pollenSeparation.png (bottom)');
        } else {
            console.log('    ✗ pollenSeparation.png (bottom)');
        }
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
    
    /**
     * Masque l'écran de chargement avec transition
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
     * Affiche un message d'erreur
     * @param {Error} error - Erreur à afficher
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
        console.log('[App] 🧹 Nettoyage de l\'application...');
        
        if (Visuals) Visuals.destroy();
        if (PollenPanel) PollenPanel.destroy();
        AppState.stopPlaying();
        
        this.initialized = false;
        this.loadedAssets = { backgrounds: {}, separators: {} };
        
        console.log('[App] ✓ Application nettoyée');
    }
};