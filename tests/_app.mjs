// O app.js agora é montado das partes em js/app/ (ver scripts/montar.cjs). Os testes leem a montagem.
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
export const lerApp=()=>require('../scripts/montar.cjs').montarApp(new URL('..',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
