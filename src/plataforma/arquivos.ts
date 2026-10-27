// Entrega de arquivo pelo navegador (download por link com blob local, sem rede). Usado no desenvolvimento
// no navegador e no build de teste (o Playwright espera o evento de download).
import type { ResultadoArquivo, SalvadorArquivos } from './provedor';

export class SalvadorNavegador implements SalvadorArquivos {
  async salvar(nome: string, conteudo: string, tipoMime: string): Promise<ResultadoArquivo> {
    try {
      const url = URL.createObjectURL(new Blob([conteudo], { type: tipoMime }));
      const a = document.createElement('a');
      a.href = url;
      a.download = nome;
      a.hidden = true;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return 'ok';
    } catch {
      return 'erro';
    }
  }
}
