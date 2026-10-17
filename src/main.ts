// Ponto de entrada: carrega os dados do aparelho e inicia a interface.
import './styles.css';
import { carregar } from './armazenamento';
import { iniciarEstado } from './loja';
import { iniciarApp } from './ui/app';

const carga = carregar();
if (carga.tipo === 'ok') iniciarEstado(carga.estado);

iniciarApp(document.getElementById('app')!);
