const {execFileSync}=require('node:child_process');
function result(runs,sha){
 const run=runs.filter(r=>r.head_sha===sha&&r.head_branch==='chatgpt-tres-mapas-correcoes-v224'&&r.event==='push'&&r.path==='.github/workflows/publication-checks.yml').sort((a,b)=>b.id-a.id)[0];
 if(!run||run.status!=='completed')return 'pending';
 return run.conclusion==='success'?'success':'failure';
}
async function main(){
 const sha=process.env.CF_PAGES_COMMIT_SHA||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 for(let attempt=0;attempt<10;attempt++){
  const response=await fetch('https://api.github.com/repos/yurziyun-prog/d100-mesa-estelar-experimental/actions/runs?head_sha='+sha+'&event=push&per_page=20',{headers:{'User-Agent':'Orla-publication-gate','Cache-Control':'no-cache'}});
  if(!response.ok)throw Error('Não foi possível confirmar testes: HTTP '+response.status);
  const state=result((await response.json()).workflow_runs,sha);
  if(state==='success'){console.log('Testes obrigatórios aprovados no GitHub para '+sha);return;}
  if(state==='failure')throw Error('Testes GitHub reprovados; publicação bloqueada para '+sha);
  console.log('Aguardando testes GitHub do commit '+sha);
  await new Promise(resolve=>setTimeout(resolve,45000));
 }
 throw Error('Testes não confirmados no prazo; publicação bloqueada.');
}
module.exports={result};
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1;});
