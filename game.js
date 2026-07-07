(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const el = {
    stageMessage: document.getElementById("stageMessage"),
    startButton: document.getElementById("startButton"),
    resetButton: document.getElementById("resetButton"),
    soundButton: document.getElementById("soundButton"),
    timerLabel: document.getElementById("timerLabel"),
    scoreLabel: document.getElementById("scoreLabel"),
    bestTitle: document.getElementById("bestTitle"),
    bestScore: document.getElementById("bestScore"),
    pointsLeft: document.getElementById("pointsLeft"),
    statList: document.getElementById("statList"),
    typePicker: document.getElementById("typePicker"),
    appearancePicker: document.getElementById("appearancePicker"),
    challengeTitle: document.getElementById("challengeTitle"),
    challengeHint: document.getElementById("challengeHint"),
    jumpButton: document.getElementById("jumpButton"),
    stickZone: document.getElementById("stickZone"),
    stickKnob: document.getElementById("stickKnob"),
    battleBoard: document.getElementById("battleBoard"),
    battleStartButton: document.getElementById("battleStartButton"),
    battleNextButton: document.getElementById("battleNextButton"),
    aiName: document.getElementById("aiName"),
    aiNote: document.getElementById("aiNote"),
    battleResults: document.getElementById("battleResults"),
  };

  const W = canvas.width;
  const H = canvas.height;
  const STAT_MIN = 1;
  const STAT_MAX = 7;
  const STAT_BUDGET = 24;
  const eventOrder = ["collect", "sumo", "jump"];

  const statDefs = [
    { key: "speed", label: "はやさ", color: "#19a4c7" },
    { key: "power", label: "ちから", color: "#e45f52" },
    { key: "weight", label: "おもさ", color: "#8a6d5c" },
    { key: "turn", label: "まがる", color: "#43a65c" },
    { key: "jump", label: "ジャンプ", color: "#d99a18" },
    { key: "size", label: "からだ", color: "#7566d8" },
  ];

  const typeDefs = [
    {
      id: "swift",
      name: "スイスイ",
      note: "どっしりに強い",
      color: "#0f9f9a",
      dark: "#086d6a",
      glow: "#9df3ea",
      mods: { speed: 1, power: -0.4, weight: -0.5, turn: 0.2, jump: 0.1, size: -0.2 },
      beats: "solid",
    },
    {
      id: "solid",
      name: "どっしり",
      note: "くるりに強い",
      color: "#e45f52",
      dark: "#9d382f",
      glow: "#ffd4cf",
      mods: { speed: -0.5, power: 0.9, weight: 1, turn: -0.4, jump: -0.3, size: 0.3 },
      beats: "twirl",
    },
    {
      id: "twirl",
      name: "くるり",
      note: "スイスイに強い",
      color: "#7566d8",
      dark: "#4739a9",
      glow: "#dad6ff",
      mods: { speed: -0.1, power: -0.2, weight: -0.2, turn: 1, jump: 0.8, size: 0 },
      beats: "swift",
    },
  ];

  const lookDefs = [
    {
      id: "dragon",
      name: "ツノドラゴン",
      note: "かっこいい",
      mark: "角",
      accent: "#ffd24a",
      vibe: "cool",
      src: "assets/monsters/dragon.png",
      baseFacing: -1,
      spriteScale: 4.25,
    },
    {
      id: "bolt",
      name: "ライガー",
      note: "かっこいい",
      mark: "雷",
      accent: "#59d9ff",
      vibe: "cool",
      src: "assets/monsters/liger.png",
      baseFacing: -1,
      spriteScale: 4.05,
    },
    {
      id: "moco",
      name: "もこぷに",
      note: "かわいい",
      mark: "ぷ",
      accent: "#ff8fbd",
      vibe: "cute",
      src: "assets/monsters/moco.png",
      baseFacing: 0,
      spriteScale: 3.65,
    },
    {
      id: "star",
      name: "キラコロ",
      note: "かわいい",
      mark: "星",
      accent: "#ffe15a",
      vibe: "cute",
      src: "assets/monsters/star.png",
      baseFacing: 0,
      spriteScale: 3.85,
    },
  ];

  const monsterSprites = {};
  for (const look of lookDefs) {
    const image = new Image();
    image.onload = () => {
      image.ready = true;
    };
    image.src = look.src;
    monsterSprites[look.id] = image;
  }

  const modes = {
    collect: {
      title: "おたからあつめ",
      short: "おたから",
      time: 36,
      bestKey: "monsterTuneBestCollect2",
      hint: "はやさだけ上げると、まがる前にぶつかるかも。",
    },
    sumo: {
      title: "ころころすもう",
      short: "すもう",
      time: 30,
      bestKey: "monsterTuneBestSumo2",
      hint: "おもさとちからがあると押せます。重すぎると追いつきにくいです。",
    },
    jump: {
      title: "ぴょんジャンプ",
      short: "ジャンプ",
      time: 42,
      bestKey: "monsterTuneBestJump2",
      hint: "ジャンプが高すぎても着地がむずかしくなります。",
    },
  };

  const aiProfiles = [
    {
      id: "blitz",
      name: "ビュンビュンAI",
      note: "おたからが得意。すもうは軽くて苦手。",
      type: "swift",
      look: "bolt",
      stats: { speed: 7, power: 2, weight: 2, turn: 5, jump: 3, size: 2 },
      targets: { collect: 460, sumo: 180, jump: 360 },
    },
    {
      id: "titan",
      name: "ドスコイAI",
      note: "すもうが得意。ジャンプと回収はにがて。",
      type: "solid",
      look: "dragon",
      stats: { speed: 2, power: 7, weight: 7, turn: 2, jump: 2, size: 4 },
      targets: { collect: 220, sumo: 520, jump: 290 },
    },
    {
      id: "acro",
      name: "ピョンピョンAI",
      note: "ジャンプが得意。おたからは少し苦手。",
      type: "twirl",
      look: "star",
      stats: { speed: 4, power: 2, weight: 2, turn: 6, jump: 7, size: 3 },
      targets: { collect: 260, sumo: 300, jump: 560 },
    },
    {
      id: "balance",
      name: "まんべんAI",
      note: "全部そこそこ。弱点が小さい相手。",
      type: "twirl",
      look: "moco",
      stats: { speed: 4, power: 4, weight: 4, turn: 4, jump: 4, size: 4 },
      targets: { collect: 340, sumo: 350, jump: 430 },
    },
  ];

  const stats = {
    speed: 3,
    power: 3,
    weight: 3,
    turn: 3,
    jump: 3,
    size: 3,
  };

  const controls = {
    up: false,
    down: false,
    left: false,
    right: false,
  };

  const stick = {
    active: false,
    pointerId: null,
    x: 0,
    y: 0,
  };

  const game = {
    phase: "ready",
    timeLeft: modes.collect.time,
    score: 0,
    message: "",
    player: null,
    items: [],
    obstacles: [],
    particles: [],
    rival: null,
    rivalType: "solid",
    rivalLook: "dragon",
    platforms: [],
    stars: [],
    cameraX: 0,
    falls: 0,
    collected: 0,
    aiTarget: 0,
    flash: { alpha: 0, color: "#ffffff" },
    shake: 0,
    lastHitSound: 0,
  };

  const battle = {
    locked: false,
    ai: null,
    lockedStats: null,
    lockedType: null,
    lockedLook: null,
    index: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    results: [],
  };

  let playMode = "free";
  let currentMode = "collect";
  let currentType = "swift";
  let currentLook = "dragon";
  let lastTime = performance.now();
  let jumpQueued = false;
  let soundEnabled = true;
  let audioCtx = null;
  let bgmTimer = null;
  let bgmGain = null;
  let bgmStep = 0;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function length(x, y) {
    return Math.hypot(x, y);
  }

  function copyStats(source) {
    return { ...source };
  }

  function activeStats() {
    return battle.locked ? battle.lockedStats : stats;
  }

  function activeType() {
    return battle.locked ? battle.lockedType : currentType;
  }

  function activeLook() {
    return battle.locked ? battle.lockedLook : currentLook;
  }

  function getType(typeId = activeType()) {
    return typeDefs.find((type) => type.id === typeId) || typeDefs[0];
  }

  function getLook(lookId = activeLook()) {
    return lookDefs.find((look) => look.id === lookId) || lookDefs[0];
  }

  function safeStorageGet(key) {
    try {
      return Number(localStorage.getItem(key) || "0");
    } catch {
      return 0;
    }
  }

  function safeStorageSet(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch {
      // Some browsers disable localStorage in private contexts.
    }
  }

  function sumStats(source = stats) {
    return statDefs.reduce((total, def) => total + source[def.key], 0);
  }

  function tuningFor(sourceStats = activeStats(), typeId = activeType()) {
    const type = getType(typeId);
    const raw = {};
    for (const def of statDefs) {
      raw[def.key] = clamp(sourceStats[def.key] + (type.mods[def.key] || 0), 0.5, 8.5);
    }

    const tooFast = Math.max(0, raw.speed - raw.turn - 1.2);
    const tooBig = Math.max(0, raw.size - raw.turn - 1.5);
    const radius = 18 + raw.size * 4;
    const mass = 0.72 + raw.weight * 0.24 + raw.size * 0.05;

    return {
      raw,
      color: type.color,
      dark: type.dark,
      glow: type.glow,
      type,
      radius,
      mass,
      maxSpeed: 95 + raw.speed * 34 - raw.weight * 5,
      grip: clamp(0.055 + raw.turn * 0.027 - tooFast * 0.012 - tooBig * 0.006, 0.032, 0.2),
      push: 28 + raw.power * 10 + raw.weight * 5 + raw.size * 2,
      jumpVelocity: 350 + raw.jump * 47 - raw.weight * 20 + raw.turn * 5,
      gravity: 860 + raw.weight * 28 + raw.size * 6,
      airGrip: clamp(0.04 + raw.turn * 0.019 - raw.speed * 0.004, 0.028, 0.13),
    };
  }

  function currentTuning() {
    return tuningFor(activeStats(), activeType());
  }

  function randomInt(min, max) {
    return Math.floor(min + Math.random() * (max - min + 1));
  }

  function randomChoice(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function randomizeAiStats(templateStats) {
    const aiStats = {};
    for (const def of statDefs) {
      aiStats[def.key] = clamp(templateStats[def.key] + randomInt(-1, 1), STAT_MIN, STAT_MAX);
    }

    let guard = 0;
    while (sumStats(aiStats) !== STAT_BUDGET && guard < 120) {
      const total = sumStats(aiStats);
      const delta = total < STAT_BUDGET ? 1 : -1;
      const candidates = statDefs.filter((def) => delta > 0 ? aiStats[def.key] < STAT_MAX : aiStats[def.key] > STAT_MIN);
      if (!candidates.length) break;
      aiStats[randomChoice(candidates).key] += delta;
      guard += 1;
    }
    return aiStats;
  }

  function roundTarget(value, min, max) {
    return Math.round(clamp(value, min, max) / 10) * 10;
  }

  function randomizeAiTargets(template, aiStats) {
    const delta = (key) => aiStats[key] - template.stats[key];
    return {
      collect: roundTarget(
        template.targets.collect + delta("speed") * 28 + delta("turn") * 18 + delta("size") * 10 - delta("weight") * 8 + randomInt(-35, 35),
        190,
        500,
      ),
      sumo: roundTarget(
        template.targets.sumo + delta("power") * 30 + delta("weight") * 28 + delta("size") * 12 - delta("speed") * 6 + randomInt(-35, 35),
        170,
        560,
      ),
      jump: roundTarget(
        template.targets.jump + delta("jump") * 34 + delta("speed") * 18 + delta("turn") * 14 - delta("weight") * 18 + randomInt(-35, 35),
        260,
        590,
      ),
    };
  }

  function makeRandomAI(template) {
    const aiStats = randomizeAiStats(template.stats);
    const targets = randomizeAiTargets(template, aiStats);
    const strongStats = [...statDefs]
      .sort((a, b) => aiStats[b.key] - aiStats[a.key])
      .slice(0, 2)
      .map((def) => `${def.label}${aiStats[def.key]}`)
      .join("・");

    return {
      ...template,
      id: `${template.id}-${randomInt(10, 99)}`,
      name: `${template.name} ${randomInt(10, 99)}`,
      note: `${template.note} ${strongStats}が高め。リセットやページ更新で相手が変わります。`,
      stats: aiStats,
      targets,
    };
  }

  function getMoveVector() {
    if (Math.abs(stick.x) + Math.abs(stick.y) > 0.08) {
      return { x: stick.x, y: stick.y };
    }

    let x = 0;
    let y = 0;
    if (controls.left) x -= 1;
    if (controls.right) x += 1;
    if (controls.up) y -= 1;
    if (controls.down) y += 1;
    const mag = length(x, y);
    if (mag > 0) {
      x /= mag;
      y /= mag;
    }
    return { x, y };
  }

  function ensureAudio() {
    if (!soundEnabled) return;
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    if (!audioCtx) audioCtx = new AudioCtor();
    if (audioCtx.state === "suspended") audioCtx.resume();
    startBgm();
  }

  function tone(freq, duration, type = "sine", gain = 0.045, delay = 0) {
    if (!soundEnabled || !audioCtx) return;
    const now = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const amp = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    amp.gain.setValueAtTime(0, now);
    amp.gain.linearRampToValueAtTime(gain, now + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(amp);
    amp.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function musicTone(freq, duration, type = "triangle", gain = 0.035, delay = 0) {
    if (!soundEnabled || !audioCtx || !bgmGain) return;
    const now = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const amp = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    amp.gain.setValueAtTime(0, now);
    amp.gain.linearRampToValueAtTime(gain, now + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(amp);
    amp.connect(bgmGain);
    osc.start(now);
    osc.stop(now + duration + 0.03);
  }

  function noteFreq(root, semitone) {
    return root * (2 ** (semitone / 12));
  }

  function playBgmStep() {
    if (!soundEnabled || !audioCtx || !bgmGain) return;
    const patterns = {
      collect: [0, 4, 7, 9, 7, 4, 12, 9],
      sumo: [0, 0, 7, 5, 0, 0, 10, 7],
      jump: [0, 7, 12, 14, 12, 7, 16, 12],
    };
    const roots = { collect: 196, sumo: 174.61, jump: 220 };
    const pattern = patterns[currentMode] || patterns.collect;
    const root = playMode === "battle" ? roots[currentMode] * 0.94 : roots[currentMode];
    const semitone = pattern[bgmStep % pattern.length];
    const isAccent = bgmStep % 4 === 0;

    musicTone(noteFreq(root, semitone), isAccent ? 0.16 : 0.11, "triangle", isAccent ? 0.028 : 0.02);
    if (bgmStep % 4 === 0) musicTone(root / 2, 0.2, "sine", 0.018);
    if (game.phase === "playing" && bgmStep % 8 === 6) musicTone(noteFreq(root, semitone + 12), 0.08, "square", 0.012);
    bgmStep += 1;
  }

  function startBgm() {
    if (!soundEnabled || !audioCtx || bgmTimer) return;
    bgmGain = audioCtx.createGain();
    bgmGain.gain.setValueAtTime(0.55, audioCtx.currentTime);
    bgmGain.connect(audioCtx.destination);
    playBgmStep();
    bgmTimer = window.setInterval(playBgmStep, 190);
  }

  function stopBgm() {
    if (bgmTimer) {
      window.clearInterval(bgmTimer);
      bgmTimer = null;
    }
    if (!bgmGain) return;
    const oldGain = bgmGain;
    if (audioCtx) oldGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.04);
    window.setTimeout(() => {
      try {
        oldGain.disconnect();
      } catch {
        // It may already be disconnected on very quick toggles.
      }
    }, 180);
    bgmGain = null;
  }

  function playSound(name) {
    if (!soundEnabled) return;
    ensureAudio();
    if (!audioCtx) return;

    if (name === "start") {
      tone(330, 0.09, "triangle", 0.045);
      tone(520, 0.11, "triangle", 0.04, 0.08);
    } else if (name === "collect") {
      tone(620, 0.08, "sine", 0.045);
      tone(930, 0.08, "sine", 0.035, 0.05);
    } else if (name === "jump") {
      tone(260, 0.11, "square", 0.032);
      tone(420, 0.12, "triangle", 0.034, 0.05);
    } else if (name === "hit") {
      tone(120, 0.08, "sawtooth", 0.035);
    } else if (name === "win") {
      tone(392, 0.1, "triangle", 0.045);
      tone(523, 0.1, "triangle", 0.045, 0.08);
      tone(784, 0.14, "triangle", 0.04, 0.16);
    } else if (name === "loss") {
      tone(260, 0.12, "sawtooth", 0.035);
      tone(196, 0.16, "sawtooth", 0.028, 0.12);
    } else if (name === "switch") {
      tone(460, 0.06, "triangle", 0.025);
    } else {
      tone(360, 0.05, "sine", 0.025);
    }
  }

  function setMessage(text) {
    game.message = text;
    el.stageMessage.textContent = text;
  }

  function screenFlash(color, alpha = 0.35, shake = 0) {
    game.flash = { color, alpha };
    game.shake = Math.max(game.shake, shake);
  }

  function nextAI() {
    return makeRandomAI(randomChoice(aiProfiles));
  }

  function updateLabels() {
    const roundedScore = Math.max(0, Math.round(game.score));

    if (playMode === "battle") {
      el.bestTitle.textContent = "勝敗";
      el.bestScore.textContent = `${battle.wins}-${battle.losses}`;
      el.scoreLabel.textContent = battle.locked && game.aiTarget
        ? `きみ ${roundedScore} / AI ${game.aiTarget}`
        : `スコア ${roundedScore}`;
      el.startButton.textContent = battle.locked ? "スタート" : "AI対戦スタート";
      el.battleBoard.classList.remove("is-hidden");
    } else {
      el.bestTitle.textContent = "ベスト";
      el.bestScore.textContent = safeStorageGet(modes[currentMode].bestKey);
      el.scoreLabel.textContent = `スコア ${roundedScore}`;
      el.startButton.textContent = "スタート";
      el.battleBoard.classList.add("is-hidden");
    }

    el.timerLabel.textContent = `じかん ${Math.max(0, Math.ceil(game.timeLeft))}`;
    el.pointsLeft.textContent = STAT_BUDGET - sumStats(stats);
    el.challengeTitle.textContent = modes[currentMode].title;
    el.challengeHint.textContent = battle.locked
      ? "AI対戦中は、最初に決めた数値のまま3種目を戦います。"
      : modes[currentMode].hint;
    el.jumpButton.classList.toggle("is-muted", currentMode !== "jump");
    el.soundButton.textContent = soundEnabled ? "音・BGM ON" : "音・BGM OFF";
    document.body.classList.toggle("is-locked", battle.locked);

    for (const button of document.querySelectorAll(".mode-button")) {
      button.classList.toggle("is-active", button.dataset.mode === currentMode);
      button.disabled = playMode === "battle" && battle.locked;
    }

    for (const button of document.querySelectorAll(".play-mode-button")) {
      button.classList.toggle("is-active", button.dataset.playMode === playMode);
    }

    renderBattle();
  }

  function renderBattle() {
    const ai = battle.ai || aiProfiles[0];
    el.aiName.textContent = ai.name;
    el.aiNote.textContent = ai.note;
    el.battleResults.innerHTML = "";

    for (let i = 0; i < eventOrder.length; i += 1) {
      const mode = eventOrder[i];
      const result = battle.results.find((entry) => entry.mode === mode);
      const chip = document.createElement("div");
      chip.className = "result-chip";
      if (battle.locked && battle.index === i && !result) chip.classList.add("is-current");
      if (result?.outcome === "win") chip.classList.add("is-win");
      if (result?.outcome === "loss") chip.classList.add("is-loss");

      const title = document.createElement("strong");
      title.textContent = modes[mode].short;
      const detail = document.createElement("span");
      if (result) {
        const word = result.outcome === "win" ? "勝ち" : result.outcome === "loss" ? "負け" : "引分";
        detail.textContent = `${word} ${result.player}-${result.ai}`;
      } else if (battle.locked && battle.index === i) {
        detail.textContent = `AI ${battle.ai.targets[mode]}`;
      } else {
        detail.textContent = `AI ${ai.targets[mode]}`;
      }

      chip.append(title, detail);
      el.battleResults.append(chip);
    }

    const waitingNext = battle.locked && game.phase === "finish" && battle.results.length < eventOrder.length;
    el.battleStartButton.classList.toggle("is-hidden", battle.locked);
    el.battleNextButton.classList.toggle("is-hidden", !waitingNext);
  }

  function renderTypes() {
    el.typePicker.innerHTML = "";
    for (const type of typeDefs) {
      const button = document.createElement("button");
      button.className = `type-button${type.id === currentType ? " is-active" : ""}`;
      button.type = "button";
      button.disabled = battle.locked;
      button.dataset.type = type.id;

      const dot = document.createElement("span");
      dot.className = "type-dot";
      dot.style.background = type.color;
      dot.textContent = "●";

      const label = document.createElement("span");
      label.className = "type-label";
      const strong = document.createElement("strong");
      strong.textContent = type.name;
      const small = document.createElement("span");
      small.textContent = type.note;
      label.append(strong, small);

      const mark = document.createElement("span");
      mark.className = "type-mark";
      mark.textContent = type.id === currentType ? "えらんだ" : "タイプ";

      button.append(dot, label, mark);
      button.addEventListener("click", () => {
        if (battle.locked) return;
        currentType = type.id;
        playSound("switch");
        renderTypes();
        updateLabels();
      });
      el.typePicker.append(button);
    }
  }

  function renderAppearances() {
    el.appearancePicker.innerHTML = "";
    for (const look of lookDefs) {
      const button = document.createElement("button");
      button.className = `appearance-button${look.id === currentLook ? " is-active" : ""}`;
      button.type = "button";
      button.disabled = battle.locked;
      button.dataset.look = look.id;

      const face = document.createElement("span");
      face.className = "appearance-face";
      face.style.background = look.accent;
      const preview = document.createElement("img");
      preview.src = look.src;
      preview.alt = "";
      preview.loading = "eager";
      face.append(preview);

      const label = document.createElement("span");
      label.className = "appearance-label";
      const strong = document.createElement("strong");
      strong.textContent = look.name;
      const small = document.createElement("span");
      small.textContent = look.note;
      label.append(strong, small);

      const mark = document.createElement("span");
      mark.className = "appearance-mark";
      mark.textContent = look.id === currentLook ? "えらんだ" : "すがた";

      button.append(face, label, mark);
      button.addEventListener("click", () => {
        if (battle.locked) return;
        currentLook = look.id;
        playSound("switch");
        renderAppearances();
        updateLabels();
      });
      el.appearancePicker.append(button);
    }
  }

  function renderStats() {
    el.statList.innerHTML = "";

    for (const def of statDefs) {
      const row = document.createElement("div");
      row.className = "stat-row";

      const name = document.createElement("div");
      name.className = "stat-name";
      name.textContent = def.label;

      const minus = document.createElement("button");
      minus.className = "stepper-button";
      minus.type = "button";
      minus.textContent = "-";
      minus.disabled = battle.locked || stats[def.key] <= STAT_MIN;
      minus.setAttribute("aria-label", `${def.label}をへらす`);
      minus.addEventListener("click", () => adjustStat(def.key, -1));

      const track = document.createElement("div");
      track.className = "stat-track";
      const fill = document.createElement("div");
      fill.className = "stat-fill";
      fill.style.background = def.color;
      fill.style.width = `${(stats[def.key] / STAT_MAX) * 100}%`;
      const value = document.createElement("div");
      value.className = "stat-value";
      value.textContent = stats[def.key];
      track.append(fill, value);

      const plus = document.createElement("button");
      plus.className = "stepper-button";
      plus.type = "button";
      plus.textContent = "+";
      plus.disabled = battle.locked || stats[def.key] >= STAT_MAX || sumStats() >= STAT_BUDGET;
      plus.setAttribute("aria-label", `${def.label}をふやす`);
      plus.addEventListener("click", () => adjustStat(def.key, 1));

      row.append(name, minus, track, plus);
      el.statList.append(row);
    }
  }

  function renderAllControls() {
    renderTypes();
    renderAppearances();
    renderStats();
    updateLabels();
  }

  function adjustStat(key, delta) {
    if (battle.locked) return;
    if (delta > 0 && sumStats() >= STAT_BUDGET) return;
    stats[key] = clamp(stats[key] + delta, STAT_MIN, STAT_MAX);
    playSound("switch");
    renderStats();
    updateLabels();
  }

  function setPlayMode(mode) {
    playMode = mode;
    if (mode === "battle") {
      resetBattleSetup(false);
    } else {
      battle.locked = false;
      battle.results = [];
      battle.wins = 0;
      battle.losses = 0;
      battle.ties = 0;
      resetMode("自由に好きな種目とパラメータで遊べます。");
    }
    playSound("switch");
    renderAllControls();
  }

  function resetBattleSetup(rotateAI = true) {
    battle.locked = false;
    battle.lockedStats = null;
    battle.lockedType = null;
    battle.lockedLook = null;
    battle.index = 0;
    battle.wins = 0;
    battle.losses = 0;
    battle.ties = 0;
    battle.results = [];
    if (rotateAI || !battle.ai) battle.ai = nextAI();
    currentMode = "collect";
    resetMode(`AIの作戦を見て、3種目で勝てる改造を考えよう。相手は「${battle.ai.name}」。`);
  }

  function beginBattle() {
    ensureAudio();
    battle.locked = true;
    battle.lockedStats = copyStats(stats);
    battle.lockedType = currentType;
    battle.lockedLook = currentLook;
    battle.index = 0;
    battle.wins = 0;
    battle.losses = 0;
    battle.ties = 0;
    battle.results = [];
    currentMode = eventOrder[0];
    renderAllControls();
    startEvent();
  }

  function nextBattleEvent() {
    if (!battle.locked) return;
    battle.index += 1;
    if (battle.index >= eventOrder.length) {
      resetBattleSetup(true);
      return;
    }
    currentMode = eventOrder[battle.index];
    startEvent();
  }

  function resetMode(customMessage = "") {
    game.phase = "ready";
    game.timeLeft = modes[currentMode].time;
    game.score = 0;
    game.particles = [];
    game.flash = { alpha: 0, color: "#ffffff" };
    game.shake = 0;

    if (currentMode === "collect") prepareCollect();
    if (currentMode === "sumo") prepareSumo();
    if (currentMode === "jump") prepareJump();

    const message = customMessage || `${modes[currentMode].title}: かいぞうしてからスタート！`;
    setMessage(message);
    updateLabels();
  }

  function startGame() {
    ensureAudio();
    if (playMode === "battle" && !battle.locked) {
      beginBattle();
      return;
    }
    if (playMode === "battle" && game.phase === "finish") {
      return;
    }
    startEvent();
  }

  function startEvent() {
    game.phase = "playing";
    game.timeLeft = modes[currentMode].time;
    game.score = 0;
    game.particles = [];
    game.flash = { alpha: 0, color: "#ffffff" };
    game.shake = 0;

    if (currentMode === "collect") prepareCollect();
    if (currentMode === "sumo") prepareSumo();
    if (currentMode === "jump") prepareJump();

    setMessage("");
    screenFlash("#ffffff", 0.24, 0);
    playSound("start");
    updateLabels();
  }

  function finishGame(text, score = game.score) {
    game.phase = "finish";
    game.score = Math.max(0, Math.round(score));

    const key = modes[currentMode].bestKey;
    const best = safeStorageGet(key);
    if (game.score > best) safeStorageSet(key, game.score);

    if (playMode === "battle" && battle.locked) {
      recordBattleResult(game.score);
      return;
    }

    setMessage(text);
    screenFlash("#fff1a6", 0.28, 0);
    playSound("win");
    updateLabels();
  }

  function recordBattleResult(playerScore) {
    const aiScore = battle.ai.targets[currentMode];
    const outcome = playerScore > aiScore ? "win" : playerScore < aiScore ? "loss" : "tie";

    if (outcome === "win") battle.wins += 1;
    else if (outcome === "loss") battle.losses += 1;
    else battle.ties += 1;

    battle.results.push({
      mode: currentMode,
      player: playerScore,
      ai: aiScore,
      outcome,
    });

    const word = outcome === "win" ? "勝ち" : outcome === "loss" ? "負け" : "引き分け";
    const isFinal = battle.results.length >= eventOrder.length;
    const totalWord = battle.wins > battle.losses ? "AI対戦に勝ち！" : battle.wins < battle.losses ? "AI対戦は負け。" : "AI対戦は引き分け。";
    const nextText = isFinal ? `${totalWord} ${battle.wins}勝${battle.losses}敗。もう一回ならリセット！` : "次の種目へ進もう。";

    setMessage(`${modes[currentMode].short}: きみ ${playerScore} / AI ${aiScore} で${word}。${nextText}`);
    screenFlash(outcome === "win" ? "#b9f6c8" : outcome === "loss" ? "#ffd0ca" : "#fff1a6", 0.36, outcome === "win" ? 5 : 2);
    playSound(outcome === "win" ? "win" : "loss");
    updateLabels();
  }

  function applyTopDownMotion(entity, move, tuning, dt) {
    const targetX = move.x * tuning.maxSpeed;
    const targetY = move.y * tuning.maxSpeed;
    const blend = clamp(tuning.grip * dt * 60, 0, 0.32);
    entity.vx += (targetX - entity.vx) * blend;
    entity.vy += (targetY - entity.vy) * blend;
    entity.x += entity.vx * dt;
    entity.y += entity.vy * dt;
  }

  function keepCircleInBounds(entity, radius, minX = 28, minY = 28, maxX = W - 28, maxY = H - 28) {
    if (entity.x < minX + radius) {
      entity.x = minX + radius;
      entity.vx = Math.abs(entity.vx) * 0.35;
    }
    if (entity.x > maxX - radius) {
      entity.x = maxX - radius;
      entity.vx = -Math.abs(entity.vx) * 0.35;
    }
    if (entity.y < minY + radius) {
      entity.y = minY + radius;
      entity.vy = Math.abs(entity.vy) * 0.35;
    }
    if (entity.y > maxY - radius) {
      entity.y = maxY - radius;
      entity.vy = -Math.abs(entity.vy) * 0.35;
    }
  }

  function circleRectHit(cx, cy, radius, rect) {
    const closestX = clamp(cx, rect.x, rect.x + rect.w);
    const closestY = clamp(cy, rect.y, rect.y + rect.h);
    const dx = cx - closestX;
    const dy = cy - closestY;
    const dist = length(dx, dy);
    if (dist >= radius) return null;
    if (dist === 0) {
      const left = Math.abs(cx - rect.x);
      const right = Math.abs(rect.x + rect.w - cx);
      const top = Math.abs(cy - rect.y);
      const bottom = Math.abs(rect.y + rect.h - cy);
      const min = Math.min(left, right, top, bottom);
      if (min === left) return { nx: -1, ny: 0, depth: radius };
      if (min === right) return { nx: 1, ny: 0, depth: radius };
      if (min === top) return { nx: 0, ny: -1, depth: radius };
      return { nx: 0, ny: 1, depth: radius };
    }
    return { nx: dx / dist, ny: dy / dist, depth: radius - dist };
  }

  function collideWithObstacles(entity, radius, tuning) {
    for (const obstacle of game.obstacles) {
      const hit = circleRectHit(entity.x, entity.y, radius, obstacle);
      if (!hit) continue;
      entity.x += hit.nx * hit.depth;
      entity.y += hit.ny * hit.depth;
      const dot = entity.vx * hit.nx + entity.vy * hit.ny;
      if (dot < 0) {
        const bounce = clamp(0.62 - tuning.mass * 0.07, 0.18, 0.5);
        entity.vx -= (1 + bounce) * dot * hit.nx;
        entity.vy -= (1 + bounce) * dot * hit.ny;
        spawnParticles(entity.x, entity.y, "#ffffff", 5, 0.8);
      }
    }
  }

  function pointClearOfObstacles(x, y, radius) {
    if (x < 60 || x > W - 60 || y < 70 || y > H - 60) return false;
    for (const obstacle of game.obstacles) {
      if (circleRectHit(x, y, radius + 16, obstacle)) return false;
    }
    return true;
  }

  function spawnItem() {
    for (let tries = 0; tries < 60; tries += 1) {
      const x = 70 + Math.random() * (W - 140);
      const y = 82 + Math.random() * (H - 150);
      if (pointClearOfObstacles(x, y, 18)) {
        game.items.push({
          x,
          y,
          spin: Math.random() * Math.PI * 2,
          color: Math.random() > 0.5 ? "#e5a51a" : "#7566d8",
        });
        return;
      }
    }
  }

  function prepareCollect() {
    game.aiTarget = battle.locked ? battle.ai.targets.collect : 0;
    game.player = { x: 120, y: 300, vx: 0, vy: 0, angle: 0 };
    game.obstacles = [
      { x: 248, y: 116, w: 84, h: 210, color: "#acd8d2" },
      { x: 482, y: 330, w: 92, h: 188, color: "#edcb76" },
      { x: 665, y: 108, w: 122, h: 76, color: "#bcb3ef" },
      { x: 742, y: 380, w: 78, h: 92, color: "#f4a79b" },
    ];
    game.items = [];
    game.collected = 0;
    for (let i = 0; i < 16; i += 1) spawnItem();
  }

  function updateCollect(dt) {
    const tuning = currentTuning();
    const player = game.player;
    applyTopDownMotion(player, getMoveVector(), tuning, dt);
    keepCircleInBounds(player, tuning.radius);
    collideWithObstacles(player, tuning.radius, tuning);

    for (let i = game.items.length - 1; i >= 0; i -= 1) {
      const item = game.items[i];
      item.spin += dt * 4;
      if (length(player.x - item.x, player.y - item.y) < tuning.radius + 15) {
        game.items.splice(i, 1);
        game.collected += 1;
        game.score += 12 + Math.round(tuning.raw.speed * 2 + tuning.raw.size);
        spawnParticles(item.x, item.y, item.color, 14, 1.2);
        screenFlash(item.color, 0.12, 0);
        playSound("collect");
        spawnItem();
      }
    }

    if (game.timeLeft <= 0) {
      finishGame(`おしまい！ おたから ${game.collected}こ、スコア ${Math.round(game.score)}。`);
    }
  }

  function nextRivalType() {
    const order = ["solid", "twirl", "swift"];
    return order[Math.floor(performance.now() / 1000) % order.length];
  }

  function prepareSumo() {
    game.aiTarget = battle.locked ? battle.ai.targets.sumo : 0;
    game.player = { x: 350, y: 300, vx: 0, vy: 0, angle: 0 };

    if (battle.locked) {
      game.rivalType = battle.ai.type;
      game.rivalLook = battle.ai.look;
      game.rival = { x: 610, y: 300, vx: 0, vy: 0, angle: Math.PI, stats: copyStats(battle.ai.stats) };
    } else {
      game.rivalType = nextRivalType();
      game.rivalLook = game.rivalType === "solid" ? "dragon" : game.rivalType === "swift" ? "bolt" : "star";
      const rivalStats = {
        speed: 3 + (game.rivalType === "swift" ? 2 : 0),
        power: 3 + (game.rivalType === "solid" ? 2 : 0),
        weight: 3 + (game.rivalType === "solid" ? 2 : 0),
        turn: 3 + (game.rivalType === "twirl" ? 2 : 0),
        jump: 2,
        size: 3 + (game.rivalType === "solid" ? 1 : 0),
      };
      game.rival = { x: 610, y: 300, vx: 0, vy: 0, angle: Math.PI, stats: rivalStats };
    }
  }

  function affinity(attackerId, defenderId) {
    const attacker = getType(attackerId);
    const defender = getType(defenderId);
    if (attacker.beats === defender.id) return 1.16;
    if (defender.beats === attacker.id) return 0.88;
    return 1;
  }

  function updateSumo(dt) {
    const center = { x: W / 2, y: H / 2 };
    const ringRadius = 232;
    const playerTune = currentTuning();
    const rivalTune = tuningFor(game.rival.stats, game.rivalType);
    const player = game.player;
    const rival = game.rival;

    applyTopDownMotion(player, getMoveVector(), playerTune, dt);

    const toPlayer = { x: player.x - rival.x, y: player.y - rival.y };
    const distToPlayer = Math.max(1, length(toPlayer.x, toPlayer.y));
    const toCenter = { x: center.x - rival.x, y: center.y - rival.y };
    const distFromCenter = length(toCenter.x, toCenter.y);
    let aiX = toPlayer.x / distToPlayer;
    let aiY = toPlayer.y / distToPlayer;
    if (distFromCenter > ringRadius - 76) {
      aiX = aiX * 0.45 + (toCenter.x / Math.max(1, distFromCenter)) * 0.75;
      aiY = aiY * 0.45 + (toCenter.y / Math.max(1, distFromCenter)) * 0.75;
    }
    applyTopDownMotion(rival, { x: aiX, y: aiY }, rivalTune, dt);

    resolveSumoContact(player, rival, playerTune, rivalTune);

    const playerOut = length(player.x - center.x, player.y - center.y) + playerTune.radius > ringRadius;
    const rivalOut = length(rival.x - center.x, rival.y - center.y) + rivalTune.radius > ringRadius;
    if (rivalOut && !playerOut) {
      const bonus = Math.ceil(game.timeLeft * 14);
      finishGame(`やった！ あいてを外に出した。スコア ${500 + bonus}。`, 500 + bonus);
      return;
    }
    if (playerOut && !rivalOut) {
      const keepScore = Math.max(40, Math.round((modes.sumo.time - game.timeLeft) * 6));
      finishGame("もう一回！ タイプやおもさを変えると動きがかわります。", keepScore);
      return;
    }

    const centerScore = clamp(190 - length(player.x - center.x, player.y - center.y), 0, 190);
    game.score = Math.max(game.score, Math.round(centerScore + (modes.sumo.time - game.timeLeft) * 4));
    if (game.timeLeft <= 0) {
      const rivalDistance = length(rival.x - center.x, rival.y - center.y);
      const playerDistance = length(player.x - center.x, player.y - center.y);
      const text = playerDistance <= rivalDistance ? "まんなかを守った！" : "あと少し！";
      finishGame(`${text} スコア ${Math.round(game.score)}。`);
    }
  }

  function resolveSumoContact(player, rival, playerTune, rivalTune) {
    const dx = rival.x - player.x;
    const dy = rival.y - player.y;
    const dist = Math.max(0.001, length(dx, dy));
    const minDist = playerTune.radius + rivalTune.radius;
    if (dist >= minDist) return;

    const nx = dx / dist;
    const ny = dy / dist;
    const overlap = minDist - dist;
    const totalMass = playerTune.mass + rivalTune.mass;
    player.x -= nx * overlap * (rivalTune.mass / totalMass);
    player.y -= ny * overlap * (rivalTune.mass / totalMass);
    rival.x += nx * overlap * (playerTune.mass / totalMass);
    rival.y += ny * overlap * (playerTune.mass / totalMass);

    const playerDrive = Math.max(0, player.vx * nx + player.vy * ny);
    const rivalDrive = Math.max(0, -(rival.vx * nx + rival.vy * ny));
    const playerForce = (playerTune.push + playerDrive * 0.12) * affinity(activeType(), game.rivalType);
    const rivalForce = (rivalTune.push + rivalDrive * 0.12) * affinity(game.rivalType, activeType());
    rival.vx += (nx * playerForce) / rivalTune.mass;
    rival.vy += (ny * playerForce) / rivalTune.mass;
    player.vx -= (nx * rivalForce) / playerTune.mass;
    player.vy -= (ny * rivalForce) / playerTune.mass;
    spawnParticles((player.x + rival.x) / 2, (player.y + rival.y) / 2, "#ffffff", 4, 0.7);
    game.shake = Math.max(game.shake, 3);

    const now = performance.now();
    if (now - game.lastHitSound > 180) {
      game.lastHitSound = now;
      playSound("hit");
    }
  }

  function prepareJump() {
    game.aiTarget = battle.locked ? battle.ai.targets.jump : 0;
    game.player = { x: 85, y: 432, vx: 0, vy: 0, onGround: false, checkpointX: 85, checkpointY: 432 };
    game.cameraX = 0;
    game.falls = 0;
    game.collected = 0;
    game.platforms = [
      { x: 0, y: 510, w: 430, h: 80, color: "#9dcc8e" },
      { x: 500, y: 460, w: 230, h: 28, color: "#e7cc8e" },
      { x: 815, y: 410, w: 190, h: 28, color: "#b9d7cf" },
      { x: 1100, y: 472, w: 260, h: 28, color: "#f0b2a6" },
      { x: 1455, y: 388, w: 180, h: 28, color: "#ccbfe8" },
      { x: 1740, y: 445, w: 235, h: 28, color: "#b9d7cf" },
      { x: 2070, y: 390, w: 190, h: 28, color: "#e7cc8e" },
      { x: 2375, y: 490, w: 390, h: 80, color: "#9dcc8e", goal: true },
    ];
    game.stars = [
      { x: 355, y: 454, got: false },
      { x: 605, y: 400, got: false },
      { x: 910, y: 350, got: false },
      { x: 1215, y: 410, got: false },
      { x: 1538, y: 328, got: false },
      { x: 1855, y: 385, got: false },
      { x: 2155, y: 330, got: false },
      { x: 2510, y: 430, got: false },
    ];
  }

  function consumeJump() {
    const wasQueued = jumpQueued || controls.up;
    jumpQueued = false;
    return wasQueued;
  }

  function updateJump(dt) {
    const tuning = currentTuning();
    const p = game.player;
    const radius = tuning.radius * 0.86;
    const move = getMoveVector();
    const leftRight = clamp(move.x, -1, 1);
    const target = leftRight * (115 + tuning.raw.speed * 42 - tuning.raw.weight * 4);
    const grip = p.onGround ? tuning.grip : tuning.airGrip;
    p.vx += (target - p.vx) * clamp(grip * dt * 60, 0, 0.25);

    if (consumeJump() && p.onGround) {
      p.vy = -tuning.jumpVelocity;
      p.onGround = false;
      spawnParticles(p.x, p.y + radius, "#ffffff", 9, 1);
      playSound("jump");
    }

    p.vy += tuning.gravity * dt;
    const prevY = p.y;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.onGround = false;

    for (const platform of game.platforms) {
      const withinX = p.x + radius > platform.x && p.x - radius < platform.x + platform.w;
      const crossedTop = prevY + radius <= platform.y && p.y + radius >= platform.y;
      if (withinX && crossedTop && p.vy >= 0) {
        p.y = platform.y - radius;
        p.vy = 0;
        p.onGround = true;
        p.checkpointX = platform.x + Math.min(platform.w - 50, Math.max(50, p.x - platform.x));
        p.checkpointY = p.y;
      }
    }

    if (p.x < 35) {
      p.x = 35;
      p.vx = Math.abs(p.vx) * 0.2;
    }

    for (const star of game.stars) {
      if (star.got) continue;
      if (length(p.x - star.x, p.y - star.y) < radius + 21) {
        star.got = true;
        game.collected += 1;
        spawnParticles(star.x, star.y, "#e5a51a", 12, 1);
        screenFlash("#ffe15a", 0.14, 0);
        playSound("collect");
      }
    }

    if (p.y > 700) {
      game.falls += 1;
      p.x = p.checkpointX;
      p.y = p.checkpointY - 6;
      p.vx = 0;
      p.vy = -120;
      spawnParticles(p.x, p.y, "#e45f52", 10, 1);
      screenFlash("#ffd0ca", 0.25, 3);
      playSound("hit");
    }

    game.cameraX = clamp(p.x - 245, 0, 1840);
    game.score = Math.max(0, Math.round(p.x / 4 + game.collected * 70 - game.falls * 45));

    if (p.x > 2510 && p.y < 540) {
      const score = game.score + Math.ceil(game.timeLeft * 8);
      finishGame(`ゴール！ ほし ${game.collected}こ、スコア ${score}。`, score);
    } else if (game.timeLeft <= 0) {
      finishGame(`タイムアップ！ 進んだきょり ${Math.round(p.x)}。`, game.score);
    }
  }

  function spawnParticles(x, y, color, count, power = 1) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (55 + Math.random() * 160) * power;
      game.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.35 + Math.random() * 0.45,
        age: 0,
        size: 3 + Math.random() * 5,
        color,
      });
    }
  }

  function updateParticles(dt) {
    for (let i = game.particles.length - 1; i >= 0; i -= 1) {
      const p = game.particles[i];
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 220 * dt;
      if (p.age >= p.life) game.particles.splice(i, 1);
    }
    game.flash.alpha = Math.max(0, game.flash.alpha - dt * 1.8);
    game.shake = Math.max(0, game.shake - dt * 16);
  }

  function update(dt) {
    updateParticles(dt);
    if (game.phase !== "playing") return;
    game.timeLeft -= dt;
    if (currentMode === "collect") updateCollect(dt);
    if (currentMode === "sumo") updateSumo(dt);
    if (currentMode === "jump") updateJump(dt);
    updateLabels();
  }

  function draw() {
    ctx.save();
    if (game.shake > 0) {
      ctx.translate((Math.random() - 0.5) * game.shake, (Math.random() - 0.5) * game.shake);
    }
    if (currentMode === "collect") drawCollect();
    if (currentMode === "sumo") drawSumo();
    if (currentMode === "jump") drawJump();
    drawParticles();
    ctx.restore();
    drawFlash();
  }

  function drawBackdrop(colorA, colorB) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, colorA);
    grad.addColorStop(1, colorB);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(38, 57, 72, 0.08)";
    ctx.lineWidth = 2;
    for (let x = -80; x < W + 80; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x - 80, H);
      ctx.stroke();
    }
  }

  function drawCollect() {
    drawBackdrop("#dff4ee", "#fff0bf");
    ctx.fillStyle = "rgba(255,255,255,0.54)";
    roundRect(28, 36, W - 56, H - 74, 8);
    ctx.fill();

    for (const obstacle of game.obstacles) {
      ctx.fillStyle = obstacle.color;
      roundRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h, 8);
      ctx.fill();
      ctx.strokeStyle = "rgba(32,36,44,0.14)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    for (const item of game.items) {
      drawGem(item.x, item.y, 15, item.color, item.spin);
    }

    const tuning = currentTuning();
    drawMonster(game.player.x, game.player.y, tuning.radius, activeType(), activeLook(), game.player.vx, game.player.vy);
    drawTargetBadge();
  }

  function drawSumo() {
    drawBackdrop("#eef0ff", "#fff0cf");
    const centerX = W / 2;
    const centerY = H / 2;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.fillStyle = "#f2d48b";
    ctx.beginPath();
    ctx.arc(0, 0, 245, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#7d5c2b";
    ctx.lineWidth = 14;
    ctx.stroke();
    ctx.strokeStyle = "rgba(125,92,43,0.32)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 155, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    const playerTune = currentTuning();
    const rivalTune = tuningFor(game.rival.stats, game.rivalType);
    drawMonster(game.rival.x, game.rival.y, rivalTune.radius, game.rivalType, game.rivalLook, game.rival.vx, game.rival.vy, { ai: true });
    drawMonster(game.player.x, game.player.y, playerTune.radius, activeType(), activeLook(), game.player.vx, game.player.vy);

    drawNameTag(game.player.x, game.player.y - playerTune.radius - 24, "きみ");
    drawNameTag(game.rival.x, game.rival.y - rivalTune.radius - 24, battle.locked ? "AI" : getType(game.rivalType).name);
    drawTargetBadge();
  }

  function drawJump() {
    drawBackdrop("#dfefff", "#fff3d7");
    const cam = game.cameraX;

    ctx.save();
    ctx.translate(-cam, 0);
    ctx.fillStyle = "rgba(255,255,255,0.42)";
    for (let i = 0; i < 8; i += 1) {
      const x = i * 360 + 80;
      ctx.beginPath();
      ctx.ellipse(x, 90 + (i % 3) * 28, 72, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const platform of game.platforms) {
      ctx.fillStyle = platform.color;
      roundRect(platform.x, platform.y, platform.w, platform.h, 8);
      ctx.fill();
      ctx.fillStyle = "rgba(73, 64, 42, 0.12)";
      ctx.fillRect(platform.x, platform.y + platform.h - 5, platform.w, 5);
      if (platform.goal) drawFlag(platform.x + platform.w - 82, platform.y - 74);
    }

    for (const star of game.stars) {
      if (!star.got) drawStar(star.x, star.y, 16, "#e5a51a", performance.now() / 500);
    }

    const tuning = currentTuning();
    drawMonster(game.player.x, game.player.y, tuning.radius * 0.86, activeType(), activeLook(), game.player.vx, game.player.vy);
    ctx.restore();

    ctx.fillStyle = "rgba(255,255,255,0.84)";
    roundRect(690, 24, 236, 40, 8);
    ctx.fill();
    ctx.fillStyle = "#28313c";
    ctx.font = "900 20px sans-serif";
    ctx.fillText(`ほし ${game.collected} / ${game.stars.length}`, 715, 51);
    drawTargetBadge();
  }

  function drawTargetBadge() {
    if (!battle.locked || !game.aiTarget) return;
    ctx.fillStyle = "rgba(22, 48, 66, 0.88)";
    roundRect(28, H - 64, 224, 42, 8);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 18px sans-serif";
    ctx.fillText(`AI目標 ${game.aiTarget}`, 52, H - 37);
  }

  function drawMonster(x, y, radius, typeId, lookId, vx, vy, options = {}) {
    const type = getType(typeId);
    const look = getLook(lookId);
    const angle = Math.atan2(vy, vx || 0.001);
    const speed = length(vx, vy);
    const lean = clamp(speed / 260, 0, 0.24);
    const sprite = monsterSprites[look.id];

    if (sprite?.ready) {
      drawSpriteMonster(x, y, radius, type, look, sprite, vx, vy, options, lean);
      return;
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.cos(angle) * lean * 0.25);

    ctx.fillStyle = "rgba(32, 36, 44, 0.2)";
    ctx.beginPath();
    ctx.ellipse(0, radius * 0.86, radius * 0.84, radius * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    if (look.id === "dragon") drawDragonExtras(radius, type, look);
    if (look.id === "bolt") drawBoltExtras(radius, type, look);
    if (look.id === "moco") drawMocoExtras(radius, type, look);
    if (look.id === "star") drawStarExtras(radius, type, look);

    ctx.shadowColor = type.glow;
    ctx.shadowBlur = options.ai ? 12 : 18;
    ctx.fillStyle = type.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.95, radius, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (options.ai) {
      ctx.strokeStyle = "#1d2430";
      ctx.lineWidth = Math.max(3, radius * 0.08);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,255,255,0.26)";
    ctx.beginPath();
    ctx.ellipse(-radius * 0.22, -radius * 0.28, radius * 0.42, radius * 0.28, -0.4, 0, Math.PI * 2);
    ctx.fill();

    drawFace(radius, type, look);

    ctx.fillStyle = type.dark;
    ctx.beginPath();
    ctx.arc(-radius * 0.45, radius * 0.58, radius * 0.16, 0, Math.PI * 2);
    ctx.arc(radius * 0.45, radius * 0.58, radius * 0.16, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawSpriteMonster(x, y, radius, type, look, sprite, vx, vy, options, lean) {
    const moving = Math.abs(vx) > 14;
    const desiredFacing = moving ? (vx < 0 ? -1 : 1) : look.baseFacing || 1;
    const baseFacing = look.baseFacing || 1;
    const flip = baseFacing === desiredFacing ? 1 : -1;
    const size = radius * look.spriteScale;
    const yOffset = look.id === "dragon" ? -radius * 0.1 : look.id === "bolt" ? -radius * 0.06 : 0;
    const bob = Math.sin(performance.now() / 140) * clamp(length(vx, vy) / 260, 0, 1) * 2.5;

    ctx.save();
    ctx.translate(x, y + yOffset + bob);

    ctx.fillStyle = "rgba(32, 36, 44, 0.2)";
    ctx.beginPath();
    ctx.ellipse(0, radius * 0.86, radius * 0.9, radius * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(Math.sign(vx || 1) * lean * 0.22);
    ctx.scale(flip, 1);
    ctx.shadowColor = type.glow;
    ctx.shadowBlur = options.ai ? 10 : 18;
    ctx.globalAlpha = options.ai ? 0.97 : 1;
    ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  function drawDragonExtras(radius, type, look) {
    ctx.fillStyle = look.accent;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.48, -radius * 0.72);
    ctx.lineTo(-radius * 0.28, -radius * 1.18);
    ctx.lineTo(-radius * 0.08, -radius * 0.72);
    ctx.moveTo(radius * 0.48, -radius * 0.72);
    ctx.lineTo(radius * 0.28, -radius * 1.18);
    ctx.lineTo(radius * 0.08, -radius * 0.72);
    ctx.fill();

    ctx.fillStyle = type.dark;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.78, -radius * 0.12);
    ctx.lineTo(-radius * 1.42, -radius * 0.48);
    ctx.lineTo(-radius * 1.12, radius * 0.22);
    ctx.closePath();
    ctx.moveTo(radius * 0.78, -radius * 0.12);
    ctx.lineTo(radius * 1.42, -radius * 0.48);
    ctx.lineTo(radius * 1.12, radius * 0.22);
    ctx.closePath();
    ctx.fill();
  }

  function drawBoltExtras(radius, type, look) {
    ctx.fillStyle = type.dark;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.52, -radius * 0.72);
    ctx.lineTo(-radius * 0.86, -radius * 1.1);
    ctx.lineTo(-radius * 0.16, -radius * 0.88);
    ctx.closePath();
    ctx.moveTo(radius * 0.52, -radius * 0.72);
    ctx.lineTo(radius * 0.86, -radius * 1.1);
    ctx.lineTo(radius * 0.16, -radius * 0.88);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = look.accent;
    ctx.beginPath();
    ctx.moveTo(radius * 0.06, -radius * 1.05);
    ctx.lineTo(-radius * 0.12, -radius * 0.34);
    ctx.lineTo(radius * 0.12, -radius * 0.34);
    ctx.lineTo(-radius * 0.03, radius * 0.22);
    ctx.lineTo(radius * 0.32, -radius * 0.48);
    ctx.lineTo(radius * 0.08, -radius * 0.48);
    ctx.closePath();
    ctx.fill();
  }

  function drawMocoExtras(radius, type, look) {
    ctx.fillStyle = type.color;
    for (const spot of [
      [-0.52, -0.68, 0.28],
      [0, -0.82, 0.3],
      [0.52, -0.68, 0.28],
      [-0.82, -0.08, 0.24],
      [0.82, -0.08, 0.24],
    ]) {
      ctx.beginPath();
      ctx.arc(radius * spot[0], radius * spot[1], radius * spot[2], 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = look.accent;
    ctx.beginPath();
    ctx.arc(-radius * 0.74, -radius * 0.18, radius * 0.18, 0, Math.PI * 2);
    ctx.arc(radius * 0.74, -radius * 0.18, radius * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawStarExtras(radius, type, look) {
    ctx.strokeStyle = type.dark;
    ctx.lineWidth = Math.max(3, radius * 0.08);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-radius * 0.34, -radius * 0.78);
    ctx.lineTo(-radius * 0.46, -radius * 1.1);
    ctx.moveTo(radius * 0.34, -radius * 0.78);
    ctx.lineTo(radius * 0.46, -radius * 1.1);
    ctx.stroke();
    drawStarShape(-radius * 0.49, -radius * 1.15, radius * 0.14, look.accent);
    drawStarShape(radius * 0.49, -radius * 1.15, radius * 0.14, look.accent);
  }

  function drawFace(radius, type, look) {
    const cool = look.vibe === "cool";
    ctx.fillStyle = type.dark;

    if (cool) {
      ctx.save();
      ctx.rotate(-0.08);
      roundRect(-radius * 0.52, -radius * 0.22, radius * 0.34, radius * 0.16, 4);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.rotate(0.08);
      roundRect(radius * 0.18, -radius * 0.22, radius * 0.34, radius * 0.16, 4);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = type.dark;
      ctx.lineWidth = Math.max(3, radius * 0.08);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-radius * 0.24, radius * 0.2);
      ctx.quadraticCurveTo(0, radius * 0.38, radius * 0.26, radius * 0.2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(-radius * 0.34, -radius * 0.1, radius * 0.13, 0, Math.PI * 2);
      ctx.arc(radius * 0.34, -radius * 0.1, radius * 0.13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(-radius * 0.38, -radius * 0.14, radius * 0.045, 0, Math.PI * 2);
      ctx.arc(radius * 0.3, -radius * 0.14, radius * 0.045, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = look.accent;
      ctx.beginPath();
      ctx.arc(-radius * 0.56, radius * 0.12, radius * 0.1, 0, Math.PI * 2);
      ctx.arc(radius * 0.56, radius * 0.12, radius * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = type.dark;
      ctx.lineWidth = Math.max(3, radius * 0.07);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, radius * 0.1, radius * 0.28, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
  }

  function drawNameTag(x, y, text) {
    ctx.font = "900 18px sans-serif";
    const width = ctx.measureText(text).width + 24;
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    roundRect(x - width / 2, y - 17, width, 28, 8);
    ctx.fill();
    ctx.fillStyle = "#25313d";
    ctx.textAlign = "center";
    ctx.fillText(text, x, y + 3);
    ctx.textAlign = "left";
  }

  function drawGem(x, y, radius, color, spin) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin);
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -radius);
    ctx.lineTo(radius * 0.86, 0);
    ctx.lineTo(0, radius);
    ctx.lineTo(-radius * 0.86, 0);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,0.72)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  function drawStar(x, y, radius, color, spin) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin);
    drawStarShape(0, 0, radius, color);
    ctx.restore();
  }

  function drawStarShape(x, y, radius, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const r = i % 2 === 0 ? radius : radius * 0.45;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = Math.max(2, radius * 0.18);
    ctx.stroke();
    ctx.restore();
  }

  function drawFlag(x, y) {
    ctx.strokeStyle = "#4b5360";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + 76);
    ctx.stroke();
    ctx.fillStyle = "#e45f52";
    ctx.beginPath();
    ctx.moveTo(x + 3, y + 3);
    ctx.lineTo(x + 72, y + 18);
    ctx.lineTo(x + 3, y + 36);
    ctx.closePath();
    ctx.fill();
  }

  function drawParticles() {
    const cam = currentMode === "jump" ? game.cameraX : 0;
    for (const p of game.particles) {
      const alpha = 1 - p.age / p.life;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x - cam, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawFlash() {
    if (game.flash.alpha <= 0) return;
    ctx.globalAlpha = game.flash.alpha;
    ctx.fillStyle = game.flash.color;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  function bindControls() {
    const keyMap = {
      ArrowUp: "up",
      KeyW: "up",
      ArrowDown: "down",
      KeyS: "down",
      ArrowLeft: "left",
      KeyA: "left",
      ArrowRight: "right",
      KeyD: "right",
    };

    window.addEventListener("keydown", (event) => {
      if (event.code === "Space" || (currentMode === "jump" && event.code === "ArrowUp")) {
        jumpQueued = true;
      }
      const dir = keyMap[event.code];
      if (dir) {
        controls[dir] = true;
        event.preventDefault();
      }
    });

    window.addEventListener("keyup", (event) => {
      const dir = keyMap[event.code];
      if (dir) controls[dir] = false;
    });

    const moveStick = (event) => {
      const rect = el.stickZone.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const max = Math.min(rect.width, rect.height) * 0.32;
      const dx = event.clientX - cx;
      const dy = event.clientY - cy;
      const dist = Math.max(1, length(dx, dy));
      const limited = Math.min(max, dist);
      stick.x = (dx / dist) * (limited / max);
      stick.y = (dy / dist) * (limited / max);
      el.stickKnob.style.transform = `translate(calc(-50% + ${stick.x * max}px), calc(-50% + ${stick.y * max}px))`;
    };

    const releaseStick = () => {
      stick.active = false;
      stick.pointerId = null;
      stick.x = 0;
      stick.y = 0;
      el.stickKnob.style.transform = "translate(-50%, -50%)";
    };

    el.stickZone.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      stick.active = true;
      stick.pointerId = event.pointerId;
      el.stickZone.setPointerCapture?.(event.pointerId);
      moveStick(event);
    });

    el.stickZone.addEventListener("pointermove", (event) => {
      if (!stick.active || stick.pointerId !== event.pointerId) return;
      event.preventDefault();
      moveStick(event);
    });

    el.stickZone.addEventListener("pointerup", releaseStick);
    el.stickZone.addEventListener("pointercancel", releaseStick);
    el.stickZone.addEventListener("lostpointercapture", releaseStick);

    el.jumpButton.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      jumpQueued = true;
      ensureAudio();
      el.jumpButton.setPointerCapture?.(event.pointerId);
    });
  }

  function bindUI() {
    el.startButton.addEventListener("click", startGame);
    el.battleStartButton.addEventListener("click", beginBattle);
    el.battleNextButton.addEventListener("click", nextBattleEvent);

    el.resetButton.addEventListener("click", () => {
      if (playMode === "battle") resetBattleSetup(true);
      else resetMode();
      renderAllControls();
    });

    el.soundButton.addEventListener("click", () => {
      soundEnabled = !soundEnabled;
      if (soundEnabled) {
        ensureAudio();
        playSound("switch");
      } else {
        stopBgm();
      }
      updateLabels();
    });

    for (const button of document.querySelectorAll(".play-mode-button")) {
      button.addEventListener("click", () => setPlayMode(button.dataset.playMode));
    }

    for (const button of document.querySelectorAll(".mode-button")) {
      button.addEventListener("click", () => {
        if (playMode === "battle" && battle.locked) return;
        currentMode = button.dataset.mode;
        resetMode();
        playSound("switch");
        updateLabels();
      });
    }
  }

  function loop(now) {
    const dt = Math.min(0.034, (now - lastTime) / 1000);
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  bindUI();
  bindControls();
  renderAllControls();
  resetMode();
  requestAnimationFrame(loop);
})();
