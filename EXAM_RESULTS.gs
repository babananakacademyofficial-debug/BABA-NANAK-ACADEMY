/* =========================================================
   EXAM RESULTS
   Saves official exam details into Google Sheet: ExamResults
   ========================================================= */

const EXAM_SHEET = 'ExamResults';
const EXAM_HEADERS = [
  'Timestamp',
  'Exam ID',
  'Student ID',
  'Name',
  'Email',
  'Course ID',
  'Subject ID',
  'Subject',
  'Exam Type',
  'Score',
  'Total',
  'Percentage',
  'Result',
  'Submitted At'
];

function examSheet(ss) {
  let sh = ss.getSheetByName(EXAM_SHEET);
  if (!sh) sh = ss.insertSheet(EXAM_SHEET);

  if (sh.getMaxColumns() < EXAM_HEADERS.length) {
    sh.insertColumnsAfter(
      sh.getMaxColumns(),
      EXAM_HEADERS.length - sh.getMaxColumns()
    );
  }

  sh.getRange(1, 1, 1, EXAM_HEADERS.length)
    .setValues([EXAM_HEADERS]);
  sh.setFrozenRows(1);
  return sh;
}

function generateExamId(sh) {
  const year = new Date().getFullYear();
  let max = 0;

  if (sh.getLastRow() > 1) {
    sh.getRange(2, 2, sh.getLastRow() - 1, 1)
      .getValues()
      .flat()
      .forEach(function(v) {
        const m = s(v).match(/^BNA-EXAM-(\d{4})-(\d{5})$/);
        if (m && Number(m[1]) === year) {
          max = Math.max(max, Number(m[2]));
        }
      });
  }

  return 'BNA-EXAM-' + year + '-' + String(max + 1).padStart(5, '0');
}

function examSubmit(ss, d) {
  const studentId = s(d.studentId).toUpperCase();
  const email = s(d.email).toLowerCase();
  const courseId = s(d.courseId);
  const subjectId = s(d.subjectId);
  const examType = s(d.examType) || 'OFFICIAL SUBJECT EXAM';

  if (!studentId || !email || !courseId || !subjectId) {
    throw Error('Student ID, email, course ID and subject ID are required.');
  }

  const student = findStudent(ss, studentId);
  if (!student || !student.name) {
    throw Error('Student ID not found.');
  }

  if (s(student.email).toLowerCase() !== email) {
    throw Error('Student ID and email do not match.');
  }

  const c = course(ss, courseId);
  if (!c) throw Error('Course ID not found: ' + courseId);

  const subjects = getSubjects(ss, courseId);
  const master = subjects.find(function(x) {
    return s(x.subjectId) === subjectId;
  });
  if (!master) throw Error('Subject ID not found: ' + subjectId);

  const score = Number(d.score);
  const total = Number(d.total || d.maxMarks || master.maxMarks);
  const minPass = Number(master.minPassMarks || 40);

  if (!isFinite(score) || !isFinite(total) || total <= 0) {
    throw Error('Invalid exam marks.');
  }
  if (score < 0 || score > total) {
    throw Error('Score must be between 0 and ' + total + '.');
  }

  const percentage = Math.round((score / total) * 10000) / 100;
  const result = score >= minPass ? 'PASS' : 'FAIL';
  const sh = examSheet(ss);

  // Prevent duplicate official submission for the same student/course/subject.
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (
      s(rows[i][2]).toUpperCase() === studentId &&
      s(rows[i][5]) === courseId &&
      s(rows[i][6]) === subjectId &&
      s(rows[i][8]).toUpperCase() === examType.toUpperCase()
    ) {
      return {
        ok: true,
        existing: true,
        examId: s(rows[i][1]),
        studentId: studentId,
        name: student.name,
        email: student.email,
        courseId: courseId,
        subjectId: subjectId,
        subject: master.subject,
        score: Number(rows[i][9] || 0),
        total: Number(rows[i][10] || total),
        percentage: Number(rows[i][11] || 0),
        result: s(rows[i][12]),
        examType: s(rows[i][8]),
        submittedAt: rows[i][13],
        message: 'Exam already submitted for this subject.'
      };
    }
  }

  const examId = generateExamId(sh);
  const submittedAt = new Date();

  sh.appendRow([
    submittedAt,
    examId,
    studentId,
    student.name,
    student.email,
    courseId,
    subjectId,
    master.subject,
    examType,
    score,
    total,
    percentage,
    result,
    submittedAt
  ]);

  SpreadsheetApp.flush();

  return {
    ok: true,
    existing: false,
    examId: examId,
    studentId: studentId,
    name: student.name,
    email: student.email,
    courseId: courseId,
    subjectId: subjectId,
    subject: master.subject,
    score: score,
    total: total,
    percentage: percentage,
    result: result,
    examType: examType,
    submittedAt: submittedAt,
    message: 'Exam result saved successfully.'
  };
}

function examResultsForStudent(ss, d) {
  const studentId = s(d.studentId).toUpperCase();
  const email = s(d.email).toLowerCase();

  if (!studentId || !email) {
    throw Error('Student ID and registered email are required.');
  }

  const student = findStudent(ss, studentId);
  if (!student || !student.name) {
    return { ok: false, results: [], message: 'Student ID not found.' };
  }

  if (s(student.email).toLowerCase() !== email) {
    return { ok: false, results: [], message: 'Student ID and email do not match.' };
  }

  const sh = examSheet(ss);
  const rows = sh.getDataRange().getValues();

  const results = rows.slice(1)
    .filter(function(r) {
      return s(r[2]).toUpperCase() === studentId;
    })
    .map(function(r) {
      return {
        timestamp: r[0],
        examId: s(r[1]),
        studentId: s(r[2]),
        name: s(r[3]),
        email: s(r[4]),
        courseId: s(r[5]),
        subjectId: s(r[6]),
        subject: s(r[7]),
        examType: s(r[8]),
        score: Number(r[9] || 0),
        total: Number(r[10] || 0),
        percentage: Number(r[11] || 0),
        result: s(r[12]),
        submittedAt: r[13]
      };
    });

  return {
    ok: true,
    student: student,
    results: results,
    count: results.length
  };
}
