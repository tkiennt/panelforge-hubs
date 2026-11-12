# 📚 PanelForge Central Knowledge Base & SSOT Docs

> **🚨 NGUYÊN TẮC BẮT BUỘC (CENTRALIZED KNOWLEDGE SSOT):**  
> **Tất cả tài liệu đặc tả, nghiệp vụ, hiểu biết hệ thống, kiến trúc và kế hoạch triển khai ĐƯỢC ĐỌC TẠI `panelforge-hub/docs/`.**  
> Tuyệt đối KHÔNG đọc hay tìm kiếm tài liệu nghiệp vụ/kiến trúc tại các repo code riêng lẻ (`PanelForge_FA26SE251`, `panelforge-fe`, `panelforge-mobile`). Các repo code chỉ phục vụ chứa mã nguồn thực thi và test.

---

## 🗺️ Mục lục Tri thức Hệ thống (System Knowledge Map)

### 1. Đặc tả & Nghiệp vụ Cốt lõi (`docs/spec/` & `docs/V2.6/`)
- **[PANELFORGE_MASTER_SPECIFICATION_V2_6.md](file:///D:/FPT-STUDY/10_FALL-2026/SEP490/panelforge-hub/docs/spec/PANELFORGE_MASTER_SPECIFICATION_V2_6.md)**: **Bản đặc tả tối cao duy nhất (Master Spec V2.6)**. Định nghĩa toàn bộ 5 luồng cốt lõi (CF1–CF5), 8 module nghiệp vụ, quyền hạn 5 vai trò (Producer, Writer, Artist, Letterer, Editor), cấu trúc xuất bản Webtoon/Manga, cơ chế kiểm soát chất lượng & chữ ký số.
- **[CHAPTER_AND_SCRIPT_SPECIFICATION.md](file:///D:/FPT-STUDY/10_FALL-2026/SEP490/panelforge-hub/docs/spec/CHAPTER_AND_SCRIPT_SPECIFICATION.md)**: Quy chuẩn chi tiết về kịch bản, lời thoại, bong bóng thoại, phân đoạn khung tranh và trạng thái kịch bản.
- **[CORE_PRODUCTION_ARCHITECTURE.md](file:///D:/FPT-STUDY/10_FALL-2026/SEP490/panelforge-hub/docs/spec/CORE_PRODUCTION_ARCHITECTURE.md)**: Kiến trúc quy trình sản xuất truyện tranh, sự phối hợp giữa Canvas Editor, AI Assistant và Pipeline.
- **[DESIGN_RULES.md](file:///D:/FPT-STUDY/10_FALL-2026/SEP490/panelforge-hub/docs/spec/DESIGN_RULES.md)**: Quy chuẩn thiết kế giao diện (UI/UX), bảng màu, typography và trải nghiệm người dùng Studio.

### 2. Thuật ngữ & Trạng thái Chuẩn (`docs/standards/`)
- **[PanelForge_Ubiquitous_Language_and_State_Glossary.md](file:///D:/FPT-STUDY/10_FALL-2026/SEP490/panelforge-hub/docs/standards/PanelForge_Ubiquitous_Language_and_State_Glossary.md)**: Từ điển thuật ngữ thống nhất (Ubiquitous Language) giữa Backend, Frontend, Mobile và Báo cáo.
- **[PanelForge_State_Machine_Naming_Standards.md](file:///D:/FPT-STUDY/10_FALL-2026/SEP490/panelforge-hub/docs/standards/PanelForge_State_Machine_Naming_Standards.md)**: Chuẩn đặt tên và định nghĩa trạng thái của 5 State Machines: `AssignmentStatus`, `StageProgress`, `Submission`, `ChapterStatus`, và `SeriesBibleRevision`.
- **[glossary-and-rules.md](file:///D:/FPT-STUDY/10_FALL-2026/SEP490/panelforge-hub/docs/standards/glossary-and-rules.md)**: Bộ quy tắc nghiệp vụ Business Rules (BR-xx) chi tiết cho kiểm thử và logic backend.

### 3. Kiến trúc Kỹ thuật & Sơ đồ (`docs/architecture/`)
- **[clean-architecture-structure.md](file:///D:/FPT-STUDY/10_FALL-2026/SEP490/panelforge-hub/docs/architecture/clean-architecture-structure.md)**: Kiến trúc Clean Architecture, CQRS, MediatR, Repository Pattern của Backend .NET 9.
- **[storage-architecture.md](file:///D:/FPT-STUDY/10_FALL-2026/SEP490/panelforge-hub/docs/architecture/storage-architecture.md)** & **[image_storage_architecture.md](file:///D:/FPT-STUDY/10_FALL-2026/SEP490/panelforge-hub/docs/architecture/image_storage_architecture.md)**: Kiến trúc lưu trữ phân tán, Cloudflare R2 / S3 storage, quản lý phiên bản ảnh layer và thumbnail.
- **`docs/architecture/diagrams/`**: Sơ đồ lớp (Class Diagrams), sơ đồ tuần tự (Sequence Diagrams), sơ đồ trạng thái (State Diagrams) và ERD.

### 4. Kế hoạch & Điều phối Triển khai (`docs/note/` & `docs/tracking/`)
- **[PANELFORGE_V2_6_IMPLEMENTATION_PLAN.md](file:///D:/FPT-STUDY/10_FALL-2026/SEP490/panelforge-hub/docs/note/PANELFORGE_V2_6_IMPLEMENTATION_PLAN.md)**: Bản kế hoạch tổng thể, đối chiếu tiến độ code, quyết định kiến trúc đã chốt và changelog.
- **`docs/note/plans/`**: Kế hoạch module chi tiết (SCR, BIB, ASG, ART, REV, REL, RDR, UIQ) dùng chung để phân rã nhiệm vụ cho BE, FE, Mobile.
- **[TEAM_WORKBOARD.md](file:///D:/FPT-STUDY/10_FALL-2026/SEP490/panelforge-hub/docs/tracking/TEAM_WORKBOARD.md)**: Bảng theo dõi phân công công việc của các thành viên trong nhóm.
- **[GIT_COMMIT_CONVENTION.md](file:///D:/FPT-STUDY/10_FALL-2026/SEP490/panelforge-hub/docs/note/GIT_COMMIT_CONVENTION.md)**: Quy ước đặt tên commit gắn thẻ tác vụ `[TASK-ID]` / `[WIP:SUB-ID]` để tự động đồng bộ sang Web Hub.

### 5. Cổng thông tin Trực quan PanelForge Hub (`web/`)
- Giao diện trực quan hóa toàn bộ State Machines, Core Flows, Diff kiến trúc và Bảng tiến độ đa repo (Multi-Repo Task Board).
- Khởi chạy bằng lệnh:
  ```bash
  cd panelforge-hub/web
  npm run dev
  ```
