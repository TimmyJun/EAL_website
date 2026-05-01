# CHANGELOG

本檔案記錄 EAL 專案的重大變更。格式遵循「日期 / 類型 / 範圍 / 說明」原則。

---

## 2026-05-01 — 移除 .color-disabled 樣式

### 變更類型
style + refactor（小幅程式碼清理）

### 變更原因
售完顏色按鈕仍可被點擊（用來瀏覽該色照片），視覺上標成 disabled 反而誤導使用者。決定讓售完色與在貨色長相完全一致，售完狀態完全交給 size 列表的 disabled 樣式 + Add to Cart 的 toast 提示。

### 變更檔案

| 檔案 | 變更內容 |
|---|---|
| `docs/assets/styles/product.css` | 完整移除 `.color-disabled` 與 `.color-disabled:hover` 兩個 block |
| `docs/assets/scripts/product.js` | `renderColorButtons()` 移除 `disabled ? 'color-disabled' : ''` 一行；`firstAvailableIdx` 邏輯保留（仍需用來決定 active 預設色） |

### 連動影響
- 純前端變更，無需重新部署後端、無需 DB migration
- `.size-disabled` 樣式保留（size 真的不能點，需要視覺提示）
- 副作用：使用者從顏色按鈕本身已分辨不出哪些售完，需點進去看 size 列表才知道。這是刻意取捨

### 回滾方式
- `git revert <本次 commit>`

---

## 2026-05-01 — 調整 disabled 樣式（拿掉斜線）

### 變更類型
style（CSS 微調）

### 變更原因
上一版的 `.color-disabled` / `.size-disabled` 用「半透明 + 斜線」標示售完狀態，斜線在 48px 圓形與 42px 方塊上顯得擁擠。改採「加深半透明（opacity 0.25）」方案：視覺更乾淨，靠透明度本身傳達「停用」語意。

### 變更檔案

| 檔案 | 變更內容 |
|---|---|
| `docs/assets/styles/product.css` | (a) `.color-disabled` 與 `.size-disabled` 移除 `::after` 斜線偽元素；(b) opacity 由 `0.4` 改為 `0.25`；(c) 移除無用的 `position: relative` |

### 連動影響
- 純 CSS 變更，無需重新部署後端、無需 DB migration。
- 要注意：黑色或深色款式售完時，opacity 0.25 會讓按鈕看起來幾乎是淺灰色，建議在實際商品頁上目測確認可辨識度。

### 回滾方式
- `git revert <本次 commit>` 即可回到「半透明 + 斜線」版本

---

## 2026-05-01 — 修正商品頁 variant 切換 bug

### 變更類型
fix（bug 修正）+ style（CSS 補強）

### 變更原因
回報的 2 個關聯 bug：
1. **Bug 1-A**：售完的顏色按鈕被 HTML `disabled` 屬性鎖死，使用者無法點擊瀏覽該色照片。
2. **Bug 1-B**：當 `variants[0]` 完全售完時，初始化的 size 列表渲染的是 `variants[0].sizes`（全售完），但顏色按鈕已自動標為 `firstAvailableIdx` 的 variant，造成「顏色已切換但 size 仍顯示 0 庫存」的不同步狀態。
3. 同時發現 `.color-disabled` / `.size-disabled` class 雖然在 JS 有加上，但 `product.css` 完全沒對應樣式，售完狀態視覺上看不出來。

### 變更檔案

| 檔案 | 變更內容 |
|---|---|
| `docs/assets/scripts/product.js` | (a) `renderColorButtons()` 移除 sold-out 顏色的 HTML `disabled` 屬性，僅保留 `color-disabled` class；(b) `initProductPage()` 在 active color 同步區塊新增 `rerenderSizesForColor(...)` 一行，確保初始 size 列表跟隨 active color |
| `docs/assets/styles/product.css` | 新增 `.color-disabled`（半透明 + 斜線 + 仍可 hover）與 `.size-disabled`（半透明 + 斜線 + not-allowed cursor）樣式 |

### 連動影響
- 純前端變更，**無需重新部署後端、無需 DB migration**。
- 行為改變：售完顏色現在可被點擊並切換照片/size 列表，但所有 size 仍 disabled，使用者按 Add to Cart 時會跳「此款式／尺寸已售完」toast。
- 未動 `bindSingleSelect`：因為 size 仍保留 HTML `disabled`，原本的 `if (el.disabled) return;` 對 size 仍有效，只對 color 失效（這就是我們要的）。

### 回滾方式
- 程式碼：`git revert <本次 commit>`
- CSS：可直接刪除 `.color-disabled` / `.size-disabled` 兩個 block

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
