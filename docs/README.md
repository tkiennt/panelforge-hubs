# 📚 PanelForge Central Knowledge Base & SSOT Docs

> **🚨 NGUYÊN TẮC BẮT BUỘC (CENTRALIZED KNOWLEDGE SSOT):**  
> **Tất cả tài liệu đặc tả, nghiệp vụ, hiểu biết hệ thống, kiến trúc và kế hoạch triển khai ĐƯỢC ĐỌC TẠI `panelforge-hub/docs/`.**  
> Tuyệt đối KHÔNG đọc hay tìm kiếm tài liệu nghiệp vụ/kiến trúc tại các repo code riêng lẻ (`PanelForge_FA26SE251`, `panelforge-fe`, `panelforge-mobile`). Các repo code chỉ phục vụ chứa mã nguồn thực thi và test.

---

## 🗺️ Mục lục Tri thức Hệ thống (System Knowledge Map)

### 1. Đặc tả & Nghiệp vụ Cốt lõi (`docs/V2.6/` & `docs/spec/`)
- **[PANELFORGE_MASTER_SPECIFICATION_V2_6.md](./V2.6/PANELFORGE_MASTER_SPECIFICATION_V2_6.md)**: **Bản đặc tả tối cao duy nhất (Master Spec V2.6 Final)**. Định nghĩa toàn bộ 5 luồng cốt lõi (CF1–CF5), 8 module nghiệp vụ, quyền hạn 5 vai trò Studio (`Producer`, `Writer`, `Artist`, `Letterer`, `Editor`) cùng `Admin`, `Publisher`, `Reader`, cấu trúc xuất bản đa ngôn ngữ, ví VNĐ và kiểm soát chất lượng.
- **[CHAPTER_AND_SCRIPT_SPECIFICATION.md](./spec/CHAPTER_AND_SCRIPT_SPECIFICATION.md)**: Quy chuẩn chi tiết về kịch bản (`Page -> Panel -> Content`), lời thoại đa ngôn ngữ, bong bóng thoại và vòng đời chương V2.6.
- **[DESIGN_RULES.md](./spec/DESIGN_RULES.md)**: Quy chuẩn thiết kế giao diện (UI/UX), bảng màu, typography và trải nghiệm người dùng Studio.

### 2. Thuật ngữ & Trạng thái Chuẩn (`docs/standards/`)
- **[PanelForge_Ubiquitous_Language_and_State_Glossary.md](./standards/PanelForge_Ubiquitous_Language_and_State_Glossary.md)**: Từ điển thuật ngữ thống nhất (Ubiquitous Language) giữa Backend, Frontend, Mobile và Báo cáo theo V2.6.
- **[PanelForge_State_Machine_Naming_Standards.md](./standards/PanelForge_State_Machine_Naming_Standards.md)**: Chuẩn đặt tên và định nghĩa trạng thái của 5 State Machines chuẩn V2.6 (`.NET 9`).

*(Tài liệu cũ trước V2.6 đã xoá; xem lịch sử git nếu cần. Không giữ bản sao tài liệu nghiệp vụ ở repo code.)*

### 3. Kiến trúc Kỹ thuật & Sơ đồ (`docs/architecture/`)
- **[clean-architecture-structure.md](./architecture/clean-architecture-structure.md)**: Kiến trúc Clean Architecture, CQRS, MediatR, Repository Pattern của Backend .NET 9.
- **[storage-architecture.md](./architecture/storage-architecture.md)** & **[storage-strategy.md](./architecture/storage-strategy.md)**: Kiến trúc lưu trữ ảnh (Cloudflare R2, CAS SHA-256, biến thể ảnh) và chiến lược lưu trữ theo loại dữ liệu; `storage-strategy.md` ghi các điểm chỉnh so với `storage-architecture.md`.
- Máy trạng thái chuẩn nằm trong Master Spec §5.2 (Mermaid); không giữ sơ đồ PlantUML riêng.

### 4. Kế hoạch & Điều phối Triển khai (`docs/note/` & `docs/tracking/`)
- **[PANELFORGE_V2_6_IMPLEMENTATION_PLAN.md](./note/PANELFORGE_V2_6_IMPLEMENTATION_PLAN.md)**: Bản kế hoạch tổng thể, đối chiếu tiến độ code, quyết định kiến trúc đã chốt và changelog.
- **`docs/note/plans/`**: Kế hoạch module chi tiết (SCR, BIB, ASG, ART, REV, REL, RDR, UIQ) dùng chung để phân rã nhiệm vụ cho BE, FE, Mobile.
- **[TEAM_WORKBOARD.md](./tracking/TEAM_WORKBOARD.md)**: Bảng theo dõi phân công công việc của các thành viên trong nhóm.
- **[GIT_COMMIT_CONVENTION.md](./note/GIT_COMMIT_CONVENTION.md)**: Quy ước đặt tên commit gắn thẻ tác vụ `[TASK-ID]` / `[WIP:SUB-ID]` để tự động đồng bộ sang Web Hub.

### 5. Cổng thông tin Trực quan PanelForge Hub (`web/`)
- Giao diện trực quan hóa toàn bộ State Machines, Core Flows, Diff kiến trúc và Bảng tiến độ đa repo (Multi-Repo Task Board).
- Khởi chạy bằng lệnh:
  ```bash
  cd panelforge-hub/web
  npm run dev
  ```
