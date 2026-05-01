# CHANGELOG

本檔案記錄 EAL 專案的重大變更。格式遵循「日期 / 類型 / 範圍 / 說明」原則。

---

## 2026-05-01 — 新增 Instagram 必填欄位

### 變更類型
feat（新功能）+ schema 變動（資料庫遷移）

### 變更原因
結帳流程需要蒐集買家 Instagram 帳號，作為訂單後續聯絡與行銷追蹤之用。

### 變更檔案

| 檔案 | 變更內容 |
|---|---|
| `docs/pages/checkout.html` | 在 Email 與訂單備註之間新增 `<input id="instagram">` 必填欄位，`maxlength="30"` |
| `docs/assets/scripts/checkout.js` | `validateForm()` 的 `baseNeed` 加入 `instagram`；新增 `length <= 30` 檢查；`buildAndStorePayload()` 寫入 `contact.instagram`（前後 trim） |
| `prisma/schema.prisma` | `StockSnapshot` 新增 `instagram String? @db.VarChar(30)` 欄位（nullable，相容歷史資料） |
| `prisma/migrations/20260501042234_add_instagram_to_stock_snapshot/migration.sql` | 新增 migration：`ALTER TABLE "public"."StockSnapshot" ADD COLUMN "instagram" VARCHAR(30);` |
| `server/controllers/paymentController.js` | `createOrder` 增加後端必填驗證（缺即回 400）、`trim().slice(0,30)` sanitize；StockSnapshot upsert 與 `appendOrderDraft` 都寫入 sanitize 後的 `instagram` |
| `server/integrations/googleSheet.js` | `COLUMNS` 末端新增 `instagram`；所有 Sheet API range 由 `A:Q` 改為 `A:R`；`toValuesRow()` 補一格 |

### 連動影響

- **資料庫**：本機需執行 `npx prisma migrate dev`；Production 需執行 `npx prisma migrate deploy`（詳見下方部署指引）。
- **Google Sheet**：需手動在試算表表頭那列的 R 欄補上 `instagram` 欄位名稱（程式不會修改表頭）。
- **歷史訂單**：DB 中既有的 StockSnapshot 列 `instagram` 為 `NULL`；Google Sheet 既有列 R 欄為空白。皆不影響讀取。
- **API 相容性**：前端若舊版本未送 `instagram`，後端會回 400，需確保前後端同時上線。

### 回滾方式

1. 程式碼：`git revert <本次 commit>`
2. 資料庫：手動執行 `ALTER TABLE "public"."StockSnapshot" DROP COLUMN "instagram";`
3. Google Sheet：R 欄表頭可保留（不影響舊邏輯）

---
