// ColorUtils.js - Fonctions utilitaires pour la manipulation des couleurs

const ColorUtils = {
    // Convertir hex en RGB
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },
    
    // Convertir RGB en hex
    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },
    
    // Interpoler entre deux couleurs
    interpolateColor(color1, color2, factor) {
        factor = Math.max(0, Math.min(1, factor));
        
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        
        if (!c1 || !c2) return color1;
        
        const r = Math.round(c1.r + (c2.r - c1.r) * factor);
        const g = Math.round(c1.g + (c2.g - c1.g) * factor);
        const b = Math.round(c1.b + (c2.b - c1.b) * factor);
        
        return this.rgbToHex(r, g, b);
    },
    
    // Obtenir une couleur depuis une échelle de dégradé
    getColorFromScale(value, min, max, colorScale) {
        if (value <= min) return colorScale[0];
        if (value >= max) return colorScale[colorScale.length - 1];
        
        const normalized = (value - min) / (max - min);
        const index = normalized * (colorScale.length - 1);
        const lowerIndex = Math.floor(index);
        const upperIndex = Math.ceil(index);
        const factor = index - lowerIndex;
        
        return this.interpolateColor(
            colorScale[lowerIndex],
            colorScale[upperIndex],
            factor
        );
    },
    
    // Assombrir une couleur
    darken(color, amount) {
        const rgb = this.hexToRgb(color);
        if (!rgb) return color;
        
        const r = Math.max(0, Math.round(rgb.r * (1 - amount)));
        const g = Math.max(0, Math.round(rgb.g * (1 - amount)));
        const b = Math.max(0, Math.round(rgb.b * (1 - amount)));
        
        return this.rgbToHex(r, g, b);
    },
    
    // Éclaircir une couleur
    lighten(color, amount) {
        const rgb = this.hexToRgb(color);
        if (!rgb) return color;
        
        const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * amount));
        const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * amount));
        const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * amount));
        
        return this.rgbToHex(r, g, b);
    },
    
    // Convertir une couleur en format rgba
    toRgba(color, alpha) {
        const rgb = this.hexToRgb(color);
        if (!rgb) return `rgba(0, 0, 0, ${alpha})`;
        
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    },
    
    // Obtenir une palette dégradée entre plusieurs couleurs
    createGradientPalette(colors, steps) {
        const palette = [];
        const segmentSteps = Math.floor(steps / (colors.length - 1));
        
        for (let i = 0; i < colors.length - 1; i++) {
            for (let j = 0; j < segmentSteps; j++) {
                const factor = j / segmentSteps;
                palette.push(this.interpolateColor(colors[i], colors[i + 1], factor));
            }
        }
        
        palette.push(colors[colors.length - 1]);
        return palette;
    },
    
    // Calculer le contraste entre deux couleurs
    getContrast(color1, color2) {
        const rgb1 = this.hexToRgb(color1);
        const rgb2 = this.hexToRgb(color2);
        
        if (!rgb1 || !rgb2) return 0;
        
        const l1 = 0.2126 * rgb1.r + 0.7152 * rgb1.g + 0.0722 * rgb1.b;
        const l2 = 0.2126 * rgb2.r + 0.7152 * rgb2.g + 0.0722 * rgb2.b;
        
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        
        return (lighter + 0.05) / (darker + 0.05);
    },
    
    // Obtenir une couleur de texte contrastée
    getContrastingTextColor(bgColor) {
        const rgb = this.hexToRgb(bgColor);
        if (!rgb) return '#000000';
        
        const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }
};