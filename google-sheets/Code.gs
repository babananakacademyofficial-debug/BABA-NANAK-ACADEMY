const SHEET_ID = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
const API_SECRET = PropertiesService.getScriptProperties().getProperty('API_SECRET');

const HEADERS = {
  Students: ['Timestamp','Student ID','Name','Email','Phone','DOB','Address','Status'],
  Enrollments: ['Timestamp','Student ID','Course ID','Course','Subjects','Enrollment Status','Payment Status'],
  Payments: ['Timestamp','Student ID','Course ID','Course','Amount','Payment ID','Order ID','Payment Status'],
  Results: ['Timestamp','Student ID','Name','Course ID','Course','Subject','Score','Total','Percentage','Result','Exam ID'],
  Certificates: ['Timestamp','Student ID','Name','Course ID','Course','Certificate No','Grade','Issued At','Verification URL']
};

function setupSheets(){
  const ss = SpreadsheetApp.openById(SHEET_ID);
  Object.keys(HEADERS).forEach(name => {
    let sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) sh.appendRow(HEADERS[name]);
    else sh.getRange(1,1,1,HEADERS[name].length).setValues([HEADERS[name]]);
    sh.setFrozenRows(1);
  });
  return ContentService.createTextOutput(JSON.stringify({ok:true,message:'Baba Nanak Academy sheets ready'})).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e){
  try{
    const body = JSON.parse(e.postData.contents || '{}');
    if (API_SECRET && body.secret !== API_SECRET) return out({ok:false,message:'Unauthorized'});
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const event = String(body.event || '');
    const d = body.data || {};
    const now = new Date();
    if(event === 'registration') append(ss,'Students',[now,d.studentId,d.name,d.email,d.phone||'',d.dob||'',d.address||'','Registered']);
    if(event === 'enrollment') append(ss,'Enrollments',[now,d.studentId,d.courseId,d.course,d.subjects||'',d.enrollmentStatus||'pending',d.paymentStatus||'pending']);
    if(event === 'payment') append(ss,'Payments',[now,d.studentId,d.courseId,d.course,d.amount||0,d.paymentId||'',d.orderId||'',d.paymentStatus||'paid']);
    if(event === 'result') append(ss,'Results',[now,d.studentId,d.name,d.courseId,d.course,d.subject||'Final Exam',d.score||0,d.total||0,d.percentage||0,d.passed?'PASS':'FAIL',d.examId||'']);
    if(event === 'certificate') append(ss,'Certificates',[now,d.studentId,d.name,d.courseId,d.course,d.certificateNo,d.grade,d.issuedAt||now,d.verificationUrl||'']);
    return out({ok:true,event});
  }catch(err){ return out({ok:false,message:String(err)}); }
}

function doGet(){ return out({ok:true,service:'Baba Nanak Academy Google Sheets API'}); }
function append(ss,name,row){ const sh=ss.getSheetByName(name)||ss.insertSheet(name); if(sh.getLastRow()===0) sh.appendRow(HEADERS[name]); sh.appendRow(row); }
function out(obj){ return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
