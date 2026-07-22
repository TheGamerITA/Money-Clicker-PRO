const Events = {
  update(dt) {
    const s = State.current;

    if (!s.settings.events || UI.modalOpen) return;

    s.eventTimer -= dt;

    if (s.eventTimer <= 0) {
      this.trigger();
      s.eventTimer = Utils.rand(DATA.CONFIG.eventMin, DATA.CONFIG.eventMax);
    }
  },

  trigger() {
    const types = ["golden", "bag", "tax", "fever", "rain"];
    const weights = [25, 18, 12, 12, 10];

    if (State.isUnlocked("boss") && !CanvasEngine.boss) {
      types.push("boss");
      weights.push(10);
    }

    if (State.isUnlocked("games")) {
      types.push("game");
      weights.push(8);
    }

    if (State.isUnlocked("choice")) {
      types.push("choice");
      weights.push(7);
    }

    const type = Utils.weightedPick(types, weights);

    if (type === "fever") {
      State.effects.feverUntil = Date.now() + DATA.CONFIG.feverDurationMs;
      UI.notify("Frenesia click: x5 per 20 secondi", "success");
      AudioFX.event();
      this.completeEvent();
      return;
    }

    if (type === "rain") {
      const gain = this.baseReward() * 1.2 * State.eventRewardMult();
      State.addMoney(gain, true);
      CanvasEngine.moneyRain();
      UI.notify(`Pioggia di soldi: +${Utils.fmt(gain)}`, "success");
      AudioFX.event();
      this.completeEvent();
      return;
    }

    if (type === "boss") {
      CanvasEngine.spawnBoss();
      return;
    }

    CanvasEngine.spawnEntity(type);
    AudioFX.event();
  },

  baseReward() {
    return Math.max(
      200,
      State.incomePerSec() * 90 + State.clickPower() * 220
    );
  },

  completeEvent() {
    State.current.stats.eventsCompleted++;
    Missions.progress("events", 1);
  },

  collectEntity(ent) {
    if (ent.type === "golden" || ent.type === "bag" || ent.type === "tax") {
      let mult = 1;
      let color = "#ffd75e";
      let label = "Bonus";

      if (ent.type === "golden") {
        mult = 1.1;
        State.current.stats.goldenClicked++;
        Missions.progress("golden", 1);
        label = "Bonus oro";
      }

      if (ent.type === "bag") {
        mult = 1.8;
        color = "#8dff8a";
        State.current.stats.goldenClicked++;
        Missions.progress("golden", 1);
        label = "Bottino";
      }

      if (ent.type === "tax") {
        mult = 1.35;
        color = "#ff7b7b";
        label = "Tassa evitata";
      }

      const reward = this.baseReward() * mult * State.eventRewardMult();
      State.addMoney(reward, true);

      this.completeEvent();

      CanvasEngine.addParticles(ent.x, ent.y, color, 35);
      CanvasEngine.addText(ent.x, ent.y - 20, `+${Utils.fmt(reward)}`, color, 30);

      AudioFX.event();
      UI.notify(`${label}: +${Utils.fmt(reward)}`, "success");
      return;
    }

    if (ent.type === "game") {
      if (!State.isUnlocked("games")) return;

      if (Math.random() > 0.5) {
        MiniGames.openRoulette();
      } else {
        MiniGames.openSlot();
      }
      return;
    }

    if (ent.type === "choice") {
      this.openChoice();
    }
  },

  openChoice() {
    if (!State.isUnlocked("choice")) return;

    const event = Utils.pick(DATA.CHOICE_EVENTS);

    const body = `
      <p class="desc">${event.desc}</p>
      <div class="choice-grid">
        ${event.choices
          .map(
            (c, i) => `
              <button class="buy choice-btn" data-index="${i}">
                ${c.text}
              </button>
            `
          )
          .join("")}
      </div>
    `;

    UI.openModal(event.title, body);

    document.querySelectorAll(".choice-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const choice = event.choices[Number(btn.dataset.index)];
        const success = Math.random() < choice.risk;

        if (success) {
          const gain = this.baseReward() * choice.rewardMult * State.eventRewardMult();
          if (gain > 0) {
            State.addMoney(gain, true);
            UI.notify(`Scelta riuscita: +${Utils.fmt(gain)}`, "success");
          }
        } else {
          const loss = State.current.money * choice.lossMult;
          State.current.money = Math.max(0, State.current.money - loss);
          UI.notify(`Scelta fallita: -${Utils.fmt(loss)}`, "error");
        }

        State.current.stats.choicesDone++;
        State.current.stats.eventsCompleted++;
        Missions.progress("events", 1);

        AudioFX.event();
        UI.closeModal();
        UI.updateTop();
        Achievements.check();
      });
    });
  },

  bossEnd(win, boss) {
    State.current.boss.active = false;

    if (!boss) return;

    if (win) {
      const reward = boss.maxHp * 0.25 * State.eventRewardMult();
      State.addMoney(reward, true);

      State.current.stats.bossKills++;
      State.current.stats.eventsCompleted++;
      Missions.progress("boss", 1);
      Missions.progress("events", 1);

      if (Math.random() < 0.25) {
        State.current.skillPoints++;
        UI.notify("Boss sconfitto: +1 Punto Abilità", "success");
      } else {
        UI.notify(`Boss sconfitto: +${Utils.fmt(reward)}`, "success");
      }

      CanvasEngine.addParticles(boss.x, boss.y, "#ff8b5e", 70);
      CanvasEngine.addText(boss.x, boss.y - 30, "BOSS DOWN", "#ffd75e", 36);

      AudioFX.win();
    } else {
      UI.notify("Il boss è fuggito", "error");
      AudioFX.lose();
    }

    CanvasEngine.boss = null;
  }
};