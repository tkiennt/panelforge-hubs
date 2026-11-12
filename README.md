# PanelForge Hub — SSOT Docs & Multi-Repo Commit Viewer

> **Cổng tri thức trung tâm (Single Source of Truth) cho dự án PanelForge V2.6 Final (`SEP490_FA26SE251`)**  
> **Live Web (GitHub Pages):** https://tkiennt.github.io/panelforge-hubs/  
> **Repository:** https://github.com/tkiennt/panelforge-hubs

---

## 🌐 Truy cập sau khi Deploy

- **Trang chủ SSOT Docs:** https://tkiennt.github.io/panelforge-hubs/
- **Mở nhanh tài liệu qua Deep Link:** `https://tkiennt.github.io/panelforge-hubs/#/docs/<slug>`  
  Ví dụ: `https://tkiennt.github.io/panelforge-hubs/#/docs/V2.6/PANELFORGE_MASTER_SPECIFICATION_V2_6`

> **Lưu ý bật GitHub Pages lần đầu:**  
> Vào **Settings → Pages → Build and deployment → Source** và chọn **GitHub Actions** (repository cần ở chế độ **Public** nếu dùng tài khoản GitHub Free). Mọi lần push lên nhánh `main` sẽ tự động chạy workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) và cập nhật trang web.

---

## ✨ Tính năng chính

1. **Trình đọc tài liệu SSOT (V2.6 Final):**
   - Đọc trực tiếp toàn bộ tài liệu Markdown trong `docs/` (`V2.6/`, `spec/`, `architecture/`, `standards/`, `tracking/`, `note/`).
   - Hỗ trợ tiếng Việt đầy đủ (`Be Vietnam Pro`, `Lora`, `JetBrains Mono`), bảng metadata đầu bài, badge đánh số mục H2, mục lục trang tự động (`IntersectionObserver`), và click mở trực tiếp các đường dẫn `.md` nội bộ.
   - Ghim các tài liệu cốt lõi ở đầu Sidebar trái (`Pinned`), lịch sử vừa xem, tìm kiếm nhanh (`Ctrl/Cmd + K`), sao chép Deep Link và link Markdown.

2. **Changelog & Commit Diff đa Repository:**
   - Tổng hợp dòng commit mới nhất theo thời gian từ cả 4 repository:
     - **Backend (.NET 9):** `PanelForge_FA26SE251`
     - **Frontend (React 19):** `panelforge-fe`
     - **Mobile (Flutter):** `panelforge-mobile`
     - **SSOT Hub:** `panelforge-hubs`
   - Nạp commit trực tiếp từ GitHub REST API (có cache `localStorage`, nút cấu hình GitHub Token để tăng rate-limit, và fallback sang dữ liệu snapshot tạo sẵn lúc build).
   - Chế độ chuyển đổi **Đọc | Diff** ngay trên từng tài liệu, hỗ trợ cả **Unified** và **Side-by-Side Split**, kèm mini-timeline 3 commit gần nhất của file đang mở.

3. **Trình xem Sơ đồ Kiến trúc Mermaid:**
   - Render trực tiếp sơ đồ `flowchart`, `stateDiagram-v2`, `sequenceDiagram`, `erDiagram`...
   - Hỗ trợ phóng to / thu nhỏ, đặt lại zoom, sao chép mã Mermaid và mở toàn màn hình.

4. **Zero-Backend & Zero-Firebase:**
   - Ứng dụng tĩnh hoàn toàn (React 19 + TypeScript + Tailwind CSS + Vite), không cần backend hay Firebase riêng, đóng gói sẵn dữ liệu qua `scripts/build-docs-data.mjs`.

---

## 🛠️ Chạy ở máy cục bộ (Local Development)

```bash
cd panelforge-hub
npm install
npm --prefix web install
npm run dev
```

Build production (đồng bộ `docs/` → `web/public/docs/`, tạo `web/public/generated/*.json`, biên dịch TypeScript & Vite):

```bash
cd panelforge-hub
npm run build
```

---

## 📁 Cấu trúc chính

```text
panelforge-hub/
├── .github/workflows/deploy.yml   # Pipeline tự động build & deploy GitHub Pages
├── docs/                          # Nguồn tài liệu SSOT duy nhất (V2.6 Final)
│   ├── V2.6/                      # Master Specification V2.6 Final
│   ├── spec/                      # Đặc tả phân hệ & quy chuẩn thiết kế
│   ├── architecture/              # Kiến trúc Clean Architecture & Storage
│   ├── standards/                 # Glossary, State Machines, Audit chuẩn V2.6
│   ├── tracking/                  # Workboard nhóm, Feature Audit Diff, Audit Logs
│   └── note/                      # Kế hoạch triển khai theo module & archive
├── scripts/
│   ├── build-docs-data.mjs        # Quét docs/*.md & Git commits -> web/public/generated/
│   └── sync-hub.mjs               # Tiện ích đồng bộ tiến độ giữa các repo
└── web/                           # Ứng dụng Web Hub (React 19 + Vite + Tailwind)
```
