/* =========================================================
   LEGACY EXAM → OFFICIAL RESULTS SYNC
   Keep this as a separate Apps Script file or merge into Code.gs.
   It does NOT create any new sheet.
   Flow: ExamResults → Results → Certificate
   ========================================================= */

function syncExamResultsToOfficialResults(ss, studentId, courseId, subjectId) {
  const examSh = sheet(ss, 'ExamResults');
  const resultSh = sheet(ss, 'Results');
  if (examSh.getLastRow() <= 1) return { synced: 0, skipped: 0 };

  const targetStudent = s(studentId).toUpperCase();
  const targetCourse = s(courseId);
  const targetSubject = s(subjectId);
  const exams = examSh.getDataRange().getValues().slice(1);
  const existing = resultSh.getLastRow() > 1
    ? resultSh.getDataRange().getValues().slice(1)
    : [];

  let synced = 0;
  let skipped = 0;
  const seen = {};

  existing.forEach(function(r) {
    const key = [s(r[1]).toUpperCase(), s(r[3]), s(r[5])].join('|');
    seen[key] = true;
  });

  exams.forEach(function(r) {
    const sid = s(r[1 + 1]).toUpperCase(); // ExamResults: col C = Student ID
    const cid = s(r[5]);                    // col F = Course ID
    const subId = s(r[6]);                  // col G = Subject ID

    if (!sid || !cid || !subId) { skipped++; return; }
    if (targetStudent && sid !== targetStudent) return;
    if (targetCourse && cid !== targetCourse) return;
    if (targetSubject && subId !== targetSubject) return;

    const master = getSubjects(ss, cid).find(function(x) {
      return s(x.subjectId) === subId;
    });
    if (!master) { skipped++; return; }

    const rawScore = Number(r[9]);  // col J = Score
    const rawTotal = Number(r[10]); // col K = Total
    if (isNaN(rawScore) || isNaN(rawTotal) || rawTotal <= 0) {
      skipped++;
      return;
    }

    const officialTotal = Number(master.maxMarks);
    const officialScore = rawTotal === officialTotal
      ? rawScore
      : Math.round((rawScore / rawTotal) * officialTotal * 100) / 100;

    const key = [sid, cid, subId].join('|');
    saveResult(ss, {
      studentId: sid,
      courseId: cid,
      subjectId: subId,
      score: officialScore
    }, true);
    seen[key] = true;
    synced++;
  });

  SpreadsheetApp.flush();
  return { synced: synced, skipped: skipped };
}

/* Run once manually in Apps Script if old ExamResults were saved
   before the current exam-to-results flow was deployed. */
function syncAllLegacyExamResults() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const result = syncExamResultsToOfficialResults(ss, '', '', '');
  Logger.log(JSON.stringify(result));
  return result;
}
