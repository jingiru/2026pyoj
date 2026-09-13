const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('fs');
const source=fs.readFileSync('app/page.tsx','utf8');
const block=source.slice(source.indexOf('  const overviewBookRows = useMemo'),source.indexOf('  const overviewStats = useMemo'));
const compute=new Function('overviewStudent','books','problems','overviewSubmissions','overviewSubmissionByProblem','getStudentClassId','groupProblems','useMemo',block+';return overviewBookRows;');
test('student overview includes all class publications and counts 64 attempts on 40 problems',()=>{
 const student={id:'s',student_no:'2301'};
 const problems=Array.from({length:40},(_,i)=>({id:'p'+i,bookId:'a',order:i}));
 problems.push({id:'q',bookId:'b',order:0,visibilityScope:'classes',visibleClassIds:['3']},{id:'hidden',bookId:'c',order:0,visibilityScope:'classes',visibleClassIds:['4']},{id:'private',bookId:'a',isPublished:false});
 const submissions=Array.from({length:64},(_,i)=>({student_id:'s',problem_id:'p'+(i%40),status:'accepted'}));submissions.push({student_id:'s',problem_id:'q',status:'wrong_answer'});
 const rows=compute(student,[{id:'a'},{id:'b'},{id:'c'},{id:'d',isPublished:false}],problems,submissions,new Map(submissions.map(s=>[s.problem_id,s])),()=> '3',()=>[],fn=>fn());
 assert.deepEqual(rows.map(r=>r.book.id),['a','b']);assert.equal(rows[0].submissionCount,64);assert.equal(rows[0].submitted,40);assert.equal(rows[0].submittedProgress,100);assert.equal(rows[1].wrongProblems.length,1);
});
