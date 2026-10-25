// FinLab Academy: приём результатов в Google Таблицу.
// 1) Откройте таблицу «FinLab Academy — журнал прогресса» → Расширения → Apps Script.
// 2) Вставьте этот код, замените TOKEN на свой пароль (любая длинная строка).
// 3) Развернуть → Новое развёртывание → Тип: Веб-приложение →
//    Выполнять от имени: Я; Доступ: Все → Развернуть. Скопируйте адрес (оканчивается на /exec).
// 4) В приложении: Прогресс → Синхронизация → вставьте адрес и тот же токен.

const SHEET_NAME = 'log';
const TOKEN = 'ЗАМЕНИТЕ_НА_СВОЙ_ТОКЕН';

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function sheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  if (body.token !== TOKEN) return json_({ error: 'token' });
  const rows = body.rows || [];
  if (rows.length) {
    const sh = sheet_();
    const r = sh.getLastRow() + 1;
    sh.getRange(r, 1, rows.length, 1).setNumberFormat('@'); // дата-время как текст
    sh.getRange(r, 1, rows.length, 7).setValues(rows);
  }
  return json_({ ok: true, n: rows.length });
}

function doGet(e) {
  if (e.parameter.token !== TOKEN) return json_({ error: 'token' });
  const sh = sheet_();
  const n = sh.getLastRow() - 1;
  const rows = n > 0 ? sh.getRange(2, 1, n, 7).getValues() : [];
  return json_({ rows: rows.map(r => r.map(c => (c instanceof Date ? Utilities.formatDate(c, 'Europe/Moscow', 'yyyy-MM-dd HH:mm:ss') : c))) });
}
