const DATA = {
  SAVE_KEY: "moneyClickerMegaSave",

  CONFIG: {
    autosaveMs: 15000,
    offlineMaxHours: 8,
    eventMin: 28,
    eventMax: 70,
    prestigeThreshold: 1_000_000,
    prestigeBonusPerCoin: 0.02,
    feverMultiplier: 5,
    feverDurationMs: 20000,
    critBaseMultiplier: 10
  },

  UPGRADES: [
    {
      id: "guanto",
      icon: "hand",
      name: "Guanto",
      desc: "Aumenta i soldi per click.",
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
      desc: "Genera soldi automaticamente.",
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
      desc: "Aumenta la probabilità di critico.",
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
      id: "lab",
      icon: "atom",
      name: "Laboratorio",
      desc: "Sblocca l'Albero delle Abilità.",
      effect: "Sblocca Abilità",
      baseCost: 2500,
      growth: 1,
      type: "unlock",
      unlock: "skills",
      max: 1,
      unlockAt: 1200
    },
    {
      id: "banca",
      icon: "bank",
      name: "Banca",
      desc: "Rendita più alta.",
      effect: "+50/s",
      baseCost: 6000,
      growth: 1.2,
      type: "incomeAdd",
      value: 50,
      unlockAt: 4500
    },
    {
      id: "themeFactory",
      icon: "theme",
      name: "Fabbrica Temi",
      desc: "Sblocca i temi personalizzabili.",
      effect: "Sblocca Temi",
      baseCost: 20000,
      growth: 1,
      type: "unlock",
      unlock: "themes",
      max: 1,
      unlockAt: 9000
    },
    {
      id: "arena",
      icon: "sword",
      name: "Arena Boss",
      desc: "Sblocca i Boss cliccabili.",
      effect: "Sblocca Boss",
      baseCost: 50000,
      growth: 1,
      type: "unlock",
      unlock: "boss",
      max: 1,
      unlockAt: 22000
    },
    {
      id: "crypto",
      icon: "bitcoin",
      name: "Crypto Farm",
      desc: "Soldi automatici avanzati.",
      effect: "+300/s",
      baseCost: 50000,
      growth: 1.22,
      type: "incomeAdd",
      value: 300,
      unlockAt: 35000
    },
    {
      id: "casino",
      icon: "dice",
      name: "Casinò",
      desc: "Sblocca Roulette e Slot Machine.",
      effect: "Sblocca Mini-giochi",
      baseCost: 120000,
      growth: 1,
      type: "unlock",
      unlock: "games",
      max: 1,
      unlockAt: 60000
    },
    {
      id: "pr",
      icon: "gift",
      name: "Ufficio Eventi",
      desc: "Sblocca gli eventi a scelta multipla.",
      effect: "Sblocca Scelte",
      baseCost: 250000,
      growth: 1,
      type: "unlock",
      unlock: "choice",
      max: 1,
      unlockAt: 110000
    },
    {
      id: "ai",
      icon: "cpu",
      name: "AI Trader",
      desc: "Guadagno automatico enorme.",
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
  ],

  SKILLS: [
    {
      id: "click1",
      icon: "hand",
      name: "Click I",
      desc: "+30% soldi per click.",
      cost: 1,
      requires: null,
      effect: { clickMult: 0.3 }
    },
    {
      id: "income1",
      icon: "chart",
      name: "Rendita I",
      desc: "+30% soldi al secondo.",
      cost: 1,
      requires: null,
      effect: { incomeMult: 0.3 }
    },
    {
      id: "crit1",
      icon: "bolt",
      name: "Critico I",
      desc: "+5% probabilità critico.",
      cost: 2,
      requires: "click1",
      effect: { crit: 0.05 }
    },
    {
      id: "themes1",
      icon: "theme",
      name: "Designer",
      desc: "Sblocca i temi.",
      cost: 1,
      requires: "income1",
      unlock: "themes"
    },
    {
      id: "boss1",
      icon: "sword",
      name: "Cacciatore di Boss",
      desc: "Sblocca i boss e +50% danno boss.",
      cost: 2,
      requires: "click1",
      unlock: "boss",
      effect: { bossDamage: 0.5 }
    },
    {
      id: "games1",
      icon: "dice",
      name: "Fortunello",
      desc: "Sblocca i mini-giochi e +10% vincite.",
      cost: 2,
      requires: "income1",
      unlock: "games",
      effect: { gameReward: 0.1 }
    },
    {
      id: "choice1",
      icon: "gift",
      name: "Stratega",
      desc: "Sblocca eventi a scelta e +10% ricompense eventi.",
      cost: 2,
      requires: "games1",
      unlock: "choice",
      effect: { eventReward: 0.1 }
    },
    {
      id: "click2",
      icon: "hand",
      name: "Click II",
      desc: "+80% soldi per click.",
      cost: 3,
      requires: "crit1",
      effect: { clickMult: 0.8 }
    },
    {
      id: "income2",
      icon: "chart",
      name: "Rendita II",
      desc: "+80% soldi al secondo.",
      cost: 3,
      requires: "income1",
      effect: { incomeMult: 0.8 }
    },
    {
      id: "crit2",
      icon: "bolt",
      name: "Critico II",
      desc: "+10% critico e +2 danno critico.",
      cost: 4,
      requires: "crit1",
      effect: { crit: 0.1, critPower: 2 }
    },
    {
      id: "boss2",
      icon: "sword",
      name: "Danno Boss II",
      desc: "+150% danno boss.",
      cost: 4,
      requires: "boss1",
      effect: { bossDamage: 1.5 }
    },
    {
      id: "offline1",
      icon: "settings",
      name: "Offline Potenziato",
      desc: "+100% guadagno offline.",
      cost: 2,
      requires: "income1",
      effect: { offline: 1 }
    }
  ],

  ACHIEVEMENTS: [
    {
      id: "clicks",
      metric: "clicks",
      icon: "mouse",
      name: "Clicker",
      thresholds: [100, 1000, 10000, 100000],
      rewards: [
        { money: 500 },
        { money: 5000 },
        { skillPoints: 1 },
        { theme: "neon" }
      ]
    },
    {
      id: "earn",
      metric: "lifetimeEarned",
      icon: "money",
      name: "Magnate",
      thresholds: [10000, 1000000, 1000000000],
      rewards: [
        { money: 5000 },
        { skillPoints: 1 },
        { theme: "gold" }
      ]
    },
    {
      id: "boss",
      metric: "bossKills",
      icon: "sword",
      name: "Ammazzaboss",
      thresholds: [1, 10, 50],
      rewards: [
        { money: 10000 },
        { skillPoints: 1 },
        { theme: "cyber" }
      ]
    },
    {
      id: "games",
      metric: "gamesWon",
      icon: "dice",
      name: "Giocatore",
      thresholds: [1, 10, 50],
      rewards: [
        { money: 5000 },
        { skillPoints: 1 },
        { theme: "ocean" }
      ]
    },
    {
      id: "missions",
      metric: "missionsClaimed",
      icon: "mission",
      name: "Missionario",
      thresholds: [5, 25, 100],
      rewards: [
        { money: 5000 },
        { skillPoints: 1 },
        { money: 1000000 }
      ]
    },
    {
      id: "prestige",
      metric: "prestige",
      icon: "crown",
      name: "Rinascita",
      thresholds: [1, 5, 20],
      rewards: [
        { skillPoints: 2 },
        { skillPoints: 5 },
        { theme: "gold" }
      ]
    }
  ],

  THEMES: [
    { id: "default", name: "Classico", cost: 0 },
    { id: "neon", name: "Neon", cost: 250000 },
    { id: "ocean", name: "Oceano", cost: 900000 },
    { id: "gold", name: "Oro", cost: 2500000 },
    { id: "cyber", name: "Cyber", cost: 12000000 }
  ],

  CHOICE_EVENTS: [
    {
      id: "invest",
      title: "Investimento lampo",
      desc: "Un amico ti propone un affare velocissimo.",
      choices: [
        { text: "Investi", risk: 0.6, rewardMult: 1.4, lossMult: 0.08 },
        { text: "Rifiuta", risk: 1, rewardMult: 0.15, lossMult: 0 }
      ]
    },
    {
      id: "crypto",
      title: "Moneta misteriosa",
      desc: "Una nuova criptovaluta sta esplodendo.",
      choices: [
        { text: "Compra", risk: 0.45, rewardMult: 2.2, lossMult: 0.1 },
        { text: "Vendi tutto", risk: 1, rewardMult: 0.2, lossMult: 0 }
      ]
    },
    {
      id: "tax",
      title: "Controllo fiscale",
      desc: "Un funzionario bussa alla tua porta.",
      choices: [
        { text: "Paga subito", risk: 1, rewardMult: 0.05, lossMult: 0.03 },
        { text: "Nascondi i soldi", risk: 0.5, rewardMult: 0.9, lossMult: 0.12 }
      ]
    },
    {
      id: "charity",
      title: "Beneficenza",
      desc: "Un'associazione chiede supporto.",
      choices: [
        { text: "Dona", risk: 1, rewardMult: 0.12, lossMult: 0 },
        { text: "Ignora", risk: 1, rewardMult: 0, lossMult: 0 }
      ]
    }
  ],

  SLOT_SYMBOLS: [
    { id: "stone", label: "●", weight: 45, payout3: 2 },
    { id: "coin", label: "€", weight: 30, payout3: 4 },
    { id: "star", label: "★", weight: 18, payout3: 10 },
    { id: "diamond", label: "♦", weight: 7, payout3: 25 }
  ]
};