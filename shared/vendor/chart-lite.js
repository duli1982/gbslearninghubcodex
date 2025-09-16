(function () {
    const DEFAULT_COLORS = [
        '#2563eb', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#14b8a6'
    ];

    class DoughnutChart {
        constructor(ctx, config) {
            if (!ctx || !ctx.canvas) {
                throw new Error('A valid 2D canvas context is required.');
            }
            if (!config || config.type !== 'doughnut') {
                throw new Error('Only "doughnut" charts are supported by this lightweight implementation.');
            }
            this.ctx = ctx;
            this.canvas = ctx.canvas;
            this.config = config;
            this.data = config.data || { datasets: [] };
            this.options = config.options || {};
            this._segments = [];
            this._resizeHandler = () => this.update();
            if (this.options.responsive !== false) {
                window.addEventListener('resize', this._resizeHandler);
            }
            this.update();
        }

        destroy() {
            window.removeEventListener('resize', this._resizeHandler);
        }

        update() {
            const dataset = (this.data.datasets && this.data.datasets[0]) || null;
            if (!dataset) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                return;
            }

            const dpr = window.devicePixelRatio || 1;
            const displayWidth = this.canvas.clientWidth || this.canvas.width || 300;
            const displayHeight = this.canvas.clientHeight || this.canvas.height || 300;
            if (this.canvas.width !== displayWidth * dpr || this.canvas.height !== displayHeight * dpr) {
                this.canvas.width = displayWidth * dpr;
                this.canvas.height = displayHeight * dpr;
            }
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            if (dpr !== 1) {
                this.ctx.scale(dpr, dpr);
            }

            this.ctx.clearRect(0, 0, displayWidth, displayHeight);

            const total = dataset.data.reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0) || 1;
            const outerRadius = Math.min(displayWidth, displayHeight) / 2;
            const innerRadius = outerRadius * this._resolveCutout(this.options.cutout);
            const centerX = displayWidth / 2;
            const centerY = displayHeight / 2;
            const background = dataset.backgroundColor || DEFAULT_COLORS;
            const borders = dataset.borderColor || background;
            const borderWidth = dataset.borderWidth || 0;

            this._segments = [];
            let startAngle = -Math.PI / 2;

            dataset.data.forEach((rawValue, index) => {
                const value = Math.max(0, Number(rawValue) || 0);
                const angle = (value / total) * Math.PI * 2;
                const endAngle = startAngle + angle;
                const fillStyle = background[index % background.length];
                const strokeStyle = borders[index % borders.length];

                if (angle > 0) {
                    this.ctx.beginPath();
                    this.ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
                    this.ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
                    this.ctx.closePath();
                    this.ctx.fillStyle = fillStyle;
                    this.ctx.fill();

                    if (borderWidth > 0) {
                        this.ctx.lineWidth = borderWidth;
                        this.ctx.strokeStyle = strokeStyle;
                        this.ctx.stroke();
                    }
                }

                this._segments.push({ start: startAngle, end: endAngle, index });
                startAngle = endAngle;
            });

            this._center = { x: centerX, y: centerY };
            this._outerRadius = outerRadius;
            this._innerRadius = innerRadius;

            this._installInteraction();
        }

        _installInteraction() {
            if (this._interactionReady) return;
            this._interactionReady = true;
            this.canvas.addEventListener('click', (event) => {
                const handler = this.options && this.options.onClick;
                if (typeof handler !== 'function') {
                    return;
                }
                const element = this._locateSegment(event);
                if (!element) return;
                handler.call(this, event, [element], this);
            });
        }

        _locateSegment(event) {
            if (!this._segments.length) return null;
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const dx = x - this._center.x;
            const dy = y - this._center.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < this._innerRadius || distance > this._outerRadius) {
                return null;
            }
            let angle = Math.atan2(dy, dx);
            if (angle < -Math.PI / 2) {
                angle += Math.PI * 2;
            }
            for (const segment of this._segments) {
                let start = segment.start;
                let end = segment.end;
                if (end < start) {
                    end += Math.PI * 2;
                }
                let targetAngle = angle;
                if (targetAngle < start) {
                    targetAngle += Math.PI * 2;
                }
                if (targetAngle >= start && targetAngle <= end) {
                    return { index: segment.index };
                }
            }
            return null;
        }

        _resolveCutout(cutout) {
            if (typeof cutout === 'string' && cutout.trim().endsWith('%')) {
                const value = parseFloat(cutout);
                return isFinite(value) ? Math.min(Math.max(value / 100, 0), 0.95) : 0.6;
            }
            const numeric = Number(cutout);
            if (isFinite(numeric)) {
                if (numeric > 1) {
                    return Math.min(Math.max(numeric, 0), 0.95);
                }
                return Math.min(Math.max(numeric, 0), 0.95);
            }
            return 0.6;
        }
    }

    window.Chart = DoughnutChart;
})();
