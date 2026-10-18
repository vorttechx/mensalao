// US-12.CA14 — Verifica que o provedor de compra FALSO e os controles de teste não estão no build de
// produção (dist/) e que estão no build de teste (dist-teste/). Falha (código 1) se algo estiver errado.
// Uso: npm run verificar:bundle (gera os dois builds e roda esta verificação)
//      node scripts/verificar-provedor-falso.mjs [pasta-producao] [pasta-teste]
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Identificadores que só existem no código de teste (src/plataforma/falso.ts e ambiente.teste.ts).
const MARCADORES = ['provedor-falso-mensalao', 'mensalao:teste:provedor', '__mensalaoTeste'];
const EXTENSOES = /\.(js|mjs|cjs|html|json|webmanifest|map|txt)$/;

const [pastaProducao = 'dist', pastaTeste = 'dist-teste'] = process.argv.slice(2);

function arquivos(dir) {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    return statSync(caminho).isDirectory() ? arquivos(caminho) : [caminho];
  });
}

/** Devolve { marcador: [arquivos] } com o que foi encontrado na pasta. */
function procurar(dir) {
  const achados = {};
  for (const arq of arquivos(dir).filter((a) => EXTENSOES.test(a))) {
    const texto = readFileSync(arq, 'utf8');
    for (const m of MARCADORES) if (texto.includes(m)) (achados[m] ??= []).push(arq);
  }
  return achados;
}

let falhou = false;
for (const [dir, nome] of [[pastaProducao, 'produção'], [pastaTeste, 'teste']]) {
  if (!existsSync(dir)) {
    console.error(`ERRO: a pasta do build de ${nome} (${dir}/) não existe. Rode "npm run build" e "npm run build:teste".`);
    falhou = true;
  }
}
if (falhou) process.exit(1);

const prod = procurar(pastaProducao);
if (Object.keys(prod).length > 0) {
  falhou = true;
  console.error(`ERRO: o build de produção (${pastaProducao}/) contém o provedor falso ou controles de teste:`);
  for (const [m, arqs] of Object.entries(prod)) console.error(`  "${m}" em ${arqs.join(', ')}`);
} else {
  console.log(`OK: ${pastaProducao}/ (produção) não contém o provedor falso nem controles de teste.`);
}

const teste = procurar(pastaTeste);
const faltando = MARCADORES.filter((m) => !teste[m]);
if (faltando.length > 0) {
  falhou = true;
  console.error(`ERRO: o build de teste (${pastaTeste}/) deveria conter o provedor falso, mas faltam: ${faltando.join(', ')}`);
} else {
  console.log(`OK: ${pastaTeste}/ (teste) contém o provedor falso e os controles de teste.`);
}

process.exit(falhou ? 1 : 0);
