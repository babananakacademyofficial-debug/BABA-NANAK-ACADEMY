const SHEET_ID = '1vlJodWTnj5TvaO7fkVbteeJ0Hb5WP2Ta-MINeFA3Wks';
const API_SECRET = 'BNA_SECRET_2026_CHANGE_THIS';

const SHEETS = {
  Students: ['Timestamp','Student ID','Name','Email','Phone','DOB','Address','Status'],
  Enrollments: ['Timestamp','Student ID','Course ID','Course','Subjects','Enrollment Status','Payment Status'],
  Payments: ['Timestamp','Student ID','Course ID','Course','Amount','Payment ID','Order ID','Payment Status'],
  Results: ['Timestamp','Student ID','Name','Course ID','Course','Subject','Score','Total','Percentage','Result','Exam ID'],
  Certificates: ['Timestamp','Student ID','Name','Course ID','Course','Certificate No','Grade','Issued At','Verification URL']
};

function text(v) {
  return v === null || v === undefined ? '' : String(v);
}

function clean(v) {
  return text(v).trim();
}

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
    if (!e || !e.postData || !e.postData.contents) {
      return response({ok:false,message:'No request data received.'});
    }

    const body = JSON.parse(e.postData.contents);
    const event = clean(body.event);
    const data = body.data && typeof body.data === 'object' ? body.data : {};
    const publicEvents = ['registration','verifyStudent','enrollment'];

    if (publicEvents.indexOf(event) === -1 && clean(body.secret) !== API_SECRET) {
      return response({ok:false,message:'Unauthorized request.'});
    }

    const ss = SpreadsheetApp.openById(SHEET_ID);

    switch(event) {
      case 'registration':
        return response(registerStudent(ss,data));
      case 'verifyStudent':
        return response(verifyStudent(ss,data));
      case 'enrollment':
        saveEnrollment(ss,data);
        break;
      case 'payment':
        savePayment(ss,data);
        break;
      case 'result':
        saveResult(ss,data);
        break;
      case 'certificate':
        saveCertificate(ss,data);
        break;
      default:
        return response({ok:false,message:'Unknown event: '+event});
    }

    return response({ok:true,event:event,message:'Data saved successfully.'});
  } catch (error) {
    return response({ok:false,message:clean(error && error.message ? error.message : error)});
  }
}

function registerStudent(ss,data) {
  data = data || {};

  const name = clean(data.name);
  const email = clean(data.email).toLowerCase();
  const phone = clean(data.phone).replace(/\D/g,'');
  const dob = clean(data.dob);
  const address = clean(data.address);

  if (!name) throw new Error('Full Name is required.');

  if (!/^[6-9][0-9]{9}$/.test(phone)) {
    throw new Error('Invalid mobile number. Enter exactly 10 digits starting with 6-9.');
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Enter a valid email address.');
  }

  const sh = getSheet(ss,'Students');
  const lastRow = sh.getLastRow();

  if (lastRow > 1) {
    const rows = sh.getRange(2,1,lastRow-1,SHEETS.Students.length).getValues();

    for (let i=0; i<rows.length; i++) {
      const oldEmail = clean(rows[i][3]).toLowerCase();
      const oldPhone = clean(rows[i][4]).replace(/\D/g,'');

      if (oldEmail && oldEmail === email) {
        throw new Error('This email is already registered.');
      }

      if (oldPhone && oldPhone === phone) {
        throw new Error('This mobile number is already registered.');
      }
    }
  }

  const studentId = nextStudentId(sh);

  sh.appendRow([
    new Date(),
    studentId,
    name,
    email,
    phone,
    dob,
    address,
    'Registered'
  ]);

  return {
    ok:true,
    event:'registration',
    studentId:studentId,
    message:'Registration successful.'
  };
}

function nextStudentId(sh) {
  const year = new Date().getFullYear();
  const prefix = 'BNA' + year;
  const last = sh.getLastRow();

  if (last < 2) return prefix + '00001';

  const ids = sh.getRange(2,2,last-1,1).getValues().flat();
  let max = 0;

  ids.forEach(function(id) {
    const value = clean(id);
    const m = value.match(new RegExp('^' + prefix + '(\\d{5})$'));
    if (m) max = Math.max(max, Number(m[1]));
  });

  return prefix + String(max + 1).padStart(5,'0');
}

function verifyStudent(ss,data) {
  data = data || {};
  const studentId = clean(data.studentId);
  const email = clean(data.email).toLowerCase();

  if (!studentId || !email) {
    throw new Error('Student ID and registered email are required.');
  }

  const sh = getSheet(ss,'Students');
  const rows = sh.getDataRange().getValues();

  for (let i=1; i<rows.length; i++) {
    const rowId = clean(rows[i][1]);
    const rowEmail = clean(rows[i][3]).toLowerCase();
    const status = clean(rows[i][7]);

    if (rowId === studentId && rowEmail === email && status === 'Registered') {
      return {ok:true,message:'Student verified.',studentId:studentId};
    }
  }

  return {ok:false,message:'Student not found. Please register first.'};
}

function saveEnrollment(ss,data) {
  data = data || {};
  const sh = getSheet(ss,'Enrollments');
  sh.appendRow([
    new Date(),
    clean(data.studentId),
    clean(data.courseId),
    clean(data.course),
    clean(data.subjects),
    clean(data.enrollmentStatus) || 'Pending',
    clean(data.paymentStatus) || 'Pending'
  ]);
}

function savePayment(ss,data) {
  data = data || {};
  const sh = getSheet(ss,'Payments');
  sh.appendRow([
    new Date(),
    clean(data.studentId),
    clean(data.courseId),
    clean(data.course),
    Number(data.amount || 0),
    clean(data.paymentId),
    clean(data.orderId),
    clean(data.paymentStatus) || 'Paid'
  ]);
}

function saveResult(ss,data) {
  data = data || {};
  const sh = getSheet(ss,'Results');
  const percentage = data.percentage !== undefined ? data.percentage : calculatePercentage(data.score,data.total);
  const result = data.passed === true || data.passed === 'true' ? 'PASS' : 'FAIL';

  sh.appendRow([
    new Date(),
    clean(data.studentId),
    clean(data.name),
    clean(data.courseId),
    clean(data.course),
    clean(data.subject) || 'Final Exam',
    Number(data.score || 0),
    Number(data.total || 0),
    percentage,
    result,
    clean(data.examId)
  ]);
}

function saveCertificate(ss,data) {
  data = data || {};
  const sh = getSheet(ss,'Certificates');
  sh.appendRow([
    new Date(),
    clean(data.studentId),
    clean(data.name),
    clean(data.courseId),
    clean(data.course),
    clean(data.certificateNo),
    clean(data.grade),
    clean(data.issuedAt) || new Date(),
    clean(data.verificationUrl)
  ]);
}

function getSheet(ss,name) {
  let sh = ss.getSheetByName(name);

  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1,1,1,SHEETS[name].length).setValues([SHEETS[name]]);
    sh.setFrozenRows(1);
  }

  return sh;
}

function calculatePercentage(score,total) {
  score = Number(score || 0);
  total = Number(total || 0);
  return total > 0 ? Math.round((score / total) * 10000) / 100 : 0;
}

function response(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
