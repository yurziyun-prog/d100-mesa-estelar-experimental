import test from 'node:test';
import assert from 'node:assert/strict';
import gate from '../scripts/await-publication-checks.cjs';
const valid={id:1,head_sha:'abc',head_branch:'chatgpt-tres-mapas-correcoes-v224',event:'push',path:'.github/workflows/publication-checks.yml',status:'completed',conclusion:'success'};
test('publicação exige aprovação do commit, branch e workflow exatos',()=>{
 assert.equal(gate.result([valid],'abc'),'success');
 for(const override of [{head_sha:'old'},{head_branch:'main'},{event:'pull_request'},{path:'other.yml'}])assert.equal(gate.result([{...valid,...override}],'abc'),'pending');
});
test('falha, cancelamento e nova execução pendente bloqueiam publicação',()=>{
 for(const conclusion of ['failure','cancelled','skipped','timed_out'])assert.equal(gate.result([{...valid,conclusion}],'abc'),'failure');
 assert.equal(gate.result([valid,{...valid,id:2,status:'in_progress',conclusion:null}],'abc'),'pending');
});
