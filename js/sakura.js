class SakuraSVG {
  constructor() {
    this.svgNS = "http://www.w3.org/2000/svg";
    this.createContainer();
    this.initSakuras();
  }

  createContainer() {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position:fixed; top:0; left:0; 
      width:100%; height:100%; 
      pointer-events:none; z-index:-9999;
      overflow:hidden;
    `;
    document.body.appendChild(this.container);
    
    this.svg = document.createElementNS(this.svgNS, 'svg');
    this.svg.setAttribute('width', '100%');
    this.svg.setAttribute('height', '100%');
    this.container.appendChild(this.svg);
  }

  createPetal() {
    const petal = document.createElementNS(this.svgNS, 'path');
    petal.setAttribute('d', 'M15,5 Q20,0 25,5 Q30,10 25,15 Q20,20 15,15 Q10,10 15,5 Z');
    petal.setAttribute('fill', `hsl(${15+Math.random()*15}, 70%, 70%)`);
    petal.setAttribute('opacity', '0.8');
    petal.setAttribute('transform', `
      translate(${Math.random()*window.innerWidth},-30)
      scale(${Math.random()*0.5 + 0.3})
      rotate(${Math.random()*360})
    `);
    return petal;
  }

  animatePetal(petal) {
    const duration = 10 + Math.random() * 20;
    const animation = petal.animate([
      { 
        transform: `translate(${petal._x}px,-30px) rotate(0deg)`,
        opacity: 0.8 
      },
      { 
        transform: `translate(${petal._x + Math.sin(Date.now()*0.001)*100}px,${window.innerHeight+30}px) rotate(360deg)`,
        opacity: 0 
      }
    ], {
      duration: duration * 1000,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    });

    animation.onfinish = () => {
      petal.remove();
      this.addNewPetal();
    };
  }

  addNewPetal() {
    const petal = this.createPetal();
    petal._x = Math.random() * window.innerWidth;
    this.svg.appendChild(petal);
    this.animatePetal(petal);
  }

  initSakuras() {
    for(let i=0; i<30; i++) {
      setTimeout(() => this.addNewPetal(), i * 300);
    }
  }
}

new SakuraSVG();