# MA TRẬN CHIA NHỎ VÀ ĐIỀU PHỐI KIỂM THỬ THEO MODULE (MODULE TEST EXECUTION MATRIX)

> **Dự án:** PanelForge Manga Production Platform (`SEP490_FA26SE251`)  
> **Tài liệu chuẩn:** `panelforge-hub/docs/standards/MODULE_TEST_EXECUTION_MATRIX.md`  
> **Áp dụng cho:** Tất cả AI Agent (Lead, Backend-expert, Frontend-expert, Mobile-expert, QA-tester) & Developers.

---

## 1. NGUYÊN TẮC CỐT LÕI (CORE INVARIANTS)

1. ❌ **TUYỆT ĐỐI CẤM CHẠY TEST LẠI TOÀN BỘ HỆ THỐNG (NO FULL-SYSTEM TEST RE-RUNS):**
   - Không chạy `dotnet test` toàn bộ solution `.slnx`.
   - Không chạy `vitest run` / `npm test` toàn bộ repo frontend mà không chỉ định file/path.
   - Không chạy `flutter test` toàn bộ thư mục test mobile mà không chọn lọc.
   - **Lý do:** Dự án có hơn 500 unit test Backend, hơn 160 test suites Frontend, hàng chục test suite Mobile. Chạy full suite tiêu tốn từ 2 đến 5 phút, tạo ra hàng chục nghìn dòng log, làm tràn context window (hàng chục nghìn token vô ích) và tăng nguy cơ timeout/file-lock.

2. 🎯 **CHỈ CHẠY TEST MODULE ĐANG SỬA VÀ THÀNH PHẦN LIÊN QUAN (TARGETED MODULAR TESTING):**
   - Khi sửa đổi logic hoặc thêm tính năng tại một module cụ thể, **CHỈ ĐƯỢC CHẠY TEST CỦA MODULE ĐÓ VÀ CÁC MODULE TRỰC TIẾP PHỤ THUỘC (IMPACT RADIUS)**.
   - Khi commit thông thường: Chỉ chạy **Fast Syntax Check** (`dotnet build`, `npm run typecheck`, `flutter analyze`). Chỉ chạy test runner khi:
     - User có chỉ thị kiểm thử trực tiếp (ví dụ: *"test module bible"*, *"chạy test"*, *"kiểm tra tính năng vừa sửa"*).
     - Hoặc cần xác minh một bug-fix cụ thể trong phạm vi module đó.

3. ⚡ **CÔNG CỤ THỰC THI 1-CHẠM (AUTOMATION RUNNER):**
   - Toàn bộ việc ánh xạ và lọc test đã được tự động hoá trong script:
     ```powershell
     powershell -File panelforge-hub/.agents/scripts/run_module_tests.ps1 -Module <tên_module> [-Target <all|backend|frontend|mobile>] [-OnlyDirect]
     ```
   - Hỗ trợ tự động phát hiện module từ thay đổi git:
     ```powershell
     powershell -File panelforge-hub/.agents/scripts/run_module_tests.ps1 -AutoDetect
     ```

---

## 2. BẢNG MA TRẬN PHÂN CHIA TEST THEO MODULE & BÁN KÍNH ẢNH HƯỞNG (IMPACT RADIUS)

| Mã Module | Tên Module | Phạm vi nghiệp vụ | Module liên quan trực tiếp (Impact Radius) | Backend Test Filter (.NET xUnit) | Frontend Test Paths (Vitest) | Mobile Test Files (Flutter) |
|---|---|---|---|---|---|---|
| **`script`** | 01_SCRIPT (Kịch bản) | Script editor, ScriptLines, Dialogue, Scenes, Refreeze, Story Flow | `bible`, `assignment` | `FullyQualifiedName~Application.ScriptLines\|FullyQualifiedName~Application.Scenes` | `src/roles/writer`<br/>`src/services/scriptLine.service.test.ts` | *(Không có)* |
| **`bible`** | 02_BIBLE (Series Bible) | Hồ sơ nhân vật, bối cảnh, thực thể, quan hệ, AI Bible rules, revision | `script`, `review` | `FullyQualifiedName~Application.Bible\|FullyQualifiedName~Application.Consistency` | `src/shared/features/series-bible`<br/>`src/services/bible.service.test.ts`<br/>`src/roles/editor/views/BibleReviewView.test.tsx` | *(Không có)* |
| **`assignment`** | 03_ASSIGNMENT (Phân công) | Phân công vai trò, Pipeline Stage, TaskGrid, Series Members, Start Production | `script`, `artwork` | `FullyQualifiedName~Application.Assignments\|FullyQualifiedName~Application.SeriesPipeline\|FullyQualifiedName~Application.TaskGrid\|FullyQualifiedName~Application.Progress\|FullyQualifiedName~Application.SeriesMembers` | `src/roles/producer`<br/>`src/shared/features/pipeline-board`<br/>`src/shared/features/production-workspace`<br/>`src/services/assignment.service.test.ts` | *(Không có)* |
| **`artwork`** | 04_ARTWORK (Họa sĩ & Canvas) | Bàn vẽ họa sĩ, chia ô panel, balloon thoại, canvas elements, frame templates | `assignment`, `review` | `FullyQualifiedName~Application.Panels\|FullyQualifiedName~Application.CanvasElements\|FullyQualifiedName~Application.Pages\|FullyQualifiedName~Application.FrameTemplates\|FullyQualifiedName~Ai` | `src/roles/artist`<br/>`src/roles/letterer`<br/>`src/shared/lib/lettering`<br/>`src/services/artwork.service.test.ts`<br/>`src/services/panel.service.test.ts` | *(Không có)* |
| **`review`** | 05_REVIEW (Thẩm định & Feedback) | Editor desk, duyệt kịch bản/artwork, Change Requests, Provenance logs | `artwork`, `script` | `FullyQualifiedName~Application.Progress\|FullyQualifiedName~Application.PreviewLinks` | `src/roles/editor`<br/>`src/shared/features/provenance`<br/>`src/shared/features/script-review` | `test/offline_security_test.dart`<br/>`test/read_guard_test.dart` |
| **`release`** | 06_RELEASE (Xuất bản & Thanh toán) | Publisher portal, phát hành chương, định giá, CBZ, nạp xu ví, SePay, Google Play | `reader`, `auth` | `FullyQualifiedName~Application.Payments\|FullyQualifiedName~Application.Exports\|FullyQualifiedName~Infrastructure.Exports` | `src/roles/publisher`<br/>`src/services/payment.service.ts`<br/>`src/services/export.service.test.ts` | `test/google_play_billing_test.dart`<br/>`test/monetization_test.dart`<br/>`test/wallet_history_test.dart`<br/>`test/cbz_package_service_test.dart` |
| **`reader`** | 07_READER (Trình đọc truyện) | Trình đọc Web / Mobile, phân trang cuộn dọc, DRM screen protection, offline sync | `release`, `auth` | `FullyQualifiedName~Application.Catalog\|FullyQualifiedName~Application.PreviewLinks` | `src/roles/reader`<br/>`src/shared/modals/ChapterReaderModal.test.tsx` | `test/comic_reader_test.dart`<br/>`test/vertical_page_slider_test.dart`<br/>`test/paid_pages_test.dart`<br/>`test/downloads_page_test.dart`<br/>`test/reader_settings_test.dart`<br/>`test/screen_security_test.dart`<br/>`test/search_page_test.dart`<br/>`test/library_sync_test.dart` |
| **`auth`** | 08_AUTH & ADMIN (Bảo mật & Quản trị) | Đăng nhập, Đăng ký, JWT, RBAC Zero-Trust, Workspace, Admin, AI Config | `collaboration` | `FullyQualifiedName~Application.Auth\|FullyQualifiedName~Application.Users\|FullyQualifiedName~Application.Workspaces\|FullyQualifiedName~Application.Admin\|FullyQualifiedName~Application.AiConfig\|FullyQualifiedName~Infrastructure.Authentication` | `src/roles/guest`<br/>`src/roles/admin`<br/>`src/services/auth.service.test.ts`<br/>`src/services/user.service.test.ts`<br/>`src/shared/features/account`<br/>`src/shared/features/profile` | `test/auth_service_test.dart`<br/>`test/login_unverified_and_back_test.dart`<br/>`test/app_config_test.dart`<br/>`test/api_config_test.dart` |
| **`collaboration`**| 09_COLLABORATION (Realtime & Thông báo) | SignalR hubs, presence, Broadcast, Notification Center | `assignment`, `review` | `FullyQualifiedName~Application.Notifications` | `src/shared/features/collaboration`<br/>`src/services/notification.service.test.ts`<br/>`src/shared/views/NotificationCenterView.test.tsx` | `test/notifications_test.dart` |

---

## 3. HƯỚNG DẪN THỰC THI CHO AI AGENT & DEVELOPERS

### Cách 1: Sử dụng Runner Tự Động (Khuyến nghị)
```powershell
# Chạy test module Script kèm các module liên quan (Bible, Assignment):
powershell -File panelforge-hub/.agents/scripts/run_module_tests.ps1 -Module script

# Chạy test module Bible trên chỉ Backend và chỉ phạm vi trực tiếp (bỏ qua module liên quan):
powershell -File panelforge-hub/.agents/scripts/run_module_tests.ps1 -Module bible -Target backend -OnlyDirect

# Tự động nhận diện module vừa sửa đổi:
powershell -File panelforge-hub/.agents/scripts/run_module_tests.ps1 -AutoDetect
```

### Cách 2: Chạy Thủ Công Bằng CLI Từng Repo

#### Backend (.NET 9 UnitTests):
> 💡 *Mẹo:* Luôn trỏ trực tiếp file `.csproj` của test project và truyền cờ `--filter`, không trỏ cả solution `.slnx`:
```powershell
# Ví dụ chạy test cho module Bible:
dotnet test PanelForge_FA26SE251/test/PanelForge.UnitTests/PanelForge.UnitTests.csproj --filter "FullyQualifiedName~Application.Bible|FullyQualifiedName~Application.Consistency" -v q --nologo
```

#### Frontend (React 19 Vitest):
> 💡 *Mẹo:* Truyền đúng đường dẫn thư mục hoặc file test cần chạy vào sau dấu `--`:
```bash
# Ví dụ chạy test cho module Artwork (Họa sĩ & Letterer):
npm --prefix panelforge-fe run test:run -- "src/roles/artist" "src/roles/letterer" "src/services/artwork.service.test.ts"
```

#### Mobile (Flutter Test):
> 💡 *Mẹo:* Truyền đúng danh sách tệp kiểm thử cần chạy:
```bash
cd panelforge-mobile
flutter test test/comic_reader_test.dart test/vertical_page_slider_test.dart
```
