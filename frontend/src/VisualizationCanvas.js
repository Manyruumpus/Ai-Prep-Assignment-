// frontend/src/VisualizationCanvas.js

import React, { useRef, useEffect } from "react";

// --- Helper functions ---
function lerp(a, b, t) {
  return a + (b - a) * t;
}

function isDynamic(layer) {
  return Array.isArray(layer.animations) && layer.animations.length > 0;
}

// --- Gradient Parsing ---
function parseGradient(ctx, fill, x, y, r, w, h) {
  if (typeof fill !== "string") return fill;

  if (fill.startsWith("radial-gradient")) {
    const matches = fill.match(/radial-gradient\(([^,]+),\s*([^)]+)\)/);
    if (matches) {
      const g = ctx.createRadialGradient(
        x,
        y,
        0,
        x,
        y,
        r || Math.max(w, h) / 2
      );
      g.addColorStop(0, matches[1]);
      g.addColorStop(1, matches[2]);
      return g;
    }
  }
  if (fill.startsWith("linear-gradient")) {
    const matches = fill.match(/linear-gradient\(([^,]+),\s*([^)]+)\)/);
    if (matches) {
      const g = ctx.createLinearGradient(x, y, x, y + (h || r * 2));
      g.addColorStop(0, matches[1]);
      g.addColorStop(1, matches[2]);
      return g;
    }
  }
  return fill;
}

// --- Animation handler ---
function applyAnimationsToProps(baseProps, animations, elapsed) {
  const props = { ...baseProps };
  if (!animations) return props;
  for (const anim of animations) {
    switch (anim.property) {
      case "x": {
        if (elapsed >= anim.start && elapsed <= anim.end) {
          props.x = lerp(
            anim.from,
            anim.to,
            (elapsed - anim.start) / (anim.end - anim.start)
          );
        } else if (elapsed > anim.end) {
          props.x = anim.to;
        }
        break;
      }
      case "y": {
        if (elapsed >= anim.start && elapsed <= anim.end) {
          props.y = lerp(
            anim.from,
            anim.to,
            (elapsed - anim.start) / (anim.end - anim.start)
          );
        } else if (elapsed > anim.end) {
          props.y = anim.to;
        }
        break;
      }
      case "dx": {
        if (elapsed >= anim.start && elapsed <= anim.end) {
          props.dx = lerp(
            anim.from,
            anim.to,
            (elapsed - anim.start) / (anim.end - anim.start)
          );
        } else if (elapsed > anim.end) {
          props.dx = anim.to;
        }
        break;
      }
      case "dy": {
        if (elapsed >= anim.start && elapsed <= anim.end) {
          props.dy = lerp(
            anim.from,
            anim.to,
            (elapsed - anim.start) / (anim.end - anim.start)
          );
        } else if (elapsed > anim.end) {
          props.dy = anim.to;
        }
        break;
      }
      case "opacity": {
        if (elapsed >= anim.start && elapsed <= anim.end) {
          props.opacity = lerp(
            anim.from,
            anim.to,
            (elapsed - anim.start) / (anim.end - anim.start)
          );
        } else if (elapsed > anim.end) {
          props.opacity = anim.to;
        }
        break;
      }
      case "orbit": {
        const d = anim.duration || 3000;
        const theta = 2 * Math.PI * ((elapsed % d) / d);
        props.x = anim.centerX + anim.radius * Math.cos(theta);
        props.y = anim.centerY + anim.radius * Math.sin(theta);
        break;
      }
      default:
        break;
    }
  }
  return props;
}

// --- Drawing primitives ---
function drawCircle(ctx, props) {
  const { x, y, r, fill, opacity = 1, stroke, lineWidth = 2 } = props;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.beginPath();
  ctx.arc(Math.round(x), Math.round(y), r, 0, 2 * Math.PI);
  const style = parseGradient(ctx, fill, x, y, r);
  ctx.fillStyle = style;
  if (
    typeof style === "string" &&
    !style.startsWith("linear-gradient") &&
    !style.startsWith("radial-gradient")
  ) {
    ctx.shadowColor = style;
  } else {
    ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
  }
  ctx.shadowBlur = 15;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.shadowColor = "transparent";
    ctx.stroke();
  }
  ctx.restore();
}

function drawRect(ctx, props) {
  const {
    x, y, w, h, fill, opacity = 1, stroke, lineWidth = 2, borderRadius = 0,
  } = props;
  const r = Math.round;
  const rX = r(x);
  const rY = r(y);
  const rW = r(w);
  const rH = r(h);
  const br = Math.min(borderRadius, rW / 2, rH / 2);
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.beginPath();
  ctx.moveTo(rX + br, rY);
  ctx.lineTo(rX + rW - br, rY);
  ctx.arcTo(rX + rW, rY, rX + rW, rY + br, br);
  ctx.lineTo(rX + rW, rY + rH - br);
  ctx.arcTo(rX + rW, rY + rH, rX + rW - br, rY + rH, br);
  ctx.lineTo(rX + br, rY + rH);
  ctx.arcTo(rX, rY + rH, rX, rY + rH - br, br);
  ctx.lineTo(rX, rY + br);
  ctx.arcTo(rX, rY, rX + br, rY, br);
  ctx.closePath();
  ctx.fillStyle = parseGradient(ctx, fill, rX, rY, null, rW, rH);
  ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 5;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.shadowColor = "transparent";
    ctx.stroke();
  }
  ctx.restore();
}

function drawArrow(ctx, props) {
  const { x, y, dx, dy, color, opacity = 1, lineWidth = 4 } = props;
  const x0 = Math.round(x);
  const y0 = Math.round(y);
  const x1 = Math.round(x + dx);
  const y1 = Math.round(y + dy);
  const strokeColor = color || "#000";
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = strokeColor;
  ctx.shadowBlur = 10;
  ctx.stroke();
  const arrowLength = 14;
  const angle = Math.atan2(y1 - y0, x1 - x0);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(
    x1 - arrowLength * Math.cos(angle - Math.PI / 7),
    y1 - arrowLength * Math.sin(angle - Math.PI / 7)
  );
  ctx.moveTo(x1, y1);
  ctx.lineTo(
    x1 - arrowLength * Math.cos(angle + Math.PI / 7),
    y1 - arrowLength * Math.sin(angle + Math.PI / 7)
  );
  ctx.stroke();
  ctx.restore();
}

function drawText(ctx, props) {
  const {
    x, y, text, fill, font, opacity = 1, align = "left", baseline = "top",
  } = props;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.font = font || "18px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = fill || "#222";
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
  ctx.shadowBlur = 2;
  ctx.shadowOffsetY = 1;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawLayer(ctx, layer, elapsed) {
  const props = applyAnimationsToProps(
    { ...layer.props },
    layer.animations,
    elapsed
  );
  switch (layer.type) {
    case "circle":
      drawCircle(ctx, props);
      break;
    case "rect":
      drawRect(ctx, props);
      break;
    case "arrow":
      drawArrow(ctx, props);
      break;
    case "text":
      drawText(ctx, props);
      break;
    default:
      break;
  }
}

// --- Main visualization component ---
function VisualizationCanvas({ spec, playing }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const rafRef = useRef(null);
  const startRef = useRef(0);
  const lastDrawRef = useRef(0);
  const durationRef = useRef(0);
  const fpsIntervalRef = useRef(1000 / 30);
  const staticCanvasRef = useRef(null);
  const staticCtxRef = useRef(null);
  const staticDrawnRef = useRef(false);
  const staticLayersRef = useRef([]);
  const dynamicLayersRef = useRef([]);

  useEffect(() => {
    startRef.current = 0;
    lastDrawRef.current = 0;
    staticDrawnRef.current = false;
    if (!canvasRef.current || !spec) return;
    const canvas = canvasRef.current;
    const ctx =
      canvas.getContext("2d", { alpha: false, desynchronized: true }) ||
      canvas.getContext("2d");
    ctxRef.current = ctx;
    const dpr = window.devicePixelRatio || 1;
    const width = 500;
    const height = 400;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    const staticLayers = [];
    const dynamicLayers = [];
    for (const layer of spec.layers || []) {
      if (isDynamic(layer)) dynamicLayers.push(layer);
      else staticLayers.push(layer);
    }
    staticLayersRef.current = staticLayers;
    dynamicLayersRef.current = dynamicLayers;
    const off = document.createElement("canvas");
    off.width = Math.round(width * dpr);
    off.height = Math.round(height * dpr);
    off.style.width = `${width}px`;
    off.style.height = `${height}px`;
    const offCtx =
      off.getContext("2d", { alpha: false, desynchronized: true }) ||
      off.getContext("2d");
    offCtx.scale(dpr, dpr);
    staticCanvasRef.current = off;
    staticCtxRef.current = offCtx;
    durationRef.current = spec.duration || 4000;
    const fps = spec.fps || 30;
    fpsIntervalRef.current = 1000 / fps;
    offCtx.clearRect(0, 0, 500, 400);
    for (const layer of staticLayersRef.current) {
      drawLayer(offCtx, layer, 0);
    }
    staticDrawnRef.current = true;
  }, [spec]);

  useEffect(() => {
    if (!spec) return;
    const ctx = ctxRef.current;
    const sCanvas = staticCanvasRef.current;
    const duration = durationRef.current;
    const fpsInterval = fpsIntervalRef.current;
    const width = 500;
    const height = 400;

    if (playing) {
      startRef.current = 0;
      lastDrawRef.current = 0;
    }

    function frame(now) {
      if (!startRef.current) startRef.current = now;
      const elapsed = Math.min(now - startRef.current, duration);
      if (!lastDrawRef.current || now - lastDrawRef.current >= fpsInterval) {
        ctx.clearRect(0, 0, width, height);
        if (sCanvas && staticDrawnRef.current) {
          ctx.drawImage(
            sCanvas, 0, 0, sCanvas.width, sCanvas.height, 0, 0, width, height
          );
        }
        for (const layer of dynamicLayersRef.current) {
          drawLayer(ctx, layer, elapsed);
        }
        lastDrawRef.current = now;
      }
      if (!playing || elapsed >= duration) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        if (elapsed >= duration) {
          ctx.clearRect(0, 0, width, height);
          if (sCanvas && staticDrawnRef.current) {
            ctx.drawImage(sCanvas, 0, 0, sCanvas.width, sCanvas.height, 0, 0, width, height);
          }
          for (const layer of dynamicLayersRef.current) {
            drawLayer(ctx, layer, duration);
          }
        }
        return;
      }
      rafRef.current = requestAnimationFrame(frame);
    }

    if (playing) {
      rafRef.current = requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, width, height);
      if (sCanvas && staticDrawnRef.current) {
        ctx.drawImage(
          sCanvas, 0, 0, sCanvas.width, sCanvas.height, 0, 0, width, height
        );
      }
      for (const layer of dynamicLayersRef.current) {
        drawLayer(ctx, layer, 0);
      }
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [spec, playing]);

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={400}
      style={{
        background: "#fcfcfc",
        border: "1px solid #ccc",
        marginBottom: "8px",
        marginTop: "8px",
        display: "block",
        boxShadow: "0 2px 12px 0 #eee",
        borderRadius: "8px",
      }}
    />
  );
}

export default VisualizationCanvas;