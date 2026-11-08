// Restaura a ARTE APROVADA PELO YURI nas espécies do mapa de testes: o dragão-trombeta corredor feito no Blender (blender_dragao_trombeta_cima) volta a ser a miniatura
// das espécies dragao_trombeta_corredor_domesticado e _selvagem (a reforma tinha trocado por versões procedurais). Idempotente. Rodar: node scripts/arte-aprovada.mjs
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
const raiz=path.join(path.dirname(fileURLToPath(import.meta.url)),'..'),arq=path.join(raiz,'js','mesa-sprites-3d-dados.js');
const {SPRITES_3D}=await import(pathToFileURL(arq).href+'?x='+Date.now());
const base=SPRITES_3D.blender_dragao_trombeta_cima;if(!base)throw Error('arte aprovada não encontrada');
for(const [k,nome] of [['cima_dragao_trombeta_corredor_domesticado','Dragão-trombeta corredor domesticado · arte aprovada (Blender)'],['cima_dragao_trombeta_corredor_selvagem','Dragão-trombeta corredor selvagem · arte aprovada (Blender)']])SPRITES_3D[k]={...structuredClone(base),nome,aprovadaV205:true};
const cab=fs.readFileSync(arq,'utf8').split('\n')[0];
fs.writeFileSync(arq,(cab.startsWith('//')?cab+'\n':'')+'export const SPRITES_3D='+JSON.stringify(SPRITES_3D)+';\n');console.log('arte aprovada restaurada nos dois dragões corredores');
