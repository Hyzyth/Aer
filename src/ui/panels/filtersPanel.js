/**
 * filtersPanel.js - Gestion des filtres de pollens
 * 
 * Background uniforme filterBackground.png pour tout le panel
 * Pas de gaps/padding/margin entre les familles
 */
const FiltersPanel = {
    container: null,
    
    /**
     * Initialise le panneau des filtres
     */
    initialize() {
        console.log('[FiltersPanel] Initialisation...');
        this.container = document.getElementById('filters-panel');
        this.render();
        
        // Écouter les changements de pollens
        AppState.addListener('pollens', () => this.render());
    },
    
    /**
     * Rend l'interface des filtres avec les familles de pollens
     */
    render() {
        this.container.innerHTML = '';
        
        // Titre du panneau
        const title = document.createElement('div');
        title.className = 'filters-title';
        title.textContent = 'Filtres des pollens';
        this.container.appendChild(title);
        
        // Parcourir les familles dans l'ordre alphabétique
        ORDERED_FAMILIES.forEach(familyKey => {
            const family = POLLEN_GROUPS[familyKey];
            const isActive = AppState.activePollenFamilies.has(familyKey);
            
            // Créer le conteneur de la famille (sans background individuel)
            const familyContainer = document.createElement('div');
            familyContainer.className = isActive 
                ? 'pollen-family-container active'
                : 'pollen-family-container inactive';
            
            // Définir les couleurs via CSS variables
            familyContainer.style.setProperty('--family-color', getFamilyColor(familyKey));
            
            // Titre de la famille
            const titleDiv = document.createElement('div');
            titleDiv.className = 'pollen-family-title';
            
            const titleText = document.createElement('span');
            titleText.textContent = family.name;
            titleDiv.appendChild(titleText);
            
            // Indicateur actif/inactif
            const indicator = document.createElement('span');
            indicator.className = 'family-indicator';
            indicator.textContent = isActive ? '✓' : '×';
            titleDiv.appendChild(indicator);
            
            familyContainer.appendChild(titleDiv);
            
            // Espèces de la famille
            const speciesContainer = document.createElement('div');
            speciesContainer.className = 'species-container';
            
            family.species.forEach(pollen => {
                const speciesDiv = document.createElement('div');
                speciesDiv.className = isActive ? 'pollen-species active' : 'pollen-species inactive';
                
                // Puce colorée
                const bullet = document.createElement('span');
                bullet.className = 'species-bullet';
                bullet.style.backgroundColor = isActive ? getPollenColor(pollen) : '#ccc';
                speciesDiv.appendChild(bullet);
                
                const text = document.createElement('span');
                text.textContent = pollen.toUpperCase();
                speciesDiv.appendChild(text);
                
                speciesContainer.appendChild(speciesDiv);
            });
            
            familyContainer.appendChild(speciesContainer);
            
            // Événement de clic sur toute la zone
            familyContainer.addEventListener('click', () => {
                AppState.togglePollenFamily(familyKey);
            });
            
            this.container.appendChild(familyContainer);
        });
        
        // Message d'aide
        const helpText = document.createElement('div');
        helpText.className = 'filters-help';
        helpText.textContent = 'Cliquez sur une famille pour activer/désactiver tous ses pollens';
        this.container.appendChild(helpText);
        
        console.log(`[FiltersPanel] ${ORDERED_FAMILIES.length} familles affichées`);
    }
};