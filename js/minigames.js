const MiniGames = {
  activeInterval: null,

  cleanup() {
    if (this.activeInterval) {
      clearInterval(this.activeInterval);
      this.activeInterval = null;
    }
  },

  getBet() {
    return Math.max(
      100,
      Math.min(
        State.current.money * 0.03,
        State.incomePerSec() * 180 + State.clickPower() * 300,
        1_000_000_000
      )
    );
  },

  openRoulette() {
    if (!State.isUnlocked("games")) return;

    this.cleanup();

    const bet = this.getBet();

    UI.openModal(
      "Roulette",
      `
        <div class="game-result" id="rouletteResult">Pronto</div>

        <div class="game-actions">
          <button class="danger roulette-btn" data-color="red">Rosso x2</button>
          <button class="small-btn roulette-btn" data-color="black">Nero x2</button>
          <button class="claim roulette-btn" data-color="green">Verde x10</button>
        </div>

        <div class="small">Puntata: € ${Utils.fmt(bet)}</div>
      `
    );

    let spinning = false;

    document.querySelectorAll(".roulette-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (spinning) return;

        const color = btn.dataset.color;
        const currentBet = this.getBet();

        if (!State.spendMoney(currentBet)) {
          AudioFX.error();
          UI.notify("Soldi insufficienti", "error");
          return;
        }

        spinning = true;
        State.current.stats.gamesPlayed++;

        document.querySelectorAll(".roulette-btn").forEach((b) => (b.disabled = true));

        const resultEl = document.getElementById("rouletteResult");
        let ticks = 0;

        this.activeInterval = setInterval(() => {
          const fake = ["ROSSO", "NERO", "VERDE"][ticks % 3];
          resultEl.textContent = fake;
          resultEl.className = "game-result " + ["red", "black", "green"][ticks % 3];
          ticks++;

          if (ticks > 18) {
            this.cleanup();
            this.finishRoulette(color, currentBet, resultEl);
            spinning = false;
          }
        }, 80);
      });
    });
  },

  finishRoulette(choice, bet, resultEl) {
    const roll = Math.random();
    let result = "red";

    if (roll < 0.48) result = "red";
    else if (roll < 0.96) result = "black";
    else result = "green";

    resultEl.textContent = result.toUpperCase();
    resultEl.className = `game-result ${result}`;

    if (choice === result) {
      const mult = result === "green" ? 10 : 2;
      const win = bet * mult * State.gameRewardMult();

      State.addMoney(win, true);
      State.current.stats.gamesWon++;
      Missions.progress("games", 1);

      AudioFX.win();
      UI.notify(`Vincita roulette: +${Utils.fmt(win)}`, "success");
    } else {
      AudioFX.lose();
      UI.notify("Roulette: hai perso", "error");
    }

    UI.updateTop();
    Achievements.check();
  },

  openSlot() {
    if (!State.isUnlocked("games")) return;

    this.cleanup();

    const bet = this.getBet();

    UI.openModal(
      "Slot Machine",
      `
        <div class="slot-reels">
          <div class="slot-reel" id="reel0">●</div>
          <div class="slot-reel" id="reel1">€</div>
          <div class="slot-reel" id="reel2">★</div>
        </div>

        <button class="buy" id="slotSpinBtn" style="width:100%;">
          Spin - € ${Utils.fmt(bet)}
        </button>

        <div class="small">Tre simboli uguali pagano molto. Due simboli uguali pagano poco.</div>
      `
    );

    let spinning = false;

    document.getElementById("slotSpinBtn").addEventListener("click", () => {
      if (spinning) return;

      const currentBet = this.getBet();

      if (!State.spendMoney(currentBet)) {
        AudioFX.error();
        UI.notify("Soldi insufficienti", "error");
        return;
      }

      spinning = true;
      State.current.stats.gamesPlayed++;
      document.getElementById("slotSpinBtn").disabled = true;

      const finalSymbols = [
        Utils.weightedPick(DATA.SLOT_SYMBOLS, DATA.SLOT_SYMBOLS.map((s) => s.weight)),
        Utils.weightedPick(DATA.SLOT_SYMBOLS, DATA.SLOT_SYMBOLS.map((s) => s.weight)),
        Utils.weightedPick(DATA.SLOT_SYMBOLS, DATA.SLOT_SYMBOLS.map((s) => s.weight))
      ];

      let ticks = 0;

      this.activeInterval = setInterval(() => {
        for (let i = 0; i < 3; i++) {
          const sym = Utils.pick(DATA.SLOT_SYMBOLS);
          document.getElementById(`reel${i}`).textContent = sym.label;
        }

        ticks++;

        if (ticks > 20) {
          this.cleanup();

          for (let i = 0; i < 3; i++) {
            document.getElementById(`reel${i}`).textContent = finalSymbols[i].label;
          }

          this.finishSlot(finalSymbols, currentBet);
          spinning = false;
        }
      }, 75);
    });
  },

  finishSlot(symbols, bet) {
    const [a, b, c] = symbols;

    let payout = 0;

    if (a.id === b.id && b.id === c.id) {
      payout = a.payout3;
    } else if (a.id === b.id || a.id === c.id || b.id === c.id) {
      payout = 1.5;
    }

    if (payout > 0) {
      const win = bet * payout * State.gameRewardMult();
      State.addMoney(win, true);
      State.current.stats.gamesWon++;
      Missions.progress("games", 1);

      AudioFX.win();
      UI.notify(`Slot: vinci ${Utils.fmt(win)}`, "success");
    } else {
      AudioFX.lose();
      UI.notify("Slot: nessuna vincita", "error");
    }

    UI.updateTop();
    Achievements.check();
  }
};