const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("start-button");
const scoreValue = document.getElementById("score-value");
const coinsValue = document.getElementById("coins-value");

const GRAVITY = 0.4;
const FLAP_STRENGTH = -7;
const BASE_PIPE_GAP = 160;
const PIPE_WIDTH = 80;
const PIPE_INTERVAL = 1700;
const PIPE_SPEED = 115; // pixels per second
const COIN_RADIUS = 14;
const COIN_VALUE = 5;
const COIN_SPAWN_CHANCE = 0.75;
const CLOUD_COUNT = 6;
const STAR_COUNT = 40;
const GROUND_HEIGHT = 90;
const GROUND_SPEED = 60;

const BIRD = {
  x: 120,
  y: canvas.height / 2,
  radius: 20,
  velocity: 0,
  rotation: 0,
  wingTime: 0,
};

let pipes = [];
let coins = [];
let clouds = [];
let stars = [];
let score = 0;
let coinsCollected = 0;
let running = false;
let lastTime = 0;
let pipeTimer = 0;
let groundOffset = 0;

function resetGame() {
  BIRD.y = canvas.height / 2;
  BIRD.velocity = 0;
  BIRD.rotation = 0;
  BIRD.wingTime = 0;
  pipes = [];
  coins = [];
  score = 0;
  coinsCollected = 0;
  pipeTimer = 0;
  lastTime = 0;
  groundOffset = 0;
  updateScoreDisplay();
  generateBackground();
}

function generateBackground() {
  clouds = Array.from({ length: CLOUD_COUNT }, () => {
    const width = 120 + Math.random() * 160;
    return {
      x: Math.random() * (canvas.width + width),
      y: 60 + Math.random() * 160,
      width,
      height: 30 + Math.random() * 30,
      speed: 12 + Math.random() * 18,
      opacity: 0.25 + Math.random() * 0.25,
    };
  });

  stars = Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height * 0.6,
    radius: 0.8 + Math.random() * 1.6,
    phase: Math.random() * Math.PI * 2,
    speed: 0.6 + Math.random() * 1.2,
  }));
}

function spawnPipe() {
  const minPipeHeight = 60;
  const maxPipeHeight = canvas.height - BASE_PIPE_GAP - minPipeHeight - GROUND_HEIGHT;
  const topHeight = minPipeHeight + Math.random() * (maxPipeHeight - minPipeHeight);
  const pipe = {
    x: canvas.width,
    top: topHeight,
    bottom: topHeight + BASE_PIPE_GAP,
    scored: false,
  };

  pipes.push(pipe);

  if (Math.random() < COIN_SPAWN_CHANCE) {
    spawnCoin(pipe);
  }
}

function spawnCoin(pipe) {
  const offset = (Math.random() - 0.5) * 40;
  coins.push({
    x: pipe.x + PIPE_WIDTH / 2,
    y: pipe.top + BASE_PIPE_GAP / 2 + offset,
    radius: COIN_RADIUS,
    rotation: Math.random() * Math.PI * 2,
    seed: Math.random() * Math.PI * 2,
    collected: false,
  });
}

function update(delta) {
  if (!running) return;

  const deltaSeconds = delta / 1000;

  BIRD.velocity += GRAVITY;
  BIRD.y += BIRD.velocity;
  BIRD.rotation = Math.min((BIRD.velocity / 10) * 45, 90);
  BIRD.wingTime += deltaSeconds;

  if (BIRD.y + BIRD.radius > canvas.height - GROUND_HEIGHT) {
    BIRD.y = canvas.height - GROUND_HEIGHT - BIRD.radius;
    gameOver();
  } else if (BIRD.y - BIRD.radius < 0) {
    BIRD.y = BIRD.radius;
    BIRD.velocity = 0;
  }

  pipeTimer += delta;
  if (pipeTimer >= PIPE_INTERVAL) {
    spawnPipe();
    pipeTimer = 0;
  }

  pipes.forEach((pipe) => {
    pipe.x -= PIPE_SPEED * deltaSeconds;

    if (!pipe.scored && pipe.x + PIPE_WIDTH < BIRD.x) {
      pipe.scored = true;
      score += 1;
      updateScoreDisplay();
    }
  });

  coins.forEach((coin) => {
    coin.x -= PIPE_SPEED * deltaSeconds;
    coin.rotation += deltaSeconds * 6;
  });

  updateClouds(deltaSeconds);
  updateStars(deltaSeconds);

  groundOffset = (groundOffset + GROUND_SPEED * deltaSeconds) % 40;

  pipes = pipes.filter((pipe) => pipe.x + PIPE_WIDTH > -10);
  coins = coins.filter((coin) => !coin.collected && coin.x + coin.radius > -20);

  checkCoinCollisions();

  if (checkCollisions()) {
    gameOver();
  }
}

function updateClouds(deltaSeconds) {
  clouds.forEach((cloud) => {
    cloud.x -= cloud.speed * deltaSeconds;
    if (cloud.x + cloud.width < -40) {
      cloud.x = canvas.width + Math.random() * 120;
      cloud.y = 60 + Math.random() * 160;
      cloud.speed = 12 + Math.random() * 18;
      cloud.opacity = 0.25 + Math.random() * 0.25;
    }
  });
}

function updateStars(deltaSeconds) {
  stars.forEach((star) => {
    star.phase += deltaSeconds * star.speed;
  });
}

function checkCollisions() {
  return pipes.some((pipe) => {
    const inPipeX = BIRD.x + BIRD.radius > pipe.x && BIRD.x - BIRD.radius < pipe.x + PIPE_WIDTH;
    if (!inPipeX) return false;

    const hitTop = BIRD.y - BIRD.radius < pipe.top;
    const hitBottom = BIRD.y + BIRD.radius > pipe.bottom;
    return hitTop || hitBottom;
  });
}

function checkCoinCollisions() {
  coins.forEach((coin) => {
    const dx = coin.x - BIRD.x;
    const dy = coin.y - BIRD.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < coin.radius + BIRD.radius) {
      coin.collected = true;
      coinsCollected += 1;
      score += COIN_VALUE;
      updateScoreDisplay();
    }
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawMountains();
  drawClouds();
  drawPipes();
  drawCoins();
  drawBird();
  drawGround();
}

function drawBackground() {
  const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  skyGradient.addColorStop(0, "#0f2147");
  skyGradient.addColorStop(0.45, "#173d7a");
  skyGradient.addColorStop(1, "#1a1a3a");
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  stars.forEach((star) => {
    const alpha = 0.35 + Math.abs(Math.sin(star.phase)) * 0.45;
    ctx.fillStyle = `rgba(209, 226, 255, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  const moonGradient = ctx.createRadialGradient(80, 90, 10, 80, 90, 70);
  moonGradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
  moonGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = moonGradient;
  ctx.beginPath();
  ctx.arc(80, 90, 40, 0, Math.PI * 2);
  ctx.fill();
}

function drawMountains() {
  ctx.fillStyle = "#162e55";
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - GROUND_HEIGHT - 40);
  ctx.lineTo(120, canvas.height - GROUND_HEIGHT - 160);
  ctx.lineTo(260, canvas.height - GROUND_HEIGHT - 60);
  ctx.lineTo(420, canvas.height - GROUND_HEIGHT - 180);
  ctx.lineTo(canvas.width, canvas.height - GROUND_HEIGHT - 40);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#1f3d6d";
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - GROUND_HEIGHT - 10);
  ctx.lineTo(160, canvas.height - GROUND_HEIGHT - 110);
  ctx.lineTo(320, canvas.height - GROUND_HEIGHT - 20);
  ctx.lineTo(440, canvas.height - GROUND_HEIGHT - 140);
  ctx.lineTo(canvas.width, canvas.height - GROUND_HEIGHT - 10);
  ctx.closePath();
  ctx.fill();
}

function drawClouds() {
  clouds.forEach((cloud) => {
    ctx.save();
    ctx.globalAlpha = cloud.opacity;
    const gradient = ctx.createLinearGradient(cloud.x, cloud.y, cloud.x, cloud.y + cloud.height);
    gradient.addColorStop(0, "rgba(204, 225, 255, 0.95)");
    gradient.addColorStop(1, "rgba(123, 165, 255, 0.75)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    const segments = 5;
    const segmentWidth = cloud.width / segments;
    for (let i = 0; i < segments; i += 1) {
      const cx = cloud.x + segmentWidth * (i + 0.5);
      const cy = cloud.y + cloud.height / 2;
      const radius = cloud.height / 2 + Math.sin((i / segments) * Math.PI) * 16;
      ctx.moveTo(cx + radius, cy);
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
  });
}

function drawPipes() {
  pipes.forEach((pipe) => {
    const pipeGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
    pipeGradient.addColorStop(0, "#1d8f6f");
    pipeGradient.addColorStop(0.5, "#2bc48f");
    pipeGradient.addColorStop(1, "#156853");

    ctx.fillStyle = pipeGradient;
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
    ctx.fillRect(pipe.x, pipe.bottom, PIPE_WIDTH, canvas.height - pipe.bottom - GROUND_HEIGHT);

    const lipGradient = ctx.createLinearGradient(pipe.x - 6, 0, pipe.x + PIPE_WIDTH + 6, 0);
    lipGradient.addColorStop(0, "#0f4e3f");
    lipGradient.addColorStop(1, "#29d190");

    ctx.fillStyle = lipGradient;
    ctx.fillRect(pipe.x - 6, pipe.top - 26, PIPE_WIDTH + 12, 26);
    ctx.fillRect(pipe.x - 6, pipe.bottom, PIPE_WIDTH + 12, 26);

    ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
    ctx.fillRect(pipe.x + 6, pipe.top + 10, 12, pipe.top - 20);
    ctx.fillRect(pipe.x + 6, pipe.bottom + 12, 12, canvas.height - pipe.bottom - GROUND_HEIGHT - 24);
  });
}

function drawCoins() {
  coins.forEach((coin) => {
    const pulse = Math.sin(coin.rotation * 3 + coin.seed) * 3;
    const radius = coin.radius + pulse;

    const gradient = ctx.createRadialGradient(coin.x - radius / 4, coin.y - radius / 4, radius / 4, coin.x, coin.y, radius);
    gradient.addColorStop(0, "#fff7c2");
    gradient.addColorStop(0.5, "#ffd85c");
    gradient.addColorStop(1, "#f6a000");

    ctx.save();
    ctx.translate(coin.x, coin.y);
    ctx.rotate(coin.rotation * 0.5);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius, radius * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.6, radius * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });
}

function drawBird() {
  ctx.save();
  ctx.translate(BIRD.x, BIRD.y);
  ctx.rotate((BIRD.rotation * Math.PI) / 180);

  const bodyGradient = ctx.createLinearGradient(-BIRD.radius, -BIRD.radius, BIRD.radius, BIRD.radius);
  bodyGradient.addColorStop(0, "#ffedbc");
  bodyGradient.addColorStop(0.6, "#ffb703");
  bodyGradient.addColorStop(1, "#fb8500");

  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.ellipse(0, 0, BIRD.radius + 6, BIRD.radius + 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.ellipse(-6, 4, BIRD.radius / 1.6, BIRD.radius / 2.4, 0, 0, Math.PI * 2);
  ctx.fill();

  const wingAngle = Math.sin(BIRD.wingTime * 12) * 0.5;
  ctx.save();
  ctx.rotate(wingAngle);
  ctx.fillStyle = "#f77f00";
  ctx.beginPath();
  ctx.moveTo(-12, 2);
  ctx.quadraticCurveTo(-28, 0, -20, -18);
  ctx.quadraticCurveTo(6, -10, 8, 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#fb8500";
  ctx.beginPath();
  ctx.moveTo(BIRD.radius - 2, -4);
  ctx.lineTo(BIRD.radius + 14, 0);
  ctx.lineTo(BIRD.radius - 2, 4);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(-10, -6, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#0d1b2a";
  ctx.beginPath();
  ctx.arc(-8, -6, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawGround() {
  const groundY = canvas.height - GROUND_HEIGHT;
  const groundGradient = ctx.createLinearGradient(0, groundY, 0, canvas.height);
  groundGradient.addColorStop(0, "#1a472a");
  groundGradient.addColorStop(1, "#102a16");
  ctx.fillStyle = groundGradient;
  ctx.fillRect(0, groundY, canvas.width, GROUND_HEIGHT);

  ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
  const stripeWidth = 40;
  for (let x = -stripeWidth; x < canvas.width + stripeWidth; x += stripeWidth) {
    ctx.beginPath();
    ctx.moveTo(x + groundOffset, groundY + 10);
    ctx.lineTo(x + groundOffset + stripeWidth / 2, groundY + 25);
    ctx.lineTo(x + groundOffset, groundY + 40);
    ctx.closePath();
    ctx.fill();
  }
}

function flap() {
  if (!running) return;
  BIRD.velocity = FLAP_STRENGTH;
}

function gameLoop(timestamp) {
  if (!lastTime) {
    lastTime = timestamp;
  }
  const delta = timestamp - lastTime;
  lastTime = timestamp;

  update(delta);
  draw();

  requestAnimationFrame(gameLoop);
}

function startGame() {
  resetGame();
  running = true;
  startButton.blur();
  startButton.textContent = "Restart";
}

function gameOver() {
  running = false;
  startButton.textContent = "Restart";
}

function updateScoreDisplay() {
  scoreValue.textContent = score;
  coinsValue.textContent = coinsCollected;
}

startButton.addEventListener("click", () => {
  if (!running) {
    startGame();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    if (!running) {
      startGame();
    }
    flap();
  }
});

canvas.addEventListener("pointerdown", () => {
  if (!running) {
    startGame();
  }
  flap();
});

resetGame();
requestAnimationFrame(gameLoop);
