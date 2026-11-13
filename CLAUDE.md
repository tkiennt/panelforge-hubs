# CLAUDE.md – PanelForge Hub (SSOT Docs, Agent Skills & Web Hub)

> 🚨 **QUY TẮC CỐT LÕI (CENTRALIZED KNOWLEDGE SSOT):**  
> **Tất cả tài liệu đặc tả, nghiệp vụ, hiểu biết hệ thống, kiến trúc và kế hoạch triển khai ĐƯỢC ĐỌC TẬP TRUNG TẠI `docs/`.**  
> Tuyệt đối KHÔNG đọc hay tìm kiếm tài liệu nghiệp vụ/kiến trúc tại các repo code riêng lẻ (`PanelForge_FA26SE251`, `panelforge-fe`, `panelforge-mobile`). Các repo code chỉ phục vụ chứa mã nguồn thực thi và test.

Repo `panelforge-hub/` là Git Repo quản lý tài liệu trung tâm (SSOT Docs), cấu hình AI Agent, và cổng thông tin trực quan Web Hub. Chạy git độc lập bên trong từng repo.

## Imported rules (loaded every session)

@README.md
@.agents/AGENTS.md
@.agents/AI_READING_AND_EDITING_GUIDE.md
@.agents/CODEBASE_MAP.md
@docs/note/GIT_COMMIT_CONVENTION.md

## Mục lục Tri thức Hệ thống tại `docs/`

- **Bản đồ tri thức chi tiết:** Xem tại `docs/README.md`.
- **Master Spec V2.6:** `docs/V2.6/PANELFORGE_MASTER_SPECIFICATION_V2_6.md` (SSOT bản gốc duy nhất).
- **Kế hoạch triển khai (Master plan):** `docs/note/PANELFORGE_V2_6_IMPLEMENTATION_PLAN.md` · Module plans: `docs/note/plans/`.
- **Quy tắc cấu trúc tổng thể:** `docs/STRUCTURE_GUIDE.md`.
- **Thuật ngữ & State Machines:** `docs/standards/`.
- **Kiến trúc & Sơ đồ:** `docs/architecture/`.
- **Theo dõi tiến độ nhóm (Team Workboard):** `docs/tracking/TEAM_WORKBOARD.md`.
- **Coordination rules:** `docs/note/plans/README.md` §2. Plans trong `docs/note/` dùng để điều phối tác vụ giữa các repo.
- **Quy tắc Git Push:** Tuyệt đối **KHÔNG push sau mỗi lần làm/mỗi prompt**. Chỉ push lên remote GitHub khi **hoàn thành 1 module lớn** hoặc khi **User yêu cầu trực tiếp**. Bình thường chỉ commit cục bộ.

## Tooling & Cổng thông tin trực quan

- Khởi chạy Web Hub: `cd web && npm run dev`
- Đồng bộ commit tự động: `node scripts/sync-hub.mjs`
