export function initLLMCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let animId: number;
  let running = true;

  interface Token {
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
    alpha: number;
    transformed: boolean;
  }

  const tokens: Token[] = [];
  let frameCount = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    ctx!.scale(devicePixelRatio, devicePixelRatio);
  }

  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  function w() {
    return canvas.width / devicePixelRatio;
  }
  function h() {
    return canvas.height / devicePixelRatio;
  }

  function spawnToken() {
    const canvasH = h();
    tokens.push({
      x: -30,
      y: canvasH * 0.3 + Math.random() * canvasH * 0.4,
      width: 18 + Math.random() * 24,
      height: 10 + Math.random() * 6,
      speed: 0.6 + Math.random() * 0.4,
      alpha: 0.3 + Math.random() * 0.3,
      transformed: false,
    });
  }

  function drawTransformerBlock() {
    const canvasW = w();
    const canvasH = h();
    const bx = canvasW * 0.38;
    const by = canvasH * 0.2;
    const bw = canvasW * 0.24;
    const bh = canvasH * 0.6;

    // Glow
    ctx!.shadowColor = "#06B6D4";
    ctx!.shadowBlur = 20;
    ctx!.strokeStyle = "rgba(6,182,212,0.3)";
    ctx!.lineWidth = 2;
    ctx!.strokeRect(bx, by, bw, bh);
    ctx!.shadowBlur = 0;

    // Label
    ctx!.fillStyle = "rgba(6,182,212,0.25)";
    ctx!.font = "11px Inter, sans-serif";
    ctx!.textAlign = "center";
    ctx!.fillText("Transformer", bx + bw / 2, by + bh / 2 - 6);
    ctx!.fillText("Block", bx + bw / 2, by + bh / 2 + 8);

    return { bx, bw };
  }

  function drawTokens(transformerX: number, transformerW: number) {
    const midX = transformerX + transformerW / 2;
    for (const t of tokens) {
      const inTransformer = t.x > transformerX && t.x < transformerX + transformerW;

      if (inTransformer && !t.transformed) {
        t.transformed = true;
      }

      if (t.transformed) {
        ctx!.shadowColor = "#06B6D4";
        ctx!.shadowBlur = 8;
        ctx!.fillStyle = `rgba(6,182,212,${t.alpha + 0.3})`;
      } else {
        ctx!.shadowBlur = 0;
        ctx!.fillStyle = `rgba(161,161,170,${t.alpha})`;
      }

      // Rounded rect token
      const r = 3;
      ctx!.beginPath();
      ctx!.roundRect(t.x, t.y, t.width, t.height, r);
      ctx!.fill();
      ctx!.shadowBlur = 0;
    }
  }

  function updateTokens() {
    for (let i = tokens.length - 1; i >= 0; i--) {
      tokens[i].x += tokens[i].speed;
      if (tokens[i].x > w() + 40) {
        tokens.splice(i, 1);
      }
    }
  }

  function draw() {
    if (!running) return;
    ctx!.clearRect(0, 0, w(), h());

    const { bx, bw } = drawTransformerBlock();
    drawTokens(bx, bw);
    updateTokens();

    frameCount++;
    if (frameCount % 18 === 0) {
      spawnToken();
    }

    animId = requestAnimationFrame(draw);
  }

  // Seed initial tokens
  for (let i = 0; i < 5; i++) {
    spawnToken();
    tokens[tokens.length - 1].x = Math.random() * w() * 0.3;
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
