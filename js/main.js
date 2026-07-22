let lastFrame = performance.now();
let slowTick = 0;

function gameLoop(now) {
  const dt = Math.min((now - lastFrame) / 1000, 1);
  lastFrame = now;

  State.current.stats.playTime += dt;

  const income = State.incomePerSec() * dt;
  if (income > 0) {
    State.addMoney(income, true);
  }

  Events.update(dt);
  CanvasEngine.update(dt);
  CanvasEngine.draw();

  slowTick++;

  if (slowTick % 15 === 0) {
    Missions.check();
    Achievements.check();
    UI.updateDynamic();
  }

  requestAnimationFrame(gameLoop);
}

function initGame() {
  State.init();
  Sprites.init();
  Missions.check();
  CanvasEngine.init();
  UI.init();

  if (State.offlineGain > 0) {
    setTimeout(() => {
      UI.notify(`Guadagno offline: +${Utils.fmt(State.offlineGain)}`, "success");
    }, 700);
  }

  window.addEventListener("pointerdown", () => AudioFX.init(), { once: true });

  setInterval(() => {
    State.save(true);
  }, DATA.CONFIG.autosaveMs);

  window.addEventListener("beforeunload", () => State.save(true, true));

  requestAnimationFrame(gameLoop);
}

initGame();