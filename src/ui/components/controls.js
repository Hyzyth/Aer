/**
 * controls.js - Gestion des contrôles de l'interface utilisateur
 * 
 * Timeline: timeBar.png reste toujours à 100% de largeur
 */

const Controls = {
    elements: {},
    
    /**
     * Initialise tous les contrôles
     */
    initialize() {
        console.log('[Controls] Initialisation...');
        
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
        
        // Écouter les changements d'état
        AppState.addListener('zone', () => this.updateTimelineDisplay());
        AppState.addListener('year', () => this.updateTimelineDisplay());
        AppState.addListener('measures', () => this.updateTimelineDisplay());
        AppState.addListener('timeline', () => this.updateTimelineDisplay());
        AppState.addListener('playing', () => this.updatePlayButton());
        
        console.log('[Controls] ✓ Initialisés avec succès');
    },
    
    setupModeSelector() {
        const modes = [
            { id: CONSTANTS.MODES.RADIAL, icon: 'radial.png', label: 'Radial' },
            { id: CONSTANTS.MODES.GRID, icon: 'grid.png', label: 'Grille' },
            { id: CONSTANTS.MODES.AREA, icon: 'stream.png', label: 'Flux' }
        ];
        
        modes.forEach(mode => {
            const btn = document.createElement('button');
            btn.className = 'mode-btn';
            btn.dataset.mode = mode.id;
            
            const img = document.createElement('img');
            img.src = `${CONSTANTS.PATHS.UI_ICONS}${mode.icon}`;
            img.alt = mode.label;
            
            const span = document.createElement('span');
            span.textContent = mode.label;
            
            btn.appendChild(img);
            btn.appendChild(span);
            
            btn.addEventListener('click', () => {
                AppState.setMode(mode.id);
                this.updateModeButtons();
            });
            
            this.elements.modeSelector.appendChild(btn);
        });
        
        this.updateModeButtons();
    },
    
    updateModeButtons() {
        const buttons = this.elements.modeSelector.querySelectorAll('.mode-btn');
        buttons.forEach(btn => {
            if (btn.dataset.mode === AppState.selectedMode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    },
    
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
    },
    
    /**
     * Configure la timeline - timeBar.png RESTE TOUJOURS 100%
     */
    setupTimelineWithBar() {
        let container = document.getElementById('timeline-slider-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'timeline-slider-container';
            
            const controlsBottom = document.getElementById('controls-bottom');
            const timelineControls = document.getElementById('timeline-controls');
            
            if (timelineControls && timelineControls.nextSibling) {
                controlsBottom.insertBefore(container, timelineControls.nextSibling);
            } else {
                controlsBottom.appendChild(container);
            }
        }
        
        container.innerHTML = '';
        
        // 1. Background (timeBackground.png)
        const background = document.createElement('div');
        background.className = 'timeline-background';
        container.appendChild(background);
        
        // 2. Barre TOUJOURS PLEINE (timeBar.png) - PAS de changement de width
        const timelineBar = document.createElement('div');
        timelineBar.className = 'timeline-bar';
        // PAS de style.width = '0%' - reste toujours 100% via CSS
        container.appendChild(timelineBar);
        
        // 3. Slider avec timeDot.png
        const slider = this.elements.timelineSlider;
        if (slider && slider.parentElement) {
            container.appendChild(slider);
        }
        
        console.log('[Controls] ✓ Timeline configurée (timeBar.png toujours pleine)');
    },
    
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
    
    setupActionButtons() {
        this.elements.resetBtn.addEventListener('click', () => {
            console.log('[Controls] Reset demandé');
            AppState.reset();
        });
        
        this.elements.exportBtn.addEventListener('click', () => {
            console.log('[Controls] Export demandé');
            ExportPanel.exportVisualization();
        });
    },
    
    /**
     * Met à jour l'affichage de la timeline
     * NOTE: timeBar.png reste toujours pleine, seul le slider bouge
     */
    updateTimelineDisplay() {
        const maxIndex = AppState.currentMeasures.length - 1;
        
        // Mettre à jour le slider
        this.elements.timelineSlider.max = maxIndex;
        this.elements.timelineSlider.value = AppState.currentMeasureIndex;
        
        // PAS de mise à jour de la largeur de timeBar - elle reste toujours 100%
        
        // Mettre à jour l'affichage de la date
        const currentMeasure = AppState.getCurrentMeasure();
        if (currentMeasure) {
            const dateText = DataUtils.formatDate(currentMeasure.date_ech, 'full');
            this.elements.dateDisplay.textContent = dateText;
        } else {
            this.elements.dateDisplay.textContent = 'Sélectionnez une zone';
        }
        
        // Activer/désactiver les boutons
        this.elements.backwardBtn.disabled = AppState.currentMeasureIndex <= 0;
        this.elements.forwardBtn.disabled = AppState.currentMeasureIndex >= maxIndex;
        this.elements.playPauseBtn.disabled = maxIndex < 0;
    },
    
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