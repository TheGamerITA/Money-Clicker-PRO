const CanvasEngine = {
  canvas: null,
  ctx: null,
  W: 900,
  H: 506,
  dpr: 1,
  time: 0,

  coin: {
    scale: 1
  },

  particles: [],
  texts: [],
  entities: [],
  entityId: 0,
  boss: null,

  init() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    this.resize();

    window.addEventListener("resize", () => this.resize());
    this.canvas.addEventListener("pointerdown", (e) => this.onPointer(e));
  },

  resize() {
    const rect = this.canvas.getBoundingClientRect();

    this.dpr = window.devicePixelRatio || 1;
    this.W = rect.width || 900;
    this.H = rect.height || 506;

    this.canvas.width = Math.floor(this.W * this.dpr);
    this.canvas.height = Math.floor(this.H * this.dpr);

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  },

  spawnEntity(type) {
    const id = ++this.entityId;
    const r = type === "bag" ? 42 : 36;

    this.entities.push({
      id,
      type,
      x: this.W * 0.18 + Math.random() * this.W * 0.64,
      y: this.H * 0.22 + Math.random() * this.H * 0.42,
      r,
      ttl: 7,
      maxTtl: 7,
      age: 0
    });
  },

  spawnBoss() {
    if (this.boss) return;

    const level = State.current.stats.bossKills + State.current.prestige.resets + 1;

    const maxHp = Math.max(
      1000,
      (State.clickPower() * 600 + State.incomePerSec() * 350) * (1 + level * 0.65)
    );

    this.boss = {
      x: this.W * 0.5,
      y: this.H * 0.3,
      r: Math.min(this.W, this.H) * 0.14,
      hp: maxHp,
      maxHp,
      ttl: 35,
      maxTtl: 35,
      dir: Math.random() > 0.5 ? 1 : -1,
      age: 0,
      hit: 0
    };

    State.current.boss.active = true;

    UI.notify("Boss apparso nell'arena", "info");
    AudioFX.boss();
  },

  moneyRain() {
    if (!State.current.settings.particles) return;

    for (let i = 0; i < 95; i++) {
      this.particles.push({
        x: Math.random() * this.W,
        y: -20 - Math.random() * 90,
        vx: (Math.random() - 0.5) * 45,
        vy: 120 + Math.random() * 230,
        life: 1.35 + Math.random(),
        age: 0,
        size: 3 + Math.random() * 5,
        color: Math.random() > 0.5 ? "#ffd75e" : "#8dff8a"
      });
    }
  },

  addParticles(x, y, color, count) {
    if (!State.current.settings.particles) return;

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 240,
        vy: (Math.random() - 0.72) * 240,
        life: 0.7 + Math.random() * 0.55,
        age: 0,
        size: 2 + Math.random() * 4,
        color
      });
    }
  },

  addText(x, y, text, color = "#ffffff", size = 24) {
    this.texts.push({ x, y, text, color, size, age: 0, life: 1 });
  },

  onPointer(event) {
    AudioFX.init();

    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.boss) {
      const dx = x - this.boss.x;
      const dy = y - this.boss.y;
      const r = this.boss.r + 12;

      if (dx * dx + dy * dy <= r * r) {
        const dmg = State.bossDamage();
        this.boss.hp -= dmg;
        this.boss.hit = 1;

        this.addParticles(x, y, "#ff8b5e", 16);
        this.addText(x, y, `-${Utils.fmt(dmg, true)}`, "#ffb27b", 22);
        AudioFX.click();

        if (this.boss.hp <= 0) {
          const boss = this.boss;
          this.boss = null;
          Events.bossEnd(true, boss);
        }

        return;
      }
    }

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const ent = this.entities[i];
      const bob = Math.sin(ent.age * 4) * 6;
      const dx = x - ent.x;
      const dy = y - (ent.y + bob);
      const radius = ent.r + 12;

      if (dx * dx + dy * dy <= radius * radius) {
        Events.collectEntity(ent);
        this.entities.splice(i, 1);
        return;
      }
    }

    const cx = this.W / 2;
    const cy = this.H / 2 + 15;
    const cr = Math.min(this.W, this.H) * 0.19 * this.coin.scale;

    const dx = x - cx;
    const dy = y - cy;

    if (dx * dx + dy * dy <= cr * cr) {
      this.coinClick(x, y);
    }
  },

  coinClick(x, y) {
    let gain = State.clickPower();
    let crit = false;

    if (Math.random() < State.critChance()) {
      gain *= State.critMultiplier();
      crit = true;
      State.current.stats.crits++;
      AudioFX.crit();
    } else {
      AudioFX.click();
    }

    State.addMoney(gain, true);
    State.current.clicks++;
    Missions.progress("clicks", 1);

    this.coin.scale = crit ? 0.86 : 0.92;

    this.addParticles(x, y, crit ? "#ffd75e" : "#8dff8a", crit ? 28 : 12);
    this.addText(x, y, "+" + Utils.fmt(gain, true), crit ? "#ffd75e" : "#8dff8a", crit ? 34 : 24);

    if (crit) {
      this.addText(x, y - 34, "CRITICO", "#ffd75e", 18);
    }

    UI.updateTop();
    Achievements.check();
  },

  update(dt) {
    this.time += dt;

    this.coin.scale += (1 - this.coin.scale) * Math.min(1, dt * 12);

    this.particles = this.particles.filter((p) => {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 220 * dt;
      return p.age < p.life;
    });

    this.texts = this.texts.filter((t) => {
      t.age += dt;
      t.y -= 55 * dt;
      return t.age < t.life;
    });

    this.entities = this.entities.filter((e) => {
      e.age += dt;
      e.ttl -= dt;
      return e.ttl > 0;
    });

    if (this.boss) {
      this.boss.age += dt;
      this.boss.ttl -= dt;
      this.boss.hit = Math.max(0, this.boss.hit - dt * 4);

      this.boss.x += Math.sin(this.boss.age * 1.2) * 40 * dt;
      this.boss.y = this.H * 0.3 + Math.sin(this.boss.age * 2.2) * 18;

      if (this.boss.ttl <= 0) {
        const boss = this.boss;
        this.boss = null;
        Events.bossEnd(false, boss);
      }
    }
  },

  drawLayer(layer, speed, alpha = 1) {
    if (!layer) return;

    const offset = (this.time * speed) % this.W;

    this.ctx.globalAlpha = alpha;
    this.ctx.drawImage(layer, -offset, 0, this.W, this.H);
    this.ctx.drawImage(layer, this.W - offset, 0, this.W, this.H);
    this.ctx.globalAlpha = 1;
  },

  draw() {
    const ctx = this.ctx;

    ctx.clearRect(0, 0, this.W, this.H);

    this.drawLayer(Sprites.bgSky, 0, 1);
    this.drawLayer(Sprites.bgStars, 4, 0.8);
    this.drawLayer(Sprites.bgMountains, 10, 0.75);
    this.drawLayer(Sprites.bgCity, 22, 0.85);

    if (State.feverActive()) {
      ctx.strokeStyle = "rgba(255, 120, 80, 0.35)";
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, this.W - 10, this.H - 10);
    }

    this.drawCoin();

    for (const ent of this.entities) {
      this.drawEntity(ent);
    }

    if (this.boss) {
      this.drawBoss();
    }

    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, 1 - p.age / p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    for (const t of this.texts) {
      ctx.globalAlpha = Math.max(0, 1 - t.age / t.life);
      ctx.fillStyle = t.color;
      ctx.font = `800 ${t.size}px system-ui`;
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = 8;
      ctx.fillText(t.text, t.x, t.y);
      ctx.shadowBlur = 0;
    }

    ctx.globalAlpha = 1;

    if (State.feverActive()) {
      const secs = Math.ceil((State.effects.feverUntil - Date.now()) / 1000);
      ctx.fillStyle = "#ffd75e";
      ctx.font = "800 28px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(`FRENESIA x5 - ${secs}s`, this.W / 2, 44);
    }
  },

  drawCoin() {
    const ctx = this.ctx;
    const x = this.W / 2;
    const y = this.H / 2 + 15 + Math.sin(this.time * 2) * 8;
    const r = Math.min(this.W, this.H) * 0.19 * this.coin.scale;

    ctx.save();
    ctx.translate(x, y);

    ctx.shadowColor = State.feverActive()
      ? "rgba(255, 120, 60, 0.55)"
      : "rgba(255, 215, 94, 0.35)";
    ctx.shadowBlur = 45;

    ctx.drawImage(Sprites.coin, -r, -r, r * 2, r * 2);

    ctx.shadowBlur = 0;

    const shineAngle = this.time * 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.88, shineAngle, shineAngle + 0.7);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.restore();
  },

  drawEntity(ent) {
    const ctx = this.ctx;
    const bob = Math.sin(ent.age * 4) * 6;
    const x = ent.x;
    const y = ent.y + bob;
    const r = ent.r;

    ctx.save();
    ctx.translate(x, y);

    let color = "#ffd75e";
    let label = "★";

    if (ent.type === "bag") {
      color = "#8dff8a";
      label = "€";
    }

    if (ent.type === "tax") {
      color = "#ff7b7b";
      label = "%";
    }

    if (ent.type === "game") {
      color = "#7cc4ff";
      label = "?";
    }

    if (ent.type === "choice") {
      color = "#d78bff";
      label = "!";
    }

    ctx.shadowColor = color;
    ctx.shadowBlur = 25;

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.92;
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(255,255,255,0.65)";
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.fillStyle = "#111";
    ctx.font = `900 ${r}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 0, r * 0.05);

    const pct = Math.max(0, ent.ttl / ent.maxTtl);
    ctx.beginPath();
    ctx.arc(0, 0, r + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.restore();
  },

  drawBoss() {
    const ctx = this.ctx;
    const b = this.boss;

    ctx.save();
    ctx.translate(b.x, b.y);

    const scale = 1 + b.hit * 0.08;
    const r = b.r * scale;

    ctx.shadowColor = "rgba(255,80,80,0.45)";
    ctx.shadowBlur = 35;
    ctx.drawImage(Sprites.boss, -r, -r, r * 2, r * 2);
    ctx.shadowBlur = 0;

    const barW = r * 2.4;
    const barH = 14;
    const barX = -barW / 2;
    const barY = -r - 38;

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(barX, barY, barW, barH);

    ctx.fillStyle = "#ff5d5d";
    ctx.fillRect(barX, barY, barW * Math.max(0, b.hp / b.maxHp), barH);

    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(`BOSS ${Math.ceil(b.ttl)}s`, 0, barY - 8);

    ctx.restore();
  }
};