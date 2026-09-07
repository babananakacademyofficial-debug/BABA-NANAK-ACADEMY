/* Legacy ExamResults -> official Results bridge.
   Important: Google Sheets may coerce numeric-looking IDs into Date objects.
   Resolve Subject ID by subject name before writing to Results. */
function normalizeLegacySubjectId_(ss, courseId, rawSubjectId, subjectName) {
  const cid = s(courseId);
  const subjects = getSubjects(ss, cid);
  const raw = rawSubjectId;
  const sid = s(raw);
  const allowed = subjects.map(x => s(x.subjectId));
  if (allowed.indexOf(sid) >= 0) return sid;

  const name = s(subjectName).toLowerCase();
  if (name) {
    const byName = subjects.find(x => s(x.subject).toLowerCase() === name);
    if (byName) return s(byName.subjectId);
  }

  // Never propagate a Date value such as "Sun Jan 01 1111..." as a Subject ID.
  return '';
}

function syncExamResultsToOfficialResults(ss, studentId, courseId, subjectId) {
  const examSh = sheet(ss, 'ExamResults');
  if (examSh.getLastRow() <= 1) return { synced: 0, skipped: 0 };

  const targetStudent = s(studentId).toUpperCase();
  const targetCourse = s(courseId);
  const targetSubject = s(subjectId);
  const exams = examSh.getDataRange().getValues().slice(1);
  let synced = 0;
  let skipped = 0;

  exams.forEach(function(r) {
    // ExamResults schema: C=Student ID, F=Course ID, G=Subject ID, H=Subject.
    const sid = s(r[2]).toUpperCase();
    const cid = s(r[5]);
    const rawSubjectId = r[6];
    const subjectName = s(r[7]);
    if (!sid || !cid) { skipped++; return; }
    if (targetStudent && sid !== targetStudent) return;
    if (targetCourse && cid !== targetCourse) return;

    const normalizedSubjectId = normalizeLegacySubjectId_(ss, cid, rawSubjectId, subjectName);
    if (!normalizedSubjectId) { skipped++; return; }
    if (targetSubject && normalizedSubjectId !== targetSubject) return;

    const rawScore = Number(r[9]);
    const rawTotal = Number(r[10]);
    if (isNaN(rawScore) || isNaN(rawTotal) || rawTotal <= 0) { skipped++; return; }

    const master = getSubjects(ss, cid).find(x => s(x.subjectId) === normalizedSubjectId);
    if (!master) { skipped++; return; }

    const officialTotal = Number(master.maxMarks) || rawTotal;
    const officialMin = Number(master.minPassMarks) || 0;
    const officialScore = rawTotal === officialTotal
      ? rawScore
      : Math.round((rawScore / rawTotal) * officialTotal * 100) / 100;

    try {
      saveResult(ss, {
        studentId: sid,
        name: s(r[3]),
        courseId: cid,
        course: s(master.course || (course(ss, cid) ? course(ss, cid).name : '')),
        subjectId: normalizedSubjectId,
        subject: s(master.subject) || subjectName,
        score: officialScore,
        maxMarks: officialTotal,
        minPassMarks: officialMin
      }, true);
      synced++;
    } catch (err) {
      skipped++;
    }
  });

  SpreadsheetApp.flush();
  return { synced: synced, skipped: skipped };
}

function syncAllLegacyExamResults() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const result = syncExamResultsToOfficialResults(ss, '', '', '');
  Logger.log(JSON.stringify(result));
  return result;
}
