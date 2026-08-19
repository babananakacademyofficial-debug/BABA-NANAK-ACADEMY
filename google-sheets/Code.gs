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
  return out({ok:true,message:'Baba Nanak Academy sheets ready'});
}

function doPost(e){
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const event = String(body.event || '');
    const d = body.data || {};

    if (event === 'registration' && body.public === true) return publicRegistration(d);
    if (event === 'enrollment' && body.public === true) return publicEnrollment(d);

    if (!API_SECRET || body.secret !== API_SECRET) return out({ok:false,message:'Unauthorized'});

    const ss = SpreadsheetApp.openById(SHEET_ID);
    if(event === 'enrollment') append(ss,'Enrollments',[new Date(),d.studentId,d.courseId,d.course,d.subjects||'',d.enrollmentStatus||'pending',d.paymentStatus||'pending']);
    else if(event === 'payment') append(ss,'Payments',[new Date(),d.studentId,d.courseId,d.course,d.amount||0,d.paymentId||'',d.orderId||'',d.paymentStatus||'paid']);
    else if(event === 'result') append(ss,'Results',[new Date(),d.studentId,d.name,d.courseId,d.course,d.subject||'Final Exam',d.score||0,d.total||0,d.percentage||0,d.passed?'PASS':'FAIL',d.examId||'']);
    else if(event === 'certificate') append(ss,'Certificates',[new Date(),d.studentId,d.name,d.courseId,d.course,d.certificateNo,d.grade,d.issuedAt||new Date(),d.verificationUrl||'']);
    else return out({ok:false,message:'Unknown event: '+event});
    return out({ok:true,event});
  } catch(err) { return out({ok:false,message:String(err)}); }
}

function publicRegistration(d) {
  const name = clean(d.name,100);
  const email = clean(d.email,160).toLowerCase();
  const phone = clean(d.phone,30);
  const dob = clean(d.dob,30);
  const address = clean(d.address,300);
  if (!name || !email || !phone) return out({ok:false,message:'Name, email and phone are required.'});
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return out({ok:false,message:'Please enter a valid email address.'});
  if (String(d.website || '').trim() !== '') return out({ok:false,message:'Registration rejected.'});
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = getSheet(ss,'Students');
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const emails = sheet.getRange(2,4,lastRow-1,1).getValues().flat().map(String).map(x=>x.toLowerCase().trim());
    if (emails.includes(email)) return out({ok:false,message:'A student with this email is already registered.'});
  }
  const studentId = createStudentId();
  sheet.appendRow([new Date(),studentId,name,email,phone,dob,address,'Registered']);
  return out({ok:true,event:'registration',studentId,message:'Registration successful.'});
}

function publicEnrollment(d) {
  const studentId = clean(d.studentId,40);
  const email = clean(d.email,160).toLowerCase();
  const courseId = clean(d.courseId,20);
  const course = clean(d.course,160);
  const subjects = clean(d.subjects,1000);
  if (!studentId || !email || !courseId || !course) return out({ok:false,message:'Student ID, email and course are required.'});
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const students = getSheet(ss,'Students');
  const rows = students.getDataRange().getValues();
  let valid = false;
  for (let i=1;i<rows.length;i++) {
    if (String(rows[i][1]).trim() === studentId && String(rows[i][3]).trim().toLowerCase() === email) { valid = true; break; }
  }
  if (!valid) return out({ok:false,message:'Student ID and email do not match a registered student.'});
  const enrollments = getSheet(ss,'Enrollments');
  enrollments.appendRow([new Date(),studentId,courseId,course,subjects,'Selected','Pending']);
  return out({ok:true,event:'enrollment',message:'Course selected successfully.'});
}

function createStudentId() {
  const now = new Date();
  const stamp = Utilities.formatDate(now, Session.getScriptTimeZone() || 'Asia/Kolkata', 'yyyyMMddHHmmss');
  const random = Math.floor(100 + Math.random()*900);
  return 'BNA' + stamp + random;
}

function clean(value,max) { return String(value == null ? '' : value).trim().slice(0,max); }
function doGet(){ return out({ok:true,service:'Baba Nanak Academy Google Sheets API',status:'online'}); }
function getSheet(ss,name){ let sh=ss.getSheetByName(name); if(!sh){sh=ss.insertSheet(name);sh.getRange(1,1,1,HEADERS[name].length).setValues([HEADERS[name]]);sh.setFrozenRows(1);} return sh; }
function append(ss,name,row){ getSheet(ss,name).appendRow(row); }
function out(obj){ return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
