# QUY CHUẨN COMMIT MESSAGE DỰ ÁN PANELFORGE (GIT COMMIT CONVENTION)

> **Dự án tốt nghiệp:** PanelForge – Nền tảng đồng sáng tác và quản lý sản xuất truyện tranh Manga hỗ trợ bởi AI Agent  
> **Mã nhóm:** FA26SE251 · **Học kỳ:** Fall 2026 – Spring 2027  
> **Tiêu chuẩn áp dụng:** [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)

---

## 1. Cấu trúc Commit Message chuẩn

```text
<type>(<scope>): <description>

[optional body: giải thích nguyên nhân và cách giải quyết]

[optional footer: breaking changes, mã tác vụ, liên kết issue]
```

### Quy tắc định dạng cơ bản:
- Dòng tiêu đề (`header`) không vượt quá **72 ký tự**.
- Dùng động từ mệnh lệnh thì hiện tại ở `<description>`: `add`, `fix`, `update`, `refactor`, `remove`, `enforce` (không dùng `added`, `fixes`, `updating`).
- Viết thường toàn bộ chữ cái đầu của `<description>`, **không kết thúc bằng dấu chấm (`.`)**.
- Ngăn cách giữa header, body và footer bằng **1 dòng trống**.
- Body ngắt dòng tối đa ở **72 – 80 ký tự**, tập trung trả lời câu hỏi: **Tại sao làm điều này? (Why)** và **Giải quyết ra sao? (How)**.

---

## 2. Bảng phân loại `<type>` (Bắt buộc)

| Type | Mục đích | Khi nào sử dụng trong PanelForge |
|---|---|---|
| `feat` | Thêm tính năng mới (Feature) | Thêm endpoint mới, màn hình mới, tích hợp AI Agent mới, component UI mới. |
| `fix` | Sửa lỗi (Bug fix) | Sửa lỗi logic, sửa crash, sửa lỗi 409 Conflict, sửa lỗi sai toạ độ canvas. |
| `docs` | Tài liệu (Documentation) | Cập nhật `PANELFORGE_MASTER_TRACKER.md`, Note, tài liệu kiến trúc, README. |
| `style` | Định dạng code | Format khoảng trắng, dấu chấm phẩy, ESLint/Prettier không đổi logic chạy. |
| `refactor` | Tái cấu trúc mã nguồn | Tách component, chuẩn hoá Clean Architecture, đổi tên biến/hàm cho rõ nghĩa. |
| `perf` | Cải thiện hiệu năng | Tối ưu truy vấn EF Core, giảm thời gian bundle Vite, tối ưu render canvas. |
| `test` | Kiểm thử tự động | Thêm/sửa Unit Test (xUnit, Vitest), mock data, snapshot testing. |
| `chore` | Việc vặt & cấu hình | Nâng cấp package npm/nuget, cấu hình Vite/Docker/CI-CD, dọn file tạm. |

---

## 3. Danh mục `<scope>` chuẩn theo dự án PanelForge

Scope chỉ rõ module hoặc luồng nghiệp vụ bị tác động (viết thường, viết gọn):

### Backend (`PanelForge_FA26SE251`)
- `api`: Controllers, định tuyến HTTP, middleware, lọc quyền.
- `auth`: Đăng nhập, cookie session, phân quyền vai trò Studio.
- `assignment`: Giao việc, DAG dependency, nhắc hạn, tiến độ StageProgress.
- `canvas`: Quản lý Element, sự kiện Marten, toạ độ Page/Panel.
- `script`: Phân cảnh Scene, kịch bản ScriptLine, liên kết Bible.
- `asset`: Tải lên Cloudflare R2, băm SHA-256, deduplication.
- `ai`: Multi-agent pipeline, Gemini Supervisor, AgentRunner, Validator.
- `consistency`: Luật kiểm tra nhất quán kịch bản và ảnh, finding triage.
- `review`: Cổng nộp bài (Submission), phê duyệt, ChangeRequest khoanh vùng.
- `chapter`: Tạo chương, duyệt chương, khoá chương, snapshot manifest.
- `export`: Xuất bản CBZ (kèm `ComicInfo.xml` RTL), PDF, JSON mở.

### Frontend (`panelforge-fe`)
- `ui`: Component dùng chung (`Button`, `Modal`, `Drawer`, `Toast`, `Layout`).
- `letterer`: Bàn làm việc chèn chữ (`LetteringWorkspace`, balloon, toolbar).
- `writer`: Soạn thảo kịch bản (`ScriptEditorView`), liên kết nhân vật.
- `artist`: Màn vẽ, canvas layout, upload tranh theo panel/trang.
- `editor`: Màn duyệt bài so sánh side-by-side, khoanh vùng ChangeRequest.
- `publisher`: Màn duyệt phát hành, lên lịch phát hành, từ chối kèm lý do.
- `producer`: Dashboard tiến độ theo stage, quản lý phân công DAG.
- `reader`: Cổng đọc công khai, link xem thử bí mật có watermark.
- `bible`: Quản lý Series Bible, bảng nhân vật (Character Sheet), bản khoá Canon.
- `service`: Tầng gọi API qua axios client, offline sync queue.

### Tài liệu & Ghi chú chung (`Note/`)
- `tracker`: Cập nhật tiến độ tổng thể trong `PANELFORGE_MASTER_TRACKER.md`.
- `notes`: Cập nhật biên bản họp, phân tích yêu cầu, kế hoạch hành động.
- `convention`: Cập nhật quy chuẩn Git commit, coding style.

---

## 4. Các ví dụ chuẩn mẫu theo từng Flow (CF1 – CF5)

### CF2 – Chapter Production (Kiên)
```text
feat(letterer): integrate LettererAgent for dialogue shortening

- Add AI dialogue shortening button in LetteringWorkspace toolbar & drawer
- Display comparison modal between original dialogue and LLM suggestion
- Allow letterer to accept/reject and update balloon text directly
- Pass active seriesId and handle chapter version vector for optimistic locking

Refs: #WP2-CF2-Task2.4
```

```text
feat(assignment): enforce panel reading order on layout submission

- Validate that all covered panels have ReadingOrder > 0 before submission
- Return 409 Conflict with descriptive message when reading order is missing
- Add unit test Submit_ArtistPageWithInvalidReadingOrder_IsConflict

Refs: #WP2-CF2-Task2.7
```

### CF3 – Quality Control (Minh)
```text
feat(consistency): add visual similarity check against locked character sheet

- Compare submitted artwork embeddings against locked bible reference images
- Flag any panel artwork with similarity score below threshold 0.75
- Expose finding triage status in ReviewView for editor inspection

Refs: #WP3-CF3-Task3.1
```

### CF4 – Version Control & Provenance (Hoà)
```text
feat(chapter): introduce ChapterSnapshot manifest on producer approval

- Freeze immutable page element versions, approved artwork hashes and script revision
- Record snapshot hash to establish cryptographic baseline for chapter export
- Enforce strict append-only audit trail in database

Refs: #WP4-CF4-Task4.1
```

### CF5 – Approval, Release & Export (Danh)
```text
feat(export): generate CBZ archive with ComicInfo XML for RTL reading

- Bundle page images into ZIP format with .cbz extension
- Generate ComicInfo.xml containing Manga right-to-left metadata flag
- Support asynchronous background ExportJob with completion notification

Refs: #WP5-CF5-Task5.2
```

### CF1 – Studio & Series Setup (Tâm)
```text
fix(auth): enforce session idle timeout check on token refresh

- Check session lastActiveAt against Workspace idleTimeoutMinutes policy
- Revoke expired session immediately instead of waiting for token expiration
- Return 401 Unauthorized with SESSION_EXPIRED error code

Refs: #WP1-CF1-Task1.4
```

---

## 5. File mẫu Git Commit Template (`.gitmessage.txt`)

File mẫu này được đặt tại [`Note/.gitmessage.txt`](file:///d:/FPT-STUDY/10_FALL-2026/SEP490/Github/Note/.gitmessage.txt) để git tự động hiển thị gợi ý mỗi khi chạy `git commit`:

```text
# ----------------------------------------------------------------------
# <type>(<scope>): <mô tả ngắn dưới 72 ký tự dạng mệnh lệnh không dấu chấm>
#
# <type>: feat | fix | docs | style | refactor | perf | test | chore
# <scope>: api | auth | assignment | canvas | letterer | writer | artist |
#          editor | publisher | producer | consistency | chapter | export | ...
# ----------------------------------------------------------------------
# [Optional Body: Giải thích TẠI SAO và NHƯ THẾ NÀO (ngắt dòng ở 72 ký tự)]
#
# ----------------------------------------------------------------------
# [Optional Footer: Breaking change hoặc mã công việc liên quan]
# Refs: #WP<1..5>-CF<1..5> | Closes #<issue>
# ----------------------------------------------------------------------
```

---

## 6. Hướng dẫn thiết lập áp dụng vào máy thành viên nhóm

Mỗi thành viên trong nhóm thực hiện cấu hình git một lần trên máy:

```bash
# Áp dụng template cho repository hiện tại (chạy tại thư mục gốc PanelForge)
git config commit.template Note/.gitmessage.txt

# Hoặc áp dụng toàn cục cho mọi dự án trên máy cá nhân:
git config --global commit.template "d:/FPT-STUDY/10_FALL-2026/SEP490/Github/Note/.gitmessage.txt"
```

Sau khi cấu hình, mỗi lần gõ lệnh `git commit` (không kèm cờ `-m`), trình soạn thảo mặc định (VSCode / Vim / Notepad) sẽ mở sẵn khung mẫu để bạn điền thông tin đúng chuẩn.

---

## 7. Quy tắc Push code lên Remote (Batch Push / On-Demand Only)

1. **Tuyệt đối KHÔNG push sau mỗi lần làm hay sau mỗi commit nhỏ / prompt.**
2. **Chỉ Push lên Remote GitHub khi:**
   - Hoàn thành trọn vẹn **1 module lớn** (toàn bộ task của module đã được kiểm tra, build xanh và gộp vào nhánh chính).
   - **HOẶC khi Người dùng (User) yêu cầu trực tiếp** (ví dụ: *"push code"*, *"push lên github"*).
3. Trong các phiên làm việc thông thường: Chỉ commit cục bộ (`git commit`) và gộp cục bộ vào nhánh `trungkien` để lưu vết lịch sử.
