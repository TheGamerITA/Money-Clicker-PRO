const Sprites = {
  coin: null,
  boss: null,
  bgSky: null,
  bgStars: null,
  bgMountains: null,
  bgCity: null,

  init() {
    this.coin = this.make(320, 320, (ctx, w, h) => {
      const r = 140;
      const cx = w / 2;
      const cy = h / 2;

      const grad = ctx.createRadialGradient(cx - 45, cy - 55, 25, cx, cy, r);
      grad.addColorStop(0, "#fff3b0");
      grad.addColorStop(0.25, "#ffd75e");
      grad.addColorStop(0.7, "#f7b733");
      grad.addColorStop(1, "#9a6b00");

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.lineWidth = 14;
      ctx.strokeStyle = "rgba(255,255,255,0.28)";
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0,0,0,0.12)";
      ctx.lineWidth = 8;
      ctx.stroke();

      ctx.fillStyle = "#5c3d00";
      ctx.font = "900 130px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("€", cx, cy + 6);
    });

    this.boss = this.make(260, 260, (ctx, w, h) => {
      const cx = w / 2;
      const cy = h / 2;

      const body = ctx.createRadialGradient(cx - 30, cy - 40, 20, cx, cy, 105);
      body.addColorStop(0, "#ff8b5e");
      body.addColorStop(0.45, "#d84f4f");
      body.addColorStop(1, "#5e1024");

      ctx.beginPath();
      ctx.arc(cx, cy, 95, 0, Math.PI * 2);
      ctx.fillStyle = body;
      ctx.fill();

      ctx.fillStyle = "#3d0813";
      ctx.beginPath();
      ctx.moveTo(55, 70);
      ctx.lineTo(85, 15);
      ctx.lineTo(105, 75);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(155, 75);
      ctx.lineTo(175, 15);
      ctx.lineTo(205, 70);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(98, 112, 20, 0, Math.PI * 2);
      ctx.arc(162, 112, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#151515";
      ctx.beginPath();
      ctx.arc(102, 116, 8, 0, Math.PI * 2);
      ctx.arc(158, 116, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#2b0710";
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(88, 170);
      ctx.quadraticCurveTo(130, 200, 172, 170);
      ctx.stroke();
    });

    this.bgSky = this.make(1600, 900, (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#1d2b43");
      grad.addColorStop(0.55, "#101a2d");
      grad.addColorStop(1, "#0b1020");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    });

    this.bgStars = this.make(1600, 900, (ctx, w, h) => {
      for (let i = 0; i < 220; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h * 0.8;
        const r = Math.random() * 2 + 0.4;
        ctx.globalAlpha = Math.random() * 0.7 + 0.15;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });

    this.bgMountains = this.make(1600, 900, (ctx, w, h) => {
      ctx.fillStyle = "rgba(255,255,255,0.045)";
      for (let i = 0; i < 7; i++) {
        const mw = 320 + Math.random() * 260;
        const mh = 180 + Math.random() * 220;
        const x = i * 240 + Math.random() * 60;
        ctx.beginPath();
        ctx.moveTo(x, h);
        ctx.lineTo(x + mw / 2, h - mh);
        ctx.lineTo(x + mw, h);
        ctx.closePath();
        ctx.fill();
      }
    });

    this.bgCity = this.make(1600, 900, (ctx, w, h) => {
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      for (let i = 0; i < 24; i++) {
        const bw = 40 + Math.random() * 70;
        const bh = 80 + Math.random() * 260;
        const x = i * 70 + Math.random() * 18;
        ctx.fillRect(x, h - bh, bw, bh);

        ctx.fillStyle = "rgba(255,215,94,0.12)";
        for (let y = h - bh + 16; y < h - 18; y += 28) {
          for (let px = x + 8; px < x + bw - 10; px += 18) {
            if (Math.random() > 0.45) {
              ctx.fillRect(px, y, 6, 10);
            }
          }
        }
        ctx.fillStyle = "rgba(255,255,255,0.06)";
      }
    });
  },

  make(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    draw(ctx, w, h);
    return c;
  }
};