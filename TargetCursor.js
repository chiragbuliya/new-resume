// TargetCursor.js
const getContainingBlock = element => {
  let node = element?.parentElement;
  while (node && node !== document.documentElement) {
    const style = getComputedStyle(node);
    if (
      style.transform !== 'none' ||
      style.perspective !== 'none' ||
      style.filter !== 'none' ||
      style.willChange.includes('transform') ||
      style.willChange.includes('perspective') ||
      style.willChange.includes('filter') ||
      /paint|layout|strict|content/.test(style.contain)
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
};

const getContainingBlockOffset = block => {
  if (!block) return { x: 0, y: 0 };
  const rect = block.getBoundingClientRect();
  return { x: rect.left + block.clientLeft, y: rect.top + block.clientTop };
};

class TargetCursor {
  constructor(options = {}) {
    this.targetSelector = options.targetSelector || '.cursor-target';
    this.spinDuration = options.spinDuration || 2;
    this.hideDefaultCursor = options.hideDefaultCursor !== undefined ? options.hideDefaultCursor : true;
    this.hoverDuration = options.hoverDuration || 0.2;
    this.parallaxOn = options.parallaxOn !== undefined ? options.parallaxOn : true;
    this.cursorColor = options.cursorColor || '#ffffff';
    this.cursorColorOnTarget = options.cursorColorOnTarget || '#B497CF';
    
    this.constants = { borderWidth: 3, cornerSize: 12 };
    
    this.isActive = false;
    this.targetCornerPositions = null;
    this.activeStrength = { current: 0 };
    
    this.createDOM();
    this.bindEvents();
  }
  
  createDOM() {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'target-cursor-wrapper';
    
    this.dot = document.createElement('div');
    this.dot.className = 'target-cursor-dot';
    this.dot.style.backgroundColor = this.cursorColor;
    
    const createCorner = (className) => {
        const corner = document.createElement('div');
        corner.className = `target-cursor-corner ${className}`;
        corner.style.borderColor = this.cursorColor;
        return corner;
    };
    
    this.corners = [
        createCorner('corner-tl'),
        createCorner('corner-tr'),
        createCorner('corner-br'),
        createCorner('corner-bl')
    ];
    
    this.wrapper.appendChild(this.dot);
    this.corners.forEach(c => this.wrapper.appendChild(c));
    document.body.appendChild(this.wrapper);
    
    if (this.hideDefaultCursor) {
        document.body.style.cursor = 'none';
        const style = document.createElement('style');
        style.innerHTML = `* { cursor: none !important; }`;
        document.head.appendChild(style);
    }
    
    this.containingBlock = getContainingBlock(this.wrapper);
  }
  
  getOffset() {
    return getContainingBlockOffset(this.containingBlock);
  }
  
  bindEvents() {
    const initialOffset = this.getOffset();
    gsap.set(this.wrapper, {
      xPercent: -50,
      yPercent: -50,
      x: window.innerWidth / 2 - initialOffset.x,
      y: window.innerHeight / 2 - initialOffset.y
    });

    this.createSpinTimeline();
    
    this.tickerFn = () => {
      if (!this.targetCornerPositions || !this.wrapper || !this.corners) return;

      const strength = this.activeStrength.current;
      if (strength === 0) return;

      const cursorX = gsap.getProperty(this.wrapper, 'x');
      const cursorY = gsap.getProperty(this.wrapper, 'y');

      this.corners.forEach((corner, i) => {
        const currentX = gsap.getProperty(corner, 'x');
        const currentY = gsap.getProperty(corner, 'y');

        const targetX = this.targetCornerPositions[i].x - cursorX;
        const targetY = this.targetCornerPositions[i].y - cursorY;

        const finalX = currentX + (targetX - currentX) * strength;
        const finalY = currentY + (targetY - currentY) * strength;

        const duration = strength >= 0.99 ? (this.parallaxOn ? 0.2 : 0) : 0.05;

        gsap.to(corner, {
          x: finalX,
          y: finalY,
          duration: duration,
          ease: duration === 0 ? 'none' : 'power1.out',
          overwrite: 'auto'
        });
      });
    };
    
    this.moveHandler = e => {
      if (!this.wrapper) return;
      const { x: offsetX, y: offsetY } = this.getOffset();
      gsap.to(this.wrapper, {
        x: e.clientX - offsetX,
        y: e.clientY - offsetY,
        duration: 0.1,
        ease: 'power3.out'
      });
    };
    
    window.addEventListener('mousemove', this.moveHandler);
    
    this.scrollHandler = () => {
      if (!this.activeTarget || !this.wrapper) return;
      const { x: offsetX, y: offsetY } = this.getOffset();
      const mouseX = gsap.getProperty(this.wrapper, 'x') + offsetX;
      const mouseY = gsap.getProperty(this.wrapper, 'y') + offsetY;
      const elementUnderMouse = document.elementFromPoint(mouseX, mouseY);
      const isStillOverTarget =
        elementUnderMouse &&
        (elementUnderMouse === this.activeTarget || elementUnderMouse.closest(this.targetSelector) === this.activeTarget);
      if (!isStillOverTarget && this.currentLeaveHandler) {
        this.currentLeaveHandler();
      }
    };
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
    
    this.mouseDownHandler = () => {
      if (!this.dot) return;
      gsap.to(this.dot, { scale: 0.7, duration: 0.3 });
      gsap.to(this.wrapper, { scale: 0.9, duration: 0.2 });
    };

    this.mouseUpHandler = () => {
      if (!this.dot) return;
      gsap.to(this.dot, { scale: 1, duration: 0.3 });
      gsap.to(this.wrapper, { scale: 1, duration: 0.2 });
    };

    window.addEventListener('mousedown', this.mouseDownHandler);
    window.addEventListener('mouseup', this.mouseUpHandler);
    
    this.enterHandler = e => {
      const directTarget = e.target;
      const allTargets = [];
      let current = directTarget;
      while (current && current !== document.body) {
        if (current.matches && current.matches(this.targetSelector)) {
          allTargets.push(current);
        }
        current = current.parentElement;
      }
      const target = allTargets[0] || null;
      if (!target || !this.wrapper || !this.corners) return;
      if (this.activeTarget === target) return;
      if (this.activeTarget) {
        this.cleanupTarget(this.activeTarget);
      }
      if (this.resumeTimeout) {
        clearTimeout(this.resumeTimeout);
        this.resumeTimeout = null;
      }

      this.activeTarget = target;
      this.corners.forEach(corner => gsap.killTweensOf(corner, 'x,y'));

      gsap.killTweensOf(this.wrapper, 'rotation');
      if (this.spinTl) this.spinTl.pause();
      gsap.set(this.wrapper, { rotation: 0 });

      if (this.cursorColorOnTarget) {
        gsap.to(this.corners, {
          borderColor: this.cursorColorOnTarget,
          duration: 0.15,
          ease: 'power2.out'
        });
        if (this.dot) {
          gsap.to(this.dot, {
            backgroundColor: this.cursorColorOnTarget,
            duration: 0.15,
            ease: 'power2.out'
          });
        }
      }

      const rect = target.getBoundingClientRect();
      const { borderWidth, cornerSize } = this.constants;
      const { x: offsetX, y: offsetY } = this.getOffset();
      const cursorX = gsap.getProperty(this.wrapper, 'x');
      const cursorY = gsap.getProperty(this.wrapper, 'y');

      this.targetCornerPositions = [
        { x: rect.left - borderWidth - offsetX, y: rect.top - borderWidth - offsetY },
        { x: rect.right + borderWidth - cornerSize - offsetX, y: rect.top - borderWidth - offsetY },
        { x: rect.right + borderWidth - cornerSize - offsetX, y: rect.bottom + borderWidth - cornerSize - offsetY },
        { x: rect.left - borderWidth - offsetX, y: rect.bottom + borderWidth - cornerSize - offsetY }
      ];

      this.isActive = true;
      gsap.ticker.add(this.tickerFn);

      gsap.to(this.activeStrength, {
        current: 1,
        duration: this.hoverDuration,
        ease: 'power2.out'
      });

      this.corners.forEach((corner, i) => {
        gsap.to(corner, {
          x: this.targetCornerPositions[i].x - cursorX,
          y: this.targetCornerPositions[i].y - cursorY,
          duration: 0.2,
          ease: 'power2.out'
        });
      });

      this.leaveHandler = () => {
        gsap.ticker.remove(this.tickerFn);

        this.isActive = false;
        this.targetCornerPositions = null;
        gsap.set(this.activeStrength, { current: 0, overwrite: true });
        this.activeTarget = null;

        if (this.cursorColorOnTarget && this.corners) {
          gsap.to(this.corners, {
            borderColor: this.cursorColor,
            duration: 0.15,
            ease: 'power2.out'
          });
          if (this.dot) {
            gsap.to(this.dot, {
              backgroundColor: this.cursorColor,
              duration: 0.15,
              ease: 'power2.out'
            });
          }
        }

        if (this.corners) {
          gsap.killTweensOf(this.corners, 'x,y');
          const { cornerSize } = this.constants;
          const positions = [
            { x: -cornerSize * 1.5, y: -cornerSize * 1.5 },
            { x: cornerSize * 0.5, y: -cornerSize * 1.5 },
            { x: cornerSize * 0.5, y: cornerSize * 0.5 },
            { x: -cornerSize * 1.5, y: cornerSize * 0.5 }
          ];
          const tl = gsap.timeline();
          this.corners.forEach((corner, index) => {
            tl.to(
              corner,
              {
                x: positions[index].x,
                y: positions[index].y,
                duration: 0.3,
                ease: 'power3.out'
              },
              0
            );
          });
        }

        this.resumeTimeout = setTimeout(() => {
          if (!this.activeTarget && this.wrapper && this.spinTl) {
            const currentRotation = gsap.getProperty(this.wrapper, 'rotation');
            const normalizedRotation = currentRotation % 360;
            this.spinTl.kill();
            this.spinTl = gsap
              .timeline({ repeat: -1 })
              .to(this.wrapper, { rotation: '+=360', duration: this.spinDuration, ease: 'none' });
            gsap.to(this.wrapper, {
              rotation: normalizedRotation + 360,
              duration: this.spinDuration * (1 - normalizedRotation / 360),
              ease: 'none',
              onComplete: () => {
                this.spinTl.restart();
              }
            });
          }
          this.resumeTimeout = null;
        }, 50);

        this.cleanupTarget(target);
      };

      this.currentLeaveHandler = this.leaveHandler;
      target.addEventListener('mouseleave', this.leaveHandler);
    };

    window.addEventListener('mouseover', this.enterHandler, { passive: true });

    this.resizeHandler = () => {
      this.containingBlock = getContainingBlock(this.wrapper);
    };
    window.addEventListener('resize', this.resizeHandler);
  }
  
  cleanupTarget(target) {
    if (this.currentLeaveHandler) {
      target.removeEventListener('mouseleave', this.currentLeaveHandler);
    }
    this.currentLeaveHandler = null;
  }
  
  createSpinTimeline() {
    if (this.spinTl) {
      this.spinTl.kill();
    }
    this.spinTl = gsap
      .timeline({ repeat: -1 })
      .to(this.wrapper, { rotation: '+=360', duration: this.spinDuration, ease: 'none' });
  }
}
