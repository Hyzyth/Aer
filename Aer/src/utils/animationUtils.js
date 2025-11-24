// AnimationUtils.js - Fonctions d'easing et d'interpolation pour les animations

const AnimationUtils = {
    // Fonctions d'easing
    easing: {
        linear: t => t,
        
        easeInQuad: t => t * t,
        easeOutQuad: t => t * (2 - t),
        easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        
        easeInCubic: t => t * t * t,
        easeOutCubic: t => (--t) * t * t + 1,
        easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
        
        easeInQuart: t => t * t * t * t,
        easeOutQuart: t => 1 - (--t) * t * t * t,
        easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
        
        easeInSine: t => 1 - Math.cos(t * Math.PI / 2),
        easeOutSine: t => Math.sin(t * Math.PI / 2),
        easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
        
        easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
        easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
        easeInOutExpo: t => {
            if (t === 0) return 0;
            if (t === 1) return 1;
            return t < 0.5 
                ? Math.pow(2, 20 * t - 10) / 2
                : (2 - Math.pow(2, -20 * t + 10)) / 2;
        }
    },
    
    // Interpoler une valeur entre deux nombres
    lerp(start, end, t) {
        return start + (end - start) * t;
    },
    
    // Interpoler avec easing
    lerpWithEasing(start, end, t, easingFunction = 'easeInOutCubic') {
        const easedT = this.easing[easingFunction] 
            ? this.easing[easingFunction](t) 
            : this.easing.easeInOutCubic(t);
        return this.lerp(start, end, easedT);
    },
    
    // Créer un animator pour gérer les transitions
    createAnimator(duration, easingFunction = 'easeInOutCubic') {
        return {
            startTime: null,
            duration: duration,
            easingFunction: easingFunction,
            isComplete: false,
            
            start() {
                this.startTime = Date.now();
                this.isComplete = false;
            },
            
            getProgress() {
                if (!this.startTime) return 0;
                const elapsed = Date.now() - this.startTime;
                const progress = Math.min(1, elapsed / this.duration);
                
                if (progress >= 1) {
                    this.isComplete = true;
                }
                
                return AnimationUtils.easing[this.easingFunction](progress);
            },
            
            getValue(start, end) {
                const progress = this.getProgress();
                return AnimationUtils.lerp(start, end, progress);
            },
            
            reset() {
                this.startTime = null;
                this.isComplete = false;
            }
        };
    },
    
    // Créer une transition douce entre valeurs
    createSmoothTransition(initialValue) {
        return {
            current: initialValue,
            target: initialValue,
            speed: 0.1,
            
            setTarget(newTarget) {
                this.target = newTarget;
            },
            
            update() {
                const diff = this.target - this.current;
                if (Math.abs(diff) > 0.01) {
                    this.current += diff * this.speed;
                } else {
                    this.current = this.target;
                }
                return this.current;
            },
            
            getValue() {
                return this.current;
            },
            
            isAtTarget() {
                return Math.abs(this.target - this.current) < 0.01;
            }
        };
    },
    
    // Oscillateur sinusoïdal pour effets de vague
    createOscillator(amplitude, frequency, phase = 0) {
        let time = phase;
        
        return {
            getValue() {
                return Math.sin(time * frequency) * amplitude;
            },
            
            update(deltaTime = 0.1) {
                time += deltaTime;
                return this.getValue();
            },
            
            reset() {
                time = phase;
            }
        };
    },
    
    // Gestionnaire de délai
    createDelayTimer(delay) {
        return {
            startTime: null,
            delay: delay,
            
            start() {
                this.startTime = Date.now();
            },
            
            isComplete() {
                if (!this.startTime) return false;
                return (Date.now() - this.startTime) >= this.delay;
            },
            
            reset() {
                this.startTime = null;
            }
        };
    },
    
    // Séquenceur d'animations
    createSequence(steps) {
        return {
            steps: steps,
            currentStep: 0,
            currentAnimator: null,
            
            start() {
                this.currentStep = 0;
                if (this.steps.length > 0) {
                    this.currentAnimator = AnimationUtils.createAnimator(
                        this.steps[0].duration,
                        this.steps[0].easing || 'easeInOutCubic'
                    );
                    this.currentAnimator.start();
                }
            },
            
            update() {
                if (!this.currentAnimator || this.currentStep >= this.steps.length) {
                    return null;
                }
                
                if (this.currentAnimator.isComplete) {
                    this.currentStep++;
                    if (this.currentStep < this.steps.length) {
                        this.currentAnimator = AnimationUtils.createAnimator(
                            this.steps[this.currentStep].duration,
                            this.steps[this.currentStep].easing || 'easeInOutCubic'
                        );
                        this.currentAnimator.start();
                    }
                }
                
                return {
                    step: this.currentStep,
                    progress: this.currentAnimator ? this.currentAnimator.getProgress() : 1,
                    isComplete: this.currentStep >= this.steps.length
                };
            },
            
            getCurrentStep() {
                return this.steps[this.currentStep];
            }
        };
    }
};