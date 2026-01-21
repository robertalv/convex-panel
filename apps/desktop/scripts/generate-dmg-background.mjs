/**
 * DMG Background Generator for Convex Panel
 *
 * This script generates a custom DMG background image that matches
 * the GradientBackground component style used in the app.
 *
 * Usage: node scripts/generate-dmg-background.mjs
 *
 * Requirements: npm install canvas
 */

import { createCanvas } from "canvas";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// DMG window size is 660x400, we create 2x for retina
const WIDTH = 1320;
const HEIGHT = 800;

// Icon positions - from tauri.conf.json, doubled for retina
// Note: Finder positions icons from below the title bar
// Title bar is ~22px, so we add offset (22 * 2 = 44)
const TITLE_BAR_OFFSET = 44;
const APP_X = 360; // 180 * 2
const APP_Y = 400 + TITLE_BAR_OFFSET; // 200 * 2 + title bar offset
const APPLICATIONS_X = 960; // 480 * 2
const APPLICATIONS_Y = 400 + TITLE_BAR_OFFSET; // 200 * 2 + title bar offset

// Colors matching gradient-background.tsx
const BACKGROUND_COLOR = "#0a0a0b"; // Dark background
const BLUE_ACCENT_1 = "rgba(99, 168, 248, 0.04)";
const BLUE_ACCENT_2 = "rgba(177, 202, 240, 0.03)";
const BLUE_ACCENT_3 = "rgba(99, 168, 248, 0.02)";
const GRID_COLOR = "rgba(255, 255, 255, 0.05)";
const ARROW_COLOR = "rgba(255, 255, 255, 0.4)";
const TEXT_COLOR = "rgba(255, 255, 255, 0.6)";

function generateDmgBackground() {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  // Fill background
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Add radial gradient layers (matching gradient-background.tsx)

  // Top center ellipse gradient
  const gradient1 = ctx.createRadialGradient(
    WIDTH / 2,
    -HEIGHT * 0.2,
    0,
    WIDTH / 2,
    -HEIGHT * 0.2,
    WIDTH * 0.8,
  );
  gradient1.addColorStop(0, "rgba(99, 168, 248, 0.06)");
  gradient1.addColorStop(1, "transparent");
  ctx.fillStyle = gradient1;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Right side ellipse gradient
  const gradient2 = ctx.createRadialGradient(
    WIDTH,
    HEIGHT / 2,
    0,
    WIDTH,
    HEIGHT / 2,
    WIDTH * 0.6,
  );
  gradient2.addColorStop(0, "rgba(177, 202, 240, 0.04)");
  gradient2.addColorStop(1, "transparent");
  ctx.fillStyle = gradient2;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Left side ellipse gradient
  const gradient3 = ctx.createRadialGradient(
    0,
    HEIGHT / 2,
    0,
    0,
    HEIGHT / 2,
    WIDTH * 0.6,
  );
  gradient3.addColorStop(0, "rgba(99, 168, 248, 0.03)");
  gradient3.addColorStop(1, "transparent");
  ctx.fillStyle = gradient3;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Animated orb effect - top right (static for DMG)
  const orb1 = ctx.createRadialGradient(
    WIDTH + 64,
    -64,
    0,
    WIDTH + 64,
    -64,
    384,
  );
  orb1.addColorStop(0, "rgba(99, 168, 248, 0.08)");
  orb1.addColorStop(0.7, "transparent");
  ctx.fillStyle = orb1;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Animated orb effect - bottom left (static for DMG)
  const orb2 = ctx.createRadialGradient(
    -64,
    HEIGHT + 64,
    0,
    -64,
    HEIGHT + 64,
    320,
  );
  orb2.addColorStop(0, "rgba(177, 202, 240, 0.06)");
  orb2.addColorStop(0.7, "transparent");
  ctx.fillStyle = orb2;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Draw grid pattern
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = 1;

  const gridSize = 40; // Smaller grid cells

  // Create radial fade mask for grid
  for (let x = 0; x <= WIDTH; x += gridSize) {
    for (let y = 0; y <= HEIGHT; y += gridSize) {
      // Calculate distance from center for fade effect
      const dx = x - WIDTH / 2;
      const dy = y - HEIGHT / 2;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = Math.sqrt((WIDTH / 2) ** 2 + (HEIGHT / 2) ** 2);
      const opacity = Math.max(0, 1 - (distance / maxDistance) * 1.2) * 0.03;

      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + gridSize, y);
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + gridSize);
      ctx.stroke();
    }
  }

  // Draw arrow between app and Applications folder positions
  const arrowStartX = APP_X + 80; // After app icon
  const arrowEndX = APPLICATIONS_X - 80; // Before Applications folder
  const arrowY = APP_Y - 20; // Slightly above center of icons

  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Arrow line
  ctx.beginPath();
  ctx.moveTo(arrowStartX, arrowY);
  ctx.lineTo(arrowEndX - 10, arrowY);
  ctx.stroke();

  // Arrow head
  ctx.beginPath();
  ctx.moveTo(arrowEndX - 20, arrowY - 8);
  ctx.lineTo(arrowEndX - 10, arrowY);
  ctx.lineTo(arrowEndX - 20, arrowY + 8);
  ctx.stroke();

  // Add subtle text labels
  ctx.font = "16px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.textAlign = "center";

  // "Drag to install" text above arrow
  ctx.fillText(
    "Drag to Applications",
    (APP_X + APPLICATIONS_X) / 2,
    arrowY - 25,
  );

  // Add corner plus symbols (matching gradient-background.tsx)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
  ctx.lineWidth = 1;

  const plusSize = 16;
  const plusPadding = 24;

  // Top-left plus
  drawPlus(ctx, plusPadding, plusPadding, plusSize);

  // Top-right plus
  drawPlus(ctx, WIDTH - plusPadding, plusPadding, plusSize);

  // Bottom-left plus
  drawPlus(ctx, plusPadding, HEIGHT - plusPadding, plusSize);

  // Bottom-right plus
  drawPlus(ctx, WIDTH - plusPadding, HEIGHT - plusPadding, plusSize);

  // Save the image
  const outputPath = join(__dirname, "..", "src-tauri", "dmg-background.png");
  const buffer = canvas.toBuffer("image/png");
  writeFileSync(outputPath, buffer);

  console.log(`DMG background generated: ${outputPath}`);
  console.log(
    `Size: ${WIDTH}x${HEIGHT} (2x retina for ${WIDTH / 2}x${HEIGHT / 2} window)`,
  );
}

function drawPlus(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y - size / 2);
  ctx.lineTo(x, y + size / 2);
  ctx.moveTo(x - size / 2, y);
  ctx.lineTo(x + size / 2, y);
  ctx.stroke();
}

// Run the generator
generateDmgBackground();
