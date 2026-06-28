// ScrollVelocity.js

class ScrollVelocity {
    constructor(element, options = {}) {
        this.element = typeof element === 'string' ? document.querySelector(element) : element;
        this.texts = options.texts || ['Website Developer', 'Designer', 'Editor'];
        this.velocity = options.velocity || 2;
        this.numCopies = options.numCopies || 6;
        this.className = options.className || '';
        
        this.targetVelocity = 0;
        this.currentVelocity = 0;
        
        this.lastScrollY = window.scrollY;
        this.lastTime = performance.now();
        this.lastFrameTime = performance.now();
        
        this.init();
    }
    
    init() {
        this.element.innerHTML = '';
        this.element.className = 'scroll-velocity-section';
        this.scrollers = [];
        
        this.texts.forEach((text, index) => {
            const parallax = document.createElement('div');
            parallax.className = 'parallax';
            
            const scroller = document.createElement('div');
            scroller.className = 'scroller';
            
            const baseVel = index % 2 !== 0 ? -this.velocity : this.velocity;
            
            for (let i = 0; i < this.numCopies; i++) {
                const span = document.createElement('span');
                span.className = this.className;
                span.innerHTML = text + '&nbsp;';
                scroller.appendChild(span);
            }
            
            parallax.appendChild(scroller);
            this.element.appendChild(parallax);
            
            this.scrollers.push({
                el: scroller,
                baseX: 0,
                baseVel: baseVel,
                direction: 1,
                spanWidth: 0
            });
        });
        
        // Initial measurement
        setTimeout(() => this.measure(), 100);
        window.addEventListener('resize', () => this.measure());
        
        window.addEventListener('scroll', () => this.onScroll(), { passive: true });
        
        requestAnimationFrame((t) => this.tick(t));
    }
    
    measure() {
        this.scrollers.forEach(s => {
            const span = s.el.querySelector('span');
            s.spanWidth = span ? span.offsetWidth : 0;
        });
    }
    
    onScroll() {
        const now = performance.now();
        const scrollY = window.scrollY;
        const dt = now - this.lastTime;
        
        if (dt > 0) {
            const deltaY = scrollY - this.lastScrollY;
            const velocityY = (deltaY / dt) * 1000;
            this.targetVelocity = velocityY;
        }
        
        this.lastScrollY = scrollY;
        this.lastTime = now;
    }
    
    tick(time) {
        const dt = time - this.lastFrameTime;
        this.lastFrameTime = time;
        
        if (dt > 100) {
            requestAnimationFrame((t) => this.tick(t));
            return;
        }
        
        if (performance.now() - this.lastTime > 50) {
             this.targetVelocity = 0;
        }
        
        this.currentVelocity += (this.targetVelocity - this.currentVelocity) * 0.1;
        
        const vel = this.currentVelocity;
        const velMag = Math.abs(vel);
        let factor = (velMag / 1000) * 5;
        if (factor > 5) factor = 5;
        
        const velocityFactor = Math.sign(vel) * factor;
        
        this.scrollers.forEach(s => {
            if (s.spanWidth === 0) return;
            
            let moveBy = s.direction * s.baseVel * (dt / 16);
            
            if (velocityFactor < 0) {
                s.direction = -1;
            } else if (velocityFactor > 0) {
                s.direction = 1;
            }
            
            moveBy += s.direction * (s.baseVel * (dt / 16)) * Math.abs(velocityFactor);
            
            s.baseX += moveBy;
            
            const wrap = (v, min, max) => {
                const range = max - min;
                return ((((v - min) % range) + range) % range) + min;
            };
            
            const x = wrap(s.baseX, -s.spanWidth, 0);
            
            s.el.style.transform = `translate3d(${x}px, 0, 0)`;
        });
        
        requestAnimationFrame((t) => this.tick(t));
    }
}
