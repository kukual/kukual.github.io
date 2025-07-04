/**
 * CrystalCursor - 增加拖尾粒子数量并在忽略拖拽时清除粒子和动画
 * 修改：在_ignoreDrag时清除所有粒子和动画，松手后精确同步鼠标位置，支持文本拖拽
 */

// 工具函数
const css = (element, styles) => {
    if (typeof styles === "object") {
        for (const key in styles) {
            if (Object.hasOwnProperty.call(styles, key)) {
                element.style.setProperty(key, styles[key]);
            }
        }
    }
    return element;
};

const throttle = (func, delay) => {
    let lastArgs = null;
    let isWaiting = false;
    return (...args) => {
        if (!isWaiting) {
            isWaiting = true;
            func(...args);
            setTimeout(() => {
                isWaiting = false;
                if (lastArgs !== null) {
                    const lastArgsCopy = lastArgs;
                    lastArgs = null;
                    func(...lastArgsCopy);
                }
            }, delay);
        } else {
            lastArgs = args;
        }
    };
};

const lerp = (a, b, n) => (1 - n) * a + n * b;

// 样式注入 - 修复拖尾粒子定位
const injectStyles = () => {
    if (document.getElementById('crystal-cursor-styles')) return;

    const styleSheet = document.createElement('style');
    styleSheet.id = 'crystal-cursor-styles';
    styleSheet.textContent = `
        #moonlight-cursor {
            position: fixed;
            width: 16px;
            height: 16px;
            pointer-events: none;
            z-index: 9999;
            transform: translate(-50%, -50%);
            transition: transform 0.1s ease;
            will-change: transform;
            /* GPU加速 */
            transform-style: preserve-3d;
            backface-visibility: hidden;
            perspective: 1000px;
        }
        
        #moonlight-cursor.hidden {
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .moon-disc {
            position: absolute;
            width: 100%;
            height: 100%;
            background: rgba(117, 49, 177, 0.2);
            border-radius: 50%;
            box-shadow: 0 0 8px #6624a0, inset 0 0 5px #6420a0;
            transition: all 0.3s ease;
            /* GPU加速 */
            transform: translateZ(0);
            will-change: background, box-shadow;
        }
        
        .moon-crescent {
            position: absolute;
            width: 60%;
            height: 60%;
            left: 10%;
            top: 20%;
            background: transparent;
            border-radius: 50%;
            box-shadow: inset 3px -3px 0 0 #c08bdf;
            transform: rotate(45deg) translateZ(0);
            transition: all 0.3s ease;
            /* GPU加速 */
            will-change: box-shadow;
        }
        
        .moon-glow {
            position: absolute;
            width: 140%;
            height: 140%;
            left: -20%;
            top: -20%;
            background: radial-gradient(circle, rgba(224, 170, 255, 0.3) 0%, transparent 60%);
            border-radius: 50%;
            opacity: 0.7;
            animation: moon-pulse 3s ease-in-out infinite;
            /* GPU加速 */
            transform: translateZ(0);
            will-change: opacity;
        }
        
        .moon-rings {
            position: absolute;
            width: 100%;
            height: 100%;
            /* GPU加速 */
            transform: translateZ(0);
        }
        
        .ring {
            position: absolute;
            border-radius: 50%;
            border-style: solid;
            border-color: #9b59b6;
            transform: translate(-50%, -50%);
            transition: all 0.3s ease-out;
            /* GPU加速 */
            will-change: transform, opacity;
            backface-visibility: hidden;
        }
        
        .ring-1 {
            width: 120%;
            height: 120%;
            top: 50%;
            left: 50%;
            border-width: 1px;
            opacity: 0.5;
            animation: ring-pulse 2s ease-in-out infinite;
        }
        
        .ring-2 {
            width: 150%;
            height: 150%;
            top: 50%;
            left: 50%;
            border-width: 1px;
            opacity: 0.3;
            animation: ring-pulse 2s ease-in-out infinite 0.2s;
        }
        
        .ring-3 {
            width: 180%;
            height: 180%;
            top: 50%;
            left: 50%;
            border-width: 1px;
            opacity: 0.2;
            animation: ring-pulse 2s ease-in-out infinite 0.4s;
        }
        
        @keyframes moon-pulse {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 1; }
        }
        
        @keyframes ring-pulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -50%) scale(1.1); }
        }
        
        #moonlight-cursor.hover .moon-disc {
            background: rgba(157, 78, 221, 0.3);
            box-shadow: 0 0 10px #9d4edd, inset 0 0 8px #9d4edd;
        }
        
        #moonlight-cursor.hover .moon-crescent {
            box-shadow: inset 3px -3px 0 0 #c77dff;
        }
        
        #moonlight-cursor.hover .ring-1 {
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(1.2);
        }
        
        #moonlight-cursor.hover .ring-2 {
            opacity: 0.6;
            transform: translate(-50%, -50%) scale(1.2);
        }
        
        #moonlight-cursor.hover .ring-3 {
            opacity: 0.4;
            transform: translate(-50%, -50%) scale(1.2);
        }
        
        #moonlight-cursor.active {
            transform: translate(-50%, -50%) scale(0.8);
        }
        
        /* 拖尾粒子保持原有定位方式 */
        .crystal-trail {
            position: fixed;
            pointer-events: none;
            z-index: 9998;
            border-radius: 50%;
            will-change: transform, opacity;
            /* GPU加速但不影响定位 */
            backface-visibility: hidden;
            perspective: 1000px;
        }
        
        /* 爆炸粒子GPU加速优化 */
        .crystal-burst {
            position: fixed;
            pointer-events: none;
            z-index: 9997;
            will-change: transform, opacity;
            /* GPU加速 */
            transform-style: preserve-3d;
            backface-visibility: hidden;
            perspective: 1000px;
            contain: layout style paint;
            isolation: isolate;
        }
        
        @media (hover: none) {
            #moonlight-cursor {
                display: none !important;
            }
        }
    `;
    document.head.appendChild(styleSheet);
};

// 对象池管理 - 增加池子大小并添加清除方法
class ParticlePool {
    constructor(maxSize = 50) { // 从30增加到50
        this.pool = [];
        this.maxSize = maxSize;
        this.createElements();
    }

    createElements() {
        for (let i = 0; i < this.maxSize; i++) {
            const element = document.createElement('div');
            element.className = 'crystal-trail';
            element.style.display = 'none';
            document.body.appendChild(element);
            this.pool.push(element);
        }
    }

    get() {
        return this.pool.find(el => el.style.display === 'none');
    }

    release(element) {
        element.style.display = 'none';
        // 重置样式但保持原有的清理方式
        element.style.transform = '';
        element.style.opacity = '';
        element.style.background = '';
        element.style.boxShadow = '';
    }

    // 新增：清除所有活跃的粒子
    clearAll() {
        this.pool.forEach(element => {
            if (element.style.display !== 'none') {
                this.release(element);
            }
        });
    }
}

// 拖尾粒子 - 恢复原版坐标系统
class TrailAnimation {
    constructor(x, y, angle, pool) {
        this.pool = pool;
        this.element = pool.get();

        if (!this.element) return; // 池子满了就跳过

        this.pos = { x, y };
        this.life = 1;
        this.size = 1 + Math.random() * 1.5;
        this.speed = 0.3 + Math.random() * 0.3;
        this.angle = angle;
        this.active = true;

        // 恢复原版定位方式：使用left/top + transform rotate
        this.element.style.display = 'block';
        this.element.style.width = `${this.size}px`;
        this.element.style.height = `${this.size * 1.5}px`;
        this.element.style.transform = `translate(-50%, -50%) rotate(${this.angle + Math.PI / 2}rad)`;

        const hue = 270 + Math.random() * 30 - 15;
        this.element.style.background = `linear-gradient(to bottom, 
            hsla(${hue}, 100%, 70%, 0.9), 
            hsla(${hue + 20}, 100%, 50%, 0.5))`;
        this.element.style.boxShadow = `0 0 5px hsla(${hue}, 100%, 70%, 0.8)`;
    }

    update() {
        if (!this.active || !this.element) return false;

        this.life -= this.speed * 0.015;

        if (this.life <= 0) {
            this.die();
            return false;
        }

        const distance = (1 - this.life) * 15;
        this.pos.x += Math.cos(this.angle) * distance * 0.1;
        this.pos.y += Math.sin(this.angle) * distance * 0.1;

        // 恢复原版定位：使用left/top设置位置，transform只负责旋转和居中
        this.element.style.left = `${this.pos.x}px`;
        this.element.style.top = `${this.pos.y}px`;
        this.element.style.transform = `translate(-50%, -50%) rotate(${this.angle + Math.PI / 2}rad)`;
        this.element.style.opacity = this.life * 0.8;

        const tailLength = 3 + (1 - this.life) * 2.5;
        this.element.style.height = `${this.size * tailLength}px`;

        return true;
    }

    die() {
        this.active = false;
        if (this.element) {
            this.pool.release(this.element);
        }
    }
}

// 爆炸粒子 - 保持原有逻辑
class BurstAnimation {
    constructor(x, y) {
        this.startPos = { x, y };
        this.currentPos = { x, y };
        this.angle = Math.random() * Math.PI * 2;
        this.velocity = 0.5 + Math.random() * 2;
        this.lifetime = 800 + Math.random() * 400;
        this.size = 2 + Math.random() * 12;
        this.rotation = Math.random() * 360;
        this.startTime = Date.now();
        this.active = true;

        const colors = ['#8a2be2', '#9932cc', '#ba55d3', '#da70d6', '#d8bfd8'];
        const color = colors[Math.floor(Math.random() * colors.length)];

        this.element = document.createElement('div');
        this.element.className = 'crystal-burst';

        // 优化：一次性设置所有样式，使用translate3d
        css(this.element, {
            left: `${x}px`,
            top: `${y}px`,
            width: `${this.size}px`,
            height: `${this.size}px`,
            "background-color": color,
            "clip-path": "polygon(50% 0%, 0% 100%, 100% 100%)",
            "filter": `drop-shadow(0 0 3px ${color})`,
            "transform-origin": "center center",
            transform: `translate3d(-50%, -50%, 0) rotate(${this.rotation}deg)`
        });

        document.body.appendChild(this.element);
    }

    update() {
        if (!this.active) return false;

        const now = Date.now();
        const progress = (now - this.startTime) / this.lifetime;

        if (progress >= 1) {
            this.die();
            return false;
        }

        const distance = this.velocity * progress * 50;
        this.currentPos.x = this.startPos.x + Math.cos(this.angle) * distance;
        this.currentPos.y = this.startPos.y + Math.sin(this.angle) * distance;

        const opacity = 1 - progress;
        const scale = 0.5 + progress * 0.5;
        const currentRotation = this.rotation + progress * 360;

        // 优化：使用translate3d
        this.element.style.left = `${this.currentPos.x}px`;
        this.element.style.top = `${this.currentPos.y}px`;
        this.element.style.transform = `translate3d(-50%, -50%, 0) rotate(${currentRotation}deg) scale(${scale})`;
        this.element.style.opacity = opacity;

        return true;
    }

    die() {
        this.active = false;
        if (this.element) {
            this.element.remove();
        }
    }
}

// 冲击波 - 保持原有逻辑
class ShockwaveAnimation {
    constructor(x, y) {
        this.startTime = Date.now();
        this.duration = 600;
        this.active = true;

        this.element = document.createElement('div');
        this.element.className = 'shockwave';

        css(this.element, {
            position: "fixed",
            left: `${x}px`,
            top: `${y}px`,
            "border-radius": "50%",
            border: "1px solid #9d4edd",
            "pointer-events": "none",
            "z-index": "9996",
            width: "0px",
            height: "0px",
            opacity: "0.8",
            "transform-origin": "center center",
            transform: "translate(-50%, -50%)",
            "will-change": "transform, opacity"
        });

        document.body.appendChild(this.element);
    }

    update() {
        if (!this.active) return false;

        const now = Date.now();
        const progress = (now - this.startTime) / this.duration;

        if (progress >= 1) {
            this.die();
            return false;
        }

        const size = progress * 50;
        const opacity = 1 - progress;

        this.element.style.width = `${size}px`;
        this.element.style.height = `${size}px`;
        this.element.style.opacity = opacity;
        this.element.style.borderWidth = `${1 - progress * 1}px`;

        return true;
    }

    die() {
        this.active = false;
        if (this.element) {
            this.element.remove();
        }
    }
}

// 统一动画管理器 - 添加清除所有动画的方法
class AnimationManager {
    constructor() {
        this.animations = [];
        this.running = false;
    }

    add(animation) {
        this.animations.push(animation);
        if (!this.running) {
            this.running = true;
            this.update();
        }
    }

    update() {
        // 批量更新所有动画
        this.animations = this.animations.filter(animation => animation.update());

        if (this.animations.length > 0) {
            requestAnimationFrame(() => this.update());
        } else {
            this.running = false;
        }
    }

    // 新增：清除所有动画
    clearAll() {
        // 强制停止所有动画
        this.animations.forEach(animation => {
            if (animation.die && typeof animation.die === 'function') {
                animation.die();
            }
        });
        this.animations = [];
        this.running = false;
    }
}

// 主类 - 增加拖尾粒子数量并在_ignoreDrag时清除粒子和动画
class CrystalCursor {
    constructor(options = {}) {
        if (window.matchMedia("(hover: none)").matches) {
            return;
        }

        injectStyles();

        // 增加最大粒子数
        this._ignoreDrag = false;
        this.maxParticles = 100; // 从50增加到100
        this.activeParticles = 0;
        this.lastEmitTime = 0;
        this.angle = 0;
        this.isDragging = false; // 新增：标记是否在拖拽状态

        this.pos = { curr: null, prev: null };

        this.trailPool = new ParticlePool(50); // 增加池子大小
        this.animationManager = new AnimationManager();

        this.createCursor();
        this.initEventListeners();

        // 减少节流时间，增加生成频率
        this.createTrailThrottled = throttle((x, y, angle) => this.createTrailParticle(x, y, angle), 25); // 从35降到25
    }

    createCursor() {
        this.cursor = document.createElement("div");
        this.cursor.id = "moonlight-cursor";
        this.cursor.className = "hidden";
        this.cursor.innerHTML = `
            <div class="moon-disc"></div>
            <div class="moon-crescent"></div>
            <div class="moon-glow"></div>
            <div class="moon-rings">
                <div class="ring ring-1"></div>
                <div class="ring ring-2"></div>
                <div class="ring ring-3"></div>
            </div>
        `;
        document.body.appendChild(this.cursor);
    }

    move(left, top) {
        // 保持原有的坐标系统
        this.cursor.style.left = `${left}px`;
        this.cursor.style.top = `${top}px`;
    }

    createTrailParticle(x, y, angle) {
        if (this.activeParticles >= this.maxParticles) return;

        // 增加每次生成的粒子数量：2-3个
        const particleCount = 2 + Math.floor(Math.random() * 2); // 每次生成2-3个粒子

        for (let i = 0; i < particleCount; i++) {
            if (this.activeParticles >= this.maxParticles) break;

            this.activeParticles++;

            // 给每个粒子一点角度偏移，让拖尾更丰富
            const angleOffset = (Math.random() - 0.5) * 0.4;
            const trail = new TrailAnimation(x, y, angle + angleOffset, this.trailPool);

            if (trail.element) {
                this.animationManager.add({
                    update: () => {
                        const alive = trail.update();
                        if (!alive) {
                            this.activeParticles--;
                        }
                        return alive;
                    }
                });
            } else {
                this.activeParticles--;
            }
        }
    }

    // 新增：清除所有粒子和动画的方法
    clearAllParticlesAndAnimations() {
        // 清除所有动画
        this.animationManager.clearAll();

        // 清除池子中的所有粒子
        this.trailPool.clearAll();

        // 清除所有爆炸粒子元素
        const burstElements = document.querySelectorAll('.crystal-burst');
        burstElements.forEach(element => element.remove());

        // 清除所有冲击波元素
        const shockwaveElements = document.querySelectorAll('.shockwave');
        shockwaveElements.forEach(element => element.remove());

        // 重置粒子计数器
        this.activeParticles = 0;
    }

    // 新增：强制同步位置到当前鼠标位置
    syncToMousePosition(x, y) {
        this.pos.curr = { x, y };
        this.pos.prev = { x, y };
        this.move(x - 8, y - 8);
        this.cursor.classList.remove("hidden");
    }

    handleMouseMove(e) {
        if (this._ignoreDrag) return;
        this.pos.curr = { x: e.clientX, y: e.clientY };
        this.cursor.classList.remove("hidden");

        if (this.pos.prev) {
            const dx = this.pos.curr.x - this.pos.prev.x;
            const dy = this.pos.curr.y - this.pos.prev.y;

            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 2) {
                this.angle = Math.atan2(dy, dx);
                this.createTrailThrottled(this.pos.prev.x, this.pos.prev.y, this.angle);
            }

            this.pos.prev.x = lerp(this.pos.prev.x, this.pos.curr.x, 0.3);
            this.pos.prev.y = lerp(this.pos.prev.y, this.pos.curr.y, 0.3);
            this.move(this.pos.prev.x - 8, this.pos.prev.y - 8);
        } else {
            this.pos.prev = { ...this.pos.curr };
            this.move(this.pos.curr.x - 8, this.pos.curr.y - 8);
        }
    }

    handleMouseDown(e) {
        if (this.isScrollbarClick(e)) {
            this._ignoreDrag = true;
            // 在设置_ignoreDrag后立即清除所有粒子和动画
            this.clearAllParticlesAndAnimations();
            return;
        }
        this._ignoreDrag = false;
        this.cursor.classList.add("active");
        this.createCrystalBurst(e.clientX, e.clientY);
        this.createShockwave(e.clientX, e.clientY);
    }

    handleMouseUp(e) {
        this.cursor.classList.remove("active");

        // 松手后同步位置
        if (e) {
            this.syncToMousePosition(e.clientX, e.clientY);
        }

        // 只有在不是滚动条拖拽时才恢复
        if (!this.isScrollbarDrag) {
            this._ignoreDrag = false;
        }
    }

    // 新增：处理拖拽开始事件
    handleDragStart(e) {
        this.isDragging = true;
        this._ignoreDrag = true;
        this.clearAllParticlesAndAnimations();
    }

    // 新增：处理拖拽结束事件
    handleDragEnd(e) {
        this.isDragging = false;
        this._ignoreDrag = false;

        // 拖拽结束后同步位置到当前鼠标位置
        if (e) {
            this.syncToMousePosition(e.clientX, e.clientY);
        }
    }

    // 新增：处理拖拽过程事件
    handleDrag(e) {
        // 在拖拽过程中隐藏月亮
        this.cursor.classList.add("hidden");
    }

    handleMouseEnter() {
        this.cursor.classList.remove("hidden");
    }

    handleMouseLeave() {
        this.cursor.classList.add("hidden");
        // 离开页面时也清除粒子和动画
        this.clearAllParticlesAndAnimations();
    }

    createCrystalBurst(x, y) {
        const count = 50;
        for (let i = 0; i < count; i++) {
            if (this.activeParticles >= this.maxParticles) break;
            this.activeParticles++;

            const burst = new BurstAnimation(x, y);
            this.animationManager.add({
                update: () => {
                    const alive = burst.update();
                    if (!alive) {
                        this.activeParticles--;
                    }
                    return alive;
                }
            });
        }
    }

    createShockwave(x, y) {
        const shockwave = new ShockwaveAnimation(x, y);
        this.animationManager.add(shockwave);
    }

    // 判断鼠标是否点在了滚动条上
    isScrollbarClick(e) {
        // 只对垂直滚动条判断
        return (
            (e.target === document.documentElement || e.target === document.body) &&
            (
                (window.innerWidth - e.clientX < 20 && document.documentElement.scrollHeight > document.documentElement.clientHeight) || // 右侧竖滚动条
                (window.innerHeight - e.clientY < 20 && document.documentElement.scrollWidth > document.documentElement.clientWidth)    // 下方横滚动条
            )
        );
    }

    initEventListeners() {
        this.mouseMoveHandler = (e) => this.handleMouseMove(e);
        this.mouseEnterHandler = () => this.handleMouseEnter();
        this.mouseLeaveHandler = () => this.handleMouseLeave();
        this.mouseDownHandler = (e) => this.handleMouseDown(e);
        this.mouseUpHandler = (e) => this.handleMouseUp(e);

        // 新增：拖拽相关事件处理器
        this.dragStartHandler = (e) => this.handleDragStart(e);
        this.dragEndHandler = (e) => this.handleDragEnd(e);
        this.dragHandler = (e) => this.handleDrag(e);

        document.addEventListener('mousemove', this.mouseMoveHandler);
        document.addEventListener('mouseenter', this.mouseEnterHandler);
        document.addEventListener('mouseleave', this.mouseLeaveHandler);
        document.addEventListener('mousedown', this.mouseDownHandler);
        document.addEventListener('mouseup', this.mouseUpHandler);

        // 新增：添加拖拽事件监听
        document.addEventListener('dragstart', this.dragStartHandler);
        document.addEventListener('dragend', this.dragEndHandler);
        document.addEventListener('drag', this.dragHandler);

        this.addHoverListeners();
    }

    addHoverListeners() {
        const hoverElements = document.querySelectorAll('a, button, [data-hover]');
        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', () => this.cursor.classList.add('hover'));
            el.addEventListener('mouseleave', () => this.cursor.classList.remove('hover'));
        });
    }

    destroy() {
        // 销毁时清除所有粒子和动画
        this.clearAllParticlesAndAnimations();

        document.removeEventListener('mousemove', this.mouseMoveHandler);
        document.removeEventListener('mouseenter', this.mouseEnterHandler);
        document.removeEventListener('mouseleave', this.mouseLeaveHandler);
        document.removeEventListener('mousedown', this.mouseDownHandler);
        document.removeEventListener('mouseup', this.mouseUpHandler);

        // 移除拖拽事件监听
        document.removeEventListener('dragstart', this.dragStartHandler);
        document.removeEventListener('dragend', this.dragEndHandler);
        document.removeEventListener('drag', this.dragHandler);

        this.cursor?.remove();

        const styleSheet = document.getElementById('crystal-cursor-styles');
        styleSheet?.remove();
    }
}

// 自动初始化
(() => {
    const crystalCursor = new CrystalCursor();
    window.addEventListener('beforeunload', () => {
        crystalCursor?.destroy();
    });
})();

if (typeof window !== 'undefined') {
    window.CrystalCursor = CrystalCursor;
}