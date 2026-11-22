const assert = require('node:assert/strict');
require('../tests/python-worker-harness.cjs');
const {all}=require('./evaluation-second.cjs');
const load = require('../tests/load-typescript.cjs');
const {checkCodeRequirements}=load('lib/code-requirements.ts');
const {runPython}=load('lib/python-runner.ts');
(async()=>{
 let count=0;
 for(const p of all){
  const req=checkCodeRequirements(p.solution,p.requirements);
  assert.equal(req.passed,true,`${p.id}: ${req.feedback}`);
  for(const t of p.cases){
   let output='';const errors=[];const input=t.input.split('\n');
   await runPython(p.solution,{output:x=>output+=x,error:x=>errors.push(x),input:async()=>input.shift()??''},{timeLimitMs:2000});
   assert.deepEqual(errors,[],p.id);
   assert.equal(output.replace(/\n$/,''),t.output,p.id);
   count++;
  }
 }
 console.log(`Verified ${all.length} solutions, all code requirements, and ${count} test cases.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
