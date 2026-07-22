const State = {
  current: null,
  effects: {
    feverUntil: 0
  },
  offlineGain: 0,

  default() {
    const upgrades = {};
    DATA.UPGRADES.forEach((u) => {
      upgrades[u.id] = 0;
    });

    return {
      money: 0,
      totalEarned: 0,
      lifetimeEarned: 0,
      clicks: 0,

      upgrades,
      skills: [],
      skillPoints: 0,

      unlocked: {
        skills: false,
        boss: false,
        games: false,
        choice: false,
        themes: false
      },

      settings: {
        sound: true,
        particles: true,
        events: true,
        autosave: true,
        offline: true,
        theme: "default"
      },

      prestige: {
        coins: 0,
        resets: 0
      },

      missions: {
        daily: { date: "", entries: [] },
        weekly: { week: "", entries: [] }
      },

      achievements: {},

      themes: {
        unlocked: ["default"]
      },

      stats: {
        goldenClicked: 0,
        eventsCompleted: 0,
        crits: 0,
        upgradesBought: 0,
        missionsClaimed: 0,
        prestigeCoins: 0,
        playTime: 0,
        bossKills: 0,
        gamesWon: 0,
        gamesPlayed: 0,
        choicesDone: 0
      },

      boss: {
        active: false
      },

      eventTimer: 25,
      lastSeen: Date.now()
    };
  },

  init() {
    this.current = this.default();
    this.load();
    this.applyTheme(this.current.settings.theme);
  },

  load() {
    try {
      const raw = localStorage.getItem(DATA.SAVE_KEY);
      if (!raw) return;

      const saved = JSON.parse(raw);
      const def = this.default();

      this.current = {
        ...def,
        ...saved,
        upgrades: { ...def.upgrades, ...(saved.upgrades || {}) },
        settings: { ...def.settings, ...(saved.settings || {}) },
        prestige: { ...def.prestige, ...(saved.prestige || {}) },
        missions: {
          daily: { ...def.missions.daily, ...(saved.missions?.daily || {}) },
          weekly: { ...def.missions.weekly, ...(saved.missions?.weekly || {}) }
        },
        achievements: { ...def.achievements, ...(saved.achievements || {}) },
        themes: { ...def.themes, ...(saved.themes || {}) },
        stats: { ...def.stats, ...(saved.stats || {}) },
        boss: { ...def.boss, active: false }
      };

      const awaySeconds = Math.min(
        Math.max((Date.now() - (saved.lastSeen || Date.now())) / 1000, 0),
        DATA.CONFIG.offlineMaxHours * 3600
      );

      if (this.current.settings.offline && awaySeconds > 10) {
        const gain = this.incomePerSec() * awaySeconds * this.offlineMult();
        if (gain > 0) {
          this.addMoney(gain, false);
          this.offlineGain = gain;
        }
      }
    } catch (err) {
      console.error("Errore caricamento salvataggio:", err);
    }
  },

  save(silent = false, force = false) {
    if (!force && silent && !this.current.settings.autosave) return;

    this.current.lastSeen = Date.now();
    localStorage.setItem(DATA.SAVE_KEY, JSON.stringify(this.current));

    if (!silent && window.UI) {
      UI.notify("Partita salvata", "success");
    }
  },

  reset() {
    localStorage.removeItem(DATA.SAVE_KEY);
    this.current = this.default();
    this.effects.feverUntil = 0;
    this.offlineGain = 0;
    this.applyTheme("default");
  },

  skillEffects() {
    const eff = {
      clickMult: 0,
      incomeMult: 0,
      crit: 0,
      bossDamage: 0,
      eventReward: 0,
      gameReward: 0,
      offline: 0,
      critPower: 0
    };

    for (const id of this.current.skills) {
      const skill = DATA.SKILLS.find((s) => s.id === id);
      if (!skill || !skill.effect) continue;

      for (const key of Object.keys(skill.effect)) {
        eff[key] = (eff[key] || 0) + skill.effect[key];
      }
    }

    return eff;
  },

  prestigeMult() {
    return 1 + this.current.prestige.coins * DATA.CONFIG.prestigeBonusPerCoin;
  },

  upgradeGlobalMult() {
    const u = DATA.UPGRADES.find((x) => x.id === "global");
    return 1 + (this.current.upgrades.global || 0) * (u ? u.value : 0.1);
  },

  feverActive() {
    return Date.now() < this.effects.feverUntil;
  },

  globalMult() {
    const eff = this.skillEffects();
    return this.upgradeGlobalMult() * this.prestigeMult() * (1 + eff.incomeMult);
  },

  clickPower() {
    const eff = this.skillEffects();
    let base = 1;

    for (const u of DATA.UPGRADES) {
      if (u.type === "clickAdd") {
        base += (this.current.upgrades[u.id] || 0) * u.value;
      }
    }

    const fever = this.feverActive() ? DATA.CONFIG.feverMultiplier : 1;

    return (
      base *
      this.upgradeGlobalMult() *
      this.prestigeMult() *
      (1 + eff.clickMult) *
      fever
    );
  },

  incomePerSec() {
    let base = 0;

    for (const u of DATA.UPGRADES) {
      if (u.type === "incomeAdd") {
        base += (this.current.upgrades[u.id] || 0) * u.value;
      }
    }

    return base * this.globalMult();
  },

  critChance() {
    const u = DATA.UPGRADES.find((x) => x.id === "crit");
    const eff = this.skillEffects();
    return Math.min(0.8, (this.current.upgrades.crit || 0) * (u ? u.value : 0.02) + eff.crit);
  },

  critMultiplier() {
    const eff = this.skillEffects();
    return DATA.CONFIG.critBaseMultiplier + eff.critPower;
  },

  bossDamage() {
    const eff = this.skillEffects();
    return this.clickPower() * (1 + eff.bossDamage);
  },

  eventRewardMult() {
    return 1 + this.skillEffects().eventReward;
  },

  gameRewardMult() {
    return 1 + this.skillEffects().gameReward;
  },

  offlineMult() {
    return 1 + this.skillEffects().offline;
  },

  totalUpgrades() {
    return Object.values(this.current.upgrades).reduce((a, b) => a + b, 0);
  },

  getCost(u) {
    const level = this.current.upgrades[u.id] || 0;
    if (u.max && level >= u.max) return Infinity;
    return Math.floor(u.baseCost * Math.pow(u.growth, level));
  },

  isUnlocked(key) {
    if (key === "skills") {
      return this.current.unlocked.skills || this.current.prestige.resets > 0;
    }

    return !!this.current.unlocked[key];
  },

  unlock(key, silent = false) {
    if (this.current.unlocked[key]) return;

    this.current.unlocked[key] = true;

    if (!silent && window.UI) {
      UI.notify(`Nuova meccanica sbloccata: ${key}`, "success");
      AudioFX.unlock();
    }
  },

  unlockTheme(themeId) {
    if (!this.current.themes.unlocked.includes(themeId)) {
      this.current.themes.unlocked.push(themeId);
    }
  },

  applyTheme(themeId) {
    if (!this.current.themes.unlocked.includes(themeId)) return;
    this.current.settings.theme = themeId;
    document.body.dataset.theme = themeId;
  },

  buyTheme(themeId) {
    const theme = DATA.THEMES.find((t) => t.id === themeId);
    if (!theme) return;

    if (this.current.themes.unlocked.includes(themeId)) {
      this.applyTheme(themeId);
      return;
    }

    if (this.current.money < theme.cost) {
      AudioFX.error();
      UI.notify("Soldi insufficienti", "error");
      return;
    }

    this.current.money -= theme.cost;
    this.unlockTheme(themeId);
    this.applyTheme(themeId);
    AudioFX.unlock();
    UI.notify(`Tema sbloccato: ${theme.name}`, "success");
  },

  addMoney(amount, countEarnMission = true) {
    if (amount <= 0) return;

    this.current.money += amount;
    this.current.totalEarned += amount;
    this.current.lifetimeEarned += amount;

    if (countEarnMission && window.Missions) {
      Missions.progress("earn", amount);
    }
  },

  spendMoney(amount) {
    if (this.current.money < amount) return false;
    this.current.money -= amount;
    return true;
  },

  buyUpgrade(id) {
    const u = DATA.UPGRADES.find((x) => x.id === id);
    if (!u) return;

    const level = this.current.upgrades[id] || 0;
    if (u.max && level >= u.max) return;

    const cost = this.getCost(u);
    if (this.current.money < cost) {
      AudioFX.error();
      return;
    }

    this.current.money -= cost;
    this.current.upgrades[id] = level + 1;
    this.current.stats.upgradesBought++;

    if (window.Missions) {
      Missions.progress("buy", 1);
    }

    if (u.unlock) {
      this.unlock(u.unlock);
    }

    AudioFX.buy();
  },

  buySkill(id) {
    const skill = DATA.SKILLS.find((s) => s.id === id);
    if (!skill) return;

    if (this.current.skills.includes(id)) return;

    if (skill.requires && !this.current.skills.includes(skill.requires)) {
      AudioFX.error();
      UI.notify("Prima compra il requisito", "error");
      return;
    }

    if (this.current.skillPoints < skill.cost) {
      AudioFX.error();
      UI.notify("Punti abilità insufficienti", "error");
      return;
    }

    this.current.skillPoints -= skill.cost;
    this.current.skills.push(id);

    if (skill.unlock) {
      this.unlock(skill.unlock);
    }

    AudioFX.unlock();
    UI.notify(`Abilità acquistata: ${skill.name}`, "success");
  },

  prestigePotential() {
    return Math.floor(Math.sqrt(this.current.totalEarned / DATA.CONFIG.prestigeThreshold));
  },

  doPrestige() {
    const gain = this.prestigePotential();
    if (gain <= 0) return false;

    const skillGain = 1 + Math.floor(gain / 3);

    this.current.prestige.coins += gain;
    this.current.prestige.resets++;
    this.current.stats.prestigeCoins += gain;
    this.current.skillPoints += skillGain;

    this.current.money = 0;
    this.current.totalEarned = 0;

    for (const key of Object.keys(this.current.upgrades)) {
      this.current.upgrades[key] = 0;
    }

    this.effects.feverUntil = 0;
    this.current.eventTimer = 25;
    this.current.boss.active = false;

    if (window.CanvasEngine) {
      CanvasEngine.boss = null;
      CanvasEngine.entities = [];
    }

    AudioFX.prestige();
    UI.notify(`Rebirth completato: +${Utils.fmt(gain)} monete e +${skillGain} PT`, "success");

    return true;
  }
};