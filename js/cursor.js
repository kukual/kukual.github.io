/**
 * 自定义光标效果 - 黄昏色系流光粒子跟随
 * 包含主光标、粒子跟随效果和点击烟花特效
 */

// 全局光标变量
var CURSOR;

// 数学辅助函数
Math.lerp = (a, b, n) => (1 - n) * a + n * b; // 线性插值
Math.clamp = (val, min, max) => Math.max(min, Math.min(max, val)); // 数值限制

class Cursor {
    constructor() {
        // 初始化光标位置
        this.pos = { curr: null, prev: null };
        
        // 粒子数组
        this.particles = [];
        
        // 创建主光标元素
        this.cursor = document.createElement("div");
        this.cursor.id = "cursor";
        this.cursor.classList.add("hidden");
        document.body.append(this.cursor);
        
        // 创建跟随粒子
        this.particleCount = 12;
        for (let i = 0; i < this.particleCount; i++) {
            const particle = document.createElement("div");
            particle.className = "cursor-particle";
            
            // 设置粒子颜色渐变 (黄昏色系)
            particle.style.backgroundColor = `hsl(${25 + i * 3}, 100%, 60%)`;
            
            // 粒子大小递减
            particle.style.width = `${8 - i * 0.5}px`;
            particle.style.height = `${8 - i * 0.5}px`;
            
            document.body.appendChild(particle);
            this.particles.push({
                el: particle,
                pos: { x: 0, y: 0 },
                delay: i * 0.02, // 粒子延迟效果
                size: 8 - i * 0.5 // 粒子大小
            });
        }
        
        // 初始化事件监听和动画循环
        this.init();
        this.render();
    }

    /**
     * 初始化事件监听
     */
    init() {
        // 鼠标移动事件
        document.onmousemove = e => {
            if (this.pos.curr === null) {
                this.move(e.clientX - 8, e.clientY - 8);
            }
            this.pos.curr = { x: e.clientX, y: e.clientY };
            this.cursor.classList.remove("hidden");
        };
        
        // 鼠标进入/离开页面事件
        document.onmouseenter = e => this.cursor.classList.remove("hidden");
        document.onmouseleave = e => this.cursor.classList.add("hidden");
        
        // 鼠标按下/抬起事件
        document.onmousedown = e => this.cursor.classList.add("active");
        document.onmouseup = e => this.cursor.classList.remove("active");
        
        // 点击烟花效果
        document.addEventListener('click', (e) => {
            this.createFirework(e.clientX, e.clientY);
        });
    }

    /**
     * 移动主光标位置
     * @param {number} left - 左偏移量
     * @param {number} top - 上偏移量
     */
    move(left, top) {
        this.cursor.style.left = `${left}px`;
        this.cursor.style.top = `${top}px`;
    }

    /**
     * 创建点击烟花效果
     * @param {number} x - 点击X坐标
     * @param {number} y - 点击Y坐标
     */
    createFirework(x, y) {
        // 黄昏色系颜色数组
        const colors = ['#FF7F50', '#FFA07A', '#FF8C00', '#FFD700', '#FF6347'];
        const particleCount = 30;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'firework-particle';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            document.body.appendChild(particle);
            
            // 随机角度和速度
            const angle = Math.random() * Math.PI * 2;
            const velocity = 2 + Math.random() * 3;
            const lifetime = 1000 + Math.random() * 500;
            
            // 烟花粒子动画
            const animate = (startTime) => {
                const now = Date.now();
                const progress = (now - startTime) / lifetime;
                
                // 动画结束条件
                if (progress >= 1) {
                    particle.remove();
                    return;
                }
                
                // 计算当前位置和透明度
                const distance = velocity * progress * 100;
                const currentX = x + Math.cos(angle) * distance;
                const currentY = y + Math.sin(angle) * distance;
                const opacity = 1 - progress;
                
                // 更新粒子位置和透明度
                particle.style.transform = `translate(${currentX - x}px, ${currentY - y}px)`;
                particle.style.opacity = opacity;
                
                requestAnimationFrame(() => animate(startTime));
            };
            
            requestAnimationFrame(() => animate(Date.now()));
        }
    }

    /**
     * 渲染动画循环
     */
    render() {
        if (this.pos.prev) {
            // 平滑移动主光标
            this.pos.prev.x = Math.lerp(this.pos.prev.x, this.pos.curr.x, 0.2);
            this.pos.prev.y = Math.lerp(this.pos.prev.y, this.pos.curr.y, 0.2);
            this.move(this.pos.prev.x - 8, this.pos.prev.y - 8);
            
            // 更新粒子位置
            this.particles.forEach((particle, i) => {
                const delay = particle.delay;
                const targetX = this.pos.prev.x - particle.size / 2;
                const targetY = this.pos.prev.y - particle.size / 2;
                
                // 平滑移动粒子
                particle.pos.x = Math.lerp(particle.pos.x, targetX, 0.2 - i * 0.01);
                particle.pos.y = Math.lerp(particle.pos.y, targetY, 0.2 - i * 0.01);
                
                particle.el.style.left = `${particle.pos.x}px`;
                particle.el.style.top = `${particle.pos.y}px`;
                
                // 粒子颜色动态变化 (黄昏色系)
                const hue = 25 + Math.sin(Date.now() * 0.002 + i * 0.2) * 15;
                particle.el.style.backgroundColor = `hsl(${hue}, 100%, 60%)`;
            });
        } else {
            this.pos.prev = this.pos.curr;
        }
        
        // 继续动画循环
        requestAnimationFrame(() => this.render());
    }
}

// 初始化光标效果
(() => {
    CURSOR = new Cursor();
    // 修复页面滚动时的位置计算
    document.addEventListener('scroll', () => {
        if (CURSOR.pos.curr) {
            CURSOR.pos.curr.y = CURSOR.pos.curr.y - window.scrollY;
        }
    });
})();