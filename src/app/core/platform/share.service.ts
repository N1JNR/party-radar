import { DOCUMENT, Injectable, inject } from '@angular/core';

/** O que aconteceu com a imagem: foi para o aparelho, foi baixada ou a pessoa desistiu. */
export type ShareResult = 'shared' | 'downloaded' | 'cancelled';

/** Tempo para o navegador começar a baixar antes de soltar a imagem da memória. */
const RELEASE_AFTER_MS = 1000;

/**
 * Compartilhar uma imagem. Fica em `core/platform/` para trocar pelo plugin do Capacitor no futuro
 * (AGENTS.md, seção 4).
 */
@Injectable({ providedIn: 'root' })
export class ShareService {
  private readonly document = inject(DOCUMENT);

  /** Abre o compartilhamento do aparelho quando ele aceita arquivos; senão, baixa a imagem. */
  async shareImage(image: Blob, fileName: string, title: string): Promise<ShareResult> {
    const navigator = this.document.defaultView?.navigator;
    const file = new File([image], fileName, { type: image.type });
    if (navigator?.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title });
        return 'shared';
      } catch (error) {
        if ((error as DOMException).name === 'AbortError') {
          return 'cancelled';
        }
        // O aparelho recusou (por exemplo, sem permissão): a imagem ainda pode ser baixada.
      }
    }
    this.download(image, fileName);
    return 'downloaded';
  }

  private download(image: Blob, fileName: string): void {
    const url = URL.createObjectURL(image);
    const link = this.document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), RELEASE_AFTER_MS);
  }
}
