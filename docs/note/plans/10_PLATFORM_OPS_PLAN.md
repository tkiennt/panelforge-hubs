# 10 · VẬN HÀNH NỀN TẢNG (ADMIN): HẠN MỨC, VÍ/VIETQR, PHÂN QUYỀN (`OPS`)

> **Nguồn:** `VAN_HANH_PHAT_HANH_DOC_TRUYEN.html` (27/11/2026, brainstorm team + báo cáo agy + Claude kiểm code), Master Spec V2.6 (Q12, Q13, BR-07, BR-22, BR-32, BR-33, D1, D4).
> **Nhánh:** `feature/admin-b2b` (hub: plan này; BE `PanelForge_FA26SE251` tách từ `dev` @ `35fb6f6`). FE/MO tạo nhánh cùng tên khi tới task có `[FE]`/`[MO]`.
> **Repo:** `PanelForge_FA26SE251`, `panelforge-fe`, `panelforge-mobile`.
> **Trạng thái:** chỉ là kế hoạch, **chưa code**. Bắt đầu khi người phụ trách duyệt.

**Phạm vi.** Tên nhánh có chữ "b2b" nhưng tài liệu nguồn (mục 4.1) ghi rõ B2B, gói thuê bao, nhiều Publisher và chia doanh thu là **ngoài phạm vi**. Plan này theo đúng hướng đó: Admin **cấp tài nguyên và vận hành**, không bán gói. Nếu team muốn làm B2B thật thì phải sửa spec trước (xem §5, câu C0).

**Ranh giới với plan khác.** Vòng đời ấn bản (5A) thuộc `06_RELEASE_PLAN.md` (`REL`); link ảnh ký ngắn hạn và Flutter đọc trả phí (6A) thuộc `07_READER_PLAN.md` (`RDR`). Plan này chỉ ghi các việc đó ở dạng phụ thuộc, không nhân đôi task.

---

## 1. Đối chiếu tài liệu nguồn với `dev` (28/11/2026)

Tài liệu nguồn viết theo `feature/assign-automation` ngày 27/11. Cùng ngày, THBMinh đã đẩy loạt vá P0 (TASK-5..14, 23 · AUD-BE-01..10, BE PR #20, FE PR #22) vào `dev`. Kết quả kiểm lại:

| Phát hiện trong tài liệu | Trên `dev` hiện tại | Bằng chứng |
|---|---|---|
| `RequireWorkspaceRole` cho Admin đi tắt (BR-07) | ✅ đã gỡ | `4f8e39c` |
| Publisher đi qua endpoint không ghi vai trò | ✅ chỉ qua khi khai báo `Publisher` hoặc `[AllowPublisherRead]` | `5500e00` |
| Q12: tạo được Publisher thứ hai / tắt Publisher duy nhất | ✅ `SinglePublisherGuard` + migration `EnforceSingleActivePublisher` | `9792db3` |
| Publisher được thêm vào Series/Studio | ✅ `AddSeriesMember`, `UpdateSeriesMemberRole` chặn `Publisher` | — |
| Doanh thu Studio cộng tiền nạp | ✅ tách `totalTopupsVnd` / `totalUnlockRevenueVnd` | `4c8af7d` |
| API trạng thái giao dịch `[AllowAnonymous]`, mã 6 số | ✅ cần đăng nhập + chủ đơn, mã 10 số | `bb6b9f8`, `bce4697` |
| Mua được ấn bản chưa phát hành / đang hẹn giờ | ✅ chặn, trả `EDITION_NOT_PUBLISHED` 404 | `caeaf79` |
| ReopenEdition kéo bản đã phát hành về nháp | ✅ chặn | `6de7f5b` |
| Publisher thấy chương chưa bàn giao | ✅ chỉ trả chương đã bàn giao | `6ab3f3c` |
| Quyền ghi thanh toán mở cho `Publisher,Admin` | 🟡 ghi chỉ còn Publisher; `GET` vẫn `Publisher,Admin` (`WorkspacePaymentsController.cs:43`). Duyệt VietQR do Publisher là **trái BR-32**, chờ Q1 | `06dba3b` |
| Client tự gửi dung lượng khi tạo Studio, 0 = không giới hạn | ❌ còn nguyên | `CreateWorkspaceCommand.cs:16`, `StudioWorkspace.HasStorageCapacity` |
| Chỉ 2 luồng giữ chỗ dung lượng | ❌ còn nguyên: 9 luồng gọi `IAssetStorage.SaveAsync`, 2 luồng giữ chỗ | §2, OPS-02 |
| AI trừ token sau khi gọi | ❌ còn nguyên (chỉ `CheckAvailabilityAsync` trước khi gọi) | `RunThumbnailCommand.cs:90` |
| `StudioGovernanceBar` import nhưng không hiển thị | ❌ còn nguyên | FE `StudioOverviewView.tsx:38` |
| Publisher không tải được file export | ❌ `Download` chỉ Producer, Editor | `ExportsController.cs` (`{jobId}/file`) |
| Phát hành không thu hồi PreviewLink | ❌ không thấy thu hồi trong `PublishEdition*Command` | `Features/Chapters/Commands/Editions/` |
| Hoàn tiền ghi sai loại giao dịch | ❌ enum chỉ có `Topup`, `ChapterUnlock`, `VipSubscription` | `PaymentTransactionType.cs` |
| VIP còn ở Backend, cấp quyền đọc 0đ | ❌ còn `SubscribeVipCommand`, `HasActiveVipAsync` | `ChapterReadAccess.cs:194` |
| Số tài khoản ngân hàng theo từng Studio (trái Q13) | ❌ `StudioWorkspace.UpdateBankInfo` | `StudioWorkspace.cs:45` |
| FE `workspaceRoleGuard.ts` vẫn cho Admin vào mọi route | ❌ ghi chú ở Workboard 27/11 | FE `workspaceRoleGuard.ts` |
| Flutter: token chữ thường, không xoá dữ liệu khi đăng xuất | 🔍 `main` 27/11 đã có `SecureCookieStorage` và `clearUserScopedData()`; cần kiểm lại luồng thanh toán giả | MO `api_client.dart:316`, `auth_service.dart:577` |

Phần còn mở được chia thành các task dưới đây.

## 2. Danh sách luồng ghi file (đầu vào cho OPS-02)

Đếm theo `IAssetStorage.SaveAsync`, không theo `SaveChangesAsync`:

| Luồng | Giữ chỗ? |
|---|---|
| `Assets/UploadArtwork` | ✅ |
| `AiAgents/RunThumbnail` | 🟡 có, nhưng kiểm dung lượng **sau** khi gọi AI |
| `Bible/UploadBibleReferenceImage` | ❌ |
| `Chapters/SetChapterCover` | ❌ |
| `Series/SetSeriesCover` | ❌ |
| `Series/SetSeriesImage` | ❌ |
| `Workspaces/SetWorkspaceCover` | ❌ |
| `Exports/ProcessNextExportJob` | ❌ (cần chốt: gói export có tính vào dung lượng Studio không, câu C3) |
| `Assets/DownloadAsset` | 🔍 ghi bản `webp` dẫn xuất; cần xác định là cache của nền tảng hay dữ liệu Studio |

---

## 3. Lộ trình

Quy ước theo `README.md` §2: mỗi task một PR có test hồi quy, sub-task gắn tiền tố repo. Không ghi thời lượng.

### GĐ0 · Vá phần P0 còn lại (không cần đổi spec)

#### OPS-01 · Server tự đặt hạn mức khi tạo Studio — BE + FE ✅ (28/11)
BR-22.
- [x] [BE] `CreateWorkspaceCommand(OwnerId, Name)`; quota lấy từ `WorkspaceDefaults:StorageQuotaBytes` (mặc định 5 GB, âm thì báo lỗi khi khởi động).
- [x] [BE] 0 = không giới hạn chỉ đặt qua lệnh Admin `UpdateWorkspaceQuota`.
- [x] [FE] Bỏ ô chọn dung lượng ở `CreateWorkspaceModal`.
- [x] [QA] `WorkspaceHandlerTests`.
- Commit: BE `5ea5994`, FE `bb0c4ef`.

#### OPS-02 · Giữ chỗ dung lượng cho mọi luồng ghi file — BE ✅ (28/11)
- [x] [BE] `Features/Assets/Common/StorageQuota.TryReserveAsync` (bỏ qua khoá CAS đã có) dùng ở bìa Series, ảnh Series, bìa Studio, bìa Chương, ảnh tham chiếu Bible; lưu xung đột `xmin` → 409.
- [x] [BE] `RunThumbnail`: kiểm còn ≥ 2 MB trước khi gọi AI.
- [ ] [BE] Trả lại dung lượng ảnh bị thay thế: chuyển sang OPS-22 (tính lại từ asset còn tham chiếu). Export/DownloadAsset chờ C3.
- [x] [QA] SeriesCoverTests, SeriesImageTests, BibleReferenceAccessTests, ThumbnailTests.
- Commit: BE `d383e3d`.

#### OPS-03 · Trừ token AI nguyên tử — BE ✅ (28/11, một phần)
- [x] [BE] `WorkspaceAiConfig` có `xmin`; `TryReserveTokens` / `SettleReservedTokens`; `AiUsageService` thử lại khi xung đột (3 lần). Migration `AddWorkspaceAiConfigConcurrencyToken`.
- [x] [BE] Copilot giữ chỗ `AiAgentSettings.CopilotReservedTokens` (4000) trước khi gọi, chốt số thật sau.
- [ ] [BE] Giới hạn còn lại: RunWorkflow và RecordAgentStep mới chỉ hết mất cập nhật (xmin), chưa giữ chỗ trước khi gọi.
- [x] [QA] `AiUsageServiceTests` (3 test mới).
- Commit: BE `2be8323`.

#### OPS-04 · Hiện thanh hạn mức cho Producer — FE ✅ (28/11, agy)
- [x] [FE] `StudioGovernanceBar` ở tab Series của `StudioOverviewView`; quota 0 hiện "không giới hạn". Nút "Xin tăng hạn mức" (OPS-21) gắn ở `931a0d9`.
- [x] [FE] i18n VI/EN, `StudioOverviewView.test.tsx`.
- Commit: FE `403eac8`.

#### OPS-05 · Rà màn Admin rồi khoá route FE — FE + BE ✅ (28/11, agy, FE)
BR-07.
- [ ] [BE] Danh sách endpoint Admin cần đọc (xem Studio, hỗ trợ, audit): chờ team chốt.
- [x] [FE] `workspaceRoleGuard.ts`: Admin chỉ vào route ghi rõ ADMIN/ADMINISTRATOR; bị từ chối thì về `/admin`. Bỏ ADMINISTRATOR khỏi `allowedRoles` của mọi route sản xuất Studio trong `routes.tsx`.
- [x] [QA] `RequireWorkspaceRole.test.tsx`.
- Commit: FE `35a62ed`.

#### OPS-06 · Tách loại "Hoàn tiền" — DB + BE ✅ (28/11)
- [x] [DB] `PaymentTransactionType.Refund = 4`; migration `ReclassifyAdminRefundTransactions` chuyển bản ghi `bank_bin = 'ADMIN_REFUND'`.
- [x] [BE] `admin/refund` ghi Refund; Ví hiện "Hoàn tiền vào Ví"; `CreateTopup` từ chối Refund.
- Commit: BE `03b62bd`.

#### Phụ thuộc sang plan khác (GĐ0)
- `REL`: thu hồi PreviewLink khi phát hành + watermark ở server; Publisher tải được export (`ExportsController` `Download`).
- `RDR`/MO: kiểm lại luồng thanh toán giả và token Google giả trên Flutter (🔍 ở §1).

### GĐ1 · Chuẩn hoá tài chính Q13 (cần trả lời C1, C2)

#### OPS-10 · Tài khoản ngân hàng của nền tảng — DB + BE + FE ✅ (28/11, C1 = Publisher cấu hình và duyệt)
- [x] [DB] Bảng `platform_bank_accounts` append-only (bản ghi mới nhất là tài khoản đang dùng), migration `AddPlatformBankAccounts`. Cột ngân hàng cũ trên `studio_workspaces` đã bỏ ở migration `DropStudioBankColumns` (`0a3df74`); giá trị cũ được lưu vào `audit_logs` với action `STUDIO_BANK_INFO_ARCHIVED` trước khi bỏ.
- [x] [BE] Nạp ví không gắn Studio (`workspace_id = null`); mở chương bằng VietQR vẫn gắn Studio của chương. `SePay:DefaultBank` là giá trị dùng khi chưa có bản ghi.
- [x] [BE] `PUT /api/platform/payments/bank-account` bắt Publisher đã bật 2FA + mã TOTP/mã khôi phục, ghi audit `PLATFORM_BANK_ACCOUNT_CHANGED` (chỉ 4 số cuối).
- [x] [BE] Quyền theo C1 (giữ đúng V2.6): ghi/duyệt chỉ Publisher; Admin chỉ đọc (`GET /api/platform/payments`, `GET .../bank-account`). Duyệt/từ chối toàn nền tảng: `POST /api/platform/payments/{id}/approve|reject`. Bỏ `GET/PUT /api/workspaces/{id}/payments/bank-settings`.
- [x] [FE] `/publisher/revenue/payments`: cấu hình tài khoản nền tảng (ô mã 2FA, lịch sử, cảnh báo đang dùng tài khoản mặc định) + giao dịch toàn nền tảng; `/publisher/revenue/workspaces/:id` lọc theo Studio. Producer không còn màn ngân hàng.
- Commit: BE `6d8544d`, FE `2a97d2d` trên `feature/admin-b2b`.

#### OPS-11 · Gỡ VIP khỏi Backend — BE + FE ✅ (28/11)
C2 (Q6 nguồn). Flutter đã gỡ 20/11.
- [x] [BE] Bỏ `SubscribeVip` và endpoint `subscribe-vip`, bỏ VIP trong `ChapterReadAccess` và catalog; `CreateTopup` từ chối VipSubscription; đơn VIP cũ được duyệt thì cộng Ví; `GetMyWallet` luôn `IsVip = false`. Giữ bản ghi giao dịch cũ.
- [x] [FE] Bỏ dòng VIP ở KPI doanh thu Publisher.
- Commit: BE `1438dff`, FE `50f5fcf`.

#### OPS-12 · Chống webhook SePay trùng — BE ✅
- [x] [BE] Kiểm khoá duy nhất theo mã giao dịch ngân hàng; nhận trùng thì trả 200 không cộng lần hai. BE `55f6952`: cột `payment_transactions.provider_reference` (`sepay:{Id}`, unique có lọc, migration `AddPaymentProviderReference`). Cùng giao dịch gửi lại hoặc đơn đã duyệt tay → `IgnoredAlreadyProcessed`; giao dịch khác cho đơn đã xong → `IgnoredPaidTwice` + log cảnh báo để đối soát, không cộng.

### GĐ2 · Quản trị tài nguyên đầy đủ (phương án 1B, nhịp 2)

#### OPS-20 · Chính sách hạn mức mặc định — DB + BE + FE ✅
- [x] [DB] Bảng `quota_policies` (dung lượng, token AI/tháng, ảnh AI/tháng, người sửa), append-only: mỗi lần sửa thêm một dòng, dòng mới nhất là bản đang dùng. Migration `AddQuotaPoliciesAndIncreaseRequests`. Chưa có dòng nào thì dùng `WorkspaceDefaults:{StorageQuotaBytes,MonthlyTokenQuota,MonthlyImageQuota}`.
- [x] [BE] `CreateWorkspace` lấy cả 3 mức từ chính sách (OPS-01 cũ chỉ lấy dung lượng). Mọi mức trong chính sách phải > 0 (check constraint): "0 = không giới hạn" chỉ đặt riêng từng Studio. Không đổi Studio đã có. BE `80b6a7a`.
- [x] [FE] Thẻ "Hạn mức cho Studio mới" ở màn Tài nguyên (OPS-23). FE `c344704`.

#### OPS-21 · Producer xin tăng hạn mức, Admin duyệt — DB + BE + FE ✅
- [x] [DB] `quota_increase_requests` (loại `Storage|AiTokens|AiImages`, mức đang cấp, mức xin tuyệt đối, lý do, `Pending|Approved|Rejected`, người/lúc duyệt, ghi chú, mức cấp thật, `xmin`). Index unique có lọc: một yêu cầu đang chờ cho mỗi (Studio, loại).
- [x] [BE] Gửi (Producer, 409 nếu trùng loại đang chờ; loại đang không giới hạn hoặc Studio chưa cấp AI → 400), duyệt (cấp đúng mức xin hoặc mức Admin chọn, đổi hạn mức trong cùng lần lưu), từ chối (bắt lý do). Thông báo `QuotaIncreaseRequested` cho mọi Admin, `QuotaIncreaseApproved/Rejected` cho Producer. Audit tự ghi. 16 test `QuotaGovernanceTests`. BE `80b6a7a`, `8f16fda`.
- [x] [FE] `StudioGovernanceBar` có prop tuỳ chọn `onRequestQuotaIncrease` (hiện nút "Xin tăng hạn mức") + `QuotaIncreaseRequestModal` (chọn loại, mức mới, lý do, lịch sử 5 yêu cầu gần nhất). Hàng chờ duyệt ở màn Admin. FE `c344704`.
- [x] [FE] Nối vào `StudioOverviewView`: chỉ Producer có nút, render `QuotaIncreaseRequestModal` với Studio đang mở. FE `931a0d9` (trên OPS-04 `403eac8`).

**Hợp đồng API (OPS-20..23)** — enum gửi dạng chuỗi.

| Endpoint | Vai trò | Body / kết quả |
|---|---|---|
| `GET /api/workspaces/{id}/quota-requests` | Producer | `QuotaIncreaseRequestDto[]` (50 mới nhất) |
| `POST /api/workspaces/{id}/quota-requests` | Producer | `{ resourceType, requestedQuota, reason }` → 201 `QuotaIncreaseRequestDto`; 409 trùng |
| `GET/PUT /api/admin/quota-policy` | Admin | `{ storageQuotaBytes, monthlyTokenQuota, monthlyImageQuota }` → `QuotaPolicyDto` (+ `isFromSettings`, `updatedAt`, `updatedByName`) |
| `GET /api/admin/quota-requests?status=Pending` | Admin | `QuotaIncreaseRequestDto[]` |
| `POST /api/admin/quota-requests/{id}/approve` | Admin | `{ grantedQuota?: number, note?: string }`; 409 nếu đã xử lý |
| `POST /api/admin/quota-requests/{id}/reject` | Admin | `{ note }` (bắt buộc) |
| `GET /api/admin/resources` | Admin | `AdminWorkspaceResourceDto[]` (đã dùng/mức cấp 3 loại, `hasAiConfig`, `aiEnabled`, `pendingRequestCount`) |
| `PUT /api/admin/workspaces/{id}/resources` | Admin | `{ storageQuotaBytes?, monthlyTokenQuota?, monthlyImageQuota? }`; null = giữ, 0 = không giới hạn |
| `POST /api/admin/storage/reconcile?apply=false` | Admin | `StorageReconcileReportDto`: từng Studio `recordedBytes`, `computedBytes`, `orphanFiles/Bytes`, `derivedBytes`, `missingFiles`; file không thuộc Studio nào; tối đa 200 khoá mồ côi mẫu. `apply=true` ghi `UsedStorageBytes = computedBytes`; 409 nếu Studio vừa upload trong lúc quét. Không xoá file |

#### OPS-22 · Reset AI đầu tháng và đối soát file mồ côi — BE + FE ✅
- [x] [BE] Reset lười trong `AiUsageService` đủ cho việc chặn quota (mỗi lượt gọi đều kiểm tháng). Thiếu sót chỉ ở màn đọc: tháng mới chưa gọi AI thì còn hiện số tháng trước. Đã sửa: `GetWorkspaceUsage` và `GetAdminResources` coi bộ đếm của tháng cũ là 0 (`WorkspaceAiConfig.IsCountedThisMonth`). Không cần job. BE `687f503`.
- [x] [BE] Admin bấm chạy (không phải job định kỳ): `ReconcileStorageCommand` quét kho một lần (`IAssetStorage.ListAsync`, R2 + local), gán file cho Studio theo khoá CAS, so với bản ghi còn tham chiếu (asset kể cả xoá mềm, ảnh bìa Studio/Series/avatar/banner/chương hiện tại, ảnh Bible theo SHA trong mọi cột Bible kể cả lịch sử). Ảnh `thumbs/` và `exports/` báo riêng, không tính vào hạn mức. Theo C6: **không xoá file nào**. 3 test `ReconcileStorageTests`. BE `e1110f5`.
- [x] [FE] Thẻ "Đối soát dung lượng" cuối màn Tài nguyên (`StorageReconcileCard`): quét chỉ đọc, bảng Studio lệch số / có file mồ côi / thiếu file, danh sách khoá mồ côi, "Cập nhật dung lượng" phải xác nhận. FE `9e16ce0`.
- [ ] Xoá file mồ côi: chỉ làm sau khi Admin xem báo cáo trên dữ liệu thật và chốt lại (C6).

#### OPS-23 · Màn Admin Resources — FE ✅
- [x] [FE] Tab `?tab=storage` của Admin thành "Tài nguyên & hạn mức" (`AdminResourcesView`, thay `StorageBackupSettings`): hàng chờ yêu cầu, chính sách cho Studio mới, bảng Studio với dung lượng/token/ảnh đã dùng so với mức cấp, số yêu cầu chờ, sửa nhanh 3 mức. FE `c344704`.

### GĐ3 · Để sau
Tách dung lượng sản xuất và phát hành; giới hạn request/phút theo Studio; link R2 ký trực tiếp, CDN (thuộc `RDR`). B2B, gói thuê bao, nhiều Publisher, chia doanh thu: ngoài phạm vi.

---

## 4. Thứ tự và phụ thuộc

```
OPS-01 ─► OPS-02 ─► OPS-03 ─► OPS-04      (GĐ0, làm tuần tự vì cùng chạm quota)
OPS-05, OPS-06                             (GĐ0, độc lập, làm song song được)
C1 + C2 ─► OPS-10, OPS-11, OPS-12          (GĐ1)
OPS-01..04 ─► OPS-20 ─► OPS-21 ─► OPS-23   (GĐ2)
OPS-22 độc lập sau OPS-02
```

Đề xuất bắt đầu: **OPS-01** (nhỏ, nối tiếp phần quota Admin đang làm dở đã gỡ khỏi `e79e061`).

## 5. Câu hỏi cần chốt trước khi code

| # | Câu hỏi | Chặn task | Gợi ý |
|---|---|---|---|
| C0 | Nhánh tên "admin-b2b" có nghĩa là muốn làm B2B (bán gói cho Studio) không? | Toàn plan | Không; giữ V2.6, Admin cấp tài nguyên |
| C1 | Ai nắm tài khoản ngân hàng và duyệt VietQR: 2A (đúng V2.6) hay 2B (Admin nắm hết, sửa spec)? | OPS-10 | ✅ Chốt 28/11: Publisher cấu hình và duyệt (đúng BR-32 V2.6), Admin chỉ đọc |
| C2 | Gỡ VIP khỏi Backend, giữ lịch sử giao dịch? | OPS-11 | Gỡ |
| C3 | Gói export và ảnh `webp` dẫn xuất có tính vào dung lượng Studio không? | OPS-02 | Export: có, vì Studio tạo ra; `webp` cache: không |
| C4 | Danh sách màn/endpoint Admin được đọc trong Studio | OPS-05 | Lập danh sách ở OPS-05 rồi chốt |
| C6 | Dọn file mồ côi (OPS-22): chỉ tính lại `UsedStorageBytes` và báo cáo, hay xoá luôn file không còn tham chiếu khỏi R2 (không khôi phục được)? | OPS-22 | ✅ Chốt 28/11: tính lại + báo cáo, chưa xoá. Xoá sẽ hỏi lại sau khi xem báo cáo |
| C5 | Phần quota Admin đang làm dở (gỡ khỏi `e79e061`) có đi theo hướng giữ chỗ ở OPS-02 không? | OPS-01..03 | Đọc OPS-02 trước khi commit tiếp |
