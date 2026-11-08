// Mesa Estelar — servidor local de pré-visualização (não é usado no deploy).
//
// Uso: npm run dev [-- --host 0.0.0.0 --port 7100]
//
// Serve a pasta do projeto como site estático. O js/app.js não existe em disco
// (o app fica nas partes de js/app/); aqui ele é montado na hora, como no deploy,
// sem criar o arquivo solto que faria a publicação parar.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { montarApp } = require('./montar.cjs');

const root = path.resolve(__dirname, '..');

function arg(nome, padrao) {
  const i = process.argv.indexOf('--' + nome);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : padrao;
}
const host = arg('host', '0.0.0.0');
const port = Number(arg('port', 7100));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.csv': 'text/csv; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

const server = http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';

    // O app montado a partir de js/app/NN-*.js (idêntico ao publicado).
    if (urlPath === '/js/app.js') {
      res.writeHead(200, { 'Content-Type': MIME['.js'], 'Cache-Control': 'no-cache' });
      res.end(montarApp(root));
      return;
    }

    const file = path.normalize(path.join(root, urlPath));
    if (!file.startsWith(root)) { res.writeHead(403); res.end('Proibido'); return; }
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end('Não encontrado: ' + urlPath); return; }

    const tipo = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': tipo, 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  } catch (erro) {
    res.writeHead(500);
    res.end('Erro: ' + erro.message);
  }
});

server.listen(port, host, () => {
  console.log(`Mesa Estelar — pré-visualização em http://localhost:${port}/`);
});
