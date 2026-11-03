import { DOCUMENT, Injectable, inject } from '@angular/core';

import { PATENTES, patenteById } from '../domain/patentes';
import { formatHours } from '../domain/player-card';
import { SeasonImage, seasonImageStatus } from '../domain/season';
import {
  BODY,
  COLORS,
  CONTENT_WIDTH,
  HEADING,
  PADDING,
  WIDTH,
  drawHeader,
  fitText,
  renderPng,
  useTitleFont,
} from './canvas-image';

const TRACK_Y = 380;
const MARK_SIZE = 26;
const CURRENT_MARK_SIZE = 42;

function drawMark(context: CanvasRenderingContext2D, x: number, size: number): void {
  context.beginPath();
  context.moveTo(x, TRACK_Y - size);
  context.lineTo(x + size, TRACK_Y);
  context.lineTo(x, TRACK_Y + size);
  context.lineTo(x - size, TRACK_Y);
  context.closePath();
}

/** A trilha das 6 patentes, como na tela: até a atual, cheia; depois dela, só o contorno. */
function drawTrack(context: CanvasRenderingContext2D, rankId: string): void {
  const reached = PATENTES.indexOf(patenteById(rankId));
  const gap = (WIDTH - PADDING * 2 - CURRENT_MARK_SIZE * 2) / (PATENTES.length - 1);
  const xOf = (index: number) => PADDING + CURRENT_MARK_SIZE + gap * index;

  context.lineWidth = 8;
  context.strokeStyle = COLORS.line;
  context.beginPath();
  context.moveTo(xOf(0), TRACK_Y);
  context.lineTo(xOf(PATENTES.length - 1), TRACK_Y);
  context.stroke();
  context.strokeStyle = COLORS.title;
  context.beginPath();
  context.moveTo(xOf(0), TRACK_Y);
  context.lineTo(xOf(reached), TRACK_Y);
  context.stroke();

  context.lineWidth = 4;
  PATENTES.forEach((_patente, index) => {
    drawMark(context, xOf(index), index === reached ? CURRENT_MARK_SIZE : MARK_SIZE);
    context.fillStyle = index <= reached ? COLORS.title : COLORS.background;
    context.fill();
    context.strokeStyle = index <= reached ? COLORS.title : COLORS.text;
    context.stroke();
  });
}

/** Só o @usuário e os dados de jogo, como na imagem do radar (spec 005, CA13). */
function draw(context: CanvasRenderingContext2D, image: SeasonImage): void {
  drawHeader(context, image.username);

  context.fillStyle = COLORS.text;
  context.font = `600 40px ${HEADING}`;
  context.fillText(`Temporada ${image.season}`, PADDING, PADDING + 130);

  drawTrack(context, image.rankId);

  const rank = patenteById(image.rankId).name;
  context.textAlign = 'left';
  context.fillStyle = COLORS.title;
  useTitleFont(context, rank);
  context.fillText(fitText(context, rank, CONTENT_WIDTH), PADDING, 660);

  context.fillStyle = COLORS.text;
  context.font = `700 200px ${HEADING}`;
  context.fillText(formatHours(image.hours), PADDING, 930);
  context.font = `500 28px ${BODY}`;
  context.fillText('na temporada, somando todos os jogos', PADDING, 985);

  if (image.topGame) {
    context.font = `600 40px ${HEADING}`;
    context.fillText(fitText(context, image.topGame, CONTENT_WIDTH), PADDING, 1130);
    context.font = `500 28px ${BODY}`;
    context.fillText('o jogo principal da temporada', PADDING, 1175);
  }

  context.font = `600 32px ${BODY}`;
  context.fillText(seasonImageStatus(image), PADDING, 1270);
}

/** Desenha a imagem da temporada ou do troféu num canvas, sem ida ao servidor (spec 005, CA13). */
@Injectable({ providedIn: 'root' })
export class SeasonImageService {
  private readonly document = inject(DOCUMENT);

  /** Gera o PNG. Rejeita se o navegador não conseguir desenhar (spec 004, CA16). */
  create(image: SeasonImage): Promise<Blob> {
    return renderPng(this.document, (context) => draw(context, image));
  }
}
