/**
 * مكتب المحاسبة — الخادم الخلفي على Google Sheets + Google Drive
 * ---------------------------------------------------------------
 * 1) افتح Google Sheet جديد ← Extensions ← Apps Script ← الصق هذا الملف بالكامل.
 * 2) من القائمة اختر الدالة setup واضغط Run (ووافق على الصلاحيات).
 *    ستُنشأ الأوراق والمجلدات، ويظهر API_SECRET في Execution log — انسخه.
 * 3) Deploy ← New deployment ← Web app
 *      Execute as: Me    |    Who has access: Anyone
 *    انسخ رابط الـ Web app.
 *
 * الأمان: كل عمليات القراءة والكتابة تتطلب API_SECRET (موجود فقط في خادم Next.js).
 * المتصفح يرفع/يحمّل الملفات مباشرة فقط بتذكرة موقّعة (HMAC) صالحة لفترة قصيرة.
 */

const TABLES = {
  Users: ['id', 'role', 'full_name', 'email', 'password_hash', 'phone', 'phone_alt', 'national_id',
          'id_front_file', 'id_back_file', 'tax_registration_number', 'client_type', 'company_name',
          'tax_office', 'created_at', 'updated_at'],
  Requests: ['id', 'reference_no', 'client_id', 'request_type', 'sub_type', 'description', 'status',
             'admin_message', 'assigned_to', 'completed_at', 'created_at', 'updated_at'],
  Files: ['id', 'request_id', 'client_id', 'uploaded_by', 'kind', 'drive_file_id', 'file_name',
          'mime_type', 'size_bytes', 'created_at'],
  StatusHistory: ['id', 'request_id', 'old_status', 'new_status', 'message', 'changed_by', 'created_at'],
  Notes: ['id', 'client_id', 'body', 'author_id', 'author_name', 'created_at'],
  Credentials: ['id', 'client_id', 'portal', 'username_enc', 'password_enc', 'updated_by', 'updated_at'],
  Meta: ['id', 'value'],
};

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// ======================= الإعداد لمرة واحدة =======================
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(TABLES).forEach(function (name) {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    const headers = TABLES[name];
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#0b1f3a').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    // كل الأعمدة نص (حتى لا تُحذف الأصفار من أرقام الهاتف والرقم القومي)
    sh.getRange(1, 1, sh.getMaxRows(), headers.length).setNumberFormat('@');
  });
  const def = ss.getSheetByName('Sheet1') || ss.getSheetByName('ورقة1');
  if (def && ss.getSheets().length > 1) ss.deleteSheet(def);

  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('ROOT_FOLDER')) {
    const root = DriveApp.createFolder('Accounting Office — Files (private)');
    props.setProperty('ROOT_FOLDER', root.getId());
    props.setProperty('IDS_FOLDER', root.createFolder('National IDs').getId());
    props.setProperty('REQ_FOLDER', root.createFolder('Request Files').getId());
  }
  if (!props.getProperty('API_SECRET')) {
    props.setProperty('API_SECRET', Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, ''));
  }
  Logger.log('API_SECRET = ' + props.getProperty('API_SECRET'));
  Logger.log('Setup complete ✔ — now Deploy as Web app.');
}

// ======================= نقطة الدخول =======================
function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return out({ error: 'bad_json' });
  }
  try {
    if (body.action === 'directUpload') return out({ data: directUpload(body) });
    if (body.action === 'directDownload') return out({ data: directDownload(body) });
    if (!body.secret || body.secret !== prop('API_SECRET')) return out({ error: 'unauthorized' });
    if (body.action === 'batch') return out({ data: runBatch(body.ops || []) });
    return out({ error: 'unknown_action' });
  } catch (err) {
    return out({ error: String((err && err.message) || err) });
  }
}

function doGet() {
  return out({ ok: true, service: 'accounting-office-api' });
}

// ======================= العمليات على الجداول =======================
function runBatch(ops) {
  const hasWrite = ops.some(function (o) { return o.op !== 'select'; });
  const lock = LockService.getScriptLock();
  if (hasWrite) lock.waitLock(20000);
  try {
    const cache = {};
    return ops.map(function (o) {
      if (!TABLES[o.table]) throw new Error('unknown table ' + o.table);
      switch (o.op) {
        case 'select': return select(cache, o.table, o.where || {});
        case 'insert': delete cache[o.table]; return insert(o.table, o.row);
        case 'update': delete cache[o.table]; return update(o.table, o.id, o.patch);
        case 'upsert': delete cache[o.table]; return upsert(o.table, o.row);
        default: throw new Error('unknown op ' + o.op);
      }
    });
  } finally {
    if (hasWrite) lock.releaseLock();
  }
}

function sheet(table) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(table);
}

function readAll(cache, table) {
  if (cache[table]) return cache[table];
  const sh = sheet(table);
  const headers = TABLES[table];
  const last = sh.getLastRow();
  const rows = last < 2 ? [] : sh.getRange(2, 1, last - 1, headers.length).getDisplayValues();
  cache[table] = rows
    .filter(function (r) { return r[0] !== ''; })
    .map(function (r) {
      const o = {};
      headers.forEach(function (h, i) { o[h] = r[i]; });
      return o;
    });
  return cache[table];
}

/** where: { col: value } أو { col: [v1, v2] } */
function select(cache, table, where) {
  const keys = Object.keys(where);
  return readAll(cache, table).filter(function (row) {
    return keys.every(function (k) {
      const v = where[k];
      return Array.isArray(v) ? v.indexOf(row[k]) !== -1 : row[k] === String(v);
    });
  });
}

function writeRow(table, rowIndex, obj) {
  const headers = TABLES[table];
  const range = sheet(table).getRange(rowIndex, 1, 1, headers.length);
  range.setNumberFormat('@');
  range.setValues([headers.map(function (h) { return obj[h] == null ? '' : String(obj[h]); })]);
}

function findRowIndex(table, id) {
  const sh = sheet(table);
  const last = sh.getLastRow();
  if (last < 2) return -1;
  const ids = sh.getRange(2, 1, last - 1, 1).getDisplayValues();
  for (let i = 0; i < ids.length; i++) if (ids[i][0] === String(id)) return i + 2;
  return -1;
}

function insert(table, row) {
  const obj = Object.assign({}, row);
  if (!obj.id) obj.id = Utilities.getUuid();
  const now = new Date().toISOString();
  if (TABLES[table].indexOf('created_at') !== -1 && !obj.created_at) obj.created_at = now;
  if (TABLES[table].indexOf('updated_at') !== -1) obj.updated_at = now;
  if (table === 'Requests') obj.reference_no = nextCounter('request_ref', 1000);
  writeRow(table, sheet(table).getLastRow() + 1, obj);
  return obj;
}

function update(table, id, patch) {
  const idx = findRowIndex(table, id);
  if (idx === -1) throw new Error('not_found');
  const headers = TABLES[table];
  const current = sheet(table).getRange(idx, 1, 1, headers.length).getDisplayValues()[0];
  const obj = {};
  headers.forEach(function (h, i) { obj[h] = current[i]; });
  Object.keys(patch || {}).forEach(function (k) {
    if (k !== 'id' && headers.indexOf(k) !== -1) obj[k] = patch[k];
  });
  if (headers.indexOf('updated_at') !== -1) obj.updated_at = new Date().toISOString();
  writeRow(table, idx, obj);
  return obj;
}

function upsert(table, row) {
  return findRowIndex(table, row.id) === -1 ? insert(table, row) : update(table, row.id, row);
}

function nextCounter(key, start) {
  const idx = findRowIndex('Meta', key);
  if (idx === -1) {
    writeRow('Meta', sheet('Meta').getLastRow() + 1, { id: key, value: String(start) });
    return String(start);
  }
  const next = Number(sheet('Meta').getRange(idx, 2).getDisplayValue()) + 1;
  writeRow('Meta', idx, { id: key, value: String(next) });
  return String(next);
}

// ======================= الملفات (تذاكر موقّعة) =======================
function verifyTicket(ticket) {
  const parts = String(ticket || '').split('.');
  if (parts.length !== 2 || hmacHex(parts[0]) !== parts[1]) throw new Error('invalid_ticket');
  const payload = JSON.parse(Utilities.newBlob(Utilities.base64Decode(parts[0])).getDataAsString());
  if (!payload.exp || payload.exp < Date.now()) throw new Error('expired_ticket');
  return { payload: payload, raw: parts[0] };
}

function directUpload(body) {
  const t = verifyTicket(body.ticket);
  if (t.payload.t !== 'up') throw new Error('invalid_ticket');
  const bytes = Utilities.base64Decode(body.base64 || '');
  if (!bytes.length || bytes.length > MAX_UPLOAD_BYTES) throw new Error('bad_size');
  const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  if (allowed.indexOf(body.mimeType) === -1) throw new Error('bad_type');
  const folderId = prop(t.payload.folder === 'ids' ? 'IDS_FOLDER' : 'REQ_FOLDER');
  const name = String(t.payload.prefix || 'file') + '__' + String(body.name || 'file').slice(0, 120);
  const file = DriveApp.getFolderById(folderId).createFile(Utilities.newBlob(bytes, body.mimeType, name));
  return { fileId: file.getId(), receipt: hmacHex(file.getId() + '|' + t.raw) };
}

function directDownload(body) {
  const t = verifyTicket(body.ticket);
  if (t.payload.t !== 'down') throw new Error('invalid_ticket');
  const blob = DriveApp.getFileById(t.payload.fileId).getBlob();
  return { base64: Utilities.base64Encode(blob.getBytes()), mimeType: blob.getContentType(), name: blob.getName() };
}

// ======================= أدوات =======================
function hmacHex(msg) {
  const sig = Utilities.computeHmacSha256Signature(String(msg), prop('API_SECRET'), Utilities.Charset.UTF_8);
  return sig.map(function (b) { return ('0' + ((b + 256) % 256).toString(16)).slice(-2); }).join('');
}

function prop(k) {
  return PropertiesService.getScriptProperties().getProperty(k);
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
