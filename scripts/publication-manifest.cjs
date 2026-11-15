const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const commit=process.env.CF_PAGES_COMMIT_SHA||git('rev-parse','HEAD');
const branch=process.env.CF_PAGES_BRANCH||git('branch','--show-current');
const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'orla/index.html'))).digest('hex');
fs.writeFileSync(path.join(root,'dist/publication.json'),JSON.stringify({commit,branch,orlaLoaderSha256:hash,builtAt:new Date().toISOString()},null,2)+'\n');
