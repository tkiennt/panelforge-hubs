# 📚 PanelForge Central Knowledge Base & SSOT Docs

> **🚨 NGUYÊN TẮC BẮT BUỘC (CENTRALIZED KNOWLEDGE SSOT):**  
> **Tất cả tài liệu đặc tả, nghiệp vụ, hiểu biết hệ thống, kiến trúc và kế hoạch triển khai ĐƯỢC ĐỌC TẠI `panelforge-hub/docs/`.**  
> Tuyệt đối KHÔNG đọc hay tìm kiếm tài liệu nghiệp vụ/kiến trúc tại các repo code riêng lẻ (`PanelForge_FA26SE251`, `panelforge-fe`, `panelforge-mobile`). Các repo code chỉ phục vụ chứa mã nguồn thực thi và test.

---

## 🗺️ Mục lục Tri thức Hệ thống (System Knowledge Map)

### 1. Đặc tả & Nghiệp vụ Cốt lõi (`docs/V2.6/` & `docs/spec/`)
- **[PANELFORGE_MASTER_SPECIFICATION_V2_6.md](./V2.6/PANELFORGE_MASTER_SPECIFICATION_V2_6.md)**: **Bản đặc tả tối cao duy nhất (Master Spec V2.6 Final)**. Định nghĩa toàn bộ 5 luồng cốt lõi (CF1–CF5), 8 module nghiệp vụ, phân tầng vai trò 2 cấp (Studio Scope: `Producer`, `Member`; Series Scope: `Producer`, `Writer`, `Artist`, `Letterer`, `Editor` theo Spec D10) cùng `Admin`, `Publisher`, `Reader`, cấu trúc xuất bản đa ngôn ngữ, ví VNĐ và kiểm soát chất lượng.
- **[CHAPTER_AND_SCRIPT_SPECIFICATION.md](./spec/CHAPTER_AND_SCRIPT_SPECIFICATION.md)**: Quy chuẩn chi tiết về kịch bản (`Page -> Panel -> Content`), lời thoại đa ngôn ngữ, bong bóng thoại và vòng đời chương V2.6.
- **[DESIGN_RULES.md](./spec/DESIGN_RULES.md)**: Quy chuẩn thiết kế giao diện (UI/UX), bảng màu, typography, trải nghiệm người dùng Studio và quy chuẩn điều hướng phân cấp (Spec §5.3).
- **[UI_CURRENT_SCREENS_REPORT.md](./spec/UI_CURRENT_SCREENS_REPORT.md)**: Báo cáo phân tích đối chiếu hiện trạng toàn bộ màn hình giao diện (Screens Inventory) của hệ thống.

### 2. Thuật ngữ & Trạng thái Chuẩn (`docs/standards/`)
- **[PanelForge_Ubiquitous_Language_and_State_Glossary.md](./standards/PanelForge_Ubiquitous_Language_and_State_Glossary.md)**: Từ điển thuật ngữ thống nhất (Ubiquitous Language) giữa Backend, Frontend, Mobile và Báo cáo theo V2.6; chuẩn hóa hướng đọc (`RightToLeft=0`, `LeftToRight=1`, `Vertical=2`), My Work Hub, Continuous Reader và phân tầng vai trò 2 cấp.
- **[PanelForge_State_Machine_Naming_Standards.md](./standards/PanelForge_State_Machine_Naming_Standards.md)**: Chuẩn đặt tên và định nghĩa trạng thái của 5 State Machines chuẩn V2.6 (`.NET 9`).
- **[GIT_BRANCHING_AND_PROMOTION_MODEL.md](./standards/GIT_BRANCHING_AND_PROMOTION_MODEL.md)**: Quy chuẩn phân nhánh 4 cấp độ và quy trình thăng cấp an toàn (`work-branch -> dev -> stg -> main`), bảo vệ nhánh và hướng dẫn AI Agent.
- **[MODULE_TEST_EXECUTION_MATRIX.md](./standards/MODULE_TEST_EXECUTION_MATRIX.md)**: Ma trận chia nhỏ và điều phối kiểm thử theo module cho AI Agent; cấm chạy lại toàn bộ test hệ thống, chỉ chạy test module được sửa và các phần liên quan.
- **[SYSTEM_DEFINITIONS_AND_COMPONENT_IMMUTABILITY.md](./standards/SYSTEM_DEFINITIONS_AND_COMPONENT_IMMUTABILITY.md)**: **Quy chuẩn bất biến tuyệt đối đối với định nghĩa hệ thống và component dùng chung cho AI Agent**; cấm tự ý xóa/sửa/định nghĩa lại primitives (`Surface.tsx`, `SidebarItem`, `Button`, `Badge`), cấm hardcode class đè theme sidebar, bắt buộc mở rộng tương thích ngược (OCP).

*(Tài liệu cũ trước V2.6 đã xoá; xem lịch sử git nếu cần. Không giữ bản sao tài liệu nghiệp vụ ở repo code.)*

### 3. Kiến trúc Kỹ thuật & Sơ đồ (`docs/architecture/`)
- **[clean-architecture-structure.md](./architecture/clean-architecture-structure.md)**: Kiến trúc Clean Architecture, CQRS, MediatR, Repository Pattern của Backend .NET 9.
- **[core-flows-sequence-diagrams.md](./architecture/core-flows-sequence-diagrams.md)**: Sơ đồ tuần tự chuẩn hóa theo kiến trúc Clean Architecture cho 5 Core Flows cốt lõi (CF1 – CF5) cùng luồng phân vai Spec D10 và My Work Hub.
- **[workflow-sequence-diagrams.md](./architecture/workflow-sequence-diagrams.md)**: Sơ đồ tuần tự (Sequence Diagrams) mô tả chi tiết tương tác đa thành phần cho các Workflow cốt lõi của nền tảng V2.6.
- **[PANELFORGE_CORE_FLOWS_AND_EXCEPTION_HANDLING_GUIDE.md](./architecture/PANELFORGE_CORE_FLOWS_AND_EXCEPTION_HANDLING_GUIDE.md)**: Đặc tả chi tiết các luồng hệ thống, điểm kiểm tra an toàn (Quality Gates), chế độ thất bại và chiến lược xử lý lỗi tập trung RFC 7807 (ProblemDetails).
- **[storage-architecture.md](./architecture/storage-architecture.md)** & **[storage-strategy.md](./architecture/storage-strategy.md)**: Kiến trúc lưu trữ ảnh (Cloudflare R2, CAS SHA-256, biến thể ảnh) và chiến lược lưu trữ theo loại dữ liệu; `storage-strategy.md` ghi các điểm chỉnh so với `storage-architecture.md`.
- **[deployment-architecture.md](./architecture/deployment-architecture.md)**: Kiến trúc triển khai hạ tầng đám mây (Cloudflare Pages, Cloudflare Tunnel, Cloudflare R2, Oracle Cloud VM) và quy trình vận hành CI/CD cho môi trường Staging & Production.
- Máy trạng thái chuẩn nằm trong Master Spec §5.2 (Mermaid); không giữ sơ đồ PlantUML riêng.

### 4. Kế hoạch & Điều phối Triển khai (`docs/note/` & `docs/tracking/`)
- **[PANELFORGE_V2_6_IMPLEMENTATION_PLAN.md](./note/PANELFORGE_V2_6_IMPLEMENTATION_PLAN.md)**: Bản kế hoạch tổng thể, đối chiếu tiến độ code, quyết định kiến trúc đã chốt và changelog.
- **[Bộ Kế hoạch Module Chi tiết (`docs/note/plans/`)](./note/plans/README.md)**: Phân rã nhiệm vụ chi tiết theo 9 module dùng chung cho BE, FE, Mobile:
  - [01_SCRIPT_PLAN.md](./note/plans/01_SCRIPT_PLAN.md): Soạn thảo kịch bản, vòng đời, khóa Canon và Gate 1 (`SCR`).
  - [02_BIBLE_PLAN.md](./note/plans/02_BIBLE_PLAN.md): Quản trị Series Bible, Model Sheet, biến thể tạo hình và Canon (`BIB`).
  - [03_ASSIGNMENT_PLAN.md](./note/plans/03_ASSIGNMENT_PLAN.md): Giao việc theo trang, pipeline song song và Cross-Studio My Work Hub (`ASG`).
  - [04_ARTWORK_PLAN.md](./note/plans/04_ARTWORK_PLAN.md): Bàn vẽ Artist, dựng layout, đặt bóng thoại và miễn gate ảnh cho Letterer (`ART`).
  - [05_REVIEW_PLAN.md](./note/plans/05_REVIEW_PLAN.md): Duyệt kiểm định Gate 2, cô lập lỗi cấp Panel, Pinned Comments & Rework conversion (`REV`).
  - [06_RELEASE_PLAN.md](./note/plans/06_RELEASE_PLAN.md): Nghiệm thu Gate 3, ấn bản ngôn ngữ và Publisher Portal (`REL`).
  - [07_READER_PLAN.md](./note/plans/07_READER_PLAN.md): Độc giả Web/Mobile, nạp ví VNĐ, mở khóa ấn bản và Series Continuous Reader (`RDR`).
  - [08_UI_QUALITY_PLAN.md](./note/plans/08_UI_QUALITY_PLAN.md): Chuẩn hóa UI/UX, chống AI slop, token thiết kế và gói cải tiến UIQ-11 (`UIQ`).
  - [09_MODERN_WEB_PLAN.md](./note/plans/09_MODERN_WEB_PLAN.md): Chuẩn nền tảng Web hiện đại, IME, ARIA và tối ưu tương tác (`MWG`).
- **[SIDEBAR_CONVENTION.md](./note/SIDEBAR_CONVENTION.md)**: Quy chuẩn Sidebar Theme (`paper`, `ink`, `ocean`, `plum`) và bảo toàn CSS scoped variables.
- **[TEAM_WORKBOARD.md](./tracking/TEAM_WORKBOARD.md)**: Bảng theo dõi tiến độ và phân công công việc của các thành viên trong nhóm.
- **[AUDIT_LOGS.md](./tracking/AUDIT_LOGS.md)**: Nhật ký kiểm định chất lượng và audit code hệ thống.
- **[Báo cáo Sprint Lịch sử](./tracking/reports/2026-11-14_15_REPORT.md)**: Báo cáo đối chiếu tiến độ nhóm đợt 2026-11-14/15.
- **[GIT_COMMIT_CONVENTION.md](./note/GIT_COMMIT_CONVENTION.md)**: Quy ước đặt tên commit gắn thẻ tác vụ `[TASK-ID]` / `[WIP:SUB-ID]` để tự động đồng bộ sang Web Hub.
- **Đề xuất Kiến trúc Mở rộng & Thiết kế Chi tiết**:
  - [ASSIGNMENT_GRID_V3_PROPOSAL.md](./note/proposals/ASSIGNMENT_GRID_V3_PROPOSAL.md): Đề xuất tái cấu trúc lưới giao việc V3.
  - [MULTILINGUAL_PUBLISHING_BACKEND_GAPS.md](./note/proposals/MULTILINGUAL_PUBLISHING_BACKEND_GAPS.md): Phân tích khoảng cách phát hành đa ngôn ngữ.
  - Briefs thiết kế giao diện: [UIQ-10a.md](./note/plans/briefs/UIQ-10a.md) và [UIQ-10b.md](./note/plans/briefs/UIQ-10b.md).

### 5. Cổng thông tin Trực quan PanelForge Hub (`web/`)
- Giao diện trực quan hóa toàn bộ State Machines, Core Flows, Diff kiến trúc và Bảng tiến độ đa repo (Multi-Repo Task Board).
- Khởi chạy bằng lệnh:
  ```bash
  cd panelforge-hub/web
  npm run dev
  ```
