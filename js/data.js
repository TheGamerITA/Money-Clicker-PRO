const SAVE_KEY = "moneyClickerProSave";

const CONFIG = {
  tickMs: 100,
  autosaveMs: 15000,
  offlineMaxHours: 8,
  eventMin: 35,
  eventMax: 80,
  prestigeThreshold: 1_000_000,
  prestigeBonusPerCoin: 0.02,
  feverMultiplier: 5,
  feverDurationMs: 20000
};

const UPGRADES = [
  {
    id: "guanto",
    icon: "hand",
    name: "Guanto",
    desc: "Aumenta i soldi guadagnati per click.",
    effect: "+1 per click",
    baseCost: 15,
    growth: 1.15,
    type: "clickAdd",
    value: 1,
    unlockAt: 0
  },
  {
    id: "mouse",
    icon: "mouse",
    name: "Mouse Gaming",
    desc: "Click più potenti.",
    effect: "+5 per click",
    baseCost: 120,
    growth: 1.18,
    type: "clickAdd",
    value: 5,
    unlockAt: 80
  },
  {
    id: "autoclicker",
    icon: "robot",
    name: "Auto Clicker",
    desc: "Clicca automaticamente per te.",
    effect: "+1/s",
    baseCost: 60,
    growth: 1.15,
    type: "incomeAdd",
    value: 1,
    unlockAt: 40
  },
  {
    id: "crit",
    icon: "bolt",
    name: "Click Critico",
    desc: "Aggiunge probabilità di critico x10.",
    effect: "+2% critico",
    baseCost: 400,
    growth: 1.35,
    type: "crit",
    value: 0.02,
    max: 25,
    unlockAt: 250
  },
  {
    id: "fabbrica",
    icon: "factory",
    name: "Fabbrica",
    desc: "Produce soldi automaticamente.",
    effect: "+8/s",
    baseCost: 700,
    growth: 1.17,
    type: "incomeAdd",
    value: 8,
    unlockAt: 500
  },
  {
    id: "global",
    icon: "globe",
    name: "Moltiplicatore Globale",
    desc: "Aumenta tutti i guadagni.",
    effect: "+10% guadagni",
    baseCost: 1500,
    growth: 1.55,
    type: "global",
    value: 0.1,
    unlockAt: 1000
  },
  {
    id: "banca",
    icon: "bank",
    name: "Banca",
    desc: "Genera interessi e rendite più alte.",
    effect: "+50/s",
    baseCost: 6000,
    growth: 1.2,
    type: "incomeAdd",
    value: 50,
    unlockAt: 4500
  },
  {
    id: "crypto",
    icon: "bitcoin",
    name: "Crypto Farm",
    desc: "Macina soldi con le criptovalute.",
    effect: "+300/s",
    baseCost: 50000,
    growth: 1.22,
    type: "incomeAdd",
    value: 300,
    unlockAt: 35000
  },
  {
    id: "ai",
    icon: "cpu",
    name: "AI Trader",
    desc: "Un'intelligenza artificiale che guadagna per te.",
    effect: "+2.000/s",
    baseCost: 400000,
    growth: 1.25,
    type: "incomeAdd",
    value: 2000,
    unlockAt: 250000
  },
  {
    id: "quantum",
    icon: "atom",
    name: "Quantum Money",
    desc: "Stampa soldi da altre dimensioni.",
    effect: "+15.000/s",
    baseCost: 5000000,
    growth: 1.28,
    type: "incomeAdd",
    value: 15000,
    unlockAt: 3000000
  }
];

const ACHIEVEMENTS = [
  {
    id: "earn100",
    icon: "money",
    name: "Primi soldi",
    desc: "Guadagna 100€ totali.",
    check: (s) => s.lifetimeEarned >= 100
  },
  {
    id: "earn10k",
    icon: "coin",
    name: "Imprenditore",
    desc: "Guadagna 10.000€ totali.",
    check: (s) => s.lifetimeEarned >= 10000
  },
  {
    id: "earn1m",
    icon: "bank",
    name: "Miliardario",
    desc: "Guadagna 1.000.000€ totali.",
    check: (s) => s.lifetimeEarned >= 1000000
  },
  {
    id: "click100",
    icon: "mouse",
    name: "Dito caldo",
    desc: "Fai 100 click.",
    check: (s) => s.clicks >= 100
  },
  {
    id: "click5000",
    icon: "hand",
    name: "Clicker seriale",
    desc: "Fai 5.000 click.",
    check: (s) => s.clicks >= 5000
  },
  {
    id: "upg25",
    icon: "shop",
    name: "Shopping sfrenato",
    desc: "Compra 25 upgrade totali.",
    check: () => totalUpgrades() >= 25
  },
  {
    id: "income1k",
    icon: "chart",
    name: "Rendita potente",
    desc: "Raggiungi 1.000/s.",
    check: () => incomePerSec() >= 1000
  },
  {
    id: "crit100",
    icon: "bolt",
    name: "Critico facile",
    desc: "Ottieni 100 click critici.",
    check: (s) => s.stats.crits >= 100
  },
  {
    id: "golden10",
    icon: "star",
    name: "Cacciatore dorato",
    desc: "Clicca 10 bonus dorati.",
    check: (s) => s.stats.goldenClicked >= 10
  },
  {
    id: "events25",
    icon: "gift",
    name: "Re degli eventi",
    desc: "Completa 25 eventi.",
    check: (s) => s.stats.eventsCompleted >= 25
  },
  {
    id: "missions10",
    icon: "mission",
    name: "Soldato giornaliero",
    desc: "Completa 10 missioni giornaliere.",
    check: (s) => s.stats.missionsClaimed >= 10
  },
  {
    id: "prestige1",
    icon: "crown",
    name: "Prima rinascita",
    desc: "Fai il primo prestigio.",
    check: (s) => s.prestige.resets >= 1
  },
  {
    id: "prestige10",
    icon: "refresh",
    name: "Ciclo infinito",
    desc: "Fai 10 prestige.",
    check: (s) => s.prestige.resets >= 10
  }
];

const MISSION_TYPES = ["clicks", "earn", "buy", "events", "golden"];