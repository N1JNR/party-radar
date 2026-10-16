import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Modo de renderização por rota.
 *
 * - Telas do app (com PO UI) renderizam no navegador: o PO UI acessa `document`
 *   diretamente e não é seguro no servidor.
 * - Páginas públicas para compartilhar (perfil público, card do Wrapped) entram aqui
 *   com RenderMode.Server, sem componentes do PO UI, para o link ter prévia no
 *   WhatsApp e no Discord.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
