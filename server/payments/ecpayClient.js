// 純商務邏輯（產生參數、CheckMacValue、目標 URL）
const crypto = require('crypto')
const qs = require('qs')

const MERCHANT_ID = process.env.ECPAY_MERCHANT_ID
const HASH_KEY = process.env.ECPAY_HASH_KEY
const HASH_IV = process.env.ECPAY_HASH_IV
const cashierUrl = process.env.ECPAY_CASHIER_URL
  || 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5'; // 測試環境


function encodeDotNet(str) {
  return encodeURIComponent(str)
    .toLowerCase()
    .replace(/%20/g, '+')
    .replace(/%21/g, '!')
    .replace(/%28/g, '(')
    .replace(/%29/g, ')')
    .replace(/%2a/g, '*')
    .replace(/%2d/g, '-')
    .replace(/%5f/g, '_')
    .replace(/%2e/g, '.');
}

function pad2(n) { 
  return String(n).padStart(2, '0')
}

function formatEcpayDate(now = new Date()) {
  // 轉成台北時間的 Date 物件
  const tz = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
  const yyyy = tz.getFullYear();
  const MM = pad2(tz.getMonth() + 1);
  const dd = pad2(tz.getDate());
  const HH = pad2(tz.getHours());
  const mm = pad2(tz.getMinutes());
  const ss = pad2(tz.getSeconds());
  return `${yyyy}/${MM}/${dd} ${HH}:${mm}:${ss}`;
}

function genCheckMacValue(params) {
  const sorted = {};
  Object.keys(params).sort((a, b) => a.localeCompare(b)).forEach(k => sorted[k] = params[k]);
  const query = qs.stringify(sorted, { encode: false });
  const raw = `HashKey=${HASH_KEY}&${query}&HashIV=${HASH_IV}`;
  const encoded = encodeDotNet(raw);
  return crypto.createHash('sha256').update(encoded).digest('hex').toUpperCase();
}

function buildAioPayload({ tradeNo, amount, itemName, email, returnUrl, orderResultUrl, clientBackUrl }) {
  const base = {
    MerchantID: MERCHANT_ID,
    MerchantTradeNo: tradeNo,
    MerchantTradeDate: formatEcpayDate(),
    PaymentType: 'aio',
    TotalAmount: amount,
    TradeDesc: 'Your Shop Order',
    ItemName: itemName,
    ReturnURL: process.env.ECPAY_RETURN_URL,
    OrderResultURL: process.env.ECPAY_RESULT_URL,
    ClientBackURL: process.env.ECPAY_CLIENT_BACK_URL,
    ChoosePayment: 'Credit',
    EncryptType: 1,
    // 可按需加 Email / Remark 等欄位
  };
  return { ...base, CheckMacValue: genCheckMacValue(base) };
}

function verifyMac(returned) {
  const { CheckMacValue, ...rest } = returned || {};
  const calc = genCheckMacValue(rest);
  return String(CheckMacValue) === String(calc);
}

module.exports = { cashierUrl, buildAioPayload, verifyMac }