// US-17 — Temas de cor (design 7.3). Aplicados por atributo data-tema no <html> (só variáveis CSS mudam).
import { temaEfetivo, type IdTema } from '../domain/preferencias';
import { obterPrefs } from '../servicos/preferencias';
import { ehPro } from '../servicos/pro';

export interface InfoTema {
  id: IdTema;
  nome: string;
  /** Prévia: fundo, primária e superfície no claro e no escuro. */
  claro: [string, string, string];
  escuro: [string, string, string];
  /** Cor do navegador (meta theme-color) no claro e no escuro (US-17.CA8). */
  corNavegador: [string, string];
}

export const TEMAS_INFO: InfoTema[] = [
  { id: 'verde-cedula', nome: 'Verde-cédula (padrão)', claro: ['#F5F8F6', '#0B6B47', '#FFFFFF'], escuro: ['#0E1A15', '#5FD4A0', '#16261F'], corNavegador: ['#0B6B47', '#0E1A15'] },
  { id: 'azul-noite', nome: 'Azul-noite', claro: ['#F4F6FA', '#1F4E8C', '#FFFFFF'], escuro: ['#0D1424', '#8DB8FF', '#152037'], corNavegador: ['#1F4E8C', '#0D1424'] },
  { id: 'grafite', nome: 'Grafite', claro: ['#F5F5F4', '#34495E', '#FFFFFF'], escuro: ['#121212', '#C9D3DD', '#1C1C1E'], corNavegador: ['#34495E', '#121212'] },
  { id: 'ameixa', nome: 'Ameixa', claro: ['#F8F5F7', '#7A2E62', '#FFFFFF'], escuro: ['#170F15', '#F0A8D8', '#221820'], corNavegador: ['#7A2E62', '#170F15'] },
];

export function infoTema(id: IdTema): InfoTema {
  return TEMAS_INFO.find((t) => t.id === id) ?? TEMAS_INFO[0];
}

/** Nome curto (sem "(padrão)") para o banner "Tema X aplicado.". */
export function nomeCurto(id: IdTema): string {
  return infoTema(id).nome.replace(' (padrão)', '');
}

/** Aplica o tema efetivo (o escolhido no Pro; o padrão no grátis, sem apagar a escolha). */
export function aplicarTema(): void {
  const id = temaEfetivo(obterPrefs(), ehPro());
  const raiz = document.documentElement;
  if (id === 'verde-cedula') delete raiz.dataset.tema;
  else raiz.dataset.tema = id;
  const info = infoTema(id);
  const metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
  metas.forEach((m) => {
    const escuro = (m.getAttribute('media') ?? '').includes('dark');
    m.content = escuro ? info.corNavegador[1] : info.corNavegador[0];
  });
}
