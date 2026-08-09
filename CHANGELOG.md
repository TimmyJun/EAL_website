# CHANGELOG

本檔案記錄 EAL 專案的重大變更。格式遵循「日期 / 類型 / 範圍 / 說明」原則。

---

## 2026-08-08 — 新增「女裝」頂層分類

### 變更類型
feat + DB migration（schema 變動）

### 變更原因
需要在 SHOP 選單新增一個與季節（25SS/25FW）同層級的分類「女裝」，用來聚合女裝商品。

### 設計決策
- **與季節互斥**：女裝商品只出現在「女裝」分頁，不出現在季節分頁（比照 Archive Sale）。季節查詢與 season-tags 均加 `isWomens: false` 排除女裝；女裝商品的 season/year 仍為必填但不被使用（僅存 NOT NULL 值）。
- **用布林旗標 isWomens**（比照 isArchived）：因目前只規劃「女裝」單一分類，採最單純做法；若日後要多個分類，再改為通用 category 欄位。
- **選單位置**：放在 SHOP 下拉、與動態季節項目並列（menu.js 動態插入），符合「與 25SS 同層級」。非最上層項目（有別於 Archive Sale）。
- 女裝分頁排除已封存商品（`isWomens: true, isArchived: false`），使封存品只留在 Archive Sale。

### 變更檔案

| 檔案 | 變更內容 |
|---|---|
| `prisma/schema.prisma` | `Product` 新增 `isWomens Boolean @default(false)` 與 `@@index([isWomens])` |
| `prisma/migrations/20260808000000_add_product_is_womens/migration.sql` | 新增 `ADD COLUMN isWomens` 與索引 |
| `server/models/productModel.js` | `listProducts` 加 `womens` 分支；季節查詢與 `getSeasonTags` 加 `isWomens:false` 排除女裝（女裝與季節互斥）|
| `server/controllers/productController.js` | `list` 讀取 `?womens=1|true` 並轉布林傳入 model |
| `docs/assets/scripts/menu.js` | `renderShopItems` 於季節項目後插入「女裝」連結（`#products?womens=1&label=女裝`） |
| `docs/assets/scripts/products.js` | `parseHashRoute` 解析 `womens`；`renderProductsByRoute` 加 womens 分支 |
| `docs/assets/scripts/productsService.js` | `fetchProductsBy` 支援 `womens`，cache key 分離 |
| `admin/routes/adminRoutes.js` | 建立/更新商品支援 `isWomens` |
| `admin/web/index.html`、`admin/web/app.js` | 商品表單（新增與編輯）加「女裝」勾選框；勾女裝時淡化季度/年份欄位 |

### 連動影響
- **需執行 migration**：部署前須跑 `npx prisma migrate deploy`（或 dev）套用 `isWomens` 欄位，並 `prisma generate` 重生 client。順序務必為「先 migrate，後用更新後的後端/後台」。
- 現有資料安全：新欄位 `@default(false)`，既有商品皆為非女裝。
- 前端為靜態部署，需重新部署 `docs/`。
- 後端（正式 EC2 / 測試 Vercel）需部署更新後的 `server/`。

### 回滾方式
移除 `isWomens` 相關程式與選單項目；DB 欄位可保留（不影響）或以反向 migration 移除 `ADD COLUMN`／索引。

---

## 2026-08-08 — 新增本機商品管理後台（admin/）

### 變更類型
feat（新增獨立模組，不影響現有 server / docs / prisma）

### 變更原因
商品數量增加，手動編輯 `scripts/products-bulk.js` + JSON 再跑 seed 腳本的流程成本過高，且調整圖片順序（`Variant.thumbnails`）不直覺。需要一個 GUI 來批次上架與拖拉排序圖片。

### 設計決策（路線 A：只在本機執行，連遠端 DB/S3）
- **不另開 repo，放在同一專案的 `admin/` 模組**：可直接重用 Prisma schema 與 S3 慣例，避免 schema/env 兩地同步。
  - 優點：零重複、維護單一真相；缺點：repo 體積略增。
- **前端純 HTML/JS + CDN（SortableJS 拖拉排序），不用 React/Vite**：零 build step，符合無 Docker/CICD 環境。
  - 缺點：功能長大後維護性不如框架。
- **圖片上傳改用 base64 → 後端 lib-storage 直傳 S3，不裝 multer**：因無法從遠端 session 幫使用者本機安裝 npm 套件；且本機使用無 serverless body 限制。
  - 優點：零新增依賴；缺點：傳輸量多約 33%（本機 localhost 無感）。若日後改公開部署（路線 B）需改成 presigned URL。
- **預設連 staging**：`ADMIN_ENV` 預設 staging，避免測試誤動正式資料；啟動橫幅明確標示環境。

### 變更檔案

| 檔案 | 變更內容 |
|---|---|
| `admin/server.js` | 新增。獨立 Express server，依 `ADMIN_ENV` 載入對應 `.env`，預設 staging，port 預設 4300 |
| `admin/lib/prisma.js` | 新增。後台專用 Prisma client 單例 |
| `admin/lib/s3.js` | 新增。S3 上傳/刪除 helper，沿用既有 env 與 key 命名慣例 |
| `admin/routes/adminRoutes.js` | 新增。商品/variant/size CRUD、圖片上傳、`thumbnails` 重新排序 API |
| `admin/web/index.html`、`app.js`、`style.css` | 新增。後台介面（商品列表、編輯、拖拉排序圖片） |
| `admin/README.md` | 新增。啟動與環境說明 |
| `package.json` | 新增 script `admin` 與 `admin:prod`；**未變動 dependencies** |

### 連動影響
- 不影響正式站：`admin/` 不會被 Vercel 部署，前台仍走 `docs/`（GitHub Pages）與 `server/`（Vercel）。
- 無 DB schema 變動、無 migration。
- 刪除商品/顏色/圖片會連同 S3 檔案刪除且不可復原，建議先在 staging 操作。

### 回滾方式
移除 `admin/` 目錄並還原 `package.json` 的 scripts 即可，無資料庫或其他模組副作用。

---

## 2026-06-24 — 新增「Archive Sale」獨立類別

### 變更類型
feat + DB migration（schema 變動）

### 變更原因
需要在 Header Menu 新增一個與年份/季別無關、跨年份聚合的獨立商品分類「Archive Sale」。原本選單機制以 (year, season) 為單位，無法表達此需求。

### 設計決策
採用獨立旗標 `Product.isArchived`，而非把 ARCHIVE 加入 `Season` enum。
- 優點：商品的 `season/year` 不被破壞、語意正交、可逆（關旗標即還原）、不污染 enum。
- 取捨：相較 enum 改動面較廣（schema + 前後端各一處）；archived 商品在 DB 仍保有 year 值（不顯示、不使用，僅為滿足 NOT NULL）。
- 「完全獨立、不帶年份」透過排除過濾達成：一般季別查詢與 season-tags 一律排除 `isArchived: true`，故 archived 商品會從原年份分類消失，只出現在 Archive Sale。

### 變更檔案

| 檔案 | 變更內容 |
|---|---|
| `prisma/schema.prisma` | `Product` 新增 `isArchived Boolean @default(false)` 與 `@@index([isArchived])` |
| `prisma/migrations/20260624000000_add_product_is_archived/migration.sql` | 新增 `ADD COLUMN isArchived` 與索引 |
| `server/models/productModel.js` | `listProducts` 加 `archived` 分支（只查 `isArchived: true`、忽略 year/season）；一般查詢加 `isArchived: false`；`getSeasonTags` 加 `where: { isArchived: false }` |
| `server/controllers/productController.js` | `list` 讀取 `?archived=1\|true` 並轉布林傳入 model |
| `docs/index.html` | Menu 新增頂層項目 `ARCHIVE SALE`，連結 `#products?archived=1&label=Archive%20Sale` |
| `docs/assets/scripts/products.js` | `parseHashRoute` 解析 `archived`；`renderProductsByRoute` 加 archived 分支 |
| `docs/assets/scripts/productsService.js` | `fetchProductsBy` 支援 `archived`，cache key 分離 |
| `scripts/seed-bulk-products.js` | 解構並寫入 `isArchived`（預設 false） |
| `scripts/products-bulk.js` | 補充以 `isArchived: true` 標記 Archive Sale 商品的註解 |

### 連動影響
- **需執行 migration**：部署前須跑 `npx prisma migrate deploy`（或 dev）套用 `isArchived` 欄位。
- 現有資料安全：新欄位 `@default(false)`，既有商品維持非 archive。
- 前端為靜態部署（GitHub Pages），需重新部署 `docs/`。

### 回滾方式
- 程式碼：`git revert <本次 commit>`
- DB：`ALTER TABLE "Product" DROP COLUMN "isArchived";`（並移除該 migration 目錄）

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
