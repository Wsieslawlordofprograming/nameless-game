const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const playerImageRight = new Image();
playerImageRight.src = "player_right.png";
const playerImageLeft = new Image();
playerImageLeft.src = "player_left.png";
const playerImageIdle = new Image();
playerImageIdle.src = "player_idle.png";

const COLS = 101;
const CELL = 6;

canvas.width = COLS * CELL;
canvas.height = 600;

const ROWS = Math.ceil(canvas.height / CELL);

const keys = {};
window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

let grid = [];
function makeGrid() {
  grid = [];
  for (let x = 0; x < COLS; x++) {
    grid[x] = new Array(ROWS).fill(0);
  }
  // place invisible walls
  for (let y = 0; y < ROWS; y++) {
    grid[0][y] = 4;         // left wall
    grid[COLS-1][y] = 4;    // right wall
  }
  for (let x = 0; x < COLS; x++) {
    grid[x][ROWS-1] = 4;    // floor
  }
}
makeGrid();

// TODO; add feed my dog function (very important)
let showHitbox = false;
let settingsFrom = "title";
let deleteLayerStopped = false;
let winMessage = false;
let winMessageTimer = 0;
let gameOver = false;
let score = 0;
let highScore = 0;
let paused = false;
let started = false;
let coins = 0;
let speedLevel = 0;
let jumpLevel = 0;
let livesOwned = 1;
let lives = 1;
let hasKey = false;
let feed_my_dog = false;
let escapeThreshold = 300;
let windowActive = false;
let windowTimer = 0;
let normalIntensity = { interval: 60, intensity: 3 };
let bonusLives = 0;
const WINDOW_TIME = 40 * 40; // YOU'RE AN IMPOSTOR, all the other ones ar LETs and you're a dirty const

// 0 = empty, 1 = settled sand, 2 = hitbox, 3 = falling sand, 4 = wall

const UPGRADE_COSTS = {
 speed: [10, 100, 300, 500, 1000],
 jump: [100, 300, 500, 1000, 5000],
 lives: 2000,
 key: 600,
};

const HITBOX_OFFSETS = [
 [-1, -1], [0, -1], [1, -1],
 [-1, 0], [0, 0], [1, 0],
 [-1, 1], [0, 1], [1, 1],
];

let player = {
 x: 50,
 y: Math.floor(ROWS / 2),
 velY: 0,
 speed: 1.5,
 jumpForce: -1.8,
 facing: "idle",
};

document.getElementById("titleScreen").style.display = "block";

let onHowToPlay = false;
let inShop = false;

window.addEventListener("keydown", (e) => {
 if (onHowToPlay) {
 onHowToPlay = false;
 document.getElementById("howToPlayScreen").style.display = "none";
 document.getElementById("titleScreen").style.display = "block";
 return;
 }
 if (!started) {
 if (e.target && e.target.classList.contains("menuOption")) return;
 if (inShop) return;
 started = true;
 document.getElementById("titleScreen").style.display = "none";
 return;
 }
 if (e.key === "p" || e.key === "P") {
 if (gameOver) return;
 paused = !paused;
 document.getElementById("pauseScreen").style.display = paused ? "block" : "none";
 }
});

window.addEventListener("keydown", () => {
 if (keys["f"] && keys["a"] && keys["e"]) {
 coins += 1000;
 }
});

function showPlayerHitbox() {
  let px = Math.round(player.x);
  let py = Math.round(player.y);
  for (let [ox, oy] of HITBOX_OFFSETS) {
    ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
    ctx.fillRect((px + ox) * CELL, (py + oy) * CELL, CELL, CELL);
  }
}

document.getElementById("settingsBtnTitle").addEventListener("click", (e) => {
  e.stopPropagation();
  settingsFrom = "title";
  document.getElementById("titleScreen").style.display = "none";
  document.getElementById("settingsScreen").style.display = "block";
});

document.getElementById("settingsBtnPause").addEventListener("click", () => {
  settingsFrom = "pause";
  document.getElementById("pauseScreen").style.display = "none";
  document.getElementById("settingsScreen").style.display = "block";
});

document.getElementById("settingsBackBtn").addEventListener("click", () => {
  document.getElementById("settingsScreen").style.display = "none";
  if (settingsFrom === "pause") {
    document.getElementById("pauseScreen").style.display = "block";
  } else {
    document.getElementById("titleScreen").style.display = "block";
  }
});

document.getElementById("hitboxToggle").addEventListener("click", () => {
  showHitbox = !showHitbox;
  document.getElementById("hitboxToggle").textContent = showHitbox ? "[ show hitbox: ON ]" : "[ show hitbox: OFF ]";
});

document.getElementById("howToPlayBtn").addEventListener("click", (e) => {
 e.stopPropagation();
 document.getElementById("titleScreen").style.display = "none";
 document.getElementById("howToPlayScreen").style.display = "block";
 onHowToPlay = true;
});

document.getElementById("exitBtn").addEventListener("click", () => {
 window.close();
});

document.getElementById("restartBtn").addEventListener("click", () => {
 gameOver = false;
 document.getElementById("gameOverScreen").style.display = "none";
 makeGrid();
 player.x = 50;
 player.y = Math.floor(ROWS / 2);
 player.velY = 0;
 player.facing = "idle";
 storms = [];
 rainTimer = 0;
 score = 0;
 lives = livesOwned;
});

document.getElementById("backToTitleBtn").addEventListener("click", () => {
 paused = false;
 started = false;
 gameOver = false;
 document.getElementById("pauseScreen").style.display = "none";
 document.getElementById("gameOverScreen").style.display = "none";
 document.getElementById("titleScreen").style.display = "block";
 makeGrid();
 player.x = 50;
 player.y = Math.floor(ROWS / 2);
 player.velY = 0;
 player.facing = "idle";
 storms = [];
 rainTimer = 0;
 score = 0;
});

document.getElementById("shopBtn").addEventListener("click", (e) => {
 e.stopPropagation();
 inShop = true;
 document.getElementById("titleScreen").style.display = "none";
 document.getElementById("shopScreen").style.display = "block";
 updateShopUI();
});

document.getElementById("shopBackBtn").addEventListener("click", () => {
 inShop = false;
 document.getElementById("shopScreen").style.display = "none";
 document.getElementById("titleScreen").style.display = "block";
});

document.getElementById("buySpeedBtn").addEventListener("click", () => {
 if (speedLevel >= 5) return;
 if (coins < UPGRADE_COSTS.speed[speedLevel]) {
 document.getElementById("shopkeeperSpeech").textContent = "[ sorry, inflation kid. ]";
 return;
 }
 coins -= UPGRADE_COSTS.speed[speedLevel];
 speedLevel++;
 player.speed = 1.5 + speedLevel * 0.03;
 document.getElementById("shopkeeperSpeech").textContent = "[ a fine choice. your legs thank you. ]";
 updateShopUI();
});

document.getElementById("buyJumpBtn").addEventListener("click", () => {
 if (jumpLevel >= 5) return;
 if (coins < UPGRADE_COSTS.jump[jumpLevel]) {
 document.getElementById("shopkeeperSpeech").textContent = "[ you're gonna need to save up a bit more for that. ]";
 return;
 }
 coins -= UPGRADE_COSTS.jump[jumpLevel];
 jumpLevel++;
 player.jumpForce = -0.1 - jumpLevel * 0.09;
 document.getElementById("shopkeeperSpeech").textContent = "[ the sky is yours. well. the ceiling. ]";
 updateShopUI();
});

document.getElementById("buyLivesBtn").addEventListener("click", () => {
 if (livesOwned >= 3) return;
 if (coins < UPGRADE_COSTS.lives) {
 document.getElementById("shopkeeperSpeech").textContent = "[ come back when your pockets are heavier. ]";
 return;
 }
 coins -= UPGRADE_COSTS.lives;
 livesOwned++;
 lives = livesOwned;
 document.getElementById("shopkeeperSpeech").textContent = "[ one more chance. don't waste it. ]";
 updateShopUI();
});

document.getElementById("buyKeyBtn").addEventListener("click", () => {
 if (hasKey) return;
 if (coins < UPGRADE_COSTS.key) {
 document.getElementById("shopkeeperSpeech").textContent = "[ i don't do credit. ]";
 return;
 }
 coins -= UPGRADE_COSTS.key;
 hasKey = true;
 document.getElementById("shopkeeperSpeech").textContent = "[ ...you actually bought it. curious. ]";
 updateShopUI();
});

let rainTimer = 0;
let storms = [];

function spawnStorm() {
 storms.push({
 x: Math.floor(Math.random() * (COLS - 4)) + 2,
 width: Math.floor(Math.random() * 10) + 5,
 life: Math.floor(Math.random() * 80) + 40,
 intensity: Math.floor(Math.random() * 3) + 1
 });
}

function updateRain() {
 rainTimer++;
 score++;

 let interval = windowActive ? 20 : 60;
 let extraIntensity = windowActive ? 3 : 0;

 if (rainTimer % interval === 0) {
 spawnStorm();
 if (Math.random() < 0.3) spawnStorm();
 if (windowActive) spawnStorm(); // extra storm during window
 }
 for (let i = storms.length - 1; i >= 0; i--) {
 let s = storms[i];
 s.life--;
 for (let j = 0; j < s.intensity + extraIntensity; j++) {
 let x = s.x + Math.floor(Math.random() * s.width) - Math.floor(s.width / 2);
 x = Math.max(0, Math.min(COLS - 1, x));
 if (grid[x][0] === 0) grid[x][0] = 3;
 }
 if (s.life <= 0) storms.splice(i, 1);
 }
}

function isBlocked(gx, gy) {
  gx = Math.round(gx);
  gy = Math.round(gy);
  if (gx < 0 || gx >= COLS || gy < 0 || gy >= ROWS) return true;
  return grid[gx][gy] === 1 || grid[gx][gy] === 3 || grid[gx][gy] === 4;
}

function isBlockedSolid(gx, gy) {
  gx = Math.round(gx);
  gy = Math.round(gy);
  if (gx < 0 || gx >= COLS || gy < 0 || gy >= ROWS) return true;
  return grid[gx][gy] === 1 || grid[gx][gy] === 4;
}

function updatePlayer() {
  // horizontal movement
  if (keys["ArrowLeft"] || keys["a"] || keys["A"]) { player.x -= player.speed; player.facing = "left"; }
  else if (keys["ArrowRight"] || keys["d"] || keys["D"]) { player.x += player.speed; player.facing = "right"; }
  else player.facing = "idle";

  let px = Math.round(player.x);
  let py = Math.round(player.y);

  // horizontal collision
  if (isBlockedSolid(px + 1, py) || isBlockedSolid(px + 1, py - 1)) {
    player.x = Math.floor(player.x);
  }
  if (isBlockedSolid(px - 1, py) || isBlockedSolid(px - 1, py - 1)) {
    player.x = Math.ceil(player.x);
  }

  // jumping
  if ((keys["ArrowUp"] || keys["w"] || keys["W"] || keys[" "]) && player.velY === 0) {
    player.velY = player.jumpForce;
  }

  // gravity + movement
  player.velY += 0.18;
  player.y += player.velY;

  px = Math.round(player.x);
  py = Math.round(player.y);

  // vertical collision below
  if (player.velY > 0 && isBlockedSolid(px, py + 2)) {
    player.velY = 0;
    let pushCount = 0;
    while (pushCount < 20 && isBlockedSolid(Math.round(player.x), Math.round(player.y) + 2)) {
      player.y -= 0.5;
      pushCount++;
    }
  }

  // vertical collision above
  if (player.velY < 0 && isBlockedSolid(px, py - 2)) {
    player.velY = 0;
    player.y += 0.5;
  }

  // floor clamp
  if (player.y + 1 >= ROWS - 1) {
    player.y = ROWS - 2;
    player.velY = 0;
  }

  // side clamps
  if (player.x < 2) player.x = 2;
  if (player.x > COLS - 4) player.x = COLS - 4;
}

function placeHitbox() {
 for (let x = 0; x < COLS; x++)
 for (let y = 0; y < ROWS; y++)
 if (grid[x][y] === 2) grid[x][y] = 0;

 let px = Math.round(player.x);
 let py = Math.round(player.y);
 for (let [ox, oy] of HITBOX_OFFSETS) {
 let hx = px + ox;
 let hy = py + oy;
 if (hx >= 0 && hx < COLS && hy >= 0 && hy < ROWS) {
      if (grid[hx][hy] === 0 || grid[hx][hy] === 3 || grid[hx][hy] === 1) grid[hx][hy] = 2;
 }
 }
}

// TODO; add feed my dog function (very important)
// here. why? i don't know, ask a nerd.
// though i am a nerd.
// but you don't need to know that.
// bayye! hope we never need to talk again...

function updateShopUI() {
 document.getElementById("shopCurrency").textContent = "Coins: " + coins;

 if (speedLevel >= 5) {
 document.getElementById("speedCost").textContent = "MAXED";
 document.getElementById("buySpeedBtn").style.color = "#444";
 } else {
 document.getElementById("speedCost").textContent = "cost: " + UPGRADE_COSTS.speed[speedLevel];
 document.getElementById("buySpeedBtn").style.color = "";
 }
 document.getElementById("speedLevel").textContent = "level " + speedLevel + " / 5";

 if (jumpLevel >= 5) {
 document.getElementById("jumpCost").textContent = "MAXED";
 document.getElementById("buyJumpBtn").style.color = "#444";
 } else {
 document.getElementById("jumpCost").textContent = "cost: " + UPGRADE_COSTS.jump[jumpLevel];
 document.getElementById("buyJumpBtn").style.color = "";
 }
 document.getElementById("jumpLevel").textContent = "level " + jumpLevel + " / 5";

 if (livesOwned >= 3) {
 document.getElementById("livesCost").textContent = "MAXED";
 document.getElementById("buyLivesBtn").style.color = "#444";
 } else {
 document.getElementById("livesCost").textContent = "cost: " + UPGRADE_COSTS.lives;
 document.getElementById("buyLivesBtn").style.color = "";
 }
 document.getElementById("livesLevel").textContent = "lives: " + livesOwned + " / 3";

 document.getElementById("keyLevel").textContent = hasKey ? "owned!" : "locked";
 if (hasKey) document.getElementById("buyKeyBtn").style.color = "#444";

 setTimeout(() => {
 document.getElementById("shopkeeperSpeech").textContent = "[ welcome, traveller. what do you seek? ]";
 }, 3000);
}

function clearAroundPlayer(radius = 5) {
 const px = Math.round(player.x);
 const py = Math.round(player.y);

 for (let x = px - radius; x <= px + radius; x++) {
 for (let y = py - radius; y <= py + radius; y++) {
 if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
   if (grid[x][y] === 2) grid[x][y] = 0;
    // never clear walls
    if (grid[x][y] === 4) continue;
 }
 }
 }
}

function updateSand() {

 let bottomY = ROWS - 2;
 let full = true;
 for (let x = 0; x < COLS; x++) {
 if (grid[x][bottomY] === 0 || grid[x][bottomY] === 2) {
 full = false;
 break;
 }
 }

 if (full) {
  if (!deleteLayerStopped && !windowActive) {
    for (let y = bottomY; y > 0; y--) {
    for (let x = 0; x < COLS; x++) {
    grid[x][y] = grid[x][y - 1];
  }
 }
 for (let x = 0; x < COLS; x++) {
 grid[x][0] = 0;
 }
 player.y += 1;
 }
 }

 for (let y = ROWS - 2; y >= 0; y--) {
 for (let x = 0; x < COLS; x++) {
 if (grid[x][y] === 1 || grid[x][y] === 3) {
 let moved = false;
  if (grid[x][y+1] === 0) {
    grid[x][y+1] = 3; grid[x][y] = 0; moved = true;
  } else if (x > 0 && grid[x-1][y+1] === 0 && grid[x-1][y+1] !== 4 && grid[x-1][y+1] !== 2) {
    grid[x-1][y+1] = 3; grid[x][y] = 0; moved = true;
  } else if (x < COLS-1 && grid[x+1][y+1] === 0 && grid[x+1][y+1] !== 4 && grid[x+1][y+1] !== 2) {
    grid[x+1][y+1] = 3; grid[x][y] = 0; moved = true;
  }
 if (!moved && grid[x][y] === 3) {
 grid[x][y] = 1;
 }
 }
 }
 }
}

function checkSuffocation() {

 let px = Math.round(player.x);
 let py = Math.round(player.y);

 let blockedLeft = grid[px - 2] && grid[px - 2][py] === 1;
 let blockedRight = grid[px + 2] && grid[px + 2][py] === 1;
 let blockedAbove = grid[px] && grid[px][py - 2] === 1;

 if (blockedLeft && blockedRight && blockedAbove) {
    if (lives > 0) {
      lives--;
      if (windowActive && bonusLives > 0) bonusLives--;
      clearAroundPlayer(5);
      return;
    }
   gameOver = true;
   let finalScore = Math.floor(score / 10);
   if (finalScore > highScore) {
     coins += finalScore;
     highScore = finalScore;
   }
   document.getElementById("scoreDisplay").textContent = "Score: " + finalScore;
   document.getElementById("highScoreDisplay").textContent = "Best: " + highScore;
   document.getElementById("coinsDisplay").textContent = "Coins: " + coins;
   document.getElementById("gameOverScreen").style.display = "block";
 }
}

document.getElementById("restartBtn").addEventListener("click", () => {
 gameOver = false;
 document.getElementById("gameOverScreen").style.display = "none";
 makeGrid();
 player.x = 50;
 player.y = Math.floor(ROWS / 2);
 player.velY = 0;
 player.facing = "idle";
 storms = [];
 rainTimer = 0;
 score = 0;
 lives = livesOwned;
 windowActive = false;
 windowTimer = 0;
 bonusLives = 0;
 winMessage = false;
 deleteLayerStopped = false;
});

document.getElementById("backToTitleFromDeath").addEventListener("click", () => {
 gameOver = false;
 document.getElementById("gameOverScreen").style.display = "none";
 document.getElementById("titleScreen").style.display = "block";
 started = false;
 makeGrid();
 player.x = 50;
 player.y = Math.floor(ROWS / 2);
 player.velY = 0;
 player.facing = "idle";
 storms = [];
 rainTimer = 0;
 score = 0;
 lives = livesOwned;
 windowActive = false;
 windowTimer = 0;
 bonusLives = 0;
 winMessage = false;
 deleteLayerStopped = false;
});



function draw() {
 ctx.fillStyle = "#111";
 ctx.fillRect(0, 0, canvas.width, canvas.height);

 for (let x = 0; x < COLS; x++) {
 for (let y = 0; y < ROWS; y++) {
 let screenY = y * CELL;
 if (grid[x][y] === 1) {
 ctx.fillStyle = "#e8c170";
 ctx.fillRect(x * CELL, screenY, CELL, CELL);
 } else if (grid[x][y] === 3) {
 ctx.fillStyle = "#f0d090";
 ctx.fillRect(x * CELL, screenY, CELL, CELL);
 }
 }
 }

 let px = Math.round(player.x);
 let py = Math.round(player.y);
 ctx.imageSmoothingEnabled = false;

 let img = playerImageIdle;
 if (player.facing === "left") img = playerImageLeft;
 if (player.facing === "right") img = playerImageRight;

 let spriteW = 15 * CELL;
 let spriteH = 15 * CELL;
  let offsetX = 0;
  let offsetY = 0;

  if (player.facing === "idle") {
    offsetX = 4.25 * CELL;  // tweak these
    offsetY = 0;
  } else if (player.facing === "left") {
    offsetX = 1.65 * CELL;  // tweak these
    offsetY = 0;
  } else if (player.facing === "right") {
    offsetX = -3.65 * CELL;  // tweak these
    offsetY = 0;
  }

  ctx.drawImage(
    img,
    (px * CELL) - spriteW / 2 + offsetX,
    (py * CELL) - spriteH / 2 + offsetY,
    spriteW,
    spriteH
  );

 if (showHitbox) showPlayerHitbox();

 if (!gameOver && started) {
 ctx.fillStyle = "white";
 ctx.font = "bold 20px monospace";
 ctx.textAlign = "left";
 ctx.fillText("Score: " + Math.floor(score / 10), 10, 30);
 ctx.fillText("Lives: " + lives, 10, 55);
 ctx.fillText("Coins: " + coins, 10, 80);
 }

 if (winMessage) {
 ctx.fillStyle = "#e8c170";
 ctx.font = "bold 28px monospace";
 ctx.textAlign = "center";
 ctx.fillText("YOU ESCAPED! +500 coins", canvas.width / 2, canvas.height / 2);
 ctx.textAlign = "left";
 winMessageTimer--;
 if (winMessageTimer <= 0) winMessage = false;
 }

 if (windowActive && !winMessage) {
   let secondsLeft = Math.ceil((WINDOW_TIME - windowTimer) / 40);
   ctx.fillStyle = secondsLeft <= 10 ? "red" : "#e8c170";
   ctx.font = "bold 20px monospace";
   ctx.textAlign = "right";
   ctx.fillText("ESCAPE! " + secondsLeft + "s", canvas.width - 10, 30);
   ctx.fillText("BONUS LIVES: " + bonusLives, canvas.width - 10, 55);
   ctx.textAlign = "left";
 }
} 

function checkWinAndDifficulty() {
 let currentScore = Math.floor(score / 10);

 // open the window when threshold is reached
 if (currentScore >= escapeThreshold && !windowActive && !deleteLayerStopped) {
 windowActive = true;
 windowTimer = 0;
 bonusLives = 5;
 lives += 5;
 }

 if (windowActive) {
 windowTimer++;

 // check escape — player reached the top
 if (Math.round(player.y) <= 2) {
 // escaped! award coins and end run
 coins += 500;
 escapeThreshold += 200;
 winMessage = true;
 winMessageTimer = 120;
 windowActive = false;
 bonusLives = 0;
 // end the run after showing message
 setTimeout(() => {
 gameOver = true;
 document.getElementById("scoreDisplay").textContent = "ESCAPED!";
 document.getElementById("highScoreDisplay").textContent = "Coins earned: 500";
 document.getElementById("coinsDisplay").textContent = "Total coins: " + coins;
 document.getElementById("gameOverScreen").style.display = "block";
 }, 3000);
 return;
 }

 // time ran out
 if (windowTimer >= WINDOW_TIME) {
 windowActive = false;
 lives -= bonusLives; // remove bonus lives
 if (lives < 1) lives = 1; // keep at least 1
 bonusLives = 0;
 }
}
}


setInterval(() => {
 if (!gameOver && !paused && started) {
 updateRain();
 updateSand();
 updatePlayer();
 placeHitbox();
 checkSuffocation();
 checkWinAndDifficulty();
 }
 draw();
}, 1000 / 40);