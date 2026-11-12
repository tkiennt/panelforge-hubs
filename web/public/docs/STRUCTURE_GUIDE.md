# 📂 CẤU TRÚC TỔ CHỨC DỰ ÁN TỔNG THỂ — SEP490-PANELFORGE

> **Cập nhật:** 2026-11-12  
> **Kiến trúc:** Polyrepo phân tách trách nhiệm (Code, Docs/Hub, Báo cáo, Tài liệu tham khảo)  
> **Phiên bản chuẩn:** PanelForge V2.6 Final

---

## 1. SƠ ĐỒ CẤU TRÚC THƯ MỤC CỐT LÕI

```text
SEP490-PanelForge/                     <-- Mở IDE / AI Agent tại cấp thư mục này
├── PanelForge_FA26SE251/              <-- [Git Repo 1] Backend .NET 9 + thư mục db/
│   ├── src/                           # Domain, Application, Infrastructure, API, AI
│   ├── test/                          # Unit Tests, Integration Tests
│   ├── db/                            # Migration scripts, database schema & seed data
│   └── docs/                          # Docs kỹ thuật riêng cho Backend
│
├── panelforge-fe/                     <-- [Git Repo 2] Frontend React 19 + page-diff
│   ├── src/                           # Roles (Producer, Writer, Artist, Letterer, Editor)
│   ├── page-diff/                     # Microservice / module so sánh ảnh trang (visual diff)
│   └── docs/                          # Docs riêng của FE (audit, archive); không giữ bản sao spec
│
├── panelforge-mobile/                 <-- [Git Repo 3] Mobile Flutter
│   ├── lib/                           # Mobile Reader App (Webtoon / Manga)
│   └── test/                          # Mobile test suites
│
├── panelforge-hub/                    <-- [Git Repo 4] SSOT Docs, Agent Skills & Web Hub
│   ├── .agents/                       # AI Agent Skills, Rules, Worktree Scripts dùng chung
│   ├── .vscode/ & CLAUDE.md           # Cấu hình workspace và prompt rules trung tâm
│   ├── docs/                          # Hệ thống tài liệu tập trung:
│   │   ├── STRUCTURE_GUIDE.md         # Quy chuẩn tổ chức thư mục & SSOT
│   │   ├── note/                      # Kế hoạch triển khai (Implementation Plan, plans/ theo module)
│   │   └── V2.6/                      # Bản sao đặc tả V2.6, file Excel Requirements Specification
│   ├── scripts/                       # sync-hub.mjs, install-hooks.mjs (tự động đồng bộ commit)
│   └── web/                           # Source code web viewer PanelForge Hub (React 19 + Vite)
│
├── panelforge-reports/                <-- [Git Repo 5 - Tùy chọn] Hồ sơ Report 1 -> 7 (.docx, .xlsx)
│   ├── 00_Huong_Dan_Templates/        # Biểu mẫu, slide hướng dẫn chuẩn FPT
│   ├── 01_Phieu_De_Tai_BM01/          # Phiếu đăng ký đề tài qua các đợt
│   ├── 02_Reports/                    # Báo cáo Report 1 đến Report 6, Ma trận yêu cầu
│   ├── 03_Defense_Review/             # Slide & tài liệu thuyết trình bảo vệ
│   ├── 04_Final_Report/               # Báo cáo tổng kết đồ án chính thức (Report 7)
│   └── 05_Visualizers_Prototypes/     # Prototypes & mockups đồ án
│
└── _local_references/                 <-- [Local Only] Chứa Sample/, SEP490_Templlate/, PRN232v1/
    ├── Sample/                        # Đồ án mẫu điểm cao khóa trước (8614_HCM_SP26SE071...)
    ├── SEP490_Templlate/              # Biểu mẫu gốc của Đại học FPT
    ├── PRN232v1/                      # Project kiến trúc tham khảo
    └── page-diff-ref/                 # Mã nguồn thuật toán so sánh ảnh tham khảo
```

---

## 2. QUY ƯỚC ĐỒNG BỘ TÀI LIỆU V2.6 (SINGLE SOURCE OF TRUTH)

| Tài liệu | Bản gốc duy nhất (chỉ sửa ở đây) | Bản sao chỉ đọc | Ghi chú |
|---|---|---|---|
| **Master Spec V2.6** | `panelforge-hub/docs/V2.6/PANELFORGE_MASTER_SPECIFICATION_V2_6.md` | `panelforge-reports/docs/V2.6/` | Sửa bản gốc trong hub, commit + push `main`, rồi chép đè sang `panelforge-reports/`. Repo code (BE, FE, MO) không giữ bản sao. |
| **Đặc tả Chương & Kịch bản, Quy chuẩn UI** | `panelforge-hub/docs/spec/CHAPTER_AND_SCRIPT_SPECIFICATION.md`, `panelforge-hub/docs/spec/DESIGN_RULES.md` | Không có bản sao | Repo code chỉ trỏ đường dẫn về hub. |
| **Plan tổng & plan module** | `panelforge-hub/docs/note/PANELFORGE_V2_6_IMPLEMENTATION_PLAN.md`, `panelforge-hub/docs/note/plans/` | Không có bản sao | Không chép plan vào repo code. Dùng chung để phân chia task cho BE, FE, Mobile. |
| **Bảng theo dõi nhóm** | `panelforge-hub/docs/tracking/TEAM_WORKBOARD.md` | Không có bản sao | Nơi duy nhất ghi "Đang làm" / "Đã xong". Mọi lần sửa tài liệu trong hub đều commit + push `main` ngay (xem `docs/note/plans/README.md` §2.5). |
| **File Excel Yêu cầu** | Sinh từ script trong `panelforge-reports/docs/scripts/` | `panelforge-reports/02_Reports/`, `panelforge-hub/docs/V2.6/` | Chạy script cập nhật sau mỗi lần sửa Master Spec. |
| **Đồng bộ tiến độ Hub** | `panelforge-hub/scripts/sync-hub.mjs` | Tự động qua Git post-commit hooks hoặc chạy tay | Cập nhật tiến độ vào `panelforge-hub/web/public/data/hub-state.json`. |
