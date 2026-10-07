const assert = require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {createRequire}=require('node:module');
const path=require('node:path');
const ts=require('typescript');
const {all}=require('./evaluation-second.cjs');
function load(relative){
 const filename=path.resolve(__dirname,'..',relative);
 const compiled=ts.transpileModule(readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const mod={exports:{}};new Function('require','module','exports',compiled)(createRequire(filename),mod,mod.exports);return mod.exports;
}
const {checkCodeRequirements}=load('lib/code-requirements.ts');
const {runPythonWithSkulpt}=load('lib/skulpt-runner.ts');
(async()=>{
 let count=0;
 for(const p of all){
  const req=checkCodeRequirements(p.solution,p.requirements);
  assert.equal(req.passed,true,`${p.id}: ${req.feedback}`);
  for(const t of p.cases){
   let output='';const errors=[];const input=t.input.split('\n');
   await runPythonWithSkulpt(p.solution,{output:x=>output+=x,error:x=>errors.push(x),input:async()=>input.shift()??''},{timeLimitMs:2000});
   assert.deepEqual(errors,[],p.id);
   assert.equal(output.replace(/\n$/,''),t.output,p.id);
   count++;
  }
 }
 console.log(`Verified ${all.length} solutions, all code requirements, and ${count} test cases.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
