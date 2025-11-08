// server/integrations/googleSheet.js
const { google } = require('googleapis');

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Orders';

const COLUMNS = [
  'created_at', 'merchant_trade_no', 'trade_no',
  'buyer_name', 'buyer_phone', 'buyer_email',
  'ship_method', 'ship_summary', 'ship_address',
  'items_json', 'amount', 'status',
  'payment_method', 'payment_date', 'rtn_code', 'rtn_msg',
  'note',
];

function normalizePrivateKey(raw) {
  if (!raw) return '';
  let k = raw;
  if (k.startsWith('"') && k.endsWith('"')) k = k.slice(1, -1);
  if (k.includes('\\n')) k = k.replace(/\\n/g, '\n');
  return k;
}

function loadCredentials() {
  let client_email = process.env.GOOGLE_SA_CLIENT_EMAIL || '';
  let private_key = process.env.GOOGLE_SA_PRIVATE_KEY || '';

  // Plan B: 私鑰 Base64
  if (!private_key && process.env.GOOGLE_SA_PRIVATE_KEY_B64) {
    private_key = Buffer.from(process.env.GOOGLE_SA_PRIVATE_KEY_B64, 'base64').toString('utf8');
  }

  // Plan C: 整包 service-account JSON Base64
  if ((!client_email || !private_key) && process.env.GOOGLE_SA_CREDENTIALS_JSON_B64) {
    const json = JSON.parse(Buffer.from(process.env.GOOGLE_SA_CREDENTIALS_JSON_B64, 'base64').toString('utf8'));
    client_email = client_email || json.client_email || '';
    private_key = private_key || json.private_key || '';
  }

  private_key = normalizePrivateKey(private_key);

  // 診斷（安全、不印內容）
  console.log('[sheet] cred diag:', {
    hasSheetId: !!SHEET_ID,
    email: client_email,
    keyLen: private_key ? private_key.length : 0,
    hasBegin: !!(private_key && private_key.includes('BEGIN PRIVATE KEY')),
  });

  if (!SHEET_ID) throw new Error('Missing env: GOOGLE_SHEET_ID');
  if (!client_email || !private_key) {
    throw new Error('Missing Service Account credential: GOOGLE_SA_CLIENT_EMAIL / GOOGLE_SA_PRIVATE_KEY');
  }

  return { client_email, private_key };
}

async function getSheets() {
  const { client_email, private_key } = loadCredentials();

  // ✅ 使用 GoogleAuth 而非手動 new JWT
  const auth = new google.auth.GoogleAuth({
    credentials: { client_email, private_key },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  // 取得 client（這一步若有任何權限/時間/格式錯誤會直接丟真實錯誤）
  await auth.getClient();

  return google.sheets({ version: 'v4', auth });
}

function toValuesRow(d) {
  const get = (k, v = '') => (d && d[k] != null ? d[k] : v);
  return [
    new Date().toISOString(),
    String(get('merchant_trade_no')),
    String(get('trade_no')),
    String(get('buyer_name')),
    String(get('buyer_phone')),
    String(get('buyer_email')),
    String(get('ship_method')),
    String(get('ship_summary')),
    String(get('ship_address')),
    String(get('items_json')),
    String(get('amount')),
    String(get('status', 'PENDING')),
    String(get('payment_method')),
    String(get('payment_date')),
    String(get('rtn_code')),
    String(get('rtn_msg')),
    String(get('note')),
  ];
}

async function appendOrderDraft(rowData) {
  const sheets = await getSheets();
  const resp = await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A:Q`,
    valueInputOption: 'RAW',
    requestBody: { values: [toValuesRow(rowData)] },
  });
  console.log('[sheet] append ok:', resp.status, resp.statusText);
}

async function findRowIndexByTradeNo(merchantTradeNo) {
  const sheets = await getSheets();
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A:Q`,
  });
  const rows = data.values || [];
  const idx0 = rows.findIndex(r => String(r[1] || '') === String(merchantTradeNo)); // B 欄
  return idx0 >= 0 ? idx0 + 1 : -1;
}

async function updateRowByIndex(rowIndex, patch) {
  if (rowIndex < 2) return; // 跳過表頭
  const sheets = await getSheets();

  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A${rowIndex}:Q${rowIndex}`,
  });

  const row = (data.values && data.values[0]) || new Array(COLUMNS.length).fill('');
  const map = Object.fromEntries(COLUMNS.map((k, i) => [k, row[i] || '']));

  Object.entries(patch || {}).forEach(([k, v]) => {
    if (k in map) map[k] = String(v ?? '');
  });

  const newRow = COLUMNS.map(k => map[k]);
  const resp = await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A${rowIndex}:Q${rowIndex}`,
    valueInputOption: 'RAW',
    requestBody: { values: [newRow] },
  });
  console.log('[sheet] update ok:', resp.status, resp.statusText);
}

async function updateByMerchantTradeNo(merchantTradeNo, patch) {
  const rowIndex = await findRowIndexByTradeNo(merchantTradeNo);
  if (rowIndex === -1) return false;
  await updateRowByIndex(rowIndex, patch);
  return true;
}

module.exports = { appendOrderDraft, updateByMerchantTradeNo };