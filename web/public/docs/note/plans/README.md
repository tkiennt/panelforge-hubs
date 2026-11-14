# BỘ KẾ HOẠCH TRIỂN KHAI THEO MODULE — PANELFORGE SPEC V2.6

> **Nguồn đặc tả:** [`docs/V2.6/PANELFORGE_MASTER_SPECIFICATION_V2_6.md`](../../V2.6/PANELFORGE_MASTER_SPECIFICATION_V2_6.md) — bản SSOT duy nhất trong `panelforge-hub`. Bộ plan trong `docs/note/plans/` được quản lý tập trung trong `panelforge-hub` và push lên GitHub cùng `docs/tracking/TEAM_WORKBOARD.md`.
> **Plan tổng (đối chiếu codebase, quyết định đã chốt, changelog chung):** [`note/PANELFORGE_V2_6_IMPLEMENTATION_PLAN.md`](../PANELFORGE_V2_6_IMPLEMENTATION_PLAN.md).
> **Lập ngày:** 2026-11-12. Thay thế toàn bộ plan cũ: `SCRIPT_FLOW_REFACTOR_PLAN.md`, `SERIES_BIBLE_REDESIGN_PLAN.md`, `ANTI_SLOP_REFACTOR_PLAN.md`, `archive/IMPLEMENTATION_PLAN_V2_5.md`, `archive/implement-plan/**`. Phần còn giá trị tham khảo của chúng đã được chép vào plan module tương ứng.

---

## 1. Danh sách module

| # | File | Prefix | Phạm vi | Spec | Tiến độ |
|---|---|---|---|---|---|
| 1 | [01_SCRIPT_PLAN.md](01_SCRIPT_PLAN.md) | `SCR` | Soạn kịch bản, vòng đời kịch bản, duyệt & khoá (phần kịch bản của Gate 1), mở lại/sửa muộn | Module 1, 4 · §1.2 | D1–D6 đã chốt; sẵn sàng làm từ Phase A |
| 2 | [02_BIBLE_PLAN.md](02_BIBLE_PLAN.md) | `BIB` | Series Bible: biến thể tạo hình, phiên bản concept & góp ý (Editor xác nhận = khoá Canon), Danh sách & Bản đồ thực thể chương chốt ở Gate 1, màn Bible | Module 1 · BR-01/06/15/21/30/35 · Q16–Q20 | Vòng đời cũ xong; BIB-09..17 (Q16/Q19, 1A–9A) và BIB-10 (Q20) chưa làm |
| 3 | [03_ASSIGNMENT_PLAN.md](03_ASSIGNMENT_PLAN.md) | `ASG` | Giao việc, pipeline, Kanban, giao Page tại Gate 1, Ink ∥ Lettering, chia/chuyển phạm vi | Phần II · BR-19/23/30 | Phần lớn chưa làm |
| 4 | [04_ARTWORK_PLAN.md](04_ARTWORK_PLAN.md) | `ART` | Bàn vẽ Artist (Layout, Pencil, Ink), đặt chữ (Artist/Letterer), thứ tự đọc, upload artwork, ngôn ngữ bóng thoại | Module 2 · BR-04/05/20/27/31/34 | BR-31 xong (P0); còn nhiều hạng mục |
| 5 | [05_REVIEW_PLAN.md](05_REVIEW_PLAN.md) | `REV` | Gate 2: duyệt trang, khoanh lỗi, cô lập Panel, ChangeRequest, so sánh phiên bản | Module 3 · BR-06/27 | Luật 4 mắt xong (P0); thiếu thuật toán giao thoa, định tuyến theo lớp |
| 6 | [06_RELEASE_PLAN.md](06_RELEASE_PLAN.md) | `REL` | Vòng đời Chương & ấn bản ngôn ngữ (Editor duyệt bản dịch, Producer cho phép phát hành), Gate 3, Snapshot theo ấn bản, PreviewLink, Export, Publisher Portal (một Publisher duy nhất) | Module 5 · §5.2 · BR-09/12/16/17/32/34 | Gate 3 xong một phần (P0) |
| 7 | [07_READER_PLAN.md](07_READER_PLAN.md) | `RDR` | Độc giả: thống kê đọc & doanh thu VNĐ (Producer xem), đánh giá, kiếm tiền theo ấn bản (Publisher đặt giá VNĐ, mua ngôn ngữ nào đọc ngôn ngữ đó), chọn ngôn ngữ đọc | Module 5 · BR-32/33/34 · §6.1 | Chưa làm |
| 8 | [08_UI_QUALITY_PLAN.md](08_UI_QUALITY_PLAN.md) | `UIQ` | Chống AI-slop, token thiết kế, i18n, mobile, chốt chặn, thuật ngữ | AGENTS.md §7 · DESIGN_RULES | Đợt 1 xong; GĐ5–GĐ12 chưa làm |

Hạng mục đã xong và không còn việc (Workspace, Series, thành viên, audit transactional, CAS, optimistic concurrency, event store): xem bảng M0/M1 trong plan tổng, không có plan riêng.

---

## 2. Quy tắc phối hợp: một bộ plan cho cả BE, FE, Mobile

> Đây là **nguồn quy tắc duy nhất** cho mọi agent và thành viên làm ở `PanelForge_FA26SE251` (BE), `panelforge-fe` (FE), `panelforge-mobile` (MO). `CLAUDE.md` của từng repo chỉ trỏ về đây; nếu có chỗ khác nhau thì theo mục này.

### 2.1. Nguồn sự thật

| Loại | Vị trí duy nhất | Ghi chú |
|---|---|---|
| Đặc tả nghiệp vụ | `panelforge-hub/docs/V2.6/PANELFORGE_MASTER_SPECIFICATION_V2_6.md` | Bản SSOT duy nhất trên GitHub. Chỉ đổi khi user chốt quyết định (ghi vào bảng "Nhật ký quyết định" Q-n). Không giữ bản sao ở các repo code BE/FE/Mobile. |
| Plan tổng | `panelforge-hub/docs/note/PANELFORGE_V2_6_IMPLEMENTATION_PLAN.md` | Đối chiếu codebase, quyết định đã chốt, changelog chung. |
| Task | `panelforge-hub/docs/note/plans/0X_*.md` | Một task chỉ nằm ở **một** plan module. Không tạo file plan trong các repo code; plan cũ đã xong chuyển vào `docs/note/archive/`. |

### 2.2. Cấu trúc một task dùng chung nhiều repo

1. **ID:** `<PREFIX>-<nn>` (vd `ASG-03`); ghi chú "cũ …" giữ ID cũ (`P1-03`, `S2-01`, `GĐ6`…) để tra lịch sử commit.
2. **Dòng tiêu đề ghi repo tham gia:** `— DB + BE + FE + MO`. Trạng thái: ✅ xong · 🟡 có một phần / lệch đặc tả · ❌ chưa có · ⏸️ hoãn · 🔍 chưa xác minh kỹ (đọc code xác nhận trước khi sửa) · 🔄 đang làm (xem §2.4).
3. **Sub-task gắn tiền tố repo:** `- [ ] [BE] …`, `- [ ] [FE] …`, `- [ ] [MO] …`, `- [ ] [DB] …`, `- [ ] [QA] …`. Task cũ chưa có tiền tố: agent nhận task thêm tiền tố khi bắt đầu.
4. **Hợp đồng API trước:** task có cả BE và FE/MO phải có khối `**Hợp đồng API:**` (endpoint, request/response DTO, mã lỗi) do BE ghi vào task **trước khi** FE/MO bắt đầu phần gọi API. FE/MO không tự đặt tên trường; thiếu thì hỏi BE qua task.
5. **Phụ thuộc:** dòng `**Phụ thuộc:**` liệt kê task phải xong trước (xem sơ đồ §3).

### 2.3. Thứ tự làm và merge

1. **[DB] → [BE]:** migration + domain + handler + endpoint + test, build xanh, merge cục bộ vào `trungkien` của BE, ghi Hợp đồng API vào task. (Chỉ push lên remote khi hoàn thành module lớn hoặc khi user yêu cầu).
2. **[FE] và [MO] song song** sau khi BE đã có trên `trungkien` (hoặc làm phần UI không gọi API trước, nối API sau).
3. Mỗi repo merge vào `trungkien` **của chính repo đó**; không đẩy nhánh feature lên remote (`.agents/AGENTS.md` §6).
4. Đổi hợp đồng API sau khi FE/MO đã dùng: BE ghi rõ thay đổi vào task, đánh `[ ]` lại các sub-task FE/MO bị ảnh hưởng.

### 2.4. Nhận task để không đụng nhau

1. **Trước khi code**, thêm một dòng vào §2 "Đang làm" của [`TEAM_WORKBOARD.md`](../../tracking/TEAM_WORKBOARD.md) (người/phiên, repo, ID task, nhánh, file chính dự kiến), đổi trạng thái task sang 🔄, rồi commit cục bộ `docs(tracker): start …`. Workboard là bảng nhận task duy nhất (§5 dưới đây chỉ trỏ về đó). Một phần repo của một task chỉ có **một** người nhận; BE và FE của cùng task có thể do hai người khác nhau.
2. **Không nhận** task mà cột "File chính" đụng file đang có ở §2 workboard của task khác; chờ hoặc phối hợp với người đang giữ.
3. **Worktree / Sandbox theo số lượng Agent:**
   - **Khi 1 Agent làm việc đơn lẻ:** **KHÔNG tạo sandbox**, làm việc và commit trực tiếp trong repository chính ở nhánh `trungkien`.
   - **Khi có từ 2 Agent trở lên chạy song song:** Tạo sandbox riêng cho từng agent qua lệnh: `powershell -ExecutionPolicy Bypass -File .agents\scripts\worktree_manager.ps1 -Action create -AgentRole <task-id viết thường> -Module <task-id viết thường> -Target <backend|frontend|mobile|all>`. Dùng ID task làm `AgentRole` để mỗi task có sandbox riêng (`panelforge-agent-<task-id>`). Sau khi tạo, kiểm tra `git branch --show-current` đúng `feature/<task-id>-be|fe|mobile`.
4. **Xong sub-task:** Nếu làm trên sandbox worktree thì merge cục bộ vào `trungkien` và dọn worktree; nếu làm trực tiếp 1 agent thì commit rõ ràng vào `trungkien`. Đổi trạng thái task, ghi Changelog (mục 2.5); chuyển dòng trong `TEAM_WORKBOARD.md` sang "Đã xong" kèm thay đổi API/DB, commit `docs(tracker): finish …`. **KHÔNG push sau mỗi lần làm; chỉ push remote khi hoàn thành trọn vẹn 1 module lớn hoặc khi user yêu cầu.**

### 2.5. Sửa file plan an toàn (`docs/` của `panelforge-hub`, chia sẻ qua GitHub)

0. `git -C panelforge-hub pull` trước khi sửa; sửa xong commit cục bộ `docs(<scope>): …`. Không push sau mỗi lần sửa nhỏ; chỉ push khi hoàn thành module lớn hoặc khi user yêu cầu.
1. Đọc lại file ngay trước khi sửa; chỉ sửa **khối task của mình** và **thêm dòng** vào Changelog/bảng §5. Không viết lại cả file, không sắp xếp lại task của người khác.
2. Task đã xong không xoá, không di chuyển; giữ làm lịch sử.
3. Việc mới phát sinh: thêm task mới (ID tiếp theo) vào plan module đúng mảng, kèm tiền tố repo; quyết định cần user chốt thì ghi vào mục "Còn mở" của plan tổng, không tự quyết.
4. Ghi Changelog ở **plan module** và **plan tổng** (ngày, task, repo, nhánh/commit).

### 2.6. Kiểm tra & chất lượng

1. Chỉ `dotnet build` / `npm run typecheck` / `npm run i18n:check` / `flutter analyze`. Không chạy test runner trừ khi user yêu cầu, nhưng **phải viết/cập nhật test** cho mọi đổi luật nghiệp vụ.
2. Agent: BE = `backend-expert`, FE = `frontend-expert`, MO = `mobile-expert`, DB = `db-architect`, QA = `qa-tester`, REV = `architect-reviewer` (nên chạy trước khi merge task nhiều repo).
3. UI mới phải qua checklist [08_UI_QUALITY_PLAN.md §5](08_UI_QUALITY_PLAN.md#5-checklist-kiểm-định-mỗi-màn-hình) và thuật ngữ §6; Mobile theo `panelforge-mobile/lib/theme/app_theme.dart`.

---

## 3. Thứ tự & phụ thuộc giữa module

```
SCR S0 (sửa lỗi, dọn code chết) ── làm ngay, độc lập
BIB-FE ─────────────────────────── làm ngay, độc lập (backend đã xong)
UIQ-01 (trung thực dữ liệu) ────── làm ngay, độc lập

SCR S1 (dữ liệu) ─► SCR S2 (vòng đời) ─► SCR S3..S6
                          │
REL-01 (ChapterStatus) ◄──┘ làm cùng SCR-08 (ScriptStatus)
                          │
ASG-01 (giao Page tại Gate 1) ◄── cần SCR-10 (ApproveScript) + REL-01
ASG-02 (Ink ∥ Lettering) ─► ART-08 (composite nền) ─► REV-* (Gate 2)
REV-01 (giao thoa 15%) ─► REV-02 (lớp lỗi) ─► REV-03 (Check Balloon Fit, dùng chung ART-06)
REL-02 (Gate 3 chặn trang chưa giao) ◄── ASG-01
RDR-01..06 (analytics) độc lập
ART-14 (ngôn ngữ Series + bản dịch) ─► ART-15 (kiểm tra & tiến độ dịch)
ART-14 + REL-01 ─► REL-09 (ấn bản ChapterEdition: nghiệm thu/phát hành theo ngôn ngữ) ─► REL-08 (Snapshot theo ấn bản)
REL-09 + REL-04 (một tài khoản Publisher) ─► RDR-07 (giá VNĐ theo ấn bản) ─► RDR-10 (mở khoá theo ấn bản)
RDR-12 (tiền nạp về tài khoản nền tảng) độc lập, nên làm trước RDR-10
REL-08 ─► RDR-11 (độc giả chọn ngôn ngữ)
```

## 4. Những gì đã bỏ khỏi plan cũ (không làm)

| Nguồn cũ | Hạng mục | Lý do bỏ |
|---|---|---|
| `SCRIPT_END_TO_END_REFACTOR_MASTER_PLAN.md`, `PAGE_BASED_SCRIPT_EDITOR_AND_DYNAMIC_ENTITY_LINKING_PLAN.md` | Toàn bộ | Bị thay bởi `01_SCRIPT_PLAN.md` (thiết kế mới có `ScriptStatus`, `ScriptLineKind`, Scene ẩn) |
| `LUCIAN_UXUI_ENHANCEMENT_INTEGRATION_PLAN.md` | #017 thanh trượt nghiêng, #020 hiệu ứng mực dâng, #280 mô phỏng khử nhiễu AI, #093 hạt mừng hoàn thành, #255 thẻ kéo nghiêng | Trang trí, trái AGENTS.md §7.2 (anti-slop). Các mục có chức năng thật được giữ trong plan module |
| `IMPLEMENTATION_PLAN_V2_5.md` | Phase 1–2 | Đã xong; phần còn lại (Phase 3) chuyển vào `03_ASSIGNMENT_PLAN.md` |
| `archive/implement-plan/completed/*` (13 file) | Toàn bộ | Đã hoàn thành; quy chuẩn màu/chữ đã nằm trong `panelforge-hub/docs/spec/DESIGN_RULES.md`. Bảng thuật ngữ và checklist còn mở chép vào `08_UI_QUALITY_PLAN.md` |
| `panelforge-fe/docs/implement-plan/ongoing/editor-review-screens.md` | Phần "Next" | Chép vào REV-06 và REL-03. Đã gỡ khỏi repo (FE `9b4577b`) cùng việc đổi quy trình tài liệu sang `note/plans/` |
| `PanelForge_FA26SE251/docs/superpowers/plans/2026-10-31-native-dotnet-panel-splitter.md` | Task 5–6 | Chép vào ART-13. Đã gỡ khỏi repo (BE `c74649d`) |

---

## 5. Đang làm (bảng nhận task — §2.4)

Gộp vào §2 "Đang làm" của [`docs/tracking/TEAM_WORKBOARD.md`](../../tracking/TEAM_WORKBOARD.md) từ 2026-11-12 để chỉ còn một bảng nhận task.
