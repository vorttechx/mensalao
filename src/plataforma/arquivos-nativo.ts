// US-24.CA11 — Entrega de arquivo no app Android: grava no cache do app e abre a folha de compartilhar do
// Android (salvar no Drive, nos Arquivos, enviar por e-mail...). O arquivo não sai do aparelho sem a pessoa escolher.
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import type { ResultadoArquivo, SalvadorArquivos } from './provedor';

export class SalvadorNativo implements SalvadorArquivos {
  async salvar(nome: string, conteudo: string): Promise<ResultadoArquivo> {
    let uri: string;
    try {
      const r = await Filesystem.writeFile({ path: nome, data: conteudo, directory: Directory.Cache, encoding: Encoding.UTF8 });
      uri = r.uri;
    } catch {
      return 'erro';
    }
    try {
      await Share.share({ title: nome, files: [uri], dialogTitle: 'Salvar ou enviar o arquivo' });
      return 'ok';
    } catch (e) {
      // Folha fechada sem escolher destino: não é erro (design 15.6), e nada foi entregue.
      return /cancel/i.test(e instanceof Error ? e.message : String(e)) ? 'cancelado' : 'erro';
    }
  }
}
