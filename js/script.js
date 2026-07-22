"use strict";

let state = defaultState();

let effects = {
  feverUntil: 0
};

let eventTimer = 25;
let offlineGain = 0;
let toastTimeout = null;
let lastFrame = performance.now();
let slowTick = 0;

const els = {
  money: document.getElementById("money"),
  perClick: document.getElementById("perClick"),
  perSec: document.getElementById("perSec"),
  mult: document.getElementById("mult"),

  canvas: document.getElementById("gameCanvas"),

  tabButtons: document.querySelectorAll(".tab-btn"),
  panels: document.querySelectorAll(".panel-tab"),

  shopList: document.getElementById("shopList"),
  statsList: document.getElementById("statsList"),
  achievementsList: document.getElementById("achievementsList"),

  missionsDate: document.getElementById("missionsDate"),
  missionsList: document.getElementById("missionsList"),
  claimAllBtn: document.getElementById("claimAllBtn"),

  soundToggle: document.getElementById("soundToggle"),
  particlesToggle: document.getElementById("particlesToggle"),
  eventsToggle: document.getElementById("eventsToggle"),
  autosaveToggle: document.getElementById("autosaveToggle"),
  offlineToggle: document.getElementById("offlineToggle"),

  prestigeInfo: document.getElementById("prestigeInfo"),
  prestigeBtn: document.getElementById("prestigeBtn"),

  saveBtn: document.getElementById("saveBtn"),
  resetBtn: document.getElementById("resetBtn"),

  toast: document.getElementById("toast")
};

function defaultState() {
  const upgrades = {};

  UPGRADES.forEach((u) => {
    upgrades[u.id] = 0;
  });

  return {
    money: 0,
    totalEarned: 0,
    lifetimeEarned: 0,
    clicks: 0,

    upgrades,
    achievements: [],

    settings: {
      sound: true,
      particles: true,
      events: true,
      autosave: true,
      offline: true
    },

    prestige: {
      coins: 0,
      resets: 0
    },

    missions: {
      date: "",
      entries: []
    },

    stats: {
      goldenClicked: 0,
      eventsCompleted: 0,
      crits: 0,
      upgradesBought: 0,
      missionsClaimed: 0,
      prestigeCoins: 0,
      playTime: 0
    },

    lastSeen: Date.now()
  };
}

function fmt(n, decimals = false) {
  n = Number(n) || 0;

  if (!isFinite(n)) return "∞";

  if (n < 1000) {
    return decimals
      ? (Math.round(n * 10) / 10).toLocaleString("it-IT")
      : Math.floor(n).toLocaleString("it-IT");
  }

  const units = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp"];
  let i = 0;

  while (n >= 1000 && i < units.length - 1) {
    n /= 1000;
    i++;
  }

  return n.toFixed(2).replace(/\.00$/, "") + " " + units[i];
}

function formatTime(seconds) {
  seconds = Math.floor(seconds || 0);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}h ${m}m ${s}s`;
  }

  if (m > 0) {
    return `${m}m ${s}s`;
  }

  return `${s}s`;
}

function todayKey() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function hashCode(str) {
  let h = 0;

  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }

  return h >>> 0;
}

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;

    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(array, rng) {
  const arr = [...array];

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

function prestigeMult() {
  return 1 + state.prestige.coins * CONFIG.prestigeBonusPerCoin;
}

function upgradeGlobalMult() {
  const u = UPGRADES.find((x) => x.id === "global");
  return 1 + (state.upgrades.global || 0) * (u ? u.value : 0.1);
}

function feverActive() {
  return Date.now() < effects.feverUntil;
}

function clickMult() {
  return feverActive() ? CONFIG.feverMultiplier : 1;
}

function globalMult() {
  return upgradeGlobalMult() * prestigeMult();
}

function clickPower() {
  let base = 1;

  for (const u of UPGRADES) {
    if (u.type === "clickAdd") {
      base += (state.upgrades[u.id] || 0) * u.value;
    }
  }

  return base * globalMult() * clickMult();
}

function incomePerSec() {
  let base = 0;

  for (const u of UPGRADES) {
    if (u.type === "incomeAdd") {
      base += (state.upgrades[u.id] || 0) * u.value;
    }
  }

  return base * globalMult();
}

function critChance() {
  const u = UPGRADES.find((x) => x.id === "crit");
  return Math.min(0.75, (state.upgrades.crit || 0) * (u ? u.value : 0.02));
}

function totalUpgrades() {
  return Object.values(state.upgrades).reduce((a, b) => a + b, 0);
}

function getCost(u) {
  const level = state.upgrades[u.id] || 0;

  if (u.max && level >= u.max) {
    return Infinity;
  }

  return Math.floor(u.baseCost * Math.pow(u.growth, level));
}

function prestigePotential() {
  return Math.floor(Math.sqrt(state.totalEarned / CONFIG.prestigeThreshold));
}

function addMoney(amount, countEarnMission = true) {
  if (amount <= 0) return;

  state.money += amount;
  state.totalEarned += amount;
  state.lifetimeEarned += amount;

  if (countEarnMission) {
    addMissionProgress("earn", amount);
  }
}

function buy(id) {
  const u = UPGRADES.find((x) => x.id === id);
  if (!u) return;

  const level = state.upgrades[id] || 0;

  if (u.max && level >= u.max) return;

  const cost = getCost(u);

  if (state.money < cost) {
    AudioFX.error();
    return;
  }

  state.money -= cost;
  state.upgrades[id] = level + 1;
  state.stats.upgradesBought++;

  addMissionProgress("buy", 1);

  AudioFX.buy();

  UI.renderShop();
  UI.updateShop();
  UI.renderStats();
  UI.renderMissions();
  UI.renderOptions();

  checkAchievements();
  updateTop();
}

const CanvasEngine = {
  canvas: null,
  ctx: null,

  W: 900,
  H: 560,
  dpr: 1,

  coin: {
    x: 0,
    y: 0,
    baseR: 90,
    scale: 1
  },

  stars: [],
  particles: [],
  texts: [],
  entities: [],
  entityId: 0,

  init() {
    this.canvas = els.canvas;
    this.ctx = this.canvas.getContext("2d");

    this.resize();

    window.addEventListener("resize", () => this.resize());
    this.canvas.addEventListener("pointerdown", onCanvasPointer);

    this.initStars();
  },

  resize() {
    const rect = this.canvas.getBoundingClientRect();

    this.dpr = window.devicePixelRatio || 1;
    this.W = rect.width || 900;
    this.H = rect.height || 560;

    this.canvas.width = Math.floor(this.W * this.dpr);
    this.canvas.height = Math.floor(this.H * this.dpr);

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.coin.x = this.W / 2;
    this.coin.y = this.H / 2 + 15;
    this.coin.baseR = Math.min(this.W, this.H) * 0.19;

    this.initStars();
  },

  initStars() {
    this.stars = [];

    for (let i = 0; i < 85; i++) {
      this.stars.push({
        x: Math.random() * this.W,
        y: Math.random() * this.H,
        r: Math.random() * 1.8 + 0.3,
        a: Math.random() * Math.PI * 2,
        s: Math.random() * 0.7 + 0.15
      });
    }
  },

  addParticles(x, y, color, count) {
    if (!state.settings.particles) return;

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
    this.texts.push({
      x,
      y,
      text,
      color,
      size,
      age: 0,
      life: 1
    });
  },

  spawnEntity(type) {
    const id = ++this.entityId;

    const r = type === "bag" ? 42 : 36;
    const x = this.W * 0.18 + Math.random() * this.W * 0.64;
    const y = this.H * 0.22 + Math.random() * this.H * 0.42;

    this.entities.push({
      id,
      type,
      x,
      y,
      r,
      ttl: type === "tax" ? 6 : 7,
      maxTtl: type === "tax" ? 6 : 7,
      age: 0
    });
  },

  moneyRain() {
    if (!state.settings.particles) return;

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

  update(dt) {
    this.coin.scale += (1 - this.coin.scale) * Math.min(1, dt * 12);

    for (const s of this.stars) {
      s.a += s.s * dt;
    }

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

    if (state.settings.events) {
      eventTimer -= dt;

      if (eventTimer <= 0) {
        triggerRandomEvent();
        eventTimer = CONFIG.eventMin + Math.random() * (CONFIG.eventMax - CONFIG.eventMin);
      }
    }
  },

  draw() {
    const ctx = this.ctx;

    ctx.clearRect(0, 0, this.W, this.H);

    const bg = ctx.createLinearGradient(0, 0, 0, this.H);
    bg.addColorStop(0, "#1d2b43");
    bg.addColorStop(1, "#0b1020");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.W, this.H);

    for (const s of this.stars) {
      ctx.globalAlpha = 0.22 + Math.abs(Math.sin(s.a)) * 0.65;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    if (feverActive()) {
      ctx.strokeStyle = "rgba(255, 120, 80, 0.35)";
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, this.W - 10, this.H - 10);
    }

    this.drawCoin();

    for (const ent of this.entities) {
      this.drawEntity(ent);
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
      ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
      ctx.shadowBlur = 8;
      ctx.fillText(t.text, t.x, t.y);
      ctx.shadowBlur = 0;
    }

    ctx.globalAlpha = 1;

    if (feverActive()) {
      const secs = Math.ceil((effects.feverUntil - Date.now()) / 1000);
      ctx.fillStyle = "#ffd75e";
      ctx.font = "800 28px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(`FRENESIA CLICK x5 - ${secs}s`, this.W / 2, 44);
    }
  },

  drawCoin() {
    const ctx = this.ctx;
    const x = this.coin.x;
    const y = this.coin.y;
    const r = this.coin.baseR * this.coin.scale;

    ctx.save();
    ctx.translate(x, y);

    ctx.shadowColor = feverActive()
      ? "rgba(255, 120, 60, 0.55)"
      : "rgba(255, 215, 94, 0.35)";
    ctx.shadowBlur = 45;

    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.15, 0, 0, r);
    grad.addColorStop(0, "#fff3b0");
    grad.addColorStop(0.25, "#ffd75e");
    grad.addColorStop(0.7, "#f7b733");
    grad.addColorStop(1, "#9a6b00");

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.lineWidth = 10;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.fillStyle = "#5c3d00";
    ctx.font = `900 ${Math.floor(r * 0.9)}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("€", 0, r * 0.04);

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
    ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
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
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.restore();
  }
};

function onCanvasPointer(event) {
  AudioFX.init();

  const rect = CanvasEngine.canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  for (let i = CanvasEngine.entities.length - 1; i >= 0; i--) {
    const ent = CanvasEngine.entities[i];
    const bob = Math.sin(ent.age * 4) * 6;

    const dx = x - ent.x;
    const dy = y - (ent.y + bob);
    const radius = ent.r + 12;

    if (dx * dx + dy * dy <= radius * radius) {
      collectEntity(ent);
      CanvasEngine.entities.splice(i, 1);
      return;
    }
  }

  const dx = x - CanvasEngine.coin.x;
  const dy = y - CanvasEngine.coin.y;
  const r = CanvasEngine.coin.baseR * CanvasEngine.coin.scale;

  if (dx * dx + dy * dy <= r * r) {
    doCoinClick(x, y);
  }
}

function doCoinClick(x, y) {
  let gain = clickPower();
  let crit = false;

  if (Math.random() < critChance()) {
    gain *= 10;
    crit = true;
    state.stats.crits++;
    AudioFX.crit();
  } else {
    AudioFX.click();
  }

  addMoney(gain, true);

  state.clicks++;
  addMissionProgress("clicks", 1);

  CanvasEngine.coin.scale = crit ? 0.86 : 0.92;

  CanvasEngine.addParticles(
    x,
    y,
    crit ? "#ffd75e" : "#8dff8a",
    crit ? 28 : 12
  );

  CanvasEngine.addText(
    x,
    y,
    "+" + fmt(gain, true),
    crit ? "#ffd75e" : "#8dff8a",
    crit ? 34 : 24
  );

  if (crit) {
    CanvasEngine.addText(x, y - 34, "CRITICO!", "#ffd75e", 18);
  }

  updateTop();
  checkAchievements();
}

function triggerRandomEvent() {
  if (!state.settings.events) return;

  const roll = Math.random();

  if (roll < 0.3) {
    CanvasEngine.spawnEntity("golden");
    showToast("È apparso un bonus dorato!");
    AudioFX.event();
    return;
  }

  if (roll < 0.52) {
    CanvasEngine.spawnEntity("bag");
    showToast("È apparso un bottino!");
    AudioFX.event();
    return;
  }

  if (roll < 0.7) {
    CanvasEngine.spawnEntity("tax");
    showToast("Controllo fiscale! Cliccalo subito!");
    AudioFX.event();
    return;
  }

  if (roll < 0.86) {
    effects.feverUntil = Date.now() + CONFIG.feverDurationMs;
    showToast("Frenesia click: x5 per 20 secondi!");
    AudioFX.event();

    state.stats.eventsCompleted++;
    addMissionProgress("events", 1);

    UI.renderMissions();
    checkAchievements();
    updateTop();
    return;
  }

  const gain = Math.max(
    250,
    incomePerSec() * 100 + clickPower() * 250
  );

  addMoney(gain, true);
  CanvasEngine.moneyRain();
  showToast(`Pioggia di soldi: +${fmt(gain)}!`);
  AudioFX.event();

  state.stats.eventsCompleted++;
  addMissionProgress("events", 1);

  UI.renderMissions();
  checkAchievements();
  updateTop();
}

function collectEntity(ent) {
  let reward = 0;
  let color = "#ffd75e";
  let label = "Bonus!";

  if (ent.type === "golden") {
    reward = Math.max(150, incomePerSec() * 70 + clickPower() * 140);
    state.stats.goldenClicked++;
    addMissionProgress("golden", 1);
    label = "Bonus oro!";
  }

  if (ent.type === "bag") {
    reward = Math.max(400, incomePerSec() * 130 + clickPower() * 280);
    state.stats.goldenClicked++;
    addMissionProgress("golden", 1);
    color = "#8dff8a";
    label = "Bottino!";
  }

  if (ent.type === "tax") {
    reward = Math.max(300, incomePerSec() * 90 + clickPower() * 200);
    color = "#ff7b7b";
    label = "Tassa evitata!";
  }

  addMoney(reward, true);

  state.stats.eventsCompleted++;
  addMissionProgress("events", 1);

  CanvasEngine.addParticles(ent.x, ent.y, color, 35);
  CanvasEngine.addText(ent.x, ent.y - 20, `+${fmt(reward)}`, color, 30);

  AudioFX.event();

  UI.renderMissions();
  checkAchievements();
  updateTop();
}

function generateDailyMissions(force = false) {
  const key = todayKey();

  if (
    !force &&
    state.missions.date === key &&
    Array.isArray(state.missions.entries) &&
    state.missions.entries.length
  ) {
    return;
  }

  const rng = mulberry32(hashCode(key + "|" + state.prestige.resets));
  const types = shuffle(MISSION_TYPES, rng).slice(0, 3);

  const entries = types.map((type, index) => {
    let target = 1;
    let reward = 0;
    let rewardCoins = 0;
    let name = "Missione";
    let desc = "Descrizione missione";
    let icon = "star";

    const diff = 1 + state.prestige.resets * 0.35;

    if (type === "clicks") {
      target = Math.floor((100 + state.prestige.resets * 120) * (1 + rng() * 0.5));
      reward = Math.max(500, clickPower() * target * 0.35);
      name = "Click quotidiani";
      desc = "Clicca la moneta.";
      icon = "mouse";
    }

    if (type === "earn") {
      target = Math.floor(
        Math.max(
          1000,
          (clickPower() * 220 + Math.max(incomePerSec(), 1) * 160) *
            diff *
            (0.8 + rng() * 0.6)
        )
      );
      reward = Math.max(750, target * 0.18);
      name = "Affari d'oro";
      desc = "Guadagna soldi.";
      icon = "money";
    }

    if (type === "buy") {
      target = Math.floor(
        3 + Math.min(8, totalUpgrades() / 12) + state.prestige.resets + rng() * 2
      );
      reward = Math.max(
        1000,
        (incomePerSec() * 120 + clickPower() * 250) * diff
      );
      name = "Shopping strategico";
      desc = "Compra upgrade.";
      icon = "shop";
    }

    if (type === "events") {
      target = 1 + Math.floor(rng() * 2);
      reward = Math.max(
        2000,
        (incomePerSec() * 200 + clickPower() * 450) * diff
      );
      rewardCoins =
        (state.prestige.coins > 0 || state.lifetimeEarned >= CONFIG.prestigeThreshold) &&
        rng() > 0.55
          ? 1
          : 0;
      name = "Cacciatore di eventi";
      desc = "Completa eventi casuali.";
      icon = "gift";
    }

    if (type === "golden") {
      target = 1 + Math.floor(rng() * 2);
      reward = Math.max(
        1800,
        (incomePerSec() * 180 + clickPower() * 400) * diff
      );
      rewardCoins =
        (state.prestige.coins > 0 || state.lifetimeEarned >= CONFIG.prestigeThreshold) &&
        rng() > 0.65
          ? 1
          : 0;
      name = "Febbre dorata";
      desc = "Clicca bonus dorati.";
      icon = "star";
    }

    return {
      id: `${type}_${index}`,
      type,
      name,
      desc,
      icon,
      target,
      progress: 0,
      reward: Math.floor(reward),
      rewardCoins,
      claimed: false
    };
  });

  state.missions = {
    date: key,
    entries
  };
}

function addMissionProgress(type, amount = 1) {
  if (!state.missions || state.missions.date !== todayKey()) return;

  for (const m of state.missions.entries) {
    if (m.type === type && !m.claimed) {
      m.progress += amount;
    }
  }
}

function claimMission(id) {
  const m = state.missions.entries.find((x) => x.id === id);

  if (!m || m.claimed || m.progress < m.target) return;

  m.claimed = true;
  state.stats.missionsClaimed++;

  addMoney(m.reward, false);

  if (m.rewardCoins) {
    state.prestige.coins += m.rewardCoins;
  }

  AudioFX.unlock();

  showToast(
    `Missione completata: +${fmt(m.reward)}${
      m.rewardCoins ? ` e +${m.rewardCoins} Monete Anima` : ""
    }`
  );

  UI.renderMissions();
  UI.renderOptions();
  updateTop();
  checkAchievements();
}

function claimAllMissions() {
  if (!state.missions || state.missions.date !== todayKey()) return;

  for (const m of state.missions.entries) {
    if (!m.claimed && m.progress >= m.target) {
      claimMission(m.id);
    }
  }
}

function doPrestige() {
  const gain = prestigePotential();

  if (gain <= 0) {
    AudioFX.error();
    return;
  }

  const ok = confirm(
    `Vuoi fare prestigio?\n\nOttieni: ${fmt(gain)} Monete Anima\nPerderai soldi e upgrade della run attuale.`
  );

  if (!ok) return;

  state.prestige.coins += gain;
  state.prestige.resets++;
  state.stats.prestigeCoins += gain;

  state.money = 0;
  state.totalEarned = 0;

  for (const key of Object.keys(state.upgrades)) {
    state.upgrades[key] = 0;
  }

  effects.feverUntil = 0;
  eventTimer = 25;
  CanvasEngine.entities = [];

  AudioFX.prestige();

  showToast(`Rebirth completato: +${fmt(gain)} Monete Anima`);

  UI.renderAll();
  updateTop();
  checkAchievements();
  save(true, true);
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;

    const saved = JSON.parse(raw);
    const def = defaultState();

    state = {
      ...def,
      ...saved,
      upgrades: { ...def.upgrades, ...(saved.upgrades || {}) },
      settings: { ...def.settings, ...(saved.settings || {}) },
      prestige: { ...def.prestige, ...(saved.prestige || {}) },
      missions: { ...def.missions, ...(saved.missions || {}) },
      stats: { ...def.stats, ...(saved.stats || {}) }
    };

    const awaySeconds = Math.min(
      Math.max((Date.now() - (saved.lastSeen || Date.now())) / 1000, 0),
      CONFIG.offlineMaxHours * 3600
    );

    if (state.settings.offline && awaySeconds > 10) {
      const gain = incomePerSec() * awaySeconds;

      if (gain > 0) {
        addMoney(gain, false);
        offlineGain = gain;
      }
    }
  } catch (err) {
    console.error("Errore durante il caricamento del salvataggio:", err);
  }
}

function save(silent = false, force = false) {
  if (!force && silent && !state.settings.autosave) return;

  state.lastSeen = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));

  if (!silent) {
    showToast("Partita salvata");
  }
}

function resetGame() {
  const ok = confirm("Vuoi davvero resettare tutto? Questa azione è permanente.");

  if (!ok) return;

  localStorage.removeItem(SAVE_KEY);

  state = defaultState();
  effects.feverUntil = 0;
  eventTimer = 25;
  offlineGain = 0;

  CanvasEngine.entities = [];
  CanvasEngine.particles = [];
  CanvasEngine.texts = [];

  generateDailyMissions(true);

  UI.renderAll();
  updateTop();

  showToast("Gioco resettato");
}

function showToast(msg) {
  if (!els.toast) return;

  els.toast.textContent = msg;
  els.toast.classList.add("show");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    els.toast.classList.remove("show");
  }, 2600);
}

function checkAchievements() {
  let changed = false;

  for (const a of ACHIEVEMENTS) {
    if (!state.achievements.includes(a.id) && a.check(state)) {
      state.achievements.push(a.id);
      showToast(`Obiettivo completato: ${a.name}`);
      AudioFX.unlock();
      changed = true;
    }
  }

  if (changed && UI.currentTab === "achievements") {
    UI.renderAchievements();
  }
}

function updateTop() {
  els.money.textContent = fmt(state.money);
  els.perClick.textContent = fmt(clickPower(), true);
  els.perSec.textContent = fmt(incomePerSec(), true);
  els.mult.textContent = "x" + globalMult().toFixed(2);
}

const UI = {
  currentTab: "shop",

  initTabs() {
    els.tabButtons.forEach((btn) => {
      btn.innerHTML = `${icon(btn.dataset.icon)}<span>${btn.dataset.label}</span>`;

      btn.addEventListener("click", () => {
        this.switchTab(btn.dataset.tab);
      });
    });

    this.switchTab("shop");
  },

  switchTab(tab) {
    this.currentTab = tab;

    els.tabButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tab);
    });

    els.panels.forEach((panel) => {
      panel.classList.toggle("hidden", panel.dataset.panel !== tab);
    });

    if (tab === "shop") this.renderShop();
    if (tab === "stats") this.renderStats();
    if (tab === "achievements") this.renderAchievements();
    if (tab === "missions") this.renderMissions();
    if (tab === "options") this.renderOptions();
  },

  renderAll() {
    this.renderShop();
    this.renderStats();
    this.renderAchievements();
    this.renderMissions();
    this.renderOptions();
  },

  visibleUpgrades() {
    return UPGRADES.filter((u) => {
      return (
        (state.upgrades[u.id] || 0) > 0 ||
        state.totalEarned >= u.unlockAt ||
        state.lifetimeEarned >= u.unlockAt
      );
    });
  },

  effectText(u) {
    const level = state.upgrades[u.id] || 0;

    if (u.type === "clickAdd") {
      return `Totale: +${fmt(u.value * level, true)} per click`;
    }

    if (u.type === "incomeAdd") {
      return `Totale: +${fmt(u.value * level, true)}/s`;
    }

    if (u.type === "crit") {
      return `Probabilità critico: ${Math.round(level * u.value * 100)}%`;
    }

    if (u.type === "global") {
      return `Bonus attuale: +${Math.round(level * u.value * 100)}%`;
    }

    return "";
  },

  renderShop() {
    const visible = this.visibleUpgrades();

    if (!visible.length) {
      els.shopList.innerHTML = `
        <p class="empty">Continua a cliccare per sbloccare il primo upgrade.</p>
      `;
      return;
    }

    els.shopList.innerHTML = visible
      .map((u) => {
        const level = state.upgrades[u.id] || 0;
        const maxed = u.max && level >= u.max;
        const cost = getCost(u);

        return `
          <div class="upgrade" id="upg-${u.id}">
            <div class="upgrade-left">
              <div class="upgrade-icon">${icon(u.icon)}</div>

              <div>
                <div class="upgrade-name">
                  ${u.name}
                  <span class="level">Lv ${level}${u.max ? "/" + u.max : ""}</span>
                </div>

                <div class="upgrade-desc">${u.desc} (${u.effect})</div>
                <div class="upgrade-effect">${this.effectText(u)}</div>
              </div>
            </div>

            <button class="buy" data-id="${u.id}" ${maxed ? "disabled" : ""}>
              ${maxed ? "MAX" : "€ " + fmt(cost)}
            </button>
          </div>
        `;
      })
      .join("");

    this.updateShop();
  },

  updateShop() {
    for (const u of this.visibleUpgrades()) {
      const card = document.getElementById(`upg-${u.id}`);

      if (!card) {
        this.renderShop();
        return;
      }

      const btn = card.querySelector("button.buy");
      if (!btn) continue;

      const level = state.upgrades[u.id] || 0;
      const maxed = u.max && level >= u.max;
      const cost = getCost(u);

      if (maxed) {
        btn.disabled = true;
        btn.textContent = "MAX";
      } else {
        btn.disabled = state.money < cost;
        btn.textContent = "€ " + fmt(cost);
      }
    }
  },

  renderStats() {
    els.statsList.innerHTML = [
      ["Soldi attuali", fmt(state.money)],
      ["Guadagno run attuale", fmt(state.totalEarned)],
      ["Guadagno totale vita", fmt(state.lifetimeEarned)],
      ["Click totali", fmt(state.clicks)],
      ["Soldi per click", fmt(clickPower(), true)],
      ["Soldi per secondo", fmt(incomePerSec(), true)],
      ["Moltiplicatore globale", "x" + globalMult().toFixed(2)],
      ["Probabilità critico", Math.round(critChance() * 100) + "%"],
      ["Upgrade comprati", fmt(state.stats.upgradesBought)],
      ["Bonus dorati cliccati", fmt(state.stats.goldenClicked)],
      ["Eventi completati", fmt(state.stats.eventsCompleted)],
      ["Missioni completate", fmt(state.stats.missionsClaimed)],
      ["Click critici", fmt(state.stats.crits)],
      ["Monete Anima", fmt(state.prestige.coins)],
      ["Prestige fatti", fmt(state.prestige.resets)],
      ["Tempo di gioco", formatTime(state.stats.playTime)]
    ]
      .map(
        ([label, value]) =>
          `<div class="stat-row"><span>${label}</span><strong>${value}</strong></div>`
      )
      .join("");
  },

  renderAchievements() {
    els.achievementsList.innerHTML = ACHIEVEMENTS.map((a) => {
      const done = state.achievements.includes(a.id);

      return `
        <div class="achievement ${done ? "done" : ""}">
          <div class="achievement-icon">${icon(a.icon)}</div>
          <div>
            <strong>${a.name}</strong>
          </div>
          <div>${done ? "✅" : "🔒"}</div>
          <div class="ach-desc">${a.desc}</div>
        </div>
      `;
    }).join("");
  },

  renderMissions() {
    generateDailyMissions();

    els.missionsDate.textContent = todayKey();

    const entries = state.missions.entries || [];

    els.claimAllBtn.disabled = !entries.some(
      (m) => m.progress >= m.target && !m.claimed
    );

    if (!entries.length) {
      els.missionsList.innerHTML = `
        <p class="empty">Nessuna missione disponibile oggi.</p>
      `;
      return;
    }

    els.missionsList.innerHTML = entries
      .map((m) => {
        const pct = Math.min(100, (m.progress / m.target) * 100);
        const complete = m.progress >= m.target;

        const rewardText = m.rewardCoins
          ? `+${fmt(m.reward)} • +${m.rewardCoins} Anima`
          : `+${fmt(m.reward)}`;

        return `
          <div class="mission ${m.claimed ? "claimed" : ""}">
            <div class="mission-head">
              <div class="mission-left">
                <div class="mission-icon">${icon(m.icon)}</div>

                <div>
                  <div class="mission-name">${m.name}</div>
                  <div class="mission-desc">${m.desc}</div>
                </div>
              </div>

              <button
                class="claim"
                data-id="${m.id}"
                ${complete && !m.claimed ? "" : "disabled"}
              >
                ${m.claimed ? "Fatto" : rewardText}
              </button>
            </div>

            <div class="mission-progress-text">
              ${fmt(Math.min(m.progress, m.target), true)} / ${fmt(m.target, true)}
            </div>

            <div class="progress">
              <div style="width:${pct}%"></div>
            </div>
          </div>
        `;
      })
      .join("");
  },

  renderOptions() {
    els.soundToggle.checked = state.settings.sound;
    els.particlesToggle.checked = state.settings.particles;
    els.eventsToggle.checked = state.settings.events;
    els.autosaveToggle.checked = state.settings.autosave;
    els.offlineToggle.checked = state.settings.offline;

    const potential = prestigePotential();

    els.prestigeInfo.innerHTML = `
      <div class="stat-row">
        <span>Monete Anima</span>
        <strong>${fmt(state.prestige.coins)}</strong>
      </div>

      <div class="stat-row">
        <span>Bonus prestigio</span>
        <strong>x${prestigeMult().toFixed(2)}</strong>
      </div>

      <div class="stat-row">
        <span>Guadagno run attuale</span>
        <strong>${fmt(state.totalEarned)}</strong>
      </div>

      <div class="stat-row">
        <span>Potenziale rebirth</span>
        <strong>${fmt(potential)}</strong>
      </div>
    `;

    els.prestigeBtn.disabled = potential <= 0;
    els.prestigeBtn.textContent =
      potential > 0
        ? `Ottieni ${fmt(potential)} Monete Anima`
        : "Serve 1M nella run attuale";
  }
};

function bindEvents() {
  els.shopList.addEventListener("click", (event) => {
    const btn = event.target.closest("button.buy");
    if (!btn || btn.disabled) return;

    buy(btn.dataset.id);
  });

  els.missionsList.addEventListener("click", (event) => {
    const btn = event.target.closest("button.claim");
    if (!btn || btn.disabled) return;

    claimMission(btn.dataset.id);
  });

  els.claimAllBtn.addEventListener("click", claimAllMissions);

  els.soundToggle.addEventListener("change", (e) => {
    state.settings.sound = e.target.checked;
    if (state.settings.sound) AudioFX.init();
    save(true, true);
  });

  els.particlesToggle.addEventListener("change", (e) => {
    state.settings.particles = e.target.checked;
    save(true, true);
  });

  els.eventsToggle.addEventListener("change", (e) => {
    state.settings.events = e.target.checked;

    if (!state.settings.events) {
      CanvasEngine.entities = [];
    }

    save(true, true);
  });

  els.autosaveToggle.addEventListener("change", (e) => {
    state.settings.autosave = e.target.checked;
    save(true, true);
  });

  els.offlineToggle.addEventListener("change", (e) => {
    state.settings.offline = e.target.checked;
    save(true, true);
  });

  els.prestigeBtn.addEventListener("click", doPrestige);
  els.saveBtn.addEventListener("click", () => save(false, true));
  els.resetBtn.addEventListener("click", resetGame);

  window.addEventListener("beforeunload", () => save(true, true));
}

function frame(now) {
  const dt = Math.min((now - lastFrame) / 1000, 1);
  lastFrame = now;

  const income = incomePerSec() * dt;

  if (income > 0) {
    addMoney(income, true);
  }

  state.stats.playTime += dt;

  CanvasEngine.update(dt);
  CanvasEngine.draw();

  slowTick++;

  if (slowTick % 15 === 0) {
    updateTop();
    UI.updateShop();

    if (UI.currentTab === "missions") {
      UI.renderMissions();
    }

    if (UI.currentTab === "stats") {
      UI.renderStats();
    }

    if (UI.currentTab === "options") {
      UI.renderOptions();
    }

    checkAchievements();
  }

  requestAnimationFrame(frame);
}

function init() {
  load();

  generateDailyMissions();

  CanvasEngine.init();
  UI.initTabs();
  UI.renderAll();
  bindEvents();

  updateTop();

  if (offlineGain > 0) {
    setTimeout(() => {
      showToast(`Guadagno offline: +${fmt(offlineGain)}!`);
    }, 700);
  }

  setInterval(() => {
    save(true);
  }, CONFIG.autosaveMs);

  requestAnimationFrame(frame);
}

init();