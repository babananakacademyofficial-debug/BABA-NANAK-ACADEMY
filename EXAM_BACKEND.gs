// ADD THIS BLOCK TO YOUR GOOGLE APPS SCRIPT Code.gs
// It creates a separate ExamResults sheet and saves official exam results.
const EXAM_SHEET_HEADERS=['Timestamp','Exam ID','Student ID','Name','Email','Course ID','Exam Type','Score','Total','Percentage','Result','Submitted At'];
function examSubmit(ss,d){
  const studentId=s(d.studentId).toUpperCase(), email=s(d.email).toLowerCase(), courseId=s(d.courseId)||'1111';
  if(!studentId||!email)throw Error('Student ID and registered email are required.');
  const v=verifyStudent(ss,{studentId,email});
  if(!v.ok)throw Error(v.message||'Student verification failed.');
  const score=Number(d.score), total=Number(d.total||10);
  if(!isFinite(score)||!isFinite(total)||total<=0||score<0||score>total)throw Error('Invalid exam score.');
  const pct=Math.round(score/total*10000)/100, result=pct>=40?'PASS':'FAIL';
  let sh=ss.getSheetByName('ExamResults');
  if(!sh)sh=ss.insertSheet('ExamResults');
  sh.getRange(1,1,1,EXAM_SHEET_HEADERS.length).setValues([EXAM_SHEET_HEADERS]);
  const examId='EXAM-'+new Date().getFullYear()+'-'+String(sh.getLastRow()).padStart(5,'0');
  sh.appendRow([new Date(),examId,studentId,v.student.name,email,courseId,s(d.examType)||'OFFICIAL EXAM',score,total,pct,result,new Date()]);
  SpreadsheetApp.flush();
  return {ok:true,examId,studentId,name:v.student.name,email,courseId,score,total,percentage:pct,result,message:'Official exam result saved.'};
}
function examResultsForStudent(ss,d){
  const studentId=s(d.studentId).toUpperCase(),email=s(d.email).toLowerCase();
  const v=verifyStudent(ss,{studentId,email});if(!v.ok)return v;
  const sh=ss.getSheetByName('ExamResults');if(!sh)return {ok:true,results:[]};
  const rows=sh.getDataRange().getValues().slice(1).filter(r=>s(r[2]).toUpperCase()===studentId);
  return {ok:true,results:rows};
}
// In doPost(), BEFORE requireAdmin(d), add:
// if(a==='examSubmit')return out(examSubmit(ss,d));
// In doGet(), add:
// else if(a==='examResults')r=examResultsForStudent(ss,{studentId:p.studentId,email:p.email});
