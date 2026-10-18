import { describe, expect, it } from 'vitest';
import { buscarCatalogo, CATALOGO } from '../../src/domain/catalogo';
import { montarGuia, TEXTO_GENERICO } from '../../src/domain/guia';
import { CATEGORIAS } from '../../src/domain/tipos';
import { sub } from './fixtures';

describe('catálogo', () => {
  it('US-01.CA1: "net" encontra Netflix sem diferenciar caixa; acentos ignorados', () => {
    expect(buscarCatalogo('net').map((s) => s.nome)).toContain('Netflix');
    expect(buscarCatalogo('NET').map((s) => s.nome)).toContain('Netflix');
    expect(buscarCatalogo('deezer')).toHaveLength(1);
    expect(buscarCatalogo('méli').map((s) => s.id)).toContain('meli-plus');
  });
  it('US-01.CA2: Spotify tem R$ 21,90 mensal, Música', () => {
    const s = CATALOGO.find((x) => x.nome === 'Spotify')!;
    expect([s.valorCentavos, s.ciclo, s.categoria]).toEqual([2190, 'mensal', 'Música']);
  });
  it('Catálogo: 18 serviços e categorias válidas', () => {
    expect(CATALOGO).toHaveLength(18);
    for (const s of CATALOGO) expect(CATEGORIAS).toContain(s.categoria);
  });
});

describe('guia', () => {
  it('US-06.CA1: serviço do catálogo mostra o texto do catálogo e a observação da loja', () => {
    const g = montarGuia(sub({ catalogoId: 'netflix' }));
    expect(g.servico).toBe('No site ou app: Conta > Assinatura > Cancelar assinatura.');
    expect(g.lojaApps).toBeTruthy();
  });
  it('US-06.CA2: Pix cita o banco informado', () => {
    const g = montarGuia(sub({ pagamento: 'pix', banco: 'Itaú' }));
    expect(g.pix).toContain('no app do Itaú');
    expect(g.pix).toContain('revogue a autorização deste recebedor');
  });
  it('US-06.CA3: cadastro livre sem Pix mostra o texto genérico', () => {
    expect(montarGuia(sub()).servico).toBe(TEXTO_GENERICO);
  });
  it('US-06.CA4: nenhum texto tem URL, e-mail ou telefone', () => {
    const textos = CATALOGO.flatMap((s) => {
      const g = montarGuia(sub({ catalogoId: s.id, pagamento: 'pix', banco: 'Nubank' }));
      return [g.servico, g.lojaApps, g.pix, g.avisoFinal];
    }).join(' ');
    expect(textos).not.toMatch(/https?:|www\.|@|\.com|\d{4}[- ]?\d{4}/);
  });
  it('US-06.CA5: informa que o app não cancela automaticamente', () => {
    expect(montarGuia(sub()).avisoFinal).toMatch(/não cancela nada automaticamente/);
  });
});
