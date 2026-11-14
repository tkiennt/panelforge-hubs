# BẢNG THEO DÕI CÔNG VIỆC NHÓM (TEAM WORKBOARD)

> Một file duy nhất cho cả 4 repo (`PanelForge_FA26SE251`, `panelforge-fe`, `panelforge-mobile`, `panelforge-hub`). Ai pull `panelforge-hub` về cũng biết người khác đang làm gì, đã xong gì, có đổi API hay DB không.
> Nghiệp vụ tham chiếu: [`PANELFORGE_MASTER_SPECIFICATION_V2_6.md`](../V2.6/PANELFORGE_MASTER_SPECIFICATION_V2_6.md) (ghi mã BR-xx, Module hoặc quyết định Q-n khi khai báo việc).

---

## 1. Cách cập nhật (bắt buộc với mọi thành viên và AI agent)

1. **Trước khi code:** `git pull` nhánh `main` của `panelforge-hub`, thêm **một dòng** vào bảng §2 "Đang làm". Commit riêng:
   `docs(tracker): start <việc ngắn gọn>`
2. **Không nhận việc** đụng vào file đang có trong cột "File chính" của người khác ở §2. Hỏi người đó trước.
3. **Khi xong (đã merge vào nhánh chính của repo mình làm):** xoá dòng của mình ở §2, thêm **một dòng** lên đầu bảng §3 "Đã xong". Commit riêng vào `panelforge-hub`:
   `docs(tracker): finish <việc ngắn gọn>`
4. **Đổi API, DTO, DB hoặc enum** mà repo khác dùng: ghi rõ ở cột "Ảnh hưởng người khác" (endpoint, trường, migration). Không ghi được thì việc chưa xong.
5. Chỉ **thêm hoặc xoá dòng của chính mình**; không sửa dòng của người khác, không sắp xếp lại bảng. Gặp conflict khi pull thì giữ cả hai dòng.
6. Làm ở repo nào (BE, FE, MO) cũng cập nhật file này trong `panelforge-hub`, vì đây là nơi duy nhất cả nhóm cùng đọc. Repo code không giữ bản sao workboard.
7. **Quy tắc Push (AI Agent & Developer):** Tuyệt đối **KHÔNG push sau mỗi lần làm/mỗi prompt**. Mỗi lần sửa file trong `panelforge-hub/docs/` (workboard, plan, spec) hay code repo, chỉ commit cục bộ (`git commit`). **Chỉ push lên remote khi hoàn thành trọn vẹn 1 module lớn hoặc khi người dùng yêu cầu trực tiếp.**

**Cột "Repo":** `BE` = `PanelForge_FA26SE251` · `FE` = `panelforge-fe` · `MO` = `panelforge-mobile`.

---

## 2. Đang làm

| Người | Repo | Việc | Spec (BR / Module / Q) | Nhánh | File chính | Bắt đầu |
|---|---|---|---|---|---|---|
| DontPassAway | BE + FE | Series Bible: refactor màn hình, quyền thẩm định theo §5.1 (Writer/Editor endorse, Producer khoá, Admin không khoá), khoá Canon cho Nhân vật/Bối cảnh/Đạo cụ | Module 1, §5.1, §5.2, BR-01, BR-15 | `feature/series-bible-spec-v26` | `src/shared/features/series-bible/*`, `roles/editor/views/BibleReviewView.tsx`; BE `BibleController.cs` | 2026-11-12 |

---

## 3. Đã xong (mới nhất ở trên)

| Ngày | Người | Repo | Việc | Commit merge | Ảnh hưởng người khác (API / DB / enum) |
|---|---|---|---|---|---|
| 2026-11-14 | THBMinh (AI agent) | FE | Đồng bộ logic Bóng thoại (Lettering Balloons) theo Master Spec V2.6 & BR-34: tích hợp lưu trữ backend vào useLetteringBalloons (load/save qua elementService); đồng bộ engine dựng bóng và textStyle trên LetteringBalloonOverlay (5 shapes, tail di động, cảnh báo isStale BR-05); thêm bộ chọn ngôn ngữ đang soạn (Language Edition) trên LetteringWorkspace toolbar | FE `54bd7e3` (THBMinh) | Không đổi DB. FE thêm trường `texts?: Record<string, string>` vào `ElementSnapshotDto` và `UpdateElementTextRequest` |
| 2026-11-13 | MinhTHB (AI agent) | BE + FE | Merge `trungkien` vào `feature/publisher-monetization` (BE gộp conflict `Chapter.cs` + EF snapshot: giữ `PreviewPagesCustomized`, `Language` lẫn `ScriptStatus`/`ScriptVersion`); thêm rule Git workflow cho AI agent vào `CLAUDE.md`; BE 1227/1227 unit test pass | BE `b6be4bc`, `7dcd991`; FE `0ca3e5a`, `d78f1a3` (feature/publisher-monetization) | Không đổi API. DB snapshot gộp tay: cần kiểm tra `dotnet ef migrations add` ra migration rỗng |
| 2026-11-13 | trungkien (AI agent) | FE | Xây dựng side tab chuyển chương nhanh (ScriptChaptersDrawer): hiển thị danh sách chương kèm số cảnh/trang, trạng thái, tìm kiếm nhanh, tích hợp thanh biểu tượng ScriptStudioRail & phím tắt Alt+C | FE `0eb9aee` (trungkien) | Không đổi API/DB |
| 2026-11-13 | trungkien (AI agent) | FE | SCR-27 hoàn thiện & sửa 2 lỗi dữ liệu: Tin cậy declaredType không đoán regex (fix Action dính chữ bị lưu nhầm thành tiêu đề), bảo toàn speakerCharacterId khi luân phiên, ô gõ nhân vật tương tác (SpeakerPickerPopover) hỗ trợ tên quần chúng & hậu tố (nghĩ) D7, phím tắt Shift+Tab / Backspace lùi một bậc chuẩn H.1 | FE `c41ee87` (trungkien) | Không đổi API/DB |
| 2026-11-13 | trungkien (AI agent) | FE | Hoàn thành P1 Phase H (SCR-26, SCR-27) trong editor thật (`ScriptLineBlockNode.ts` & `ScreenplayFlowEditor.tsx`): Zero-syntax keyboard flow, xoá bỏ regex/ký tự mồi, phím tắt Ctrl+1..5, Ctrl+Enter, Ctrl+Shift+Enter, layout 2 cột Graphic Novel kèm luân phiên người nói A→B→A | FE `8bd3d54` (trungkien) | Không đổi API/DB. Dữ liệu kịch bản lưu text sạch không bọc ngoặc kép hoặc tiền tố giả lập |
| 2026-11-13 | trungkien (AI agent) | BE + FE | Hoàn thành Phase B (SCR-04, SCR-05, SCR-07) & Phase F/H (SCR-18, SCR-19, SCR-25, SCR-26, SCR-27): ScriptLineKind, Panel.Direction, WriteSolo flow & Element Menu | BE `09716d5`, FE `970c052` | DB migration `AddScriptLineKindAndPanelDirection`; BE thêm `ScriptLineKind`, `text`, `speaker_label` vào `script_lines`, `direction` vào `panels`, `PUT /api/panels/{id}/direction`; FE types, adapter, WriteSolo workspace & element menu |
| 2026-11-13 | trungkien (AI agent) | FE | SCR-25: Luật gõ dạng hàm thuần (scriptGrammar.ts) cho kịch bản Graphic Novel (H.1) + 19 unit test pass 100% | FE (trungkien) | Không đổi API/DB. Thêm `flow/grammar/scriptGrammar.ts` |
| 2026-11-12 | trungkien (AI agent) | FE | Sửa CI Frontend bị đỏ ở bước lint: format Prettier toàn bộ, sửa lỗi ESLint, chuyển module dùng chung sang `shared/` | FE `b252442` (trungkien) | Không đổi API/DB. FE đổi đường dẫn import: `ReasonForm` → `shared/components/`, `reviewModel` + `scriptReviewModel` → `shared/features/script-review/`, `AutoAssignScriptLinesModal` → `shared/modals/`, `DependencyGraphModal` → `shared/features/pipeline-board/`, `tempBibleCodes` → `shared/utils/`. Nhánh đang mở cần rebase/merge lại vì 172 file đổi định dạng |
| 2026-11-12 | trungkien | FE | Đưa đặc tả V2.6 vào `docs/` và tạo bảng theo dõi này | — | Không |
