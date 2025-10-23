const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("start-button");
const scoreValue = document.getElementById("score-value");

const GRAVITY = 0.4;
const FLAP_STRENGTH = -7;
const PIPE_GAP = 160;
const PIPE_WIDTH = 80;
const PIPE_INTERVAL = 1400;

const BIRD = {
  x: 120,
  y: canvas.height / 2,
  radius: 20,
  velocity: 0,
  rotation: 0,
};

let pipes = [];
let score = 0;
let running = false;
let lastTime = 0;
let pipeTimer = 0;

function resetGame() {
  BIRD.y = canvas.height / 2;
  BIRD.velocity = 0;
  BIRD.rotation = 0;
  pipes = [];
  score = 0;
  scoreValue.textContent = score;
  pipeTimer = 0;
  lastTime = 0;
}

function spawnPipe() {
  const minPipeHeight = 60;
  const maxPipeHeight = canvas.height - PIPE_GAP - minPipeHeight;
  const topHeight = minPipeHeight + Math.random() * (maxPipeHeight - minPipeHeight);
  pipes.push({
    x: canvas.width,
    top: topHeight,
    bottom: topHeight + PIPE_GAP,
    scored: false,
  });
}

function update(delta) {
  if (!running) return;

  BIRD.velocity += GRAVITY;
  BIRD.y += BIRD.velocity;
  BIRD.rotation = Math.min((BIRD.velocity / 10) * 45, 90);

  if (BIRD.y + BIRD.radius > canvas.height) {
    BIRD.y = canvas.height - BIRD.radius;
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
    pipe.x -= delta * 0.2 * 60; // Normalizes to ~60 FPS movement

    if (!pipe.scored && pipe.x + PIPE_WIDTH < BIRD.x) {
      pipe.scored = true;
      score += 1;
      scoreValue.textContent = score;
    }
  });

  pipes = pipes.filter((pipe) => pipe.x + PIPE_WIDTH > 0);

  if (checkCollisions()) {
    gameOver();
  }
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

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawPipes();
  drawBird();
}

function drawBackground() {
  const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  skyGradient.addColorStop(0, "#87ceeb");
  skyGradient.addColorStop(1, "#d9f0ff");
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#38b000";
  ctx.fillRect(0, canvas.height - 80, canvas.width, 80);

  ctx.fillStyle = "#6a994e";
  for (let i = 0; i < canvas.width; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, canvas.height - 80);
    ctx.lineTo(i + 20, canvas.height - 120);
    ctx.lineTo(i + 40, canvas.height - 80);
    ctx.closePath();
    ctx.fill();
  }
}

function drawPipes() {
  pipes.forEach((pipe) => {
    ctx.fillStyle = "#2a9d8f";

    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
    ctx.fillRect(pipe.x, pipe.bottom, PIPE_WIDTH, canvas.height - pipe.bottom);

    ctx.fillStyle = "#264653";
    ctx.fillRect(pipe.x - 4, pipe.top - 24, PIPE_WIDTH + 8, 24);
    ctx.fillRect(pipe.x - 4, pipe.bottom, PIPE_WIDTH + 8, 24);
  });
}

function drawBird() {
  ctx.save();
  ctx.translate(BIRD.x, BIRD.y);
  ctx.rotate((BIRD.rotation * Math.PI) / 180);

  ctx.fillStyle = "#ffb703";
  ctx.beginPath();
  ctx.ellipse(0, 0, BIRD.radius + 4, BIRD.radius, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fb8500";
  ctx.beginPath();
  ctx.moveTo(BIRD.radius - 5, -5);
  ctx.lineTo(BIRD.radius + 10, 0);
  ctx.lineTo(BIRD.radius - 5, 5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(-8, -6, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#023047";
  ctx.beginPath();
  ctx.arc(-5, -6, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
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
}

function gameOver() {
  running = false;
  startButton.textContent = "Restart";
}

startButton.addEventListener("click", () => {
  if (!running) {
    startButton.textContent = "Restart";
    startGame();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    if (!running) {
      startButton.textContent = "Restart";
      startGame();
    }
    flap();
  }
});

canvas.addEventListener("pointerdown", () => {
  if (!running) {
    startButton.textContent = "Restart";
    startGame();
  }
  flap();
});

resetGame();
requestAnimationFrame(gameLoop);
