import { DOCUMENT, Injectable, inject } from '@angular/core';

import { formatHours, gamesLabel } from '../domain/player-card';
import { RADAR_CENTER, RADAR_RADIUS, RadarSummary } from '../domain/player-radar';

const WIDTH = 1080;
const HEIGHT = 1350;
const PADDING = 80;
const CONTENT_WIDTH = WIDTH - PADDING * 2;

/** Onde o radar fica na imagem e quanto ele cresce em relação ao da tela. */
const RADAR_X = WIDTH / 2;
const RADAR_Y = 690;
const RADAR_SCALE = 1.7;

/** Cores do tema (`src/theme/party-radar.theme.ts`); no canvas não há variável de CSS. */
const COLORS = {
  background: '#24168A',
  text: '#F5F8FA',
  title: '#FBBF24',
  disc: '#0E1117',
  line: '#30363D',
  shape: '#22D3EE',
};

const HEADING = '"Chakra Petch", sans-serif';
const BODY = 'Manrope, sans-serif';
const FONTS = ['700 112px "Chakra Petch"', '600 40px "Chakra Petch"', '600 32px Manrope'];

const NO_TITLE = 'Seu radar';
const MIN_TITLE_SIZE = 56;
const MAX_TITLE_SIZE = 112;
const TOP_GAME_WIDTH = 480;

const toImage = (value: number, center: number) => center + (value - RADAR_CENTER) * RADAR_SCALE;

/** Maior fonte em que o título cabe na largura da imagem. */
function titleFont(context: CanvasRenderingContext2D, title: string): string {
  let size = MAX_TITLE_SIZE;
  context.font = `700 ${size}px ${HEADING}`;
  while (size > MIN_TITLE_SIZE && context.measureText(title).width > CONTENT_WIDTH) {
    size -= 4;
    context.font = `700 ${size}px ${HEADING}`;
  }
  return context.font;
}

/** Corta o texto com reticências para caber na largura; usa a fonte já escolhida no contexto. */
function fitText(context: CanvasRenderingContext2D, text: string, width: number): string {
  if (context.measureText(text).width <= width) {
    return text;
  }
  let cut = text;
  while (cut.length > 1 && context.measureText(`${cut}…`).width > width) {
    cut = cut.slice(0, -1);
  }
  return `${cut.trimEnd()}…`;
}

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
  context.fillStyle = COLORS.background;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';
  context.fillStyle = COLORS.text;
  context.font = `600 32px ${BODY}`;
  context.fillText(
    fitText(context, `@${summary.username} no Party Radar`, CONTENT_WIDTH),
    PADDING,
    PADDING + 32,
  );

  const title = summary.title ?? NO_TITLE;
  context.fillStyle = COLORS.title;
  context.font = titleFont(context, title);
  context.fillText(fitText(context, title, CONTENT_WIDTH), PADDING, PADDING + 150);

  drawRadar(context, summary);

  const bottom = HEIGHT - PADDING;
  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';
  context.fillStyle = COLORS.text;
  context.font = `700 96px ${HEADING}`;
  // Na imagem, horas inteiras: "788h 12min" não cabe ao lado do jogo principal.
  context.fillText(formatHours(Math.round(summary.hours)), PADDING, bottom - 44);
  context.font = `500 28px ${BODY}`;
  context.fillText(`em ${gamesLabel(summary.games)}`, PADDING, bottom);

  if (summary.top) {
    const right = WIDTH - PADDING;
    context.textAlign = 'right';
    context.font = `600 40px ${HEADING}`;
    context.fillText(fitText(context, summary.top.name, TOP_GAME_WIDTH), right, bottom - 44);
    context.font = `500 28px ${BODY}`;
    const topHours = formatHours(Math.round(summary.top.totalHours));
    context.fillText(`o jogo da vida: ${topHours}`, right, bottom);
  }
}

/** Desenha a imagem de compartilhar num canvas, sem ida ao servidor (spec 004, CA14). */
@Injectable({ providedIn: 'root' })
export class RadarImageService {
  private readonly document = inject(DOCUMENT);

  /** Gera o PNG (1080 × 1350). Rejeita se o navegador não conseguir desenhar (CA16). */
  async create(summary: RadarSummary): Promise<Blob> {
    // Sem as fontes do tema, a imagem sai com a fonte do sistema; ainda é melhor que não sair.
    await Promise.all(FONTS.map((font) => this.document.fonts.load(font))).catch(() => undefined);

    const canvas = this.document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas indisponível.');
    }
    draw(context, summary);
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Não deu para gerar o PNG.'));
        }
      }, 'image/png');
    });
  }
}
