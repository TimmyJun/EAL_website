# EAL 本機管理後台（admin/）

一個「只在本機執行」的商品管理 GUI，用來取代手動改 JSON + 跑腳本的上架流程。
主要功能：批次新增商品、編輯商品/顏色/尺寸庫存、**上傳圖片到 S3**、**拖拉調整圖片順序**。

> 設計定位（路線 A）：只在你自己的電腦上跑，直接連遠端 DB 與 S3。
> 因此**沒有登入驗證**——請勿部署到公網。若日後要公開，需另加驗證與 presigned 上傳（路線 B）。

## 啟動

```bash
# 連 staging（預設，安全，建議測試時用這個）
npm run admin

# 連正式環境（會顯示紅色警告橫幅，操作直接影響線上）
npm run admin:prod
```

啟動後開瀏覽器： http://localhost:4300

畫面最上方的橫幅會標示目前連到哪個環境（staging=綠、prod=紅），避免誤操作。

## 環境對應

| 指令 | 載入的檔案 | 資料庫 / S3 |
| --- | --- | --- |
| `npm run admin` | `.env.staging` | staging DB、`eal-testing-bucket` |
| `npm run admin:prod` | `.env.prod` | 正式 DB、`eal-prod-assets` |
| `ADMIN_ENV=local npm run admin` | `.env` | 本機設定 |

可用環境變數：
- `ADMIN_ENV`：`staging`（預設）/ `prod` / `local`
- `ADMIN_PORT`：預設 `4300`

## 技術說明

- 後端：獨立的 Express server（`admin/server.js`），與正式 API（`server/`）互不影響。
- 圖片上傳：瀏覽器把檔案轉 base64 → 後端用 `@aws-sdk/lib-storage` 直傳 S3（沿用專案既有的 key 命名慣例 `products/{title}/{color}/{uuid}-{檔名}`）。
- 圖片順序 = `Variant.thumbnails` 陣列；拖拉後按「儲存順序」會整組更新該陣列。
- 沒有新增任何 npm 依賴。

## 注意

- 這個後台**只在本機**，不會被 Vercel 部署（正式站仍是 `git push` → Vercel 自動建置，與 `admin/` 無關）。
- 刪除商品/顏色/圖片時會**連同 S3 檔案一併刪除**，且無法復原，請先在 staging 測試。
