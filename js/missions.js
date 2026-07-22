const Missions = {
  check() {
    this.generateDaily();
    this.generateWeekly();
  },

  generateDaily(force = false) {
    const key = Utils.todayKey();
    const s = State.current;

    if (!force && s.missions.daily.date === key && s.missions.daily.entries.length) {
      return;
    }

    const rng = Utils.mulberry32(Utils.hashCode(key + "|daily|" + s.prestige.resets));

    let pool = ["clicks", "earn", "buy", "events", "golden"];
    if (State.isUnlocked("games")) pool.push("games");
    if (State.isUnlocked("boss")) pool.push("boss");

    const types = Utils.shuffle(pool, rng).slice(0, 3);

    const entries = types.map((type, index) => {
      const diff = 1 + s.prestige.resets * 0.35;
      let target = 1;
      let reward = { money: 0, skillPoints: 0 };
      let name = "Missione";
      let desc = "Descrizione";
      let icon = "star";

      if (type === "clicks") {
        target = Math.floor((150 + s.prestige.resets * 150) * (1 + rng() * 0.5));
        reward.money = Math.max(750, State.clickPower() * target * 0.35);
        name = "Click quotidiani";
        desc = "Clicca la moneta.";
        icon = "mouse";
      }

      if (type === "earn") {
        target = Math.floor(
          Math.max(
            2000,
            (State.clickPower() * 250 + Math.max(State.incomePerSec(), 1) * 200) *
              diff *
              (0.8 + rng() * 0.6)
          )
        );
        reward.money = Math.max(1000, target * 0.15);
        name = "Affari d'oro";
        desc = "Guadagna soldi.";
        icon = "money";
      }

      if (type === "buy") {
        target = Math.floor(3 + Math.min(8, State.totalUpgrades() / 12) + s.prestige.resets + rng() * 2);
        reward.money = Math.max(2000, (State.incomePerSec() * 140 + State.clickPower() * 300) * diff);
        name = "Shopping strategico";
        desc = "Compra upgrade.";
        icon = "shop";
      }

      if (type === "events") {
        target = 1 + Math.floor(rng() * 2);
        reward.money = Math.max(2500, (State.incomePerSec() * 220 + State.clickPower() * 500) * diff);
        name = "Cacciatore di eventi";
        desc = "Completa eventi casuali.";
        icon = "gift";
      }

      if (type === "golden") {
        target = 1 + Math.floor(rng() * 2);
        reward.money = Math.max(2200, (State.incomePerSec() * 200 + State.clickPower() * 450) * diff);
        name = "Febbre dorata";
        desc = "Clicca bonus dorati.";
        icon = "star";
      }

      if (type === "games") {
        target = 1 + Math.floor(rng() * 2);
        reward.money = Math.max(3000, (State.incomePerSec() * 260 + State.clickPower() * 600) * diff);
        name = "Giocatore d'azzardo";
        desc = "Vinci ai mini-giochi.";
        icon = "dice";
      }

      if (type === "boss") {
        target = 1;
        reward.money = Math.max(5000, (State.incomePerSec() * 400 + State.clickPower() * 900) * diff);
        name = "Ammazzaboss";
        desc = "Sconfiggi un boss.";
        icon = "sword";
      }

      if (rng() > 0.86) {
        reward.skillPoints = 1;
      }

      reward.money = Math.floor(reward.money);

      return {
        id: `${type}_${index}`,
        type,
        name,
        desc,
        icon,
        target,
        progress: 0,
        reward,
        claimed: false
      };
    });

    s.missions.daily = { date: key, entries };
  },

  generateWeekly(force = false) {
    const key = Utils.weekKey();
    const s = State.current;

    if (!force && s.missions.weekly.week === key && s.missions.weekly.entries.length) {
      return;
    }

    const rng = Utils.mulberry32(Utils.hashCode(key + "|weekly|" + s.prestige.resets));

    let pool = ["earn", "clicks", "buy", "events"];
    if (State.isUnlocked("games")) pool.push("games");
    if (State.isUnlocked("boss")) pool.push("boss");

    const types = Utils.shuffle(pool, rng).slice(0, 3);

    const entries = types.map((type, index) => {
      const diff = 1 + s.prestige.resets * 0.6;
      let target = 1;
      let reward = { money: 0, skillPoints: 1 };
      let name = "Missione settimanale";
      let desc = "Descrizione";
      let icon = "mission";

      if (type === "clicks") {
        target = Math.floor((1500 + s.prestige.resets * 800) * (1 + rng() * 0.4));
        reward.money = Math.max(25000, State.clickPower() * target * 0.4);
        name = "Maratona di click";
        desc = "Clicca molto.";
        icon = "mouse";
      }

      if (type === "earn") {
        target = Math.floor(
          Math.max(
            100000,
            (State.clickPower() * 2500 + Math.max(State.incomePerSec(), 1) * 2200) * diff
          )
        );
        reward.money = Math.max(50000, target * 0.12);
        name = "Impero economico";
        desc = "Guadagna tanti soldi.";
        icon = "money";
      }

      if (type === "buy") {
        target = Math.floor(15 + s.prestige.resets * 3 + rng() * 8);
        reward.money = Math.max(40000, State.incomePerSec() * 1000 + State.clickPower() * 2000);
        name = "Investitore seriale";
        desc = "Compra molti upgrade.";
        icon = "shop";
      }

      if (type === "events") {
        target = 8 + Math.floor(rng() * 8);
        reward.money = Math.max(60000, State.incomePerSec() * 1600 + State.clickPower() * 2600);
        name = "Settimana degli eventi";
        desc = "Completa eventi casuali.";
        icon = "gift";
      }

      if (type === "games") {
        target = 5 + Math.floor(rng() * 8);
        reward.money = Math.max(70000, State.incomePerSec() * 1800 + State.clickPower() * 3000);
        name = "Re del casinò";
        desc = "Vinci ai mini-giochi.";
        icon = "dice";
      }

      if (type === "boss") {
        target = 3 + Math.floor(rng() * 5);
        reward.money = Math.max(90000, State.incomePerSec() * 2400 + State.clickPower() * 4000);
        name = "Caccia grossa";
        desc = "Sconfiggi più boss.";
        icon = "sword";
      }

      reward.skillPoints = 1 + Math.floor(rng() * 2);

      const themeReward = this.chooseThemeReward(rng);
      if (themeReward && rng() > 0.45) {
        reward.theme = themeReward;
      }

      reward.money = Math.floor(reward.money);

      return {
        id: `${type}_w${index}`,
        type,
        name,
        desc,
        icon,
        target,
        progress: 0,
        reward,
        claimed: false
      };
    });

    s.missions.weekly = { week: key, entries };
  },

  chooseThemeReward(rng) {
    const locked = DATA.THEMES.filter(
      (t) => t.id !== "default" && !State.current.themes.unlocked.includes(t.id)
    );

    if (!locked.length) return null;
    return Utils.pick(locked, rng).id;
  },

  progress(type, amount = 1) {
    const s = State.current;

    const updateList = (list) => {
      if (!list || !Array.isArray(list.entries)) return;

      for (const m of list.entries) {
        if (m.type === type && !m.claimed) {
          m.progress += amount;
        }
      }
    };

    updateList(s.missions.daily);
    updateList(s.missions.weekly);
  },

  claim(listType, id) {
    const list = State.current.missions[listType];
    if (!list) return;

    const mission = list.entries.find((m) => m.id === id);
    if (!mission || mission.claimed || mission.progress < mission.target) return;

    mission.claimed = true;
    State.current.stats.missionsClaimed++;

    if (mission.reward.money) {
      State.addMoney(mission.reward.money, false);
    }

    if (mission.reward.skillPoints) {
      State.current.skillPoints += mission.reward.skillPoints;
    }

    if (mission.reward.theme) {
      State.unlockTheme(mission.reward.theme);
    }

    AudioFX.win();
    UI.notify("Missione completata", "success");
  },

  claimAll(listType) {
    const list = State.current.missions[listType];
    if (!list) return;

    for (const m of list.entries) {
      if (!m.claimed && m.progress >= m.target) {
        this.claim(listType, m.id);
      }
    }
  }
};