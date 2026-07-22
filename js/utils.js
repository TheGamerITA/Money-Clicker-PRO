const Utils = {
  fmt(n, decimals = false) {
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
  },

  formatTime(seconds) {
    seconds = Math.floor(seconds || 0);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  },

  todayKey() {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${month}-${day}`;
  },

  weekKey() {
    const d = new Date();
    const start = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d - start) / 86400000);
    const week = Math.ceil((days + start.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
  },

  hashCode(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return h >>> 0;
  },

  mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },

  shuffle(arr, rng = Math.random) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  },

  rand(min, max) {
    return min + Math.random() * (max - min);
  },

  pick(arr, rng = Math.random) {
    return arr[Math.floor(rng() * arr.length)];
  },

  weightedPick(items, weights, rng = Math.random) {
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = rng() * total;

    for (let i = 0; i < items.length; i++) {
      if (roll < weights[i]) return items[i];
      roll -= weights[i];
    }

    return items[0];
  }
};