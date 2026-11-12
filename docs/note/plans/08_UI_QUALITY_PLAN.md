# 08 · CHẤT LƯỢNG GIAO DIỆN: CHỐNG AI-SLOP, TOKEN, I18N, MOBILE (`UIQ`)

> **Chuẩn:** `.agents/AGENTS.md` §7, `panelforge-fe/docs/DESIGN_RULES.md`, `panelforge-mobile/lib/theme/app_theme.dart`, skill `antislop`, `antislop-ui`, `antislop-code`, `antislop-copywriting`, `antislop-layoutmobile`.
> **Thay cho:** `note/ANTI_SLOP_REFACTOR_PLAN.md` (GĐ5–GĐ12); phần còn mở của `UI_REFACTOR_CHECKLIST.md`, `LUCIAN_UXUI_ENHANCEMENT_INTEGRATION_PLAN.md`; bảng thuật ngữ của `UI_UX_COPY_STANDARDIZATION_AND_I18N_PLAN.md`. Các plan thiết kế/màu/font/i18n cũ đã hoàn thành, quy chuẩn nằm trong `DESIGN_RULES.md`.
> **Tách file theo màn hình** nằm ở plan module tương ứng: Writer → [SCR-20](01_SCRIPT_PLAN.md), Bible → [BIB-04..07](02_BIBLE_PLAN.md), Artist/Letterer → [ART-11/12](04_ARTWORK_PLAN.md), Editor → [REV-06](05_REVIEW_PLAN.md). File này giữ phần **quét toàn bộ** và **chốt chặn**.

Thứ tự ưu tiên: trung thực → tách file lớn → quét token → i18n & mobile → chốt chặn.

---

## 1. Đợt 1 đã xong (trên `trungkien`)

| Giai đoạn | Commit (fe / mobile) | Kết quả |
|---|---|---|
| Producer Dashboard | `7f1de5c` | `DashboardView` 2037 → 264 dòng; bỏ timer AI giả, tem "Serial" giả, toast báo thành công giả |
| Artist Desk | `5b97617` | 2857 → 1622 dòng; bỏ chữ "AI đang quét" cho thuật toán dò rãnh |
| Studio/Workspace | `4167a7b` | `SeriesShelf`, empty state có hành động |
| Văn phong + Mobile | `470395e` · `dd10847` | Landing bỏ cụm sáo rỗng, 127 chỗ chữ nhỏ; mobile vùng chạm 44dp, chữ 12sp |

Nợ còn lại: `StudioOverviewView` 1023 dòng, `LandingPageView` 3619 dòng (UIQ-03); `ArtistDeskView` (ART-12).

## 2. Mốc đo (2026-11-11, `trungkien`, không tính `*.test.tsx`)

| Chỉ số | Hiện tại | Mục tiêu |
|---|---|---|
| FE `.tsx` > 400 dòng | 29 file > 840 dòng, lớn nhất 4760 | View ≤ 600, component ≤ 400 |
| Chữ < 12px (`text-[8..11.5px]`) | 1209 chỗ / 122 file | 0 |
| Màu lệch bảng (zinc, slate, gray, indigo, pink, purple, sky, cyan) | nặng nhất `SeriesBibleView` 134, `ArtworkPanel` 97, `ChapterReviewView` 97, `LetteringWorkspace` 93 | 0 (violet chỉ cho AI) |
| File dùng `backdrop-blur` | 81 | Chỉ toolbar dính, modal |
| File dùng `useTranslation` | 15 / 227 | Toàn bộ view, modal |
| Em dash trong `.tsx` | 92 | 0 trong chữ hiển thị |
| Mobile `.dart` > 400 dòng | 11, lớn nhất `login_page.dart` 1443 | Màn hình < 500, widget < 350 |
| Mobile `fontSize` < 12 | 73 | 0 |
| Mobile `Color(0x..)` ngoài theme | 8 file | 0 |

## 3. Task

#### UIQ-01 · Trung thực dữ liệu & nhãn AI (Hard Gate) — FE · ❌ · cũ GĐ5
- [ ] Xoá số viết cứng: `shared/features/pipeline-board/WorkflowBoardView.tsx:236, 780` ("99.4% AI Continuity/Verified"), `:422, 433` ("3.2 hrs / page", "1.4 hrs avg"). Có DTO thật (`SeriesProgressDto`…) thì nối, không thì bỏ thẻ.
- [ ] Rà 15 file dùng `Sparkles`/`Wand2`: có gọi `aiAgents/aiWorkflows/aiStream.service` → giữ, violet; không → đổi icon nghiệp vụ (`ListChecks`, `Layers`, `Gauge`), bỏ tím (vd `WorkflowBoardView.tsx:420`, `CreateAssignmentModal.tsx`).
- [ ] Nút nhãn "AI" ("AI Rút Gọn Thoại", "Sinh Gợi Ý Xuất Bản") phải gọi endpoint AI thật; nút chỉ `setTimeout` → nối API hoặc gỡ.
- [ ] Quét 55 chỗ `setTimeout` tìm mẫu "chờ rồi báo thành công".

#### UIQ-02 · Quét token thiết kế toàn FE — FE · ❌ · cũ GĐ9.1–9.3
- [ ] Lô 10–15 file/commit, ưu tiên màn hay dùng. Lô đầu chữ nhỏ: `ArtistCanvaSidebar` (101), `WorkflowBoardView` (40), `SeriesChaptersModal` (30), `ChapterProvenanceModal` (28), `UserProfileView` (27). Kiểm bố cục 375px sau khi nâng chữ.
- [ ] Bảng ánh xạ màu cố định:

  | Cũ | Mới |
  |---|---|
  | `zinc-*`, `slate-*`, `gray-*` | `stone-*` cùng mức |
  | `indigo-*`, `sky-*`, `cyan-*` cho "đang làm" | `blue-*` |
  | `purple-*`, `fuchsia-*` cho AI/Bible | `violet-*` |
  | `purple-*`, `pink-*` cho trạng thái khác | `amber-*` |
  | `red-*` | `rose-*` |

- [ ] `backdrop-blur`: chỉ giữ ở sticky toolbar và modal.

#### UIQ-03 · Trả nợ tách file chung — FE · ❌ · cũ GĐ9.5
- [ ] `StudioOverviewView` (gom state modal series thành `useSeriesModals`), `LandingPageView` (tách theo section).

#### UIQ-04 · i18n theo role — FE · ❌ · cũ GĐ10
- [ ] Mỗi role một namespace: `producer`, `artist`, `letterer`, `writer`, `editor`, `publisher`, `reader`.
- [ ] Khi chuyển chuỗi, viết lại theo thuật ngữ §6; cập nhật test tìm theo chữ trong cùng commit.
- [ ] `npm run i18n:check` trước mỗi commit.

#### UIQ-05 · Mobile — MO · ❌ · cũ GĐ11
- [ ] Nâng 73 chỗ `fontSize` < 12 lên 12sp (ưu tiên `explore_page`, `review_invite_page`, `series_detail_page`, `annotation_sheet`).
- [ ] Vùng chạm 44dp cho mọi `GestureDetector`/`InkWell` (ưu tiên `explore_page`, `login_page`, `annotation_sheet`, `wallet_topup_dialog`).
- [ ] Tách `login_page.dart` (1443), `explore_page.dart` (1059), `comic_reader_page.dart` (1100), `auth_modal_sheet.dart` (947).
- [ ] Thay 8 file `Color(0x..)` bằng `AppColors`.
- [ ] Cài Flutter SDK để chạy `flutter analyze`.
- (Giá VNĐ theo ấn bản & số dư Ví: xem [RDR-07](07_READER_PLAN.md), [RDR-10](07_READER_PLAN.md).)

#### UIQ-06 · Màn chung còn lại — FE · ❌ · UI checklist C3, C5
- [ ] Admin: đổi tên `AdminDashboard.tsx` → `AdminPortalShell.tsx` (tách khỏi `AdminDashboardView.tsx`); chuẩn bảng người dùng, quota AI, audit log có lọc ngày.
- [ ] `NotificationCenterView`: tab lọc (Giao việc, Duyệt, Hệ thống), "Đánh dấu đã đọc tất cả", chấm chưa đọc.
- [ ] `UserProfileView`: thông tin, studio tham gia, bật 2FA, đổi mật khẩu.

#### UIQ-07 · Chốt chặn chống tái phát — FE + tooling · ❌ · cũ GĐ12
- [ ] ESLint `no-restricted-syntax` chặn `text-[8px]..text-[11px]` và `zinc-`, `slate-`, `gray-`, `indigo-`, `pink-`, `purple-` trong className.
- [ ] Script `.agents/scripts/slop_scan.ps1` in đúng các chỉ số mục 2.
- [ ] Thêm checklist mục 5 vào mẫu mô tả merge.
- [ ] `max-lines` 600 (warning) cho `src/roles/**/views`.

#### UIQ-08 · Kiểm định cuối — FE · ❌ · UI checklist Phase 4
- [ ] `typecheck`, `eslint --max-warnings 0`, `npm run build` sạch (test khi user yêu cầu).
- [ ] Đi tay luồng: Login → Workspaces → Series → Chương/Việc → Bàn làm việc theo vai trò.

## 4. Rủi ro

| Rủi ro | Cách giảm |
|---|---|
| Đổi chữ làm vỡ test tìm theo text | Sửa test trong cùng commit |
| Xung đột với người đang sửa cùng role | Làm sau khi phần đó đã commit |
| Nâng cỡ chữ tràn bố cục | Kiểm 375px và 1280px mỗi lô |
| Tách file đổi hành vi ngầm | Tách thuần trước, đổi giao diện sau, mỗi việc một commit |
| Gỡ số liệu giả làm trống màn | Dùng DTO thật hoặc empty state có hành động |

## 5. Checklist kiểm định mỗi màn hình

- [ ] **Trung thực:** không số liệu, nhãn, lời chứng thực hay nhãn "AI" nào không có nguồn thật.
- [ ] **Purpose Test:** mỗi thẻ, nút, badge phục vụ một hành vi nghiệp vụ; không nút trùng chức năng.
- [ ] **AI Cliché:** không gradient tím-xanh, glow, neon, hiệu ứng trang trí (hạt mừng, khử nhiễu giả); Sparkles chỉ ở tính năng gọi AI thật.
- [ ] **Paper & Ink:** chỉ `stone-*`, nền giấy ấm, mực cam `#EA580C`; tím chỉ cho AI.
- [ ] **Code Hygiene:** view ≤ 600, component ≤ 400 dòng; không comment lặp tên hàm; không nuốt lỗi rồi báo thành công.
- [ ] **Chữ & chạm:** chữ ≥ 12px (web) / 12sp (mobile); nút ≥ 36px (web) / 44dp (mobile); nút chỉ icon có `aria-label`.

Kiểm tra trước khi gộp: `npm run typecheck`, `npm run i18n:check`, `npm run build`; `flutter analyze`.

## 6. Văn phong & thuật ngữ chuẩn

**Độ dài:** nút 2–3 từ (≤ 18 ký tự) · tiêu đề bảng/modal 4–6 từ (≤ 40) · nhãn form 1–3 từ (≤ 25) · toast/banner ≤ 100 ký tự.

| Thuật ngữ | Dùng |
|---|---|
| Workspace | Studio |
| Series Bible | Series Bible (Hồ sơ tác phẩm) |
| Canon Locked | Đã khoá chuẩn (Canon) |
| Supersede | Thay bản khoá (không dùng "Mở khoá") |
| Pipeline Stage | Công đoạn |
| Assignment | Nhiệm vụ / Phân công |
| StageProgress | Tiến độ công đoạn |
| Submission | Bản nộp (Chờ duyệt / Đã duyệt / Đã trả về) |
| Change Request | Yêu cầu sửa (Mới / Đã sửa / Đã xác minh) |
| Review / Approve / Reject | Kiểm duyệt / Phê duyệt / Trả về |
| Frame Template | Mẫu khung tranh |
| Key Artwork Region | Vùng nét vẽ trọng tâm |
| Speech / Thought Balloon / Narration Box | Bóng thoại / Bóng suy nghĩ / Hộp dẫn chuyện |
| Text Overflow | Tràn chữ |
| Reading Order | Thứ tự đọc (Phải qua trái / Trái qua phải) |
| Consistency Finding | Lỗi bất nhất (Chặn / Cảnh báo / Thông tin) |
| Provenance Report | Báo cáo nguồn gốc nội dung |

Cấm: "Delve", "Seamless experience", "Elevate your workflow", "Unlock the power of…", "Trải nghiệm đỉnh cao", "Khai phá tiềm năng vô tận". Dùng từ của studio: "Lưu bản thảo", "Gửi duyệt phân cảnh", "Khoá kịch bản tập 3".

## 7. Changelog

| Ngày | Task | Trạng thái | Nhánh / Commit | Ghi chú |
|---|---|---|---|---|
| 2026-11-11 | Đợt 1 (GĐ1–GĐ4) | ✅ | xem mục 1 | |
| 2026-11-12 | — | Chuyển sang bộ plan module | — | Từ `ANTI_SLOP_REFACTOR_PLAN.md` + checklist/Lucian/glossary cũ |
