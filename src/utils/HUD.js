/* 2D HUD overlay that contains a bunch of text stuff */
export class HUD {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.id = "hud-canvas";
    this.ctx = this.canvas.getContext("2d");
    this.textElements = new Map();
    this.staminaBarVisible = false;
    this.staminaValue = 1;

    Object.assign(this.canvas.style, {
      position: "fixed",
      top: "0",
      left: "0",
      pointerEvents: "none",
      zIndex: "1000",
    });
    document.body.appendChild(this.canvas);

    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  // add/update text
  setText(id, text, x, y, opts = {}) {
    this.textElements.set(id, {
      text, x, y,
      font: opts.font || "14px monospace",
      color: opts.color || "white",
      shadow: opts.shadow !== false,
      visible: opts.visible !== false,
    });
  }

  removeText(id) { this.textElements.delete(id); }
  setVisible(id, visible) { const e = this.textElements.get(id); if (e) e.visible = visible; }
  updateText(id, text) { const e = this.textElements.get(id); if (e) e.text = text; }

  // stamina bar
  setStaminaBar(visible, value) {
    this.staminaBarVisible = visible;
    this.staminaValue = Math.max(0, Math.min(1, value));
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width, h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    // draw text
    for (const e of this.textElements.values()) {
      if (!e.visible) continue;
      ctx.font = e.font;
      ctx.fillStyle = e.color;

      if (e.shadow) {
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
      }

      const x = e.x === "right" ? w - 20 : typeof e.x === "number" ? e.x : 20;
      const y = e.y === "bottom" ? h - 20 : typeof e.y === "number" ? e.y : 20;

      ctx.fillText(e.text, x, y);
      if (e.shadow) ctx.shadowBlur = 0;
    }

    // draw stamina
    if (this.staminaBarVisible) {
      const bw = 200, bh = 20;
      const bx = (w - bw) / 2, by = h - 40;

      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(bx, by, bw, bh);

      ctx.fillStyle = this.staminaValue > 0.3 ? "#4CAF50" : "#FF5252";
      ctx.fillRect(bx, by, bw * this.staminaValue, bh);

      ctx.strokeStyle = "white";
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, bw, bh);
    }
  }

  // pause overlay
  showPauseOverlay() {
    const ctx = this.ctx;
    const w = this.canvas.width, h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, w, h);

    ctx.font = "bold 48px monospace";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = 8;
    ctx.fillText("PAUSED", w / 2, h / 2 - 30);

    ctx.font = "20px monospace";
    ctx.fillText("Click to resume", w / 2, h / 2 + 30);

    ctx.shadowBlur = 0;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  destroy() {
    this.canvas.remove();
    this.textElements.clear();
  }
}
