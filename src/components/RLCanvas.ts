export function initRLCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let animId: number;
  let running = true;

  const cols = 12;
  const rows = 8;
  const goal = { x: cols - 1, y: rows - 1 };
  const agent = { x: 0, y: 0 };
  const trail: { x: number; y: number; alpha: number }[] = [];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    ctx!.scale(devicePixelRatio, devicePixelRatio);
  }

  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  function cellW() {
    return canvas.width / devicePixelRatio / cols;
  }
  function cellH() {
    return canvas.height / devicePixelRatio / rows;
  }

  function drawGrid() {
    const w = cellW();
    const h = cellH();
    ctx!.strokeStyle = "rgba(161,161,170,0.12)";
    ctx!.lineWidth = 1;
    for (let i = 0; i <= cols; i++) {
      ctx!.beginPath();
      ctx!.moveTo(i * w, 0);
      ctx!.lineTo(i * w, rows * h);
      ctx!.stroke();
    }
    for (let j = 0; j <= rows; j++) {
      ctx!.beginPath();
      ctx!.moveTo(0, j * h);
      ctx!.lineTo(cols * w, j * h);
      ctx!.stroke();
    }
  }

  function drawGoal() {
    const w = cellW();
    const h = cellH();
    ctx!.fillStyle = "rgba(6,182,212,0.15)";
    ctx!.fillRect(goal.x * w, goal.y * h, w, h);
    ctx!.strokeStyle = "rgba(6,182,212,0.4)";
    ctx!.lineWidth = 2;
    ctx!.strokeRect(goal.x * w + 1, goal.y * h + 1, w - 2, h - 2);
  }

  function drawTrail() {
    const w = cellW();
    const h = cellH();
    for (const t of trail) {
      ctx!.fillStyle = `rgba(6,182,212,${t.alpha * 0.3})`;
      ctx!.fillRect(t.x * w + 2, t.y * h + 2, w - 4, h - 4);
    }
  }

  function drawAgent() {
    const w = cellW();
    const h = cellH();
    const cx = agent.x * w + w / 2;
    const cy = agent.y * h + h / 2;
    const r = Math.min(w, h) * 0.25;

    ctx!.shadowColor = "#06B6D4";
    ctx!.shadowBlur = 12;
    ctx!.fillStyle = "#06B6D4";
    ctx!.beginPath();
    ctx!.arc(cx, cy, r, 0, Math.PI * 2);
    ctx!.fill();
    ctx!.shadowBlur = 0;
  }

  function moveAgent() {
    trail.push({ x: agent.x, y: agent.y, alpha: 1 });

    // Biased random walk toward goal
    const dx = goal.x - agent.x;
    const dy = goal.y - agent.y;

    if (dx === 0 && dy === 0) {
      // Reached goal, reset
      agent.x = 0;
      agent.y = 0;
      trail.length = 0;
      return;
    }

    const rand = Math.random();
    if (rand < 0.6) {
      // Move toward goal
      if (Math.abs(dx) > Math.abs(dy)) {
        agent.x += Math.sign(dx);
      } else {
        agent.y += Math.sign(dy);
      }
    } else {
      // Random move
      const dirs = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];
      const [mx, my] = dirs[Math.floor(Math.random() * dirs.length)];
      const nx = agent.x + mx;
      const ny = agent.y + my;
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
        agent.x = nx;
        agent.y = ny;
      }
    }

    // Fade trail
    for (let i = trail.length - 1; i >= 0; i--) {
      trail[i].alpha -= 0.04;
      if (trail[i].alpha <= 0) trail.splice(i, 1);
    }
  }

  let frameCount = 0;

  function draw() {
    if (!running) return;
    const w = canvas.width / devicePixelRatio;
    const h = canvas.height / devicePixelRatio;
    ctx!.clearRect(0, 0, w, h);
    drawGrid();
    drawGoal();
    drawTrail();
    drawAgent();

    frameCount++;
    if (frameCount % 8 === 0) {
      moveAgent();
    }

    animId = requestAnimationFrame(draw);
  }

  draw();

  return {
    stop() {
      running = false;
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    },
    start() {
      if (!running) {
        running = true;
        draw();
      }
    },
  };
}
