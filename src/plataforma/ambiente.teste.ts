// Ambiente de TESTE (só no build `npm run build:teste`, VITE_MODO=teste). O provedor é sempre o falso
// (US-12.CA16) e os testes E2E o controlam por localStorage ou por window.__mensalaoTeste.
import { CONTROLE_PADRAO, ID_PROVEDOR_FALSO, ProvedorFalso, configurarControle, lerChamadas, lerControle, type ControleProvedorFalso } from './falso';
import type { ProvedorCompra } from './provedor';

export const MODO_BUILD = 'teste' as const;

export function criarProvedor(): ProvedorCompra {
  return new ProvedorFalso();
}

/** Expõe os controles do provedor falso no console/Playwright (só existe no build de teste). */
export function instalarControlesTeste(): void {
  (window as unknown as Record<string, unknown>).__mensalaoTeste = {
    id: ID_PROVEDOR_FALSO,
    provedor: {
      padrao: CONTROLE_PADRAO,
      ler: lerControle,
      configurar: (parcial: Partial<ControleProvedorFalso>) => configurarControle(parcial),
      chamadas: lerChamadas,
    },
  };
}
