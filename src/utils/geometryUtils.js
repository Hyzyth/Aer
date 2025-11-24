// GeometryUtils.js - Fonctions de calcul géométrique et spatial

const GeometryUtils = {
    // Convertir des coordonnées polaires en cartésiennes
    polarToCartesian(centerX, centerY, radius, angleInRadians) {
        return {
            x: centerX + radius * Math.cos(angleInRadians),
            y: centerY + radius * Math.sin(angleInRadians)
        };
    },
    
    // Convertir des coordonnées cartésiennes en polaires
    cartesianToPolar(centerX, centerY, x, y) {
        const dx = x - centerX;
        const dy = y - centerY;
        return {
            radius: Math.sqrt(dx * dx + dy * dy),
            angle: Math.atan2(dy, dx)
        };
    },
    
    // Calculer la distance entre deux points
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },
    
    // Calculer l'angle entre deux points
    angleBetween(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },
    
    // Interpoler entre deux points
    lerpPoint(p1, p2, t) {
        return {
            x: p1.x + (p2.x - p1.x) * t,
            y: p1.y + (p2.y - p1.y) * t
        };
    },
    
    // Créer un arc de cercle (retourne des points)
    createArc(centerX, centerY, radius, startAngle, endAngle, segments = 20) {
        const points = [];
        const angleStep = (endAngle - startAngle) / segments;
        
        for (let i = 0; i <= segments; i++) {
            const angle = startAngle + angleStep * i;
            points.push(this.polarToCartesian(centerX, centerY, radius, angle));
        }
        
        return points;
    },
    
    // Créer une courbe de Bézier cubique
    cubicBezier(p0, p1, p2, p3, t) {
        const u = 1 - t;
        const tt = t * t;
        const uu = u * u;
        const uuu = uu * u;
        const ttt = tt * t;
        
        return {
            x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
            y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
        };
    },
    
    // Créer une courbe lissée passant par des points
    createSmoothCurve(points, tension = 0.5) {
        if (points.length < 3) return points;
        
        const smoothPoints = [];
        smoothPoints.push(points[0]);
        
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[Math.max(0, i - 1)];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[Math.min(points.length - 1, i + 2)];
            
            // Points de contrôle pour la courbe de Bézier
            const cp1 = {
                x: p1.x + (p2.x - p0.x) * tension,
                y: p1.y + (p2.y - p0.y) * tension
            };
            const cp2 = {
                x: p2.x - (p3.x - p1.x) * tension,
                y: p2.y - (p3.y - p1.y) * tension
            };
            
            // Générer des points intermédiaires
            for (let t = 0; t <= 1; t += 0.1) {
                const point = this.cubicBezier(p1, cp1, cp2, p2, t);
                smoothPoints.push(point);
            }
        }
        
        return smoothPoints;
    },
    
    // Vérifier si un point est dans un rectangle
    pointInRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    },
    
    // Vérifier si un point est dans un cercle
    pointInCircle(px, py, cx, cy, radius) {
        return this.distance(px, py, cx, cy) <= radius;
    },
    
    // Contraindre un point dans des limites
    constrainPoint(point, minX, minY, maxX, maxY) {
        return {
            x: Math.max(minX, Math.min(maxX, point.x)),
            y: Math.max(minY, Math.min(maxY, point.y))
        };
    },
    
    // Calculer le centre d'un ensemble de points
    getCentroid(points) {
        if (!points || points.length === 0) {
            return { x: 0, y: 0 };
        }
        
        const sum = points.reduce((acc, p) => ({
            x: acc.x + p.x,
            y: acc.y + p.y
        }), { x: 0, y: 0 });
        
        return {
            x: sum.x / points.length,
            y: sum.y / points.length
        };
    },
    
    // Rotation d'un point autour d'un centre
    rotatePoint(point, center, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const dx = point.x - center.x;
        const dy = point.y - center.y;
        
        return {
            x: center.x + dx * cos - dy * sin,
            y: center.y + dx * sin + dy * cos
        };
    },
    
    // Échelle d'un point depuis un centre
    scalePoint(point, center, scale) {
        return {
            x: center.x + (point.x - center.x) * scale,
            y: center.y + (point.y - center.y) * scale
        };
    },
    
    // Calculer les limites d'un ensemble de points
    getBounds(points) {
        if (!points || points.length === 0) {
            return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
        }
        
        const xs = points.map(p => p.x);
        const ys = points.map(p => p.y);
        
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        
        return {
            minX, minY, maxX, maxY,
            width: maxX - minX,
            height: maxY - minY
        };
    },
    
    // Générer des points aléatoires dans une forme
    generateRandomPointsInCircle(centerX, centerY, radius, count) {
        const points = [];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.sqrt(Math.random()) * radius;
            points.push(this.polarToCartesian(centerX, centerY, r, angle));
        }
        return points;
    },
    
    // Normaliser un angle entre 0 et 2π
    normalizeAngle(angle) {
        while (angle < 0) angle += Math.PI * 2;
        while (angle >= Math.PI * 2) angle -= Math.PI * 2;
        return angle;
    },
    
    // Calculer la différence angulaire la plus courte
    angleDistance(angle1, angle2) {
        angle1 = this.normalizeAngle(angle1);
        angle2 = this.normalizeAngle(angle2);
        
        let diff = angle2 - angle1;
        if (diff > Math.PI) diff -= Math.PI * 2;
        if (diff < -Math.PI) diff += Math.PI * 2;
        
        return diff;
    }
};