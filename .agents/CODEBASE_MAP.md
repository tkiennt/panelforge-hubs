# PANELFORGE FAST-ROUTING CODEBASE MAP (ZERO-EXPLORATION MATRIX)

> **Mục đích:** Cung cấp bản đồ định vị 1-hop (Single-hop lookup) cho AI Agent và lập trình viên.  
> **Nguyên tắc cốt lõi:** Khi tiếp nhận task, **KHÔNG tìm kiếm đệ quy hay quét hàng loạt file**. Tra cứu trực tiếp bảng dưới đây để mở đúng các file đích cần sửa hoặc tham chiếu.

---

## 1. BẢNG TRA CỨU ĐƠN VỊ TÍNH NĂNG TOÀN DIỆN (FULL-STACK FEATURE MATRIX)

| Nghiệp vụ / Domain | Backend Controller & CQRS | Backend Domain Entity | Web Frontend (Service & View) | Mobile App (Service, Provider & Screen) |
|---|---|---|---|---|
| **1. Auth & Session** | `AuthController.cs`<br/>`UsersController.cs`<br/>`Features/Auth/`<br/>`Features/Users/` | `Entities/Identity/User.cs`<br/>`Enums/SystemRole.cs` | `services/auth.service.ts`<br/>`services/user.service.ts`<br/>`roles/guest/views/LoginPage.tsx`<br/>`shared/views/UserProfileView.tsx` | `services/auth_service.dart`<br/>`providers/api_providers.dart`<br/>`screens/auth/login_page.dart`<br/>`widgets/auth_modal_sheet.dart` |
| **2. Workspaces & RBAC** | `WorkspacesController.cs`<br/>`Common/Attributes/RequireWorkspaceRoleAttribute.cs`<br/>`Features/Workspaces/` | `Entities/Workspaces/StudioWorkspace.cs`<br/>`WorkspaceMember.cs` | `services/workspace.service.ts`<br/>`shared/views/WorkspaceListView.tsx` | N/A (Admin/Creator Web only) |
| **3. Series & Thành viên** | `SeriesController.cs`<br/>`SeriesMembersController.cs`<br/>`Features/Series/`<br/>`Features/SeriesMembers/` | `Entities/Content/Series.cs`<br/>`SeriesMember.cs` | `services/series.service.ts`<br/>`services/project.service.ts`<br/>`roles/producer/views/ProjectDetailView.tsx`<br/>`roles/producer/views/ProjectMembersView.tsx` | `services/catalog_service.dart`<br/>`screens/explore/series_detail_page.dart` |
| **4. Chapter & Pipeline** | `ChaptersController.cs`<br/>`SeriesPipelineController.cs`<br/>`AssignmentsController.cs`<br/>`Features/Chapters/`<br/>`Features/SeriesPipeline/` | `Entities/Content/Chapter.cs`<br/>`Entities/Workflow/PipelineStage.cs`<br/>`Assignment.cs` | `services/chapter.service.ts`<br/>`services/pipeline.service.ts`<br/>`services/assignment.service.ts`<br/>`roles/producer/views/ProducerWorkspaceView.tsx`<br/>`roles/editor/views/ChapterReviewView.tsx` | `services/catalog_service.dart`<br/>`models/comic_model.dart` |
| **5. Bible (Story & Nhân vật)** | `BibleController.cs`<br/>`Features/Bible/` | `Entities/Bible/SeriesBible.cs`<br/>`BibleEntry.cs`<br/>`BibleEntryRevision.cs` | `services/bible.service.ts`<br/>`shared/features/series-bible/SeriesBibleView.tsx`<br/>`roles/editor/views/BibleReviewView.tsx` | N/A (Studio internal lore) |
| **6. Script & Lời thoại (Writer)** | `ScenesController.cs`<br/>`ScriptLinesController.cs`<br/>`Features/Scenes/`<br/>`Features/ScriptLines/` | `Entities/Content/Scene.cs`<br/>`ScriptLine.cs` | `services/scriptLine.service.ts`<br/>`roles/writer/views/ScriptEditorView.tsx` | N/A (Studio desktop tool) |
| **7. Studio Canvas & Panels** | `PagesController.cs`<br/>`PanelsController.cs`<br/>`ElementsController.cs`<br/>`Features/Pages/`<br/>`Features/Panels/`<br/>`Features/CanvasElements/` | `Entities/Content/Page.cs`<br/>`Panel.cs`<br/>`ElementState.cs` | `services/page.service.ts`<br/>`services/panel.service.ts`<br/>`services/element.service.ts`<br/>`roles/artist/views/ArtistDeskView.tsx`<br/>`roles/letterer/views/LetteringWorkspace.tsx` | N/A (Web Canvas Editor) |
| **8. Khung Mẫu (Frame Templates)** | `FrameTemplatesController.cs`<br/>`Features/FrameTemplates/` | `Entities/Content/FrameTemplate.cs` | `services/frameTemplate.service.ts`<br/>`roles/artist/modals/FrameTemplateModal.tsx` | N/A |
| **9. Assets & Lưu trữ (CAS)** | `AssetsController.cs`<br/>`Features/Assets/` | `Entities/Content/Asset.cs`<br/>(SHA-256 CAS hash) | `services/artwork.service.ts`<br/>`roles/artist/components/UploadPagesModal.tsx` | `services/api_client.dart` |
| **10. AI Agents & Consistency** | `AiAgentsController.cs`<br/>`InternalAiController.cs`<br/>`Features/AiAgents/`<br/>`Features/Consistency/` | `PanelForge.AI/*`<br/>`src/PanelForge.AI.Contracts/*` | `services/aiAgents.service.ts`<br/>`services/aiStream.service.ts`<br/>`services/aiStream.service.ts`<br/>`shared/features/ai-agents/AiAssistPanel.tsx` | N/A (Studio automation) |
| **11. Preview Links & Tokens** | `PreviewLinksController.cs`<br/>`Features/PreviewLinks/` | `Entities/Preview/PreviewLink.cs`<br/>`Entities/Preview/PreviewFeedback.cs` | `services/previewLink.service.ts`<br/>`shared/modals/PreviewLinksModal.tsx` | `services/preview_service.dart`<br/>`screens/review/review_hub_page.dart`<br/>`screens/review/review_invite_page.dart`<br/>`screens/review/review_expired_page.dart` |
| **12. Reviewer Canvas (Đánh giá)** | `PreviewLinksController.cs`<br/>`Features/PreviewLinks/SubmitFeedback` | `Entities/Preview/PreviewFeedback.cs` | `roles/editor/views/ChapterReviewView.tsx` | `screens/review/review_canvas_page.dart`<br/>`widgets/annotation_sheet.dart`<br/>`widgets/sketch_drawing_dialog.dart`<br/>`widgets/watermark_overlay.dart` |
| **13. Public Catalog & Đọc Truyện** | `CatalogController.cs`<br/>`Features/Catalog/` | `Entities/Content/Series.cs`<br/>`Chapter.cs` (Published status) | `services/catalog.service.ts`<br/>`roles/reader/views/PublicCatalogView.tsx` | `services/catalog_service.dart`<br/>`screens/explore/explore_page.dart`<br/>`screens/reader/comic_reader_page.dart`<br/>`widgets/adaptive_webtoon_view.dart`<br/>`widgets/guided_panel_viewer.dart` |
| **14. Monetization & Wallet** | `CatalogController.cs` (Unlock)<br/>`Features/Catalog/UnlockChapter` | `Entities/Payments/ReaderWallet.cs`<br/>`ChapterEntitlement.cs`<br/>`PaymentTransaction.cs` | `services/catalog.service.ts` (Coin balance) | `services/monetization_service.dart`<br/>`widgets/wallet_chip.dart`<br/>`widgets/wallet_topup_dialog.dart`<br/>`widgets/unlock_chapter_bottom_sheet.dart` |
| **15. Export & Packages (CBZ/PDF)** | `ExportsController.cs`<br/>`Features/Exports/` | `Entities/Publishing/ExportJob.cs` | `services/export.service.ts`<br/>`roles/producer/views/ExportView.tsx` | `services/cbz_package_service.dart`<br/>`models/comic_package_models.dart` |
| **16. Notifications** | `NotificationsController.cs`<br/>`Features/Notifications/` | `Entities/Notifications/Notification.cs` | `services/notification.service.ts`<br/>`shared/components/NotificationBell.tsx` | N/A |
| **17. Admin & Audit Log** | `AdminController.cs`<br/>`Features/Admin/`<br/>`Features/Audit/` | `Entities/Audit/AuditLog.cs` | `services/admin.service.ts`<br/>`roles/admin/views/AdminDashboardView.tsx`<br/>`roles/admin/views/AdminAuditLogView.tsx` | N/A |

---

## 2. QUY TẮC ĐỊNH VỊ NHANH THEO VAI TRÒ (ROLE-BASED QUICK ROUTING)

### A. `backend-expert`
1. **Business Logic:** Mở thẳng thư mục `PanelForge_FA26SE251/src/PanelForge.Application/Features/<Domain>/Commands` hoặc `Queries`.
2. **Entity & Enums:** Mở `PanelForge_FA26SE251/src/PanelForge.Domain/Entities/<Domain>/` hoặc `Enums/`.
3. **DbContext & Migration:** Mở `PanelForge_FA26SE251/src/PanelForge.Infrastructure/Persistence/PanelForgeDbContext.cs`.
4. **Controllers:** Chỉ mở khi cần xem Route attribute, HTTP Status code hoặc Request binding; **không viết business logic vào Controller**.

### B. `frontend-expert`
1. **API Integration:** Mở `panelforge-fe/src/services/<domain>.service.ts` và `panelforge-fe/src/api/endpoints.ts`.
2. **Views:** Mở theo vai trò tại `panelforge-fe/src/roles/<role>/views/<ViewName>.tsx` (ví dụ: `producer`, `writer`, `artist`, `letterer`, `editor`, `admin`, `reader`).
3. **Stores & Hooks:** Mở `panelforge-fe/src/shared/stores/` hoặc `panelforge-fe/src/hooks/`.
4. **UI Design & Tokens (Chống lệch giao diện):** Bắt buộc tuân thủ `panelforge-fe/docs/DESIGN_RULES.md` ("UI Constitution") và token tại `panelforge-fe/src/styles/tokens/studio-tokens.css`. Dùng nền giấy manga ấm (`bg-[#FAF9F5]`, `stone-50`), mặt thẻ trắng (`bg-white`), viền giấy (`border-stone-200/80`), mực cam studio (`#EA580C`/`#F97316`), cỡ chữ tối thiểu `text-xs` (12px).
5. **Đa ngôn ngữ (i18n Parity):** Mọi chuỗi hiển thị phải khai báo song ngữ đồng thời vào `panelforge-fe/src/locales/vi/*.json` và `panelforge-fe/src/locales/en/*.json`, kiểm tra qua `npm run i18n:check`.

### C. `mobile-expert`
1. **API Client & Networking:** Mở `panelforge-mobile/lib/services/api_client.dart` và `panelforge-mobile/lib/services/<domain>_service.dart`.
2. **State & Providers:** Mở `panelforge-mobile/lib/providers/api_providers.dart`.
3. **Màn hình (Screens):** Mở `panelforge-mobile/lib/screens/<module>/<screen_name>.dart`.
4. **Widgets & Overlays:** Mở `panelforge-mobile/lib/widgets/<widget_name>.dart`.
5. **Theme & Tokens (Đồng bộ UI):** Tuân thủ `panelforge-mobile/lib/theme/app_theme.dart` (Tangerine `#F97316`, Paper `#FCF9F2`, Obsidian `#07080D`, Mint `#10B981`, Rose `#EF4444`).

---

## 3. CÔNG CỤ TÌM KIẾM NHANH 1-CHẠM (CLI TOOL)

Để lấy danh sách tệp chính xác của một nghiệp vụ trong 0.1 giây:
```powershell
powershell -File .agents/scripts/find_feature.ps1 -Feature <tên_chức_năng>
```
*Ví dụ:* `powershell -File .agents/scripts/find_feature.ps1 -Feature review` hoặc `... -Feature chapter`
