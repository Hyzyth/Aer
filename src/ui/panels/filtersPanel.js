/**
 * filtersPanel.js - Gestion des filtres de pollens
 * Version simplifiée sans titres ni indicateurs V/X
 */
const FiltersPanel = {
    container: null,
    
    /**
     * Initialise le panneau des filtres
     */
    initialize() {
        console.log('[FiltersPanel] 🎨 Initialisation...');
        this.container = document.getElementById('filters-panel');
        this.render();
        
        AppState.addListener('pollens', () => this.render());
    },
    
    /**
     * Rend l'interface des filtres
     */
    render() {
        this.container.innerHTML = '';
        
        const content = document.createElement('div');
        content.className = 'filters-content';
        
        ORDERED_FAMILIES.forEach(familyKey => {
            const family = POLLEN_GROUPS[familyKey];
            const isActive = AppState.activePollenFamilies.has(familyKey);
            
            const familyContainer = document.createElement('div');
            familyContainer.className = isActive 
                ? 'pollen-family-container active'
                : 'pollen-family-container inactive';
            
            familyContainer.style.setProperty('--family-color', getFamilyColor(familyKey));
            
            // Titre de la famille
            const titleDiv = document.createElement('div');
            titleDiv.className = 'pollen-family-title';
            titleDiv.textContent = family.name;
            familyContainer.appendChild(titleDiv);
            
            // Espèces
            const speciesContainer = document.createElement('div');
            speciesContainer.className = 'species-container';
            
            family.species.forEach(pollen => {
                const speciesDiv = document.createElement('div');
                speciesDiv.className = 'pollen-species';
                
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
            
            familyContainer.addEventListener('click', () => {
                AppState.togglePollenFamily(familyKey);
            });
            
            content.appendChild(familyContainer);
        });
        
        this.container.appendChild(content);
        console.log(`[FiltersPanel] ✓ ${ORDERED_FAMILIES.length} familles affichées`);
    }
};