// (주)삼화이엔지 홈페이지 - 상담신청 백엔드 (Google Apps Script)
// 사용법: 아래 코드를 Google Apps Script 에디터에 붙여넣고 "웹앱"으로 배포하세요.
// 자세한 절차는 gas/상담신청_설정가이드.md 참고.

// === 설정 (필요시 수정) ===
const ADMIN_EMAIL = 'sh50500@sheng.kr';   // 상담 접수 알림을 받을 이메일
const SHEET_NAME = '상담신청';
const ADMIN_PASSWORD = 'samhwa2026';       // admin.html 접속 비밀번호 (원하는 값으로 변경 가능)

// 스프레드시트에서 시트 가져오기 (없으면 자동 생성)
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['접수일시', '이름', '연락처', '이메일', '공사분야', '문의내용', 'IP주소', 'User-Agent']);
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#0c1c3f').setFontColor('#FFFFFF');
  }

  return sheet;
}

// POST 요청 처리 (상담 신청 접수)
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getSheet();

    const row = [
      new Date(data.ts).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      data.name,
      data.phone,
      data.email || '',
      data.field || '',
      data.message,
      e.parameter.userip || 'N/A',
      e.parameter.useragent || 'N/A'
    ];

    sheet.appendRow(row);

    // 이메일 알림 발송
    try {
      const subject = `[삼화이엔지] 새로운 상담 신청 - ${data.name}`;
      const body = `
새로운 상담 신청이 접수되었습니다.

━━━━━━━━━━━━━━━━━━━━
접수일시: ${row[0]}
이름: ${data.name}
연락처: ${data.phone}
이메일: ${data.email || '(미입력)'}
공사분야: ${data.field || '(미선택)'}

문의내용:
${data.message}
━━━━━━━━━━━━━━━━━━━━

전체 내역(스프레드시트):
${SpreadsheetApp.getActiveSpreadsheet().getUrl()}
      `;
      GmailApp.sendEmail(ADMIN_EMAIL, subject, body);
    } catch (mailError) {
      Logger.log('이메일 발송 실패: ' + mailError.toString());
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: '접수 완료' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('오류: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// GET 요청 처리 (admin.html에서 상담 목록 조회)
function doGet(e) {
  try {
    const action = e.parameter.action;

    if (action === 'getSubmissions') {
      if (e.parameter.password !== ADMIN_PASSWORD) {
        return ContentService
          .createTextOutput(JSON.stringify({ success: false, error: '비밀번호가 틀렸습니다.' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const sheet = getSheet();
      const data = sheet.getDataRange().getValues();
      const rows = data.slice(1);

      const submissions = rows.map(function (row) {
        return {
          ts: row[0],
          name: row[1],
          phone: row[2],
          email: row[3],
          field: row[4],
          message: row[5]
        };
      });

      return ContentService
        .createTextOutput(JSON.stringify({ success: true, data: submissions.reverse() }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: 'Invalid action' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('오류: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
