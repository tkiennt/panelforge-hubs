# BẢNG THEO DÕI CÔNG VIỆC NHÓM (TEAM WORKBOARD)

> Một file duy nhất cho cả 4 repo (`PanelForge_FA26SE251`, `panelforge-fe`, `panelforge-mobile`, `panelforge-hub`). Ai pull `panelforge-hub` về cũng biết người khác đang làm gì, đã xong gì, có đổi API hay DB không.
> Nghiệp vụ tham chiếu: [`PANELFORGE_MASTER_SPECIFICATION_V2_6.md`](../V2.6/PANELFORGE_MASTER_SPECIFICATION_V2_6.md) (ghi mã BR-xx, Module hoặc quyết định Q-n khi khai báo việc).

---

## 1. Cách cập nhật (bắt buộc với mọi thành viên và AI agent)

1. **Trước khi code:** `git pull` nhánh `main` của `panelforge-hub`, thêm **một dòng** vào bảng §2 "Đang làm". Commit riêng và push ngay để người khác thấy:
   `docs(tracker): start <việc ngắn gọn>`
2. **Không nhận việc** đụng vào file đang có trong cột "File chính" của người khác ở §2. Hỏi người đó trước.
3. **Khi xong (đã merge vào nhánh chính của repo mình làm):** xoá dòng của mình ở §2, thêm **một dòng** lên đầu bảng §3 "Đã xong". Commit riêng vào `panelforge-hub`:
   `docs(tracker): finish <việc ngắn gọn>`
4. **Đổi API, DTO, DB hoặc enum** mà repo khác dùng: ghi rõ ở cột "Ảnh hưởng người khác" (endpoint, trường, migration). Không ghi được thì việc chưa xong.
5. Chỉ **thêm hoặc xoá dòng của chính mình**; không sửa dòng của người khác, không sắp xếp lại bảng. Gặp conflict khi pull thì giữ cả hai dòng.
6. Làm ở repo nào (BE, FE, MO) cũng cập nhật file này trong `panelforge-hub`, vì đây là nơi duy nhất cả nhóm cùng đọc. Repo code không giữ bản sao workboard.
7. **AI Agent:** mỗi lần sửa bất kỳ file nào trong `panelforge-hub/docs/` (workboard, plan, spec) thì commit theo `docs(<scope>): …` và `git push origin main` ngay trong cùng lượt làm việc, để cả nhóm thấy thay đổi khi pull.

**Cột "Repo":** `BE` = `PanelForge_FA26SE251` · `FE` = `panelforge-fe` · `MO` = `panelforge-mobile`.

---

## 2. Đang làm

| Người | Repo | Việc | Spec (BR / Module / Q) | Nhánh | File chính | Bắt đầu |
|---|---|---|---|---|---|---|
| DontPassAway | BE + FE | Series Bible: refactor màn hình, quyền thẩm định theo §5.1 (Writer/Editor endorse, Producer khoá, Admin không khoá), khoá Canon cho Nhân vật/Bối cảnh/Đạo cụ | Module 1, §5.1, §5.2, BR-01, BR-15 | `feature/series-bible-spec-v26` | `src/shared/features/series-bible/*`, `roles/editor/views/BibleReviewView.tsx`; BE `BibleController.cs` | 2026-11-12 |
| trungkien (AI agent) | FE | Sửa CI Frontend: lint đỏ (Prettier 4.7k lỗi + ~70 lỗi ESLint) | — | `feature/fe-ci-lint-fe` | Format toàn bộ `src/`, `e2e/`; sửa tay `ScriptEditorView.tsx`, `LetteringWorkspace.tsx`, `ScreenplayFlowEditor.tsx`, converter kịch bản; import chéo role (writer↔editor, letterer↔artist) | 2026-11-12 |

---

## 3. Đã xong (mới nhất ở trên)

| Ngày | Người | Repo | Việc | Commit merge | Ảnh hưởng người khác (API / DB / enum) |
|---|---|---|---|---|---|
| 2026-11-12 | trungkien | FE | Đưa đặc tả V2.6 vào `docs/` và tạo bảng theo dõi này | — | Không |
