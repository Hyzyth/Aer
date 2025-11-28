/**
 * controls.js - Gestion des contrôles de l'interface utilisateur
 * Version optimisée avec nouvelle organisation
 */

const Controls = {
    elements: {},
    
    /**
     * Initialise tous les contrôles
     */
    initialize() {
        console.log('[Controls] 🎮 Initialisation...');
        
        this.elements = {
            modeSelector: document.getElementById('mode-selector'),
            yearSelector: document.getElementById('year-selector'),
            resetBtn: document.getElementById('reset-btn'),
            exportBtn: document.getElementById('export-btn'),
            backwardBtn: document.getElementById('backward-btn'),
            playPauseBtn: document.getElementById('play-pause-btn'),
            forwardBtn: document.getElementById('forward-btn'),
            timelineSlider: document.getElementById('timeline-slider'),
            dateDisplay: document.getElementById('date-display')
        };
        
        this.setupModeSelector();
        this.setupYearSelector();
        this.setupTimelineWithBar();
        this.setupTimelineControls();
        this.setupActionButtons();
        
        // Écouteurs d'événements
        AppState.addListener('zone', () => this.updateTimelineDisplay());
        AppState.addListener('year', () => this.updateTimelineDisplay());
        AppState.addListener('measures', () => this.updateTimelineDisplay());
        AppState.addListener('timeline', () => this.updateTimelineDisplay());
        AppState.addListener('playing', () => this.updatePlayButton());
        
        console.log('[Controls] ✓ Initialisés');
    },
    
    /**
     * Configure le sélecteur de mode (icônes seulement)
     */
    setupModeSelector() {
        const modes = [
            { id: CONSTANTS.MODES.RADIAL, icon: 'radial.png' },
            { id: CONSTANTS.MODES.GRID, icon: 'grid.png' },
            { id: CONSTANTS.MODES.AREA, icon: 'stream.png' }
        ];
        
        modes.forEach(mode => {
            const btn = document.createElement('button');
            btn.className = 'mode-btn';
            btn.dataset.mode = mode.id;
            
            const img = document.createElement('img');
            img.src = `${CONSTANTS.PATHS.UI_ICONS}${mode.icon}`;
            img.alt = mode.id;
            img.onerror = () => console.warn(`[Controls] ⚠️ Icône manquante: ${mode.icon}`);
            
            btn.appendChild(img);
            
            btn.addEventListener('click', () => {
                AppState.setMode(mode.id);
                this.updateModeButtons();
            });
            
            this.elements.modeSelector.appendChild(btn);
        });
        
        this.updateModeButtons();
        AppState.addListener('mode', () => this.updateModeButtons());
        console.log('[Controls] ✓ Modes configurés');
    },
    
    updateModeButtons() {
        const buttons = this.elements.modeSelector.querySelectorAll('.mode-btn');
        buttons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === AppState.selectedMode);
        });
    },
    
    /**
     * Configure le sélecteur d'année
     */
    setupYearSelector() {
        const select = document.createElement('select');
        
        AppState.years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            select.appendChild(option);
        });
        
        const defaultYear = AppState.getDefaultYear();
        if (defaultYear) {
            select.value = defaultYear;
            AppState.setSelectedYear(defaultYear);
        }
        
        select.addEventListener('change', (e) => {
            AppState.setSelectedYear(parseInt(e.target.value));
        });
        
        this.elements.yearSelector.appendChild(select);
        console.log('[Controls] ✓ Sélecteur d\'année configuré');
    },
    
    /**
     * Configure la timeline avec les backgrounds
     */
    setupTimelineWithBar() {
        let container = document.getElementById('timeline-slider-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'timeline-slider-container';
            const controlsBottom = document.getElementById('controls-bottom');
            controlsBottom.appendChild(container);
        }
        
        container.innerHTML = '';
        
        // Background
        const background = document.createElement('div');
        background.className = 'timeline-background';
        container.appendChild(background);
        
        // Barre pleine
        const timelineBar = document.createElement('div');
        timelineBar.className = 'timeline-bar';
        container.appendChild(timelineBar);
        
        // Slider
        const slider = this.elements.timelineSlider;
        if (slider && slider.parentElement) {
            container.appendChild(slider);
        }
        
        console.log('[Controls] ✓ Timeline configurée');
    },
    
    /**
     * Configure les contrôles temporels
     */
    setupTimelineControls() {
        this.elements.backwardBtn.addEventListener('click', () => {
            AppState.previousMeasure();
        });
        
        this.elements.playPauseBtn.addEventListener('click', () => {
            AppState.togglePlaying();
        });
        
        this.elements.forwardBtn.addEventListener('click', () => {
            AppState.nextMeasure();
        });
        
        this.elements.timelineSlider.addEventListener('input', (e) => {
            const index = parseInt(e.target.value);
            AppState.setMeasureIndex(index);
            AppState.stopPlaying();
        });
        
        this.updateTimelineDisplay();
    },
    
    /**
     * Configure les boutons d'action
     */
    setupActionButtons() {
        this.elements.resetBtn.addEventListener('click', () => {
            console.log('[Controls] 🔄 Reset demandé');
            AppState.reset();
        });
        
        this.elements.exportBtn.addEventListener('click', () => {
            console.log('[Controls] 📥 Export demandé');
            ExportPanel.exportVisualization();
        });
    },
    
    /**
     * Met à jour l'affichage de la timeline
     */
    updateTimelineDisplay() {
        const maxIndex = AppState.currentMeasures.length - 1;
        
        // Mise à jour du slider
        this.elements.timelineSlider.max = maxIndex;
        this.elements.timelineSlider.value = AppState.currentMeasureIndex;
        
        // Affichage de la date
        const currentMeasure = AppState.getCurrentMeasure();
        if (currentMeasure) {
            this.elements.dateDisplay.textContent = DataUtils.formatDate(currentMeasure.date_ech, 'full');
        } else {
            this.elements.dateDisplay.textContent = 'Sélectionnez une zone';
        }
        
        // État des boutons
        this.elements.backwardBtn.disabled = AppState.currentMeasureIndex <= 0;
        this.elements.forwardBtn.disabled = AppState.currentMeasureIndex >= maxIndex;
        this.elements.playPauseBtn.disabled = maxIndex < 0;
    },
    
    /**
     * Met à jour le bouton play/pause
     */
    updatePlayButton() {
        const img = this.elements.playPauseBtn.querySelector('img');
        if (AppState.isPlaying) {
            img.src = `${CONSTANTS.PATHS.UI_ICONS}pause.png`;
            img.alt = 'Pause';
        } else {
            img.src = `${CONSTANTS.PATHS.UI_ICONS}play.png`;
            img.alt = 'Play';
        }
    }
};