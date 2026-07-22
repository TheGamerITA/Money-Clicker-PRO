const Achievements = {
  metricValue(metric) {
    const s = State.current;

    switch (metric) {
      case "clicks":
        return s.clicks;
      case "lifetimeEarned":
        return s.lifetimeEarned;
      case "upgrades":
        return State.totalUpgrades();
      case "events":
        return s.stats.eventsCompleted;
      case "golden":
        return s.stats.goldenClicked;
      case "bossKills":
        return s.stats.bossKills;
      case "missionsClaimed":
        return s.stats.missionsClaimed;
      case "prestige":
        return s.prestige.resets;
      case "gamesWon":
        return s.stats.gamesWon;
      default:
        return 0;
    }
  },

  check() {
    for (const a of DATA.ACHIEVEMENTS) {
      const value = this.metricValue(a.metric);
      const done = a.thresholds.filter((t) => value >= t).length;
      const old = State.current.achievements[a.id] || 0;

      if (done > old) {
        for (let i = old; i < done; i++) {
          this.applyReward(a.rewards[i]);
        }

        State.current.achievements[a.id] = done;
        UI.notify(`Obiettivo completato: ${a.name}`, "success");
        AudioFX.unlock();
      }
    }
  },

  applyReward(reward) {
    if (!reward) return;

    if (reward.money) {
      State.addMoney(reward.money, false);
    }

    if (reward.skillPoints) {
      State.current.skillPoints += reward.skillPoints;
    }

    if (reward.theme) {
      if (!State.current.themes.unlocked.includes(reward.theme)) {
        State.unlockTheme(reward.theme);
        UI.notify(`Tema sbloccato: ${reward.theme}`, "success");
      } else {
        State.addMoney(2_000_000, false);
      }
    }
  }
};