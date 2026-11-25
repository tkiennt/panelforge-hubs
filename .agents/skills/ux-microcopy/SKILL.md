---
name: ux-microcopy
description: "Concise UX microcopy and zero-fluff UI guidelines based on Material 3, Microsoft Style Guide, and PanelForge Design System. Use when building, reviewing, or refactoring UI components, buttons, forms, modals, toasts, empty states, or alerts to eliminate explanatory filler, verbose labels, and AI fluff."
allowed-tools: Read Write Edit Glob Grep
---

# Concise UX Microcopy & Zero-Fluff UI (`ux-microcopy`)

> **Mục tiêu:** Loại bỏ hoàn toàn tình trạng AI Coding Agent tự ý sinh ra các thông báo, hướng dẫn (helper text), banner giải thích dài dòng hoặc nhãn nút rườm rà trên giao diện người dùng. Áp dụng chuẩn thiết kế thực tế từ **Material 3**, **Microsoft Style Guide**, và **PanelForge Design System** (`DESIGN_RULES.md`).

---

## Phạm vi áp dụng (Scope)
Kích hoạt tự động hoặc tham chiếu bắt buộc mỗi khi:
- Tạo mới hoặc tái cấu trúc (refactor) các component UI: Modals, Drawers, Cards, Forms, Toasts, Alerts, Empty States, Buttons / CTAs.
- Viết hoặc sửa đổi văn bản giao diện, thông báo lỗi, thông báo thành công trong `src/locales/` hoặc trực tiếp trong JSX/TSX.
- Thiết kế hệ thống nhãn, placeholder, tooltip, hoặc microcopy trong toàn bộ ứng dụng Web và Mobile.

---

## 4 Quy tắc cốt lõi (Strict Copywriting & UI Rules)

### 1. Zero Filler & Instructional Fluff (Cấm giải thích dài dòng)
- **NEVER** viết các đoạn văn bản hướng dẫn cách dùng ("how-to"), các câu giải thích hiển nhiên bên trong card, modal header hay thanh tiêu đề. Người dùng học giao diện qua tương tác trực quan, không phải đọc sách hướng dẫn trên màn hình làm việc.
- **Loại bỏ 100% từ đệm / từ kính cẩn / kêu gọi thừa thãi**:
  - Tiếng Việt: *"Vui lòng"*, *"Xin hãy"*, *"Bạn có thể"*, *"Hãy bấm vào đây để..."*, *"Nhấp vào nút để..."*, *"Hệ thống sẽ..."*.
  - Tiếng Anh: *"Please"*, *"Kindly"*, *"You can"*, *"Click here to..."*, *"In order to..."*, *"Feel free to..."*.
- **Hide empty descriptions**: Nếu thực thể/mục dữ liệu không có mô tả (description/subtitle is null/empty), hãy ẩn hoàn toàn (`null`), **KHÔNG** hiển thị placeholder thụ động như *"Chưa có mô tả"*, *"No description provided"*, *"Không có nội dung"*.

### 2. Giới hạn độ dài từ & ký tự (Strict Character & Word Ceilings)
- **Buttons / CTAs:**
  - Tối đa **2–3 từ** ($\le 18$ ký tự).
  - Công thức: `[Động từ hành động] + [Danh từ]` (vd: *"Lưu kịch bản"*, *"Tải ảnh"*, *"Khóa chuẩn"*, *"Thêm cảnh"*, *"Xuất bản"*).
  - **CẤM:** *"Xác nhận lưu thay đổi"*, *"Bấm để tiếp tục thực hiện"*, *"Lưu lại toàn bộ nội dung"*.
- **Form Labels & Placeholders:**
  - Nhãn (Label): Tối đa **1–3 từ**, trực diện (vd: *"Tên chương"*, *"Tác giả"*, *"Số trang"*).
  - Placeholder: **Chỉ hiển thị định dạng mẫu hoặc ví dụ cụ thể** (vd: `vd: Chương 1`, `email@domain.com`).
  - **CẤM:** Placeholder lặp lại nhãn (vd: Label là "Tên chương" thì placeholder **KHÔNG ĐƯỢC** là *"Nhập tên chương của bạn..."*).
- **Modal / Drawer / Section Headers:**
  - Tối đa **3–6 từ**. Nêu thẳng đối tượng hoặc hành động chính (vd: *"Chỉnh sửa nhân vật"*, *"Đề cương chương"*, *"Lịch sử phiên bản"*).
  - Không kèm theo subtitle giải thích sáo rỗng (như *"Nơi bạn quản lý tất cả các..."*).
- **Toasts, Alerts & Error Messages:**
  - Tối đa **1 câu ngắn gọn** ($\le 80$ ký tự).
  - Công thức: `[Chuyện gì đã xảy ra] + [Lý do/Hành động tiếp theo nếu có]`.
  - Ví dụ tốt: *"Tải ảnh thất bại. Tệp vượt quá 25 MB."*, *"Đã lưu kịch bản."*, *"Xung đột phiên bản. Đang tải lại..."*.
  - Ví dụ xấu: *"Rất tiếc, đã có lỗi xảy ra trong quá trình hệ thống cố gắng lưu lại kịch bản của bạn. Vui lòng thử lại sau ít phút hoặc liên hệ quản trị viên."*.

### 3. Không đưa mã kỹ thuật / Jargon nội bộ lên UI (No Raw Technical Jargon)
- **NEVER** hiển thị mã điều kiện nghiệp vụ nội bộ (`BR-11`, `BR-15`, `SCR-12`, `UC-06`), hash SHA-256 nội bộ, tên enum thô (`STAGE_IN_PROGRESS`), hoặc cờ developer (`v1.0-draft-internal`) lên giao diện người dùng cuối.
- Dịch toàn bộ sang ngôn ngữ người dùng tự nhiên (vd: thay vì *"Lỗi BR-12: Chapter is Approved"*, hiển thị *"Chương đã duyệt, không thể chỉnh sửa."*).
- Mã quy tắc chỉ được phép xuất hiện trong bảng Nhật ký kiểm toán (Audit Log) dành riêng cho Quản trị viên/Kỹ thuật.

### 4. Tiết lộ tăng tiến (Progressive Disclosure - Ẩn chi tiết thừa)
- Nếu một bối cảnh thực sự cần giải thích thêm cho người mới: Đặt vào trong **Hover Tooltip** (`<Tooltip>`) với biểu tượng `?` nhỏ bên cạnh — **KHÔNG BAO GIỜ** hiển thị thường trực dưới dạng dòng chữ dài trên màn hình chính.
- **Empty States (Trạng thái rỗng):**
  - Chỉ gồm đúng 2 thành phần: `[1 Tiêu đề ngắn gọn (2–4 từ)]` + `[1 Nút hành động chính]`.
  - Biểu tượng minh họa nhỏ gọn, trang nhã.
  - **KHÔNG** kèm theo 2-3 đoạn văn mô tả lê thê cách làm việc hay giới thiệu tính năng.

---

## Bảng đối chiếu Nhanh (Before & After Cheat Sheet)

| Loại UI | ❌ AI Slop / Verbose Copy | ✅ Concise Microcopy |
|---|---|---|
| **Primary Button** | *"Bấm vào đây để xác nhận lưu thay đổi"* | *"Lưu kịch bản"* |
| **Delete Button** | *"Tôi hiểu và muốn xóa phân cảnh này"* | *"Xóa cảnh"* |
| **Input Placeholder** | *"Vui lòng nhập tên nhân vật của bạn vào đây..."* | `vd: Akira, Kaito` |
| **Toast Success** | *"Chúc mừng! Kịch bản của bạn đã được cập nhật thành công vào hệ thống."* | *"Đã lưu kịch bản"* |
| **Toast Error** | *"Có lỗi xảy ra: Mã lỗi 409 CONFLICT do phiên bản kịch bản không đồng bộ."* | *"Nội dung đã được người khác sửa. Đang tải lại."* |
| **Empty State** | *"Hiện tại chưa có nhân vật nào được tạo trong chương này. Bạn có thể bấm vào nút bên dưới để bắt đầu tạo nhân vật đầu tiên cho câu chuyện của mình."* | **Chưa có nhân vật**<br/>`[+ Thêm nhân vật]` |
| **Modal Header** | *"Khung hội thoại thiết lập và tùy chỉnh các thuộc tính của phân cảnh"* | *"Thuộc tính cảnh"* |
| **Helper Text** | *"Lưu ý: Bạn chỉ có thể sửa khi kịch bản chưa được Producer phê duyệt theo quy chuẩn BR-12."* | `Icon (?) hover tooltip: "Chỉ sửa khi chưa duyệt"` |

---

## Checklist nghiệm thu (Verification Checklist)

Trước khi hoàn thành bất kỳ task UI nào, kiểm tra lại:
- [ ] Các nút bấm (Buttons) có tối đa 3 từ không? Có dùng dạng `[Động từ + Danh từ]` không?
- [ ] Toàn bộ từ đệm ("vui lòng", "bạn có thể", "xin hãy", "click here") đã bị loại bỏ chưa?
- [ ] Placeholder có hiển thị ví dụ định dạng thay vì lặp lại label không?
- [ ] Các thẻ Card, Drawer, Modal có bị nhét các đoạn văn bản hướng dẫn dài dòng không?
- [ ] Các thông báo Toast có ngắn gọn $\le 80$ ký tự và rõ ràng hành động không?
- [ ] Các mã nội bộ kỹ thuật (BR-*, mã lỗi kỹ thuật) đã được ẩn khỏi mắt người dùng chưa?
