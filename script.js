const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const levelDisplay = document.getElementById("levelDisplay");
const livesDisplay = document.getElementById("livesDisplay");
const ammoDisplay = document.getElementById("ammoDisplay");
const scoreDisplay = document.getElementById("scoreDisplay");

const gravity = 0.7;
const friction = 0.85;
const gameWidth = canvas.width;
const gameHeight = canvas.height;

const keys = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  w: false,
  W: false,
  Space: false,
  " ": false,
};

const levels = [
  {
    startX: 100,
    startY: 330,
    goalX: 820,
    goalY: 310,
    obstacles: [
      { x: 320, y: 360, w: 60, h: 40, destructible: true },
      { x: 520, y: 320, w: 80, h: 20, destructible: false },
      { x: 650, y: 350, w: 50, h: 40, destructible: true },
      { x: 760, y: 280, w: 80, h: 20, destructible: false }
    ],
    enemies: [
      { x: 420, y: 360, w: 40, h: 40, vx: 1.8, minX: 420, maxX: 560 },
      { x: 600, y: 360, w: 40, h: 40, vx: 2.3, minX: 600, maxX: 720 }
    ],
    pickups: [
      { x: 380, y: 290, w: 24, h: 24, type: "ammo" },
      { x: 720, y: 240, w: 24, h: 24, type: "ammo" }
    ]
  },
  {
    startX: 100,
    startY: 330,
    goalX: 820,
    goalY: 310,
    obstacles: [
      { x: 280, y: 360, w: 50, h: 40, destructible: false },
      { x: 380, y: 330, w: 80, h: 20, destructible: true },
      { x: 520, y: 320, w: 120, h: 20, destructible: false },
      { x: 690, y: 330, w: 60, h: 40, destructible: true }
    ],
    enemies: [
      { x: 410, y: 360, w: 42, h: 42, vx: 2.4, minX: 410, maxX: 520 },
      { x: 560, y: 320, w: 40, h: 40, vx: 2.0, minX: 560, maxX: 660 },
      { x: 742, y: 360, w: 38, h: 38, vx: 1.7, minX: 742, maxX: 820 }
    ],
    pickups: [
      { x: 310, y: 290, w: 24, h: 24, type: "ammo" },
      { x: 760, y: 240, w: 24, h: 24, type: "ammo" },
      { x: 580, y: 280, w: 24, h: 24, type: "ammo" }
    ]
  }
];

let state = {
  levelIndex: 0,
  lives: 3,
  ammo: 3,
  score: 0,
  message: "",
  bullets: [],
  lastShotTime: 0,
  player: {
    x: 100,
    y: 330,
    w: 40,
    h: 50,
    vx: 0,
    vy: 0,
    onGround: false
  }
};

function resetPlayer() {
  const level = levels[state.levelIndex];
  state.player.x = level.startX;
  state.player.y = level.startY;
  state.player.vx = 0;
  state.player.vy = 0;
  state.player.onGround = false;
}

function restartLevel() {
  state.lives = 3;
  state.ammo = 3;
  state.bullets = [];
  state.message = "Level dimulai ulang!";
  resetPlayer();
}

function nextLevel() {
  state.levelIndex += 1;
  if (state.levelIndex >= levels.length) {
    state.message = "Selamat! Kamu menangkan permainan SpongeBob Mario! Tekan F5 untuk main lagi.";
    state.levelIndex = levels.length - 1;
    return;
  }
  state.lives = 3;
  state.ammo = 3;
  state.bullets = [];
  state.message = "Level baru dimulai!";
  resetPlayer();
}

function drawBlock(x, y, w, h, color, outline = true) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  if (outline) {
    ctx.strokeStyle = "#1c1c1c";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
  }
}

function drawScene() {
  ctx.clearRect(0, 0, gameWidth, gameHeight);

  ctx.fillStyle = "#8ee0ff";
  ctx.fillRect(0, 0, gameWidth, gameHeight);

  ctx.fillStyle = "#f8f0b5";
  ctx.fillRect(0, 400, gameWidth, 50);

  const level = levels[state.levelIndex];

  level.obstacles.forEach(obs => {
    drawBlock(obs.x, obs.y, obs.w, obs.h, obs.destructible ? "#bf8f00" : "#de3c4b");
  });

  level.enemies.forEach(enemy => {
    drawBlock(enemy.x, enemy.y, enemy.w, enemy.h, "#ffb300");
    ctx.fillStyle = "#3a1f47";
    ctx.fillRect(enemy.x + 8, enemy.y + 10, enemy.w - 16, 8);
    ctx.fillRect(enemy.x + 10, enemy.y + 22, enemy.w - 20, 6);
  });

  level.pickups.forEach(pickup => {
    ctx.fillStyle = pickup.type === "ammo" ? "#00b8a9" : "#ffd166";
    ctx.beginPath();
    ctx.arc(pickup.x + pickup.w / 2, pickup.y + pickup.h / 2, pickup.w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("+", pickup.x + pickup.w / 2, pickup.y + pickup.h / 2);
  });

  drawBlock(level.goalX, level.goalY, 50, 80, "#ffd25f");
  ctx.fillStyle = "#2a4d69";
  ctx.fillRect(level.goalX + 10, level.goalY + 10, 30, 60);
  ctx.strokeStyle = "#1c1c1c";
  ctx.lineWidth = 2;
  ctx.strokeRect(level.goalX, level.goalY, 50, 80);

  state.bullets.forEach(bullet => {
    ctx.fillStyle = "rgba(135, 206, 250, 0.95)";
    ctx.fillRect(bullet.x - bullet.r, bullet.y - bullet.r, bullet.r * 2, bullet.r * 2);
    ctx.strokeStyle = "#0a3f5a";
    ctx.lineWidth = 2;
    ctx.strokeRect(bullet.x - bullet.r, bullet.y - bullet.r, bullet.r * 2, bullet.r * 2);
  });

  ctx.fillStyle = "#ffd43b";
  drawBlock(state.player.x, state.player.y, state.player.w, state.player.h, "#ffd43b", false);
  ctx.strokeStyle = "#1c1c1c";
  ctx.lineWidth = 2;
  ctx.strokeRect(state.player.x, state.player.y, state.player.w, state.player.h);
  ctx.fillStyle = "#000";
  ctx.fillRect(state.player.x + 10, state.player.y + 16, 6, 6);
  ctx.fillRect(state.player.x + 24, state.player.y + 16, 6, 6);
  ctx.fillRect(state.player.x + 12, state.player.y + 34, 16, 4);

  ctx.fillStyle = "#fff";
  ctx.font = "20px Arial";
  ctx.fillText(state.message, 20, 30);
}

function rectIntersect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function updatePhysics() {
  const player = state.player;
  if (keys.ArrowLeft) {
    player.vx -= 0.8;
  }
  if (keys.ArrowRight) {
    player.vx += 0.8;
  }
  if ((keys.ArrowUp || keys.w || keys.W) && player.onGround) {
    player.vy = -14;
    player.onGround = false;
  }

  player.vx *= friction;
  player.vy += gravity;
  player.x += player.vx;
  player.y += player.vy;

  if (player.x < 0) player.x = 0;
  if (player.x + player.w > gameWidth) player.x = gameWidth - player.w;
  if (player.y + player.h >= 400) {
    player.y = 400 - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  const level = levels[state.levelIndex];

  level.enemies.forEach(enemy => {
    enemy.x += enemy.vx;
    if (enemy.x < enemy.minX || enemy.x + enemy.w > enemy.maxX) {
      enemy.vx *= -1;
      enemy.x = Math.max(enemy.minX, Math.min(enemy.x, enemy.maxX - enemy.w));
    }
  });

  state.bullets = state.bullets.filter(bullet => bullet.x < gameWidth && bullet.x > -10);
  state.bullets.forEach(bullet => {
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
  });

  state.bullets.forEach((bullet, index) => {
    for (let obsIndex = 0; obsIndex < level.obstacles.length; obsIndex += 1) {
      const obs = level.obstacles[obsIndex];
      const bulletRect = { x: bullet.x - bullet.r, y: bullet.y - bullet.r, w: bullet.r * 2, h: bullet.r * 2 };
      if (rectIntersect(bulletRect, obs)) {
        if (obs.destructible) {
          level.obstacles.splice(obsIndex, 1);
          state.score += 100;
        }
        state.bullets.splice(index, 1);
        return;
      }
    }
  });

  level.pickups.forEach((pickup, idx) => {
    if (rectIntersect(player, pickup)) {
      if (pickup.type === "ammo") {
        state.ammo += 3;
        state.score += 50;
        state.message = "Amunisi tambahan diperoleh!";
      }
      level.pickups.splice(idx, 1);
    }
  });

  level.enemies.forEach(enemy => {
    if (rectIntersect(player, enemy)) {
      loseLife("Kena musuh bergerak!");
    }
  });

  level.obstacles.forEach(obs => {
    if (rectIntersect(player, obs)) {
      if (player.y + player.h - player.vy <= obs.y) {
        player.y = obs.y - player.h;
        player.vy = 0;
        player.onGround = true;
      } else {
        loseLife("Kena rintangan!");
      }
    }
  });

  const goalRect = { x: level.goalX, y: level.goalY, w: 50, h: 80 };
  if (rectIntersect(player, goalRect)) {
    state.message = "Goal tercapai! Lanjutkan ke level berikutnya.";
    nextLevel();
  }
}

function loseLife(reason) {
  state.lives -= 1;
  if (state.lives <= 0) {
    state.message = `${reason} Nyawa habis, level diulang.`;
    restartLevel();
    return;
  }
  state.message = `${reason} Nyawa tersisa: ${state.lives}`;
  resetPlayer();
}

function shootBubble() {
  const now = Date.now();
  if (state.ammo <= 0) {
    state.message = "Amunisi habis, ambil kotak hadiah!";
    return;
  }
  if (now - state.lastShotTime < 220) return;

  state.bullets.push({
    x: state.player.x + state.player.w,
    y: state.player.y + state.player.h / 2,
    vx: 7,
    vy: 0,
    r: 8
  });
  state.ammo -= 1;
  state.lastShotTime = now;
  state.message = "Gelembung ditembakkan!";
}

function gameLoop() {
  if (keys.Space || keys[" "]) {
    shootBubble();
  }
  updatePhysics();
  drawScene();
  levelDisplay.textContent = state.levelIndex + 1;
  livesDisplay.textContent = state.lives;
  ammoDisplay.textContent = state.ammo;
  scoreDisplay.textContent = state.score;
  requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") event.preventDefault();
  keys[event.key] = true;
  keys[event.code] = true;
});

window.addEventListener("keyup", (event) => {
  keys[event.key] = false;
  keys[event.code] = false;
});

restartLevel();
requestAnimationFrame(gameLoop);
