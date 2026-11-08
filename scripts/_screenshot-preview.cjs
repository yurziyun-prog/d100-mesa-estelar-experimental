// Capturas de tela da pré-visualização (uso local temporário).
const { chromium } = require('C:/Users/yurzi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  });
  const erros = [];

  // Desktop — tela de login
  let ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  let page = await ctx.newPage();
  page.on('pageerror', e => erros.push('pageerror: ' + e.message));
  await page.goto('http://localhost:7100/', { waitUntil: 'networkidle' }).catch(e => erros.push('goto: ' + e.message));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'docs/imagens/v190-tema-login-desktop.png' });

  // Desktop — aba Ficha (após "login" não há sessão, mas a tela de login é o que renderiza sem Firebase;
  // forçamos a visão do app para conferir o tema das abas)
  await page.evaluate(() => {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appScreen').classList.remove('hidden');
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'docs/imagens/v190-tema-app-desktop.png' });
  await ctx.close();

  // Mobile 390px — tela de login
  ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  page = await ctx.newPage();
  await page.goto('http://localhost:7100/', { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'docs/imagens/v190-tema-login-mobile.png' });
  // sem rolagem lateral?
  const scrollX = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log('scroll horizontal mobile (px):', scrollX);
  await ctx.close();

  await browser.close();
  console.log('erros de página:', erros.length ? erros.join('\n') : 'nenhum');
})().catch(e => { console.error('FALHOU:', e.message); process.exit(1); });
