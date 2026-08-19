const SHEET_ID = '1vlJodWTnj5TvaO7fkVbteeJ0Hb5WP2Ta-MINeFA3Wks';
const API_SECRET = 'BNA_SECRET_2026_CHANGE_THIS';

const SHEETS = {
  Students: ['Timestamp','Student ID','Name','Email','Phone','DOB','Address','Status'],
  Enrollments: ['Timestamp','Student ID','Course ID','Course','Subjects','Enrollment Status','Payment Status'],
  Payments: ['Timestamp','Student ID','Course ID','Course','Amount','Payment ID','Order ID','Payment Status'],
  Results: ['Timestamp','Student ID','Name','Course ID','Course','Subject','Score','Total','Percentage','Result','Exam ID'],
  Certificates: ['Timestamp','Student ID','Name','Course ID','Course','Certificate No','Grade','Issued At','Verification URL']
};

function setupSheets() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  Object.keys(SHEETS).forEach(function(name) {
    let sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) sh.getRange(1,1,1,SHEETS[name].length).setValues([SHEETS[name]]);
    sh.setFrozenRows(1);
  });
  return response({ok:true,message:'Sheets ready.'});
}

function doGet(e) {
  return response({ok:true,service:'Baba Nanak Academy API',status:'online'});
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) return response({ok:false,message:'No request data received.'});
    const body = JSON.parse(e.postData.contents);
    const event = body.event;
    const data = body.data || {};
    const publicEvents = ['registration','verifyStudent','enrollment'];
    if (!publicEvents.includes(event) && body.secret !== API_SECRET) return response({ok:false,message:'Unauthorized request.'});
    const ss = SpreadsheetApp.openById(SHEET_ID);
    switch(event) {
      case 'registration': return response(registerStudent(ss,data));
      case 'verifyStudent': return response(verifyStudent(ss,data));
      case 'enrollment': saveEnrollment(ss,data); break;
      case 'payment': savePayment(ss,data); break;
      case 'result': saveResult(ss,data); break;
      case 'certificate': saveCertificate(ss,data); break;
      default: return response({ok:false,message:'Unknown event: '+event});
    }
    return response({ok:true,event:event,message:'Data saved successfully.'});
  } catch (error) { return response({ok:false,message:String(error.message || error)}); }
}

function registerStudent(ss,data) {
  const name = String(data.name || '').trim();
  const email = String(data.email || '').trim().toLowerCase();
  const phone = String(data.phone || '').trim();
  if (!name) throw new Error('Full Name is required.');
  if (!/^[6-9][0-9]{9}$/.test(phone)) throw new Error('Invalid mobile number. Enter exactly 10 digits starting with 6-9.');
  if (!email || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
  const sh = getSheet(ss,'Students');
  const rows = sh.getDataRange().getValues();
  for (let i=1;i<rows.length;i++) {
    const oldEmail=String(rows[i][3]||'').trim().toLowerCase();
    const oldPhone=String(rows[i][4]||'').trim();
    if (oldEmail===email) throw new Error('This email is already registered.');
    if (oldPhone===phone) throw new Error('This mobile number is already registered.');
  }
  const studentId = nextStudentId(sh);
  sh.appendRow([new Date(),studentId,name,email,phone,data.dob||'',String(data.address||'').trim(),'Registered']);
  return {ok:true,event:'registration',studentId:studentId,message:'Registration successful.'};
}

function nextStudentId(sh) {
  const year = new Date().getFullYear();
  const prefix = 'BNA'+year;
  const last = sh.getLastRow();
  if (last < 2) return prefix+'00001';
  const ids = sh.getRange(2,2,last-1,1).getValues().flat();
  let max=0;
  ids.forEach(function(id){ const m=String(id).match(new RegExp('^'+prefix+'(\\d{5})$')); if(m) max=Math.max(max,Number(m[1])); });
  return prefix+String(max+1).padStart(5,'0');
}

function verifyStudent(ss,data) {
  const studentId = String(data.studentId || '').trim();
  const email = String(data.email || '').trim().toLowerCase();
  if (!studentId || !email) throw new Error('Student ID and registered email are required.');
  const sh=getSheet(ss,'Students');
  const rows=sh.getDataRange().getValues();
  for(let i=1;i<rows.length;i++) {
    if(String(rows[i][1]||'').trim()===studentId && String(rows[i][3]||'').trim().toLowerCase()===email && String(rows[i][7]||'')==='Registered') return {ok:true,message:'Student verified.',studentId:studentId};
  }
  return {ok:false,message:'Student not found. Please register first.'};
}

function saveEnrollment(ss,data) {
  const sh=getSheet(ss,'Enrollments');
  sh.appendRow([new Date(),data.studentId||'',data.courseId||'',data.course||'',data.subjects||'',data.enrollmentStatus||'Pending',data.paymentStatus||'Pending']);
}
function savePayment(ss,data) {
  const sh=getSheet(ss,'Payments');
  sh.appendRow([new Date(),data.studentId||'',data.courseId||'',data.course||'',data.amount||0,data.paymentId||'',data.orderId||'',data.paymentStatus||'Paid']);
}
function saveResult(ss,data) {
  const sh=getSheet(ss,'Results');
  const percentage=data.percentage!==undefined?data.percentage:calculatePercentage(data.score,data.total);
  const result=(data.passed===true||data.passed==='true')?'PASS':'FAIL';
  sh.appendRow([new Date(),data.studentId||'',data.name||'',data.courseId||'',data.course||'',data.subject||'Final Exam',data.score||0,data.total||0,percentage,result,data.examId||'']);
}
function saveCertificate(ss,data) {
  const sh=getSheet(ss,'Certificates');
  sh.appendRow([new Date(),data.studentId||'',data.name||'',data.courseId||'',data.course||'',data.certificateNo||'',data.grade||'',data.issuedAt||new Date(),data.verificationUrl||'']);
}
function getSheet(ss,name) {
  let sh=ss.getSheetByName(name);
  if(!sh){sh=ss.insertSheet(name);sh.getRange(1,1,1,SHEETS[name].length).setValues([SHEETS[name]]);sh.setFrozenRows(1);}
  return sh;
}
function calculatePercentage(score,total){score=Number(score||0);total=Number(total||0);return total>0?Math.round((score/total)*10000)/100:0;}
function response(data){return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);}
