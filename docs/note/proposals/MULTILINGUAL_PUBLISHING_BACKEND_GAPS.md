# Đề xuất bổ sung Backend & Domain — Xuất bản Đa ngôn ngữ (Multilingual Publishing)

> **Ngày lập:** 2026-11-27  
> **Nguồn đối chiếu:** Audit & triển khai giao diện Multilingual Publishing Workspace trên `panelforge-fe` (commit `451b5b8d`, nhánh `THBMinh`)  
> **Tham chiếu:** [`06_RELEASE_PLAN.md`](../plans/06_RELEASE_PLAN.md) (`REL-04`, `REL-09`), [`07_READER_PLAN.md`](../plans/07_READER_PLAN.md) (`RDR-07`, `RDR-10`, `RDR-11`)  
> **Nguyên tắc:** Một bộ truyện gốc (**Canonical Series**) → nhiều **Language Editions**; không nhân bản Series / Series Bible / Canon / Production tasks khi phát hành thêm ngôn ngữ.

---

## 1. Phạm vi Frontend đã hoàn tất trên API hiện có

Frontend (`panelforge-fe`, commit `451b5b8d`) đã triển khai đầy đủ giao diện tương thích với dữ liệu thật hiện tại của backend (`PanelForge_FA26SE251`):

- **Publishing Matrix, Language Edition Cards & Pricing Matrix** (`MultilingualPublishingMatrix.tsx`, `PublisherSeriesDetailView.tsx`).
- **Publisher Overview** có bộ lọc **Ngôn ngữ nội dung** độc lập với ngôn ngữ giao diện (`i18n`), tách số liệu chương gốc và ấn bản ngôn ngữ (`PublisherDeskView.tsx`).
- **Localized Chapter Detail** hỗ trợ deep-link `?section=editions&lang=`, banner ngữ cảnh ấn bản và xác nhận phát hành rõ ràng (`PublisherChapterManageView.tsx`, `PublishScheduleModal.tsx`).
- **Public Catalog & Chapter Reader** đồng bộ đúng DTO `language` / `languages` từ backend, khôi phục bộ chọn ngôn ngữ khi đọc và hiển thị giá/trạng thái mở khóa theo từng ấn bản (`catalog.service.ts`, `ChapterReaderModal.tsx`, `PublicCatalogView.tsx`).
- **Series Insights & Revenue** đồng bộ `?lang=` trên URL và hiển thị rõ đơn vị tiền tệ `VND` (`PublisherSeriesInsightsView.tsx`, `PublisherRevenueView.tsx`).

---

## 2. Danh sách hạng mục Backend & Domain cần bổ sung

### GAP-01 · Hẹn giờ phát hành độc lập cho ấn bản dịch (`ScheduleEdition`) — **Ưu tiên Cao**
- **Hiện trạng:** `POST /api/chapters/{chapterId}/publish` hỗ trợ `publishAt` (hẹn giờ) cho chương + ấn bản gốc, nhưng `POST /api/chapters/{chapterId}/editions/{lang}/publish` chỉ xuất bản ngay lập tức.
- **Cần bổ sung:**
  - Cột `scheduled_publish_at TIMESTAMPTZ NULL` trên bảng `chapter_editions` (và trạng thái `Scheduled` hoặc xử lý bởi background publisher job).
  - Endpoint `POST /api/chapters/{chapterId}/editions/{lang}/schedule` (hoặc nhận optional `publishAt` trên `publish` endpoint) cùng `DELETE`/`POST .../unschedule` cho Publisher.
  - Trả thêm `scheduledPublishAt` trên `ChapterEditionDto` và `ChapterLanguageStatusDto`.

### GAP-02 · Mở rộng danh sách ngôn ngữ nội dung động — **Ưu tiên Trung bình**
- **Hiện trạng:** `ContentLanguages.cs` đang giới hạn cứng `["vi", "en"]` (tiếng Nhật `ja` đã gỡ ở migration `20261119055209_DropJapaneseReleaseLanguage`).
- **Cần bổ sung:**
  - Registry ngôn ngữ cấu hình được (hoặc danh sách mở rộng `vi`, `en`, `ja`, `ko`, ...) kèm API đọc danh sách ngôn ngữ hệ thống hỗ trợ (`GET /api/catalog/languages` hoặc config endpoint).
  - Cho phép Publisher/Producer bật thêm Language Edition mới cho một Canonical Series mà không phải sửa hardcode.

### GAP-03 · Metadata bộ truyện & chương bản địa hóa theo Language Edition — **Ưu tiên Trung bình**
- **Hiện trạng:** `Series` chỉ có một bộ `title`, `synopsis`, `coverUrl` duy nhất; `Chapter` chỉ có một `title` duy nhất.
- **Cần bổ sung:**
  - Bảng `series_localizations` `(series_id, language_code, title, synopsis, cover_url, updated_at)` — unique `(series_id, language_code)`.
  - Bổ sung `localized_title` trên `chapter_editions` (fallback về `Chapter.Title` nếu trống).
  - API `GET/PUT /api/publisher/series/{seriesId}/editions/{lang}/metadata` và trả các trường đã bản địa hóa trong `GET /api/catalog/series/{seriesId}?lang=`.

### GAP-04 · Đa tiền tệ & hình thức truy cập (`Currency` & `AccessType`) — **Ưu tiên Trung bình**
- **Hiện trạng:** `chapter_editions` chỉ lưu `price_vnd` (số nguyên, đơn vị cố định `VND`) và boolean `is_paid`.
- **Cần bổ sung:**
  - Bổ sung `currency` (mặc định `'VND'`, hỗ trợ `'USD'`, `'JPY'`, `'KRW'`, ...) và `access_type` (`Free`, `Paid`, `PreviewThenPaid`, `ScheduledFree`, ...) trên `chapter_editions`.
  - Bổ sung `currency` trên `PaymentTransaction` và tách tổng hợp doanh thu theo từng loại tiền tệ (tuyệt đối không cộng gộp khác đơn vị tiền tệ).

### GAP-05 · Lọc ngôn ngữ & hiển thị ngôn ngữ khả dụng trên danh sách Public Catalog — **Ưu tiên Cao**
- **Hiện trạng:** `GET /api/catalog/series/{seriesId}?lang=` đã hỗ trợ lọc ngôn ngữ, nhưng danh sách `GET /api/catalog/series` chưa nhận `?lang=` và `PublicSeriesDto` chưa trả `availableLanguages`.
- **Cần bổ sung:**
  - Tham số query `?lang=` trên `GET /api/catalog/series` (chỉ trả các bộ truyện có ít nhất 1 chương `Published` ở ngôn ngữ đó).
  - Thêm `availableLanguages: string[]` và `originalLanguage: string` vào `PublicSeriesDto`.

### GAP-06 · Phân tách doanh thu theo ngôn ngữ ở cấp tổng quan Publisher — **Ưu tiên Trung bình**
- **Hiện trạng:** `GET /api/publisher/series/{seriesId}/insights?language=` đã có `byLanguage`, nhưng `GET /api/publisher/revenue` chưa hỗ trợ filter `language` và chưa có `byLanguage` / multi-currency breakdown.
- **Cần bổ sung:**
  - Thêm query `?language=` cho `GET /api/publisher/revenue`.
  - Trả thêm `byLanguage: [{ language, currency, revenueAmount, chapterUnlocks, views }]` trên `PublisherRevenueDto`.

### GAP-07 · Cờ `isOriginal` trên `ChapterEditionDto` & `ChapterLanguageStatusDto` — **Ưu tiên Thấp (Quick Win)**
- **Hiện trạng:** Frontend hiện phải gọi thêm `GET /api/series/{seriesId}` để đối chiếu `originalLanguage` với từng `ChapterEdition`.
- **Cần bổ sung:**
  - Trả sẵn boolean `isOriginal` trên `ChapterEditionDto` và `ChapterLanguageStatusDto`.

### GAP-08 · Phân công & phân quyền theo Language Edition — **Ưu tiên Thấp**
- **Hiện trạng:** Quyền Publisher hiện áp dụng đồng nhất cho toàn bộ ngôn ngữ, chưa có khái niệm người phụ trách (Language Manager / Translator Lead) theo từng ấn bản ngôn ngữ.
- **Cần bổ sung:**
  - Bảng phân công người phụ trách theo `(series_id, language_code, user_id, role)` nếu triển khai đội bản địa hóa đa thị trường.

---

## 3. Đề xuất thứ tự triển khai Backend

1. **Đợt 1 (Quick Wins + High Impact):** `GAP-07` (`isOriginal`), `GAP-05` (`GET /api/catalog/series?lang=` + `availableLanguages`), `GAP-01` (lên lịch phát hành riêng cho ấn bản dịch).
2. **Đợt 2 (Content Localization & Global Analytics):** `GAP-03` (metadata bộ truyện/chương theo ngôn ngữ), `GAP-06` (`byLanguage` cho `/api/publisher/revenue`).
3. **Đợt 3 (International Expansion):** `GAP-02` (mở rộng ngôn ngữ ngoài `vi`/`en`), `GAP-04` (đa tiền tệ & `AccessType`), `GAP-08` (phân quyền theo Language Edition).
