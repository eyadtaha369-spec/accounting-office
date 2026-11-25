/**
 * مكتب محمد عبدالعال محمد للمحاسبة والمراجعة — الخادم الخلفي (Google Sheets + Google Drive)
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
          'tax_office', 'created_at', 'updated_at', 'address', 'file_status',
          // تواريخ الانتهاء + التوكيل + خزنة المستندات الدائمة (قيم الخزنة: drive:ID|اسم الملف أو url:رابط)
          'cr_expiry', 'tax_card_expiry', 'poa_has', 'poa_number', 'poa_letter_year', 'poa_office', 'poa_file',
          'vault_tax_card', 'vault_commercial_register', 'vault_vat_certificate', 'vault_incorporation', 'vault_balance_sheet',
          // الخدمات المفعلة للعميل (مفصولة بفواصل): vat,income,einvoice,payroll,insurance,financials,audit,formation
          'services'],
  Requests: ['id', 'reference_no', 'client_id', 'request_type', 'sub_type', 'description', 'status',
             'admin_message', 'assigned_to', 'completed_at', 'created_at', 'updated_at'],
  Files: ['id', 'request_id', 'client_id', 'uploaded_by', 'kind', 'drive_file_id', 'file_name',
          'mime_type', 'size_bytes', 'created_at'],
  StatusHistory: ['id', 'request_id', 'old_status', 'new_status', 'message', 'changed_by', 'created_at'],
  Notes: ['id', 'client_id', 'body', 'author_id', 'author_name', 'created_at'],
  Credentials: ['id', 'client_id', 'portal', 'username_enc', 'password_enc', 'updated_by', 'updated_at'],
  Meta: ['id', 'value'],
  ServiceRecords: ['id', 'client_id', 'service', 'period', 'due_date', 'status', 'amount', 'reference',
                   'notes', 'created_by', 'created_at', 'updated_at'],
  Tasks: ['id', 'title', 'client_id', 'due_date', 'priority', 'status', 'assigned_to', 'notes',
          'created_by', 'created_at', 'updated_at'],
  Finance: ['id', 'type', 'category', 'amount', 'date', 'client_id', 'description', 'method',
            'created_by', 'created_at', 'updated_at'],
  Documents: ['id', 'client_id', 'title', 'category', 'drive_file_id', 'file_name', 'mime_type',
              'size_bytes', 'visible_to_client', 'uploaded_by', 'created_at'],
  // أرشيف الفواتير الشهرية (سنة ← شهر ← مبيعات/مشتريات)
  MonthlyInvoices: ['id', 'client_id', 'year', 'month', 'category', 'drive_file_id', 'file_name', 'mime_type',
                    'link', 'note', 'uploaded_by', 'created_at'],
  // كشف حساب الأتعاب: charge = أتعاب مستحقة | payment = دفعة (إيصال تحويل)
  BillingLedger: ['id', 'client_id', 'kind', 'title', 'amount', 'date', 'status', 'method', 'receipt_file',
                  'receipt_name', 'note', 'created_by', 'created_at', 'updated_at'],
  // الأرشيف السنوي: مجلد لكل سنة (id = clientId:year) مع حالة الإظهار للعميل
  ArchiveYears: ['id', 'client_id', 'year', 'is_visible', 'created_at', 'updated_at'],
  // مستندات الأرشيف: section = general أو إحدى الخدمات (vat, income, einvoice, ...)
  ArchiveDocs: ['id', 'client_id', 'year', 'section', 'title', 'drive_file_id', 'file_name', 'mime_type', 'link',
                'is_visible', 'uploaded_by', 'created_at', 'updated_at'],
};

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// ======================= الإعداد لمرة واحدة =======================
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(TABLES).forEach(function (name) { ensureSheet(name); });
  const def = ss.getSheetByName('Sheet1') || ss.getSheetByName('ورقة1');
  if (def && ss.getSheets().length > 1) ss.deleteSheet(def);

  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('ROOT_FOLDER')) {
    const root = DriveApp.createFolder('Accounting Office — Files (private)');
    props.setProperty('ROOT_FOLDER', root.getId());
    props.setProperty('IDS_FOLDER', root.createFolder('National IDs').getId());
    props.setProperty('REQ_FOLDER', root.createFolder('Request Files').getId());
  }
  if (!props.getProperty('DOCS_FOLDER')) {
    props.setProperty('DOCS_FOLDER', DriveApp.getFolderById(props.getProperty('ROOT_FOLDER')).createFolder('Documents Archive').getId());
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
    if (body.action === 'snapshot') return out({ data: snapshot(body.tables || [], body.known) });
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
    if (!hasWrite) {
      // قراءة فقط: استخدم النسخة المخزنة مؤقتاً لكل ورقة (أسرع بكثير)
      ops.forEach(function (o) { if (TABLES[o.table] && !cache[o.table]) cache[o.table] = readAllCached(o.table); });
    }
    const results = ops.map(function (o) {
      if (!TABLES[o.table]) throw new Error('unknown table ' + o.table);
      switch (o.op) {
        case 'select': return select(cache, o.table, o.where || {});
        case 'insert': delete cache[o.table]; return insert(o.table, o.row);
        case 'update': delete cache[o.table]; return update(o.table, o.id, o.patch);
        case 'upsert': delete cache[o.table]; return upsert(o.table, o.row);
        case 'delete': delete cache[o.table]; return remove(o.table, o.id);
        default: throw new Error('unknown op ' + o.op);
      }
    });
    if (hasWrite) bumpVersion();
    return results;
  } finally {
    if (hasWrite) lock.releaseLock();
  }
}

const _ensured = {};
function sheet(table) {
  if (!_ensured[table]) { ensureSheet(table); _ensured[table] = true; }
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(table);
}

/** ينشئ الورقة إن لم توجد ويضيف أي أعمدة جديدة في آخرها (ترقية تلقائية بدون فقد بيانات) */
function ensureSheet(table) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const headers = TABLES[table];
  let sh = ss.getSheetByName(table);
  if (!sh) sh = ss.insertSheet(table);
  const current = sh.getLastColumn() > 0 ? sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0] : [];
  if (current.join('|') !== headers.join('|')) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#14243b').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    // كل الأعمدة نص (حتى لا تُحذف الأصفار من أرقام الهاتف والرقم القومي)
    sh.getRange(1, 1, sh.getMaxRows(), headers.length).setNumberFormat('@');
  }
  return sh;
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

function remove(table, id) {
  const idx = findRowIndex(table, id);
  if (idx === -1) return { deleted: false };
  sheet(table).deleteRow(idx);
  return { deleted: true };
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

// ======================= اللقطة الكاملة + التخزين المؤقت =======================
/** رقم إصدار البيانات — يتغير مع كل عملية كتابة */
function currentVersion() {
  return prop('DATA_VERSION') || '0';
}

function bumpVersion() {
  PropertiesService.getScriptProperties().setProperty('DATA_VERSION', String(Date.now()));
}

/**
 * يرجع كل الجداول المطلوبة في طلب واحد.
 * إذا أرسل الموقع رقم الإصدار المعروف لديه ولم تتغير البيانات، يرجع {unchanged:true} فوراً بدون قراءة الشيت.
 */
function snapshot(tables, known) {
  const v = currentVersion();
  if (known && String(known) === v) return { unchanged: true, version: v };
  const data = {};
  tables.forEach(function (t) {
    if (TABLES[t]) data[t] = readAllCached(t);
  });
  return { version: v, tables: data };
}

/** قراءة ورقة مع تخزينها في CacheService (مقسمة لأجزاء لأن الحد 100KB لكل مفتاح) */
function readAllCached(table) {
  const v = currentVersion();
  const cache = CacheService.getScriptCache();
  const base = 'tbl:' + table + ':' + v;
  try {
    const meta = cache.get(base);
    if (meta) {
      const n = Number(meta);
      const keys = [];
      for (let i = 0; i < n; i++) keys.push(base + ':' + i);
      const parts = cache.getAll(keys);
      if (keys.every(function (k) { return parts[k] != null; })) {
        return JSON.parse(keys.map(function (k) { return parts[k]; }).join(''));
      }
    }
  } catch (e) { /* تجاهل وأعد القراءة من الشيت */ }
  const rows = readAll({}, table);
  try {
    const json = JSON.stringify(rows);
    const size = 90000;
    const chunks = {};
    let n = 0;
    for (let i = 0; i < json.length; i += size) chunks[base + ':' + n++] = json.slice(i, i + size);
    if (n <= 50) {
      cache.putAll(chunks, 21600);
      cache.put(base, String(n), 21600);
    }
  } catch (e) { /* الكاش اختياري */ }
  return rows;
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
  const folderKey = { ids: 'IDS_FOLDER', requests: 'REQ_FOLDER', docs: 'DOCS_FOLDER' }[t.payload.folder];
  if (!folderKey) throw new Error('invalid_ticket');
  let folderId = prop(folderKey);
  if (!folderId) { setup(); folderId = prop(folderKey); }
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
