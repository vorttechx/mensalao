// US-17 / US-19.CA5 — Temas de cor (design 2.3). Aplicados por atributo data-tema no <html> (só variáveis CSS mudam).
import { temaEfetivo, type IdTema } from '../domain/preferencias';
import { obterPrefs } from '../servicos/preferencias';
import { ehPro } from '../servicos/pro';

export interface InfoTema {
  id: IdTema;
  nome: string;
  /** Prévia (design 3.10): papel e marca no claro e no escuro. */
  claro: [string, string];
  escuro: [string, string];
  /** Cor do navegador (meta theme-color) no claro e no escuro: o papel do tema (design 2.3, UX-S3-09). */
  corNavegador: [string, string];
}

export const TEMAS_INFO: InfoTema[] = [
  { id: 'verde-cedula', nome: 'Verde-cédula (padrão)', claro: ['#FFFFFF', '#1D5C3F'], escuro: ['#0F1512', '#7FCBA2'], corNavegador: ['#FFFFFF', '#0F1512'] },
  { id: 'azul-noite', nome: 'Azul-noite', claro: ['#FFFFFF', '#1F4E8C'], escuro: ['#0E1320', '#8FB4F0'], corNavegador: ['#FFFFFF', '#0E1320'] },
  { id: 'grafite', nome: 'Grafite', claro: ['#FFFFFF', '#2F3B47'], escuro: ['#121212', '#C5CFD9'], corNavegador: ['#FFFFFF', '#121212'] },
  { id: 'ameixa', nome: 'Ameixa', claro: ['#FFFFFF', '#7A2E62'], escuro: ['#160F14', '#EBA6D4'], corNavegador: ['#FFFFFF', '#160F14'] },
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
