import { DOCUMENT, Injectable, inject } from '@angular/core';

import { formatHours, gamesLabel } from '../domain/player-card';
import { RADAR_CENTER, RADAR_RADIUS, RadarSummary } from '../domain/player-radar';
import {
  BODY,
  COLORS,
  CONTENT_WIDTH,
  HEADING,
  HEIGHT,
  PADDING,
  WIDTH,
  drawHeader,
  fitText,
  renderPng,
  useTitleFont,
} from './canvas-image';

/** Onde o radar fica na imagem e quanto ele cresce em relação ao da tela. */
const RADAR_X = WIDTH / 2;
const RADAR_Y = 690;
const RADAR_SCALE = 1.7;

const NO_TITLE = 'Seu radar';
const TOP_GAME_WIDTH = 480;

const toImage = (value: number, center: number) => center + (value - RADAR_CENTER) * RADAR_SCALE;

function drawRadar(context: CanvasRenderingContext2D, summary: RadarSummary): void {
  const radius = RADAR_RADIUS * RADAR_SCALE;
  context.fillStyle = COLORS.disc;
  context.beginPath();
  context.arc(RADAR_X, RADAR_Y, radius, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = COLORS.line;
  context.lineWidth = 2;
  for (const step of [0.25, 0.5, 0.75, 1]) {
    context.beginPath();
    context.arc(RADAR_X, RADAR_Y, radius * step, 0, Math.PI * 2);
    context.stroke();
  }
  for (const axis of summary.axes) {
    context.beginPath();
    context.moveTo(RADAR_X, RADAR_Y);
    context.lineTo(toImage(axis.x, RADAR_X), toImage(axis.y, RADAR_Y));
    context.stroke();
  }

  context.beginPath();
  for (const axis of summary.axes) {
    context.lineTo(toImage(axis.px, RADAR_X), toImage(axis.py, RADAR_Y));
  }
  context.closePath();
  context.fillStyle = COLORS.shape;
  context.globalAlpha = 0.4;
  context.fill();
  context.globalAlpha = 1;
  context.strokeStyle = COLORS.shape;
  context.lineWidth = 5;
  context.lineJoin = 'round';
  context.stroke();

  context.fillStyle = COLORS.text;
  context.font = `600 30px ${BODY}`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  for (const axis of summary.axes) {
    context.fillText(axis.label, toImage(axis.lx, RADAR_X), toImage(axis.ly, RADAR_Y));
  }
}

/** Só o @usuário e os dados de jogo: nunca SteamID, e-mail nem login da Steam (spec 004, CA15). */
function draw(context: CanvasRenderingContext2D, summary: RadarSummary): void {
  drawHeader(context, summary.username);

  const title = summary.title ?? NO_TITLE;
  context.fillStyle = COLORS.title;
  useTitleFont(context, title);
  context.fillText(fitText(context, title, CONTENT_WIDTH), PADDING, PADDING + 150);

  drawRadar(context, summary);

  const bottom = HEIGHT - PADDING;
  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';
  context.fillStyle = COLORS.text;
  context.font = `700 96px ${HEADING}`;
  context.fillText(formatHours(summary.hours), PADDING, bottom - 44);
  context.font = `500 28px ${BODY}`;
  context.fillText(`em ${gamesLabel(summary.games)}`, PADDING, bottom);

  if (summary.top) {
    const right = WIDTH - PADDING;
    context.textAlign = 'right';
    context.font = `600 40px ${HEADING}`;
    context.fillText(fitText(context, summary.top.name, TOP_GAME_WIDTH), right, bottom - 44);
    context.font = `500 28px ${BODY}`;
    context.fillText(`o jogo da vida: ${formatHours(summary.top.totalHours)}`, right, bottom);
  }
}

/** Desenha a imagem do radar num canvas, sem ida ao servidor (spec 004, CA14). */
@Injectable({ providedIn: 'root' })
export class RadarImageService {
  private readonly document = inject(DOCUMENT);

  /** Gera o PNG. Rejeita se o navegador não conseguir desenhar (CA16). */
  create(summary: RadarSummary): Promise<Blob> {
    return renderPng(this.document, (context) => draw(context, summary));
  }
}
