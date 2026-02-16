export function initParallelismCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let animId: number;
  let running = true;

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

  interface Packet {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    alpha: number;
    phase: "scatter" | "gather";
  }

  const packets: Packet[] = [];
  let frameCount = 0;

  // 4 GPU nodes arranged in a 2x2 grid
  function gpuPositions() {
    const cw = w();
    const ch = h();
    const gw = cw * 0.18;
    const gh = ch * 0.22;
    const cx = cw / 2;
    const cy = ch / 2;
    const gapX = cw * 0.14;
    const gapY = ch * 0.14;
    return [
      { x: cx - gapX - gw / 2, y: cy - gapY - gh / 2, w: gw, h: gh },
      { x: cx + gapX - gw / 2, y: cy - gapY - gh / 2, w: gw, h: gh },
      { x: cx - gapX - gw / 2, y: cy + gapY - gh / 2, w: gw, h: gh },
      { x: cx + gapX - gw / 2, y: cy + gapY - gh / 2, w: gw, h: gh },
    ];
  }

  function drawGPUs() {
    const gpus = gpuPositions();
    for (let i = 0; i < gpus.length; i++) {
      const g = gpus[i];
      ctx!.strokeStyle = "rgba(6,182,212,0.25)";
      ctx!.lineWidth = 1.5;
      ctx!.strokeRect(g.x, g.y, g.w, g.h);

      // Shard bars inside each GPU
      const barH = g.h * 0.12;
      const barY = g.y + g.h * 0.3;
      for (let j = 0; j < 3; j++) {
        const opacity = 0.08 + j * 0.06;
        ctx!.fillStyle = `rgba(6,182,212,${opacity})`;
        ctx!.fillRect(
          g.x + g.w * 0.12,
          barY + j * (barH + 4),
          g.w * 0.76,
          barH
        );
      }

      // Label
      ctx!.fillStyle = "rgba(161,161,170,0.5)";
      ctx!.font = "10px Inter, sans-serif";
      ctx!.textAlign = "center";
      ctx!.fillText(`GPU ${i}`, g.x + g.w / 2, g.y + g.h - 6);
    }
  }

  function drawConnections() {
    const gpus = gpuPositions();
    ctx!.strokeStyle = "rgba(82,82,91,0.2)";
    ctx!.lineWidth = 1;
    ctx!.setLineDash([3, 4]);
    // Horizontal
    ctx!.beginPath();
    ctx!.moveTo(gpus[0].x + gpus[0].w, gpus[0].y + gpus[0].h / 2);
    ctx!.lineTo(gpus[1].x, gpus[1].y + gpus[1].h / 2);
    ctx!.stroke();
    ctx!.beginPath();
    ctx!.moveTo(gpus[2].x + gpus[2].w, gpus[2].y + gpus[2].h / 2);
    ctx!.lineTo(gpus[3].x, gpus[3].y + gpus[3].h / 2);
    ctx!.stroke();
    // Vertical
    ctx!.beginPath();
    ctx!.moveTo(gpus[0].x + gpus[0].w / 2, gpus[0].y + gpus[0].h);
    ctx!.lineTo(gpus[2].x + gpus[2].w / 2, gpus[2].y);
    ctx!.stroke();
    ctx!.beginPath();
    ctx!.moveTo(gpus[1].x + gpus[1].w / 2, gpus[1].y + gpus[1].h);
    ctx!.lineTo(gpus[3].x + gpus[3].w / 2, gpus[3].y);
    ctx!.stroke();
    ctx!.setLineDash([]);
  }

  function spawnPackets() {
    const gpus = gpuPositions();
    // Pick a random source GPU, send a packet to each other GPU
    const src = Math.floor(Math.random() * 4);
    for (let i = 0; i < 4; i++) {
      if (i === src) continue;
      packets.push({
        x: gpus[src].x + gpus[src].w / 2,
        y: gpus[src].y + gpus[src].h / 2,
        targetX: gpus[i].x + gpus[i].w / 2,
        targetY: gpus[i].y + gpus[i].h / 2,
        alpha: 1,
        phase: "scatter",
      });
    }
  }

  function drawPackets() {
    for (let i = packets.length - 1; i >= 0; i--) {
      const p = packets[i];
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 2) {
        packets.splice(i, 1);
        continue;
      }

      const speed = 1.5;
      p.x += (dx / dist) * speed;
      p.y += (dy / dist) * speed;
      p.alpha = Math.max(0.3, dist / 200);

      ctx!.shadowColor = "#06B6D4";
      ctx!.shadowBlur = 6;
      ctx!.fillStyle = `rgba(6,182,212,${p.alpha})`;
      ctx!.beginPath();
      ctx!.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.shadowBlur = 0;
    }
  }

  function draw() {
    if (!running) return;
    ctx!.clearRect(0, 0, w(), h());

    drawConnections();
    drawGPUs();
    drawPackets();

    frameCount++;
    if (frameCount % 60 === 0) {
      spawnPackets();
    }

    animId = requestAnimationFrame(draw);
  }

  // Seed initial packets
  spawnPackets();
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
