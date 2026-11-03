/** Base das imagens de compartilhar (specs 004 e 005): tamanho, cores, fontes e geração do PNG. */
export const WIDTH = 1080;
export const HEIGHT = 1350;
export const PADDING = 80;
export const CONTENT_WIDTH = WIDTH - PADDING * 2;

/** Cores do tema (`src/theme/party-radar.theme.ts`); no canvas não há variável de CSS. */
export const COLORS = {
  background: '#24168A',
  text: '#F5F8FA',
  title: '#FBBF24',
  disc: '#0E1117',
  line: '#30363D',
  shape: '#22D3EE',
};

export const HEADING = '"Chakra Petch", sans-serif';
export const BODY = 'Manrope, sans-serif';
const FONTS = [
  '700 112px "Chakra Petch"',
  '600 40px "Chakra Petch"',
  '600 32px Manrope',
  '500 28px Manrope',
];

const MIN_TITLE_SIZE = 56;
const MAX_TITLE_SIZE = 112;

/** Escolhe a maior fonte em que o título cabe na largura da imagem. */
export function useTitleFont(context: CanvasRenderingContext2D, title: string): void {
  let size = MAX_TITLE_SIZE;
  context.font = `700 ${size}px ${HEADING}`;
  while (size > MIN_TITLE_SIZE && context.measureText(title).width > CONTENT_WIDTH) {
    size -= 4;
    context.font = `700 ${size}px ${HEADING}`;
  }
}

/** Corta o texto com reticências para caber na largura; usa a fonte já escolhida no contexto. */
export function fitText(context: CanvasRenderingContext2D, text: string, width: number): string {
  if (context.measureText(text).width <= width) {
    return text;
  }
  let cut = text;
  while (cut.length > 1 && context.measureText(`${cut}…`).width > width) {
    cut = cut.slice(0, -1);
  }
  return `${cut.trimEnd()}…`;
}

/** Fundo e linha do @usuário, iguais nas duas imagens. Só o @usuário: nunca SteamID nem e-mail. */
export function drawHeader(context: CanvasRenderingContext2D, username: string): void {
  context.fillStyle = COLORS.background;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';
  context.fillStyle = COLORS.text;
  context.font = `600 32px ${BODY}`;
  context.fillText(
    fitText(context, `@${username} no Party Radar`, CONTENT_WIDTH),
    PADDING,
    PADDING + 32,
  );
}

/** Gera o PNG (1080 × 1350). Rejeita se o navegador não conseguir desenhar. */
export async function renderPng(
  document: Document,
  draw: (context: CanvasRenderingContext2D) => void,
): Promise<Blob> {
  // Sem as fontes do tema, a imagem sai com a fonte do sistema; ainda é melhor que não sair.
  await Promise.all(FONTS.map((font) => document.fonts.load(font))).catch(() => undefined);

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas indisponível.');
  }
  draw(context);
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
