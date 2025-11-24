/**
 * pollenPanel.js - Affichage morphique des pollens avec transitions fluides
 * 
 * FONCTIONNALITÉS:
 * - Sélection VRAIMENT aléatoire des variantes d'icônes
 * - Fade in/out fluide lors des activations/désactivations
 * - Orbite élégante autour du centre
 * - Logs détaillés pour le debugging
 */

const PollenPanel = {
    canvas: null,
    ctx: null,
    images: {}, // Cache {familyKey: [{img, index}, ...]}
    backgroundImage: null,
    activeImages: new Map(), // familyKey -> {img, iconIndex, x, y, targetX, targetY, vx, vy, opacity, fadingOut}
    animationFrame: null,
    isInitialized: false,
    backgroundLoaded: false,
    orbitAngle: 0,
    
    /**
     * Initialise le panneau des pollens
     */
    initialize() {
        console.log('%c[PollenPanel] 🌸 Initialisation...', 'color: #6b9464; font-weight: bold;');
        this.container = document.getElementById('pollen-display');
        this.setupCanvas();
        this.loadBackgroundImage();
        this.loadAllImages();
        
        AppState.addListener('pollens', () => this.onPollensChanged());
    },
    
    /**
     * Configure le canvas
     */
    setupCanvas() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    },
    
    /**
     * Redimensionne le canvas
     */
    resize() {
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        if (this.isInitialized) {
            this.updateTargetPositions();
        }
    },
    
    /**
     * Charge l'image de fond
     */
    loadBackgroundImage() {
        this.backgroundImage = new Image();
        this.backgroundImage.onload = () => {
            this.backgroundLoaded = true;
            console.log('[PollenPanel] ✓ Background chargé: pollenBackground.png');
        };
        this.backgroundImage.onerror = () => {
            console.warn('[PollenPanel] ✗ Background introuvable: pollenBackground.png');
            this.backgroundLoaded = false;
        };
        this.backgroundImage.src = CONSTANTS.PATHS.BACKGROUNDS + 'pollenBackground.png';
    },
    
    /**
     * Charge TOUTES les variantes d'images pour chaque famille
     */
    loadAllImages() {
        const families = Object.keys(POLLEN_GROUPS);
        let totalToLoad = 0;
        let loadedCount = 0;
        
        // Calculer le nombre total d'images à charger
        families.forEach(familyKey => {
            const iconCount = CONSTANTS.POLLEN_ICON_COUNTS[familyKey] || 1;
            totalToLoad += iconCount;
        });
        
        console.log(`[PollenPanel] 🔥 Chargement de ${totalToLoad} icônes de pollens...`);
        
        // Charger toutes les variantes pour chaque famille
        families.forEach(familyKey => {
            const iconCount = CONSTANTS.POLLEN_ICON_COUNTS[familyKey] || 1;
            this.images[familyKey] = [];
            
            for (let i = 1; i <= iconCount; i++) {
                const iconFileName = `${familyKey.toLowerCase()}_${i}.png`;
                const img = new Image();
                
                img.onload = () => {
                    this.images[familyKey].push({ img, index: i });
                    loadedCount++;
                    console.log(`[PollenPanel] ✓ ${iconFileName} (${loadedCount}/${totalToLoad})`);
                    
                    if (loadedCount === totalToLoad) {
                        this.onAllImagesLoaded();
                    }
                };
                
                img.onerror = () => {
                    console.warn(`[PollenPanel] ✗ ${iconFileName} introuvable`);
                    loadedCount++;
                    if (loadedCount === totalToLoad) {
                        this.onAllImagesLoaded();
                    }
                };
                
                img.src = CONSTANTS.PATHS.POLLEN_ICONS + iconFileName;
            }
        });
    },
    
    /**
     * Callback quand toutes les images sont chargées
     */
    onAllImagesLoaded() {
        const totalImages = Object.values(this.images).reduce((sum, arr) => sum + arr.length, 0);
        console.log(`%c[PollenPanel] ✅ ${totalImages} icônes chargées!`, 'color: #6b9464; font-weight: bold;');
        
        // Log détaillé des variantes disponibles
        Object.keys(this.images).forEach(family => {
            console.log(`  - ${family}: ${this.images[family].length} variante(s) disponible(s)`);
        });
        
        this.isInitialized = true;
        this.initializeActiveImages();
        this.animate();
    },
    
    /**
     * Sélectionne VRAIMENT aléatoirement une image pour une famille
     * IMPORTANT: Utilise Math.random() correctement pour éviter les répétitions
     */
    getRandomImageForFamily(familyKey) {
        const images = this.images[familyKey];
        if (!images || images.length === 0) {
            console.warn(`[PollenPanel] ⚠️ Aucune image disponible pour ${familyKey}`);
            return null;
        }
        
        // Sélection vraiment aléatoire avec Math.random()
        const randomIndex = Math.floor(Math.random() * images.length);
        const selected = images[randomIndex];
        
        console.log(`[PollenPanel] 🎲 ${familyKey}: variante ${selected.index}/${images.length} sélectionnée (index ${randomIndex})`);
        
        return {
            img: selected.img,
            iconIndex: selected.index
        };
    },
    
    /**
     * Initialise les images actives au démarrage
     */
    initializeActiveImages() {
        const activeFamilies = Array.from(AppState.activePollenFamilies);
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        console.log(`[PollenPanel] 🎨 Initialisation de ${activeFamilies.length} pollen(s) actif(s)`);
        
        activeFamilies.forEach(familyKey => {
            if (!this.activeImages.has(familyKey)) {
                const imageData = this.getRandomImageForFamily(familyKey);
                if (imageData) {
                    this.activeImages.set(familyKey, {
                        img: imageData.img,
                        iconIndex: imageData.iconIndex,
                        x: centerX,
                        y: centerY,
                        targetX: centerX,
                        targetY: centerY,
                        vx: 0,
                        vy: 0,
                        opacity: 0, // Fade in progressif
                        fadingOut: false
                    });
                    console.log(`[PollenPanel] ✓ ${familyKey} ajouté (variante ${imageData.iconIndex})`);
                }
            }
        });
        
        this.updateTargetPositions();
    },
    
    /**
     * Gère les changements de pollens actifs avec logs détaillés
     */
    onPollensChanged() {
        const activeFamilies = new Set(AppState.activePollenFamilies);
        const currentFamilies = new Set(this.activeImages.keys());
        
        console.log('[PollenPanel] 🔄 Changement de pollens détecté');
        console.log(`  Actifs: [${Array.from(activeFamilies).join(', ')}]`);
        console.log(`  Actuels: [${Array.from(currentFamilies).join(', ')}]`);
        
        // Nouvelles activations - NOUVELLE IMAGE ALÉATOIRE à chaque fois
        activeFamilies.forEach(family => {
            if (!currentFamilies.has(family)) {
                console.log(`[PollenPanel] ➕ Activation: ${family}`);
                const imageData = this.getRandomImageForFamily(family);
                if (imageData) {
                    const centerX = this.canvas.width / 2;
                    const centerY = this.canvas.height / 2;
                    
                    this.activeImages.set(family, {
                        img: imageData.img,
                        iconIndex: imageData.iconIndex,
                        x: centerX,
                        y: centerY,
                        targetX: centerX,
                        targetY: centerY,
                        vx: 0,
                        vy: 0,
                        opacity: 0, // Fade in progressif
                        fadingOut: false
                    });
                    console.log(`[PollenPanel] ✓ ${family} ajouté avec succès (variante ${imageData.iconIndex})`);
                } else {
                    console.error(`[PollenPanel] ✗ Impossible d'ajouter ${family} - aucune image disponible`);
                }
            }
        });
        
        // Désactivations - Fade out
        currentFamilies.forEach(family => {
            if (!activeFamilies.has(family)) {
                const imageData = this.activeImages.get(family);
                if (imageData && !imageData.fadingOut) {
                    console.log(`[PollenPanel] ➖ Désactivation: ${family} - Démarrage fade out`);
                    imageData.fadingOut = true;
                }
            }
        });
        
        this.updateTargetPositions();
    },
    
    /**
     * Met à jour les positions cibles pour l'orbite
     */
    updateTargetPositions() {
        // Ne considérer que les images non en cours de fade out
        const activeFamilies = Array.from(this.activeImages.keys())
            .filter(f => !this.activeImages.get(f).fadingOut);
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        if (activeFamilies.length === 0) {
            return;
        }
        
        // Une seule image: centrer
        if (activeFamilies.length === 1) {
            const family = activeFamilies[0];
            const data = this.activeImages.get(family);
            if (data) {
                data.targetX = centerX;
                data.targetY = centerY;
                data.orbiting = false;
            }
        } else {
            // Plusieurs images: orbite elliptique
            const radiusX = Math.min(centerX, centerY) * 0.5;
            const radiusY = Math.min(centerX, centerY) * 0.8;
            
            activeFamilies.forEach((family, index) => {
                const data = this.activeImages.get(family);
                if (data) {
                    const angle = this.orbitAngle + (index / activeFamilies.length) * Math.PI * 2;
                    
                    data.targetX = centerX + Math.cos(angle) * radiusX;
                    data.targetY = centerY + Math.sin(angle) * radiusY;
                    data.orbiting = true;
                }
            });
        }
    },
    
    /**
     * Calcule l'échelle optimale pour les images
     */
    calculateImageScale() {
        const activeCount = Array.from(this.activeImages.keys())
            .filter(f => !this.activeImages.get(f).fadingOut).length;
        const maxSize = Math.min(this.canvas.width, this.canvas.height);
        
        if (activeCount === 1) {
            return maxSize * 0.6 / 400;
        } else if (activeCount === 2) {
            return maxSize * 0.4 / 400;
        } else {
            return maxSize * 0.3 / 400;
        }
    },
    
    /**
     * Boucle d'animation principale
     */
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dessiner le fond
        if (this.backgroundLoaded && this.backgroundImage) {
            this.ctx.drawImage(this.backgroundImage, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = PALETTE.UI.NATURE_LIGHT;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Mise à jour de l'angle d'orbite
        this.orbitAngle += 0.003;
        this.updateTargetPositions();
        
        const imagesToRemove = [];
        
        // Animer toutes les images actives
        this.activeImages.forEach((data, family) => {
            // Fade in ou fade out
            if (data.fadingOut) {
                data.opacity = Math.max(0, data.opacity - 0.05);
                if (data.opacity <= 0) {
                    imagesToRemove.push(family);
                }
            } else {
                data.opacity = Math.min(1, data.opacity + 0.05);
            }
            
            // Mouvement vers la cible avec inertie
            const dx = data.targetX - data.x;
            const dy = data.targetY - data.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 2) {
                const force = distance * 0.05;
                data.vx += (dx / distance) * force;
                data.vy += (dy / distance) * force;
                
                // Friction
                data.vx *= 0.85;
                data.vy *= 0.85;
                
                data.x += data.vx;
                data.y += data.vy;
            } else {
                data.x = data.targetX;
                data.y = data.targetY;
                data.vx = 0;
                data.vy = 0;
            }
            
            // Dessiner l'image
            this.drawImage(data.img, data.x, data.y, data.opacity);
        });
        
        // Supprimer les images complètement disparues
        imagesToRemove.forEach(family => {
            this.activeImages.delete(family);
            console.log(`[PollenPanel] 🗑️ ${family} complètement supprimé (fade out terminé)`);
        });
        
        this.animationFrame = requestAnimationFrame(() => this.animate());
    },
    
    /**
     * Dessine une image de pollen
     */
    drawImage(img, x, y, opacity = 1) {
        const scale = this.calculateImageScale();
        const imgWidth = img.width * scale;
        const imgHeight = img.height * scale;
        
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        this.ctx.drawImage(
            img,
            x - imgWidth / 2,
            y - imgHeight / 2,
            imgWidth,
            imgHeight
        );
        this.ctx.restore();
    },
    
    /**
     * Nettoie et détruit le panneau
     */
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        if (this.canvas && this.canvas.parentElement) {
            this.canvas.parentElement.removeChild(this.canvas);
        }
        console.log('[PollenPanel] 🛑 Détruit');
    }
};