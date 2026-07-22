const UI = {
  current: "game",
  modalOpen: false,

  els: {},

  init() {
    this.els = {
      money: document.getElementById("money"),
      perClick: document.getElementById("perClick"),
      perSec: document.getElementById("perSec"),
      mult: document.getElementById("mult"),
      skillPointsPill: document.getElementById("skillPointsPill"),

      navButtons: document.querySelectorAll(".nav-btn"),
      views: document.querySelectorAll(".view"),

      shopList: document.getElementById("shopList"),
      skillsList: document.getElementById("skillsList"),
      missionsList: document.getElementById("missionsList"),
      achievementsList: document.getElementById("achievementsList"),
      gamesList: document.getElementById("gamesList"),
      themesList: document.getElementById("themesList"),
      statsList: document.getElementById("statsList"),

      soundToggle: document.getElementById("soundToggle"),
      particlesToggle: document.getElementById("particlesToggle"),
      eventsToggle: document.getElementById("eventsToggle"),
      autosaveToggle: document.getElementById("autosaveToggle"),
      offlineToggle: document.getElementById("offlineToggle"),

      prestigeInfo: document.getElementById("prestigeInfo"),
      prestigeBtn: document.getElementById("prestigeBtn"),

      saveBtn: document.getElementById("saveBtn"),
      resetBtn: document.getElementById("resetBtn"),

      notifications: document.getElementById("notifications"),

      modalOverlay: document.getElementById("modalOverlay"),
      modalTitle: document.getElementById("modalTitle"),
      modalBody: document.getElementById("modalBody"),
      modalCloseBtn: document.getElementById("modalCloseBtn")
    };

    this.els.navButtons.forEach((btn) => {
      btn.innerHTML = `${icon(btn.dataset.icon)}<span>${btn.dataset.label}</span>`;
      btn.addEventListener("click", () => this.switchPanel(btn.dataset.panel));
    });

    this.bindStaticEvents();
    this.renderAll();
  },

  bindStaticEvents() {
    this.els.shopList.addEventListener("click", (e) => {
      const btn = e.target.closest("button.buy");
      if (!btn || btn.disabled) return;
      State.buyUpgrade(btn.dataset.id);
      this.renderShop();
      this.updateTop();
      this.renderSkills();
      this.renderGames();
      this.renderThemes();
      Achievements.check();
    });

    this.els.skillsList.addEventListener("click", (e) => {
      const btn = e.target.closest("button.buy");
      if (!btn || btn.disabled) return;
      State.buySkill(btn.dataset.id);
      this.renderSkills();
      this.updateTop();
      this.renderGames();
      this.renderThemes();
    });

    this.els.missionsList.addEventListener("click", (e) => {
      const claimBtn = e.target.closest("button.claim");
      const allBtn = e.target.closest("button.claim-all");

      if (claimBtn && !claimBtn.disabled) {
        Missions.claim(claimBtn.dataset.list, claimBtn.dataset.id);
        this.renderMissions();
        this.updateTop();
        Achievements.check();
      }

      if (allBtn && !allBtn.disabled) {
        Missions.claimAll(allBtn.dataset.list);
        this.renderMissions();
        this.updateTop();
        Achievements.check();
      }
    });

    this.els.gamesList.addEventListener("click", (e) => {
      if (e.target.closest("#openRouletteBtn")) MiniGames.openRoulette();
      if (e.target.closest("#openSlotBtn")) MiniGames.openSlot();
    });

    this.els.themesList.addEventListener("click", (e) => {
      const btn = e.target.closest("button.theme-btn");
      if (!btn) return;

      State.buyTheme(btn.dataset.theme);
      this.renderThemes();
      this.updateTop();
    });

    this.els.soundToggle.addEventListener("change", (e) => {
      State.current.settings.sound = e.target.checked;
      if (e.target.checked) AudioFX.init();
      State.save(true, true);
    });

    this.els.particlesToggle.addEventListener("change", (e) => {
      State.current.settings.particles = e.target.checked;
      State.save(true, true);
    });

    this.els.eventsToggle.addEventListener("change", (e) => {
      State.current.settings.events = e.target.checked;
      State.save(true, true);
    });

    this.els.autosaveToggle.addEventListener("change", (e) => {
      State.current.settings.autosave = e.target.checked;
      State.save(true, true);
    });

    this.els.offlineToggle.addEventListener("change", (e) => {
      State.current.settings.offline = e.target.checked;
      State.save(true, true);
    });

    this.els.prestigeBtn.addEventListener("click", () => {
      const potential = State.prestigePotential();
      if (potential <= 0) {
        AudioFX.error();
        return;
      }

      this.openModal(
        "Prestigio",
        `
          <p class="desc">
            Vuoi resettare la run attuale?<br><br>
            Ottieni: <strong>${Utils.fmt(potential)}</strong> Monete Anima<br>
            Ottieni anche: <strong>${1 + Math.floor(potential / 3)}</strong> Punti Abilità
          </p>
          <div class="save-row">
            <button class="buy" id="confirmPrestigeBtn">Conferma</button>
            <button class="small-btn" id="cancelPrestigeBtn">Annulla</button>
          </div>
        `
      );

      document.getElementById("confirmPrestigeBtn").addEventListener("click", () => {
        State.doPrestige();
        this.closeModal();
        this.renderAll();
      });

      document.getElementById("cancelPrestigeBtn").addEventListener("click", () => {
        this.closeModal();
      });
    });

    this.els.saveBtn.addEventListener("click", () => State.save(false, true));

    this.els.resetBtn.addEventListener("click", () => {
      this.openModal(
        "Reset totale",
        `
          <p class="desc">Vuoi davvero cancellare tutto?</p>
          <div class="save-row">
            <button class="danger" id="confirmResetBtn">Reset</button>
            <button class="small-btn" id="cancelResetBtn">Annulla</button>
          </div>
        `
      );

      document.getElementById("confirmResetBtn").addEventListener("click", () => {
        State.reset();
        Missions.check();
        this.closeModal();
        this.renderAll();
        this.notify("Gioco resettato", "info");
      });

      document.getElementById("cancelResetBtn").addEventListener("click", () => {
        this.closeModal();
      });
    });

    this.els.modalCloseBtn.addEventListener("click", () => this.closeModal());

    this.els.modalOverlay.addEventListener("click", (e) => {
      if (e.target === this.els.modalOverlay) this.closeModal();
    });
  },

  switchPanel(name) {
    this.current = name;

    this.els.navButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.panel === name);
    });

    this.els.views.forEach((view) => {
      view.classList.toggle("hidden", view.dataset.view !== name);
    });

    this.renderCurrent();
  },

  renderCurrent() {
    if (this.current === "shop") this.renderShop();
    if (this.current === "skills") this.renderSkills();
    if (this.current === "missions") this.renderMissions();
    if (this.current === "achievements") this.renderAchievements();
    if (this.current === "games") this.renderGames();
    if (this.current === "themes") this.renderThemes();
    if (this.current === "stats") this.renderStats();
    if (this.current === "options") this.renderOptions();
  },

  renderAll() {
    this.updateTop();
    this.renderShop();
    this.renderSkills();
    this.renderMissions();
    this.renderAchievements();
    this.renderGames();
    this.renderThemes();
    this.renderStats();
    this.renderOptions();
  },

  updateTop() {
    this.els.money.textContent = Utils.fmt(State.current.money);
    this.els.perClick.textContent = Utils.fmt(State.clickPower(), true);
    this.els.perSec.textContent = Utils.fmt(State.incomePerSec(), true);
    this.els.mult.textContent = "x" + State.globalMult().toFixed(2);
    this.els.skillPointsPill.textContent = `${Utils.fmt(State.current.skillPoints)} PT`;
  },

  updateDynamic() {
    this.updateTop();

    if (this.modalOpen) return;

    if (this.current === "shop") this.renderShop();
    if (this.current === "missions") this.renderMissions();
    if (this.current === "stats") this.renderStats();
    if (this.current === "options") this.renderOptions();
    if (this.current === "skills") this.renderSkills();
    if (this.current === "games") this.renderGames();
    if (this.current === "achievements") this.renderAchievements();
  },

  rewardText(reward) {
    const parts = [];

    if (reward.money) parts.push(`€ ${Utils.fmt(reward.money)}`);
    if (reward.skillPoints) parts.push(`${reward.skillPoints} PT`);
    if (reward.theme) {
      const theme = DATA.THEMES.find((t) => t.id === reward.theme);
      parts.push(`Tema: ${theme ? theme.name : reward.theme}`);
    }

    return parts.join(" + ") || "Ricompensa";
  },

  renderShop() {
    const s = State.current;

    this.els.shopList.innerHTML = DATA.UPGRADES.map((u) => {
      const level = s.upgrades[u.id] || 0;
      const maxed = u.max && level >= u.max;
      const cost = State.getCost(u);
      const visible = level > 0 || s.lifetimeEarned >= u.unlockAt || u.unlockAt === 0;

      if (!visible) {
        return `
          <div class="upgrade">
            <div class="left">
              <div class="box-icon">${icon("coin")}</div>
              <div>
                <div class="title">???</div>
                <div class="desc">Si sblocca con ${Utils.fmt(u.unlockAt)} guadagnati totali.</div>
              </div>
            </div>
            <button class="buy" disabled>Bloccato</button>
          </div>
        `;
      }

      let effect = u.effect;

      if (u.type === "clickAdd") {
        effect = `Totale: +${Utils.fmt(u.value * level, true)} per click`;
      }

      if (u.type === "incomeAdd") {
        effect = `Totale: +${Utils.fmt(u.value * level, true)}/s`;
      }

      if (u.type === "crit") {
        effect = `Probabilità critico: ${Math.round(level * u.value * 100)}%`;
      }

      if (u.type === "global") {
        effect = `Bonus attuale: +${Math.round(level * u.value * 100)}%`;
      }

      if (u.type === "unlock") {
        effect = level > 0 ? "Meccanica attiva" : u.effect;
      }

      return `
        <div class="upgrade">
          <div class="left">
            <div class="box-icon">${icon(u.icon)}</div>
            <div>
              <div class="title">
                ${u.name}
                <span class="small">Lv ${level}${u.max ? "/" + u.max : ""}</span>
              </div>
              <div class="desc">${u.desc}</div>
              <div class="effect">${effect}</div>
            </div>
          </div>

          <button
            class="buy"
            data-id="${u.id}"
            ${maxed || s.money < cost ? "disabled" : ""}
          >
            ${maxed || (u.type === "unlock" && level > 0) ? "Attivo" : "€ " + Utils.fmt(cost)}
          </button>
        </div>
      `;
    }).join("");
  },

  renderSkills() {
    if (!State.isUnlocked("skills")) {
      this.els.skillsList.innerHTML = `
        <div class="locked-box">
          Compra il Laboratorio oppure fai un prestigio per sbloccare l'Albero delle Abilità.
        </div>
      `;
      return;
    }

    const s = State.current;

    this.els.skillsList.innerHTML = `
      <div class="card">
        <div class="title">Punti Abilità disponibili</div>
        <div class="effect">${Utils.fmt(s.skillPoints)} PT</div>
      </div>

      ${DATA.SKILLS.map((skill) => {
        const bought = s.skills.includes(skill.id);
        const reqOk = !skill.requires || s.skills.includes(skill.requires);
        const canBuy = !bought && reqOk && s.skillPoints >= skill.cost;

        const req = skill.requires
          ? DATA.SKILLS.find((x) => x.id === skill.requires)
          : null;

        return `
          <div class="skill">
            <div class="left">
              <div class="box-icon">${icon(skill.icon)}</div>
              <div>
                <div class="title">${skill.name}</div>
                <div class="desc">${skill.desc}</div>
                <div class="small">
                  Costo: ${skill.cost} PT
                  ${req ? ` • Richiede: ${req.name}` : ""}
                  ${skill.unlock ? ` • Sblocca: ${skill.unlock}` : ""}
                </div>
              </div>
            </div>

            <button
              class="buy"
              data-id="${skill.id}"
              ${bought || !canBuy ? "disabled" : ""}
            >
              ${bought ? "Attiva" : "Compra"}
            </button>
          </div>
        `;
      }).join("")}
    `;
  },

  missionBlock(title, listType, list) {
    const entries = list.entries || [];

    const claimAllDisabled = !entries.some(
      (m) => m.progress >= m.target && !m.claimed
    );

    return `
      <div class="section-title">${title}</div>

      <div class="card">
        <div class="mission-head">
          <div class="title">Ricompense speciali</div>
          <button class="claim claim-all" data-list="${listType}" ${claimAllDisabled ? "disabled" : ""}>
            Riscatta tutto
          </button>
        </div>
      </div>

      ${
        entries.length
          ? entries
              .map((m) => {
                const pct = Math.min(100, (m.progress / m.target) * 100);
                const complete = m.progress >= m.target;

                return `
                  <div class="mission">
                    <div class="mission-head">
                      <div class="left">
                        <div class="box-icon">${icon(m.icon)}</div>
                        <div>
                          <div class="title">${m.name}</div>
                          <div class="desc">${m.desc}</div>
                          <div class="effect">Ricompensa: ${this.rewardText(m.reward)}</div>
                        </div>
                      </div>

                      <button
                        class="claim"
                        data-list="${listType}"
                        data-id="${m.id}"
                        ${complete && !m.claimed ? "" : "disabled"}
                      >
                        ${m.claimed ? "Fatto" : "Riscatta"}
                      </button>
                    </div>

                    <div class="mission-progress-text">
                      ${Utils.fmt(Math.min(m.progress, m.target), true)} / ${Utils.fmt(m.target, true)}
                    </div>

                    <div class="progress">
                      <div style="width:${pct}%"></div>
                    </div>
                  </div>
                `;
              })
              .join("")
          : `<div class="locked-box">Nessuna missione disponibile.</div>`
      }
    `;
  },

  renderMissions() {
    Missions.check();

    const daily = State.current.missions.daily;
    const weekly = State.current.missions.weekly;

    this.els.missionsList.innerHTML = `
      ${this.missionBlock(`Missioni giornaliere - ${daily.date}`, "daily", daily)}
      ${this.missionBlock(`Missioni settimanali - ${weekly.week}`, "weekly", weekly)}
    `;
  },

  renderAchievements() {
    this.els.achievementsList.innerHTML = DATA.ACHIEVEMENTS.map((a) => {
      const value = Achievements.metricValue(a.metric);
      const done = State.current.achievements[a.id] || 0;
      const nextIndex = Math.min(done, a.thresholds.length - 1);
      const nextThreshold = a.thresholds[nextIndex];
      const allDone = done >= a.thresholds.length;

      const pct = allDone
        ? 100
        : Math.min(100, (value / nextThreshold) * 100);

      const pips = a.thresholds
        .map((_, i) => `<div class="pip ${i < done ? "filled" : ""}"></div>`)
        .join("");

      const nextReward = allDone
        ? "Completato"
        : `Prossimo: ${this.rewardText(a.rewards[done])}`;

      return `
        <div class="achievement">
          <div class="mission-head">
            <div class="left">
              <div class="box-icon">${icon(a.icon)}</div>
              <div>
                <div class="title">${a.name}</div>
                <div class="desc">
                  Progresso: ${Utils.fmt(value, true)} / ${Utils.fmt(allDone ? value : nextThreshold, true)}
                </div>
                <div class="effect">${nextReward}</div>
              </div>
            </div>
          </div>

          <div class="tier-pips">${pips}</div>

          <div class="progress">
            <div style="width:${pct}%"></div>
          </div>
        </div>
      `;
    }).join("");
  },

  renderGames() {
    if (!State.isUnlocked("games")) {
      this.els.gamesList.innerHTML = `
        <div class="locked-box">
          Sblocca i mini-giochi comprando il Casinò o con l'abilità Fortunello.
        </div>
      `;
      return;
    }

    const bet = MiniGames.getBet();

    this.els.gamesList.innerHTML = `
      <div class="game-card">
        <div class="left">
          <div class="box-icon">${icon("dice")}</div>
          <div>
            <div class="title">Roulette</div>
            <div class="desc">Rosso x2, Nero x2, Verde x10.</div>
            <div class="small">Puntata attuale: € ${Utils.fmt(bet)}</div>
          </div>
        </div>
        <button class="buy" id="openRouletteBtn">Apri</button>
      </div>

      <div class="game-card">
        <div class="left">
          <div class="box-icon">${icon("star")}</div>
          <div>
            <div class="title">Slot Machine</div>
            <div class="desc">Tre simboli uguali pagano molto.</div>
            <div class="small">Puntata attuale: € ${Utils.fmt(bet)}</div>
          </div>
        </div>
        <button class="buy" id="openSlotBtn">Apri</button>
      </div>
    `;
  },

  renderThemes() {
    if (!State.isUnlocked("themes")) {
      this.els.themesList.innerHTML = `
        <div class="locked-box">
          Sblocca i temi con Fabbrica Temi o con l'abilità Designer.
        </div>
      `;
      return;
    }

    const s = State.current;

    this.els.themesList.innerHTML = DATA.THEMES.map((theme) => {
      const unlocked = s.themes.unlocked.includes(theme.id);
      const active = s.settings.theme === theme.id;

      return `
        <div class="theme-card">
          <div class="left">
            <div class="box-icon">${icon("theme")}</div>
            <div>
              <div class="title">${theme.name}</div>
              <div class="desc">
                ${unlocked ? "Tema sbloccato" : `Costo: € ${Utils.fmt(theme.cost)}`}
              </div>
            </div>
          </div>

          <button
            class="buy theme-btn"
            data-theme="${theme.id}"
            ${active ? "disabled" : ""}
          >
            ${active ? "Attivo" : unlocked ? "Usa" : "Compra"}
          </button>
        </div>
      `;
    }).join("");
  },

  renderStats() {
    const s = State.current;

    this.els.statsList.innerHTML = [
      ["Soldi attuali", Utils.fmt(s.money)],
      ["Guadagno run attuale", Utils.fmt(s.totalEarned)],
      ["Guadagno totale vita", Utils.fmt(s.lifetimeEarned)],
      ["Click totali", Utils.fmt(s.clicks)],
      ["Soldi per click", Utils.fmt(State.clickPower(), true)],
      ["Soldi per secondo", Utils.fmt(State.incomePerSec(), true)],
      ["Moltiplicatore globale", "x" + State.globalMult().toFixed(2)],
      ["Probabilità critico", Math.round(State.critChance() * 100) + "%"],
      ["Moltiplicatore critico", "x" + State.critMultiplier().toFixed(0)],
      ["Upgrade comprati", Utils.fmt(s.stats.upgradesBought)],
      ["Punti Abilità", Utils.fmt(s.skillPoints)],
      ["Monete Anima", Utils.fmt(s.prestige.coins)],
      ["Prestige fatti", Utils.fmt(s.prestige.resets)],
      ["Boss uccisi", Utils.fmt(s.stats.bossKills)],
      ["Mini-giochi vinti", Utils.fmt(s.stats.gamesWon)],
      ["Mini-giochi giocati", Utils.fmt(s.stats.gamesPlayed)],
      ["Eventi completati", Utils.fmt(s.stats.eventsCompleted)],
      ["Bonus dorati", Utils.fmt(s.stats.goldenClicked)],
      ["Scelte completate", Utils.fmt(s.stats.choicesDone)],
      ["Missioni riscattate", Utils.fmt(s.stats.missionsClaimed)],
      ["Tempo di gioco", Utils.formatTime(s.stats.playTime)]
    ]
      .map(
        ([label, value]) =>
          `<div class="stat-row"><span>${label}</span><strong>${value}</strong></div>`
      )
      .join("");
  },

  renderOptions() {
    const s = State.current;

    this.els.soundToggle.checked = s.settings.sound;
    this.els.particlesToggle.checked = s.settings.particles;
    this.els.eventsToggle.checked = s.settings.events;
    this.els.autosaveToggle.checked = s.settings.autosave;
    this.els.offlineToggle.checked = s.settings.offline;

    const potential = State.prestigePotential();

    this.els.prestigeInfo.innerHTML = `
      <div class="stat-row">
        <span>Monete Anima</span>
        <strong>${Utils.fmt(s.prestige.coins)}</strong>
      </div>

      <div class="stat-row">
        <span>Bonus prestigio</span>
        <strong>x${State.prestigeMult().toFixed(2)}</strong>
      </div>

      <div class="stat-row">
        <span>Guadagno run attuale</span>
        <strong>${Utils.fmt(s.totalEarned)}</strong>
      </div>

      <div class="stat-row">
        <span>Potenziale rebirth</span>
        <strong>${Utils.fmt(potential)}</strong>
      </div>
    `;

    this.els.prestigeBtn.disabled = potential <= 0;
    this.els.prestigeBtn.textContent =
      potential > 0
        ? `Ottieni ${Utils.fmt(potential)} Monete Anima`
        : "Serve 1M nella run attuale";
  },

  notify(msg, type = "info") {
    const el = document.createElement("div");
    el.className = `notification ${type}`;
    el.textContent = msg;

    this.els.notifications.appendChild(el);

    while (this.els.notifications.children.length > 5) {
      this.els.notifications.removeChild(this.els.notifications.firstChild);
    }

    setTimeout(() => {
      el.remove();
    }, 3500);
  },

  openModal(title, bodyHtml) {
    this.els.modalTitle.textContent = title;
    this.els.modalBody.innerHTML = bodyHtml;
    this.els.modalOverlay.classList.remove("hidden");
    this.modalOpen = true;
  },

  closeModal() {
    this.els.modalOverlay.classList.add("hidden");
    this.modalOpen = false;

    if (window.MiniGames) {
      MiniGames.cleanup();
    }
  }
};