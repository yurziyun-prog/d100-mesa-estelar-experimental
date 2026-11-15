const {execFileSync,spawnSync}=require('node:child_process');
const crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),site='https://d100-mesa-estelar-experimental.pages.dev';
const sha=process.argv[2]||execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const branch='chatgpt-tres-mapas-correcoes-v224';
async function json(url){const r=await fetch(url,{headers:{'User-Agent':'Orla-publication-check','Cache-Control':'no-cache'}});if(!r.ok)throw Error(url+': HTTP '+r.status);return r.json();}
(async()=>{
 const checks=await json('https://api.github.com/repos/yurziyun-prog/d100-mesa-estelar-experimental/commits/'+sha+'/check-runs');
 const check=checks.check_runs.find(c=>c.name==='Cloudflare Pages');
 if(!check||check.status!=='completed'||check.conclusion!=='success')throw Error('Deploy não confirmado: '+JSON.stringify(check&&{status:check.status,conclusion:check.conclusion}));
 const manifest=await json(site+'/publication.json?verify='+sha+'-'+Date.now());
 if(manifest.commit!==sha||manifest.branch!==branch)throw Error('Domínio público ainda não corresponde ao commit/branch esperado: '+JSON.stringify(manifest));
 const r=await fetch(site+'/orla/index.html?verify='+sha,{cache:'no-store'});
 if(!r.ok)throw Error('Orla HTTP '+r.status);
 const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
 const remote=hash(Buffer.from(await r.arrayBuffer()));
 const committed=execFileSync('git',['show',sha+':orla/index.html'],{cwd:root});
 if(remote!==manifest.orlaLoaderSha256||remote!==hash(committed))throw Error('Carregador publicado difere do commit validado');
 const result=spawnSync(process.execPath,['scripts/check-orla-startup.cjs'],{cwd:root,env:{...process.env,PUBLICATION_URL:site},stdio:'inherit'});
 if(result.status!==0)throw Error('Orla publicada não passou no teste de abertura');
 console.log('PUBLICAÇÃO CONFIRMADA',branch,sha,site,check.details_url);
})().catch(e=>{console.error(e.message);process.exitCode=1;});
