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

#### OPS-01 · Server tự đặt hạn mức khi tạo Studio — BE + FE ❌
BR-22. Hiện client gửi `StorageQuotaBytes`, gửi 0 là không giới hạn.
- [ ] [BE] Bỏ `StorageQuotaBytes` khỏi `CreateWorkspaceCommand` và request của `WorkspacesController`; lấy mặc định từ cấu hình `WorkspaceDefaults:StorageQuotaBytes` (và quota AI mặc định).
- [ ] [BE] 0 = không giới hạn chỉ đặt được qua lệnh Admin `UpdateWorkspaceQuota`, ghi audit.
- [ ] [FE] Bỏ ô dung lượng ở form tạo Studio (nếu có).
- [ ] [QA] Test: client gửi quota bị bỏ qua; Studio mới nhận đúng mặc định.

#### OPS-02 · Giữ chỗ dung lượng cho mọi luồng ghi file — BE ❌
Mẫu: giữ chỗ nguyên tử (`TryReserveStorage` + khoá `xmin`) → ghi file → lỗi/huỷ thì `ReleaseStorage`.
- [ ] [BE] Bọc 5 luồng ❌ ở §2 (Bible, 3 loại bìa, ảnh Series); xử lý Export/DownloadAsset sau khi chốt C3.
- [ ] [BE] `RunThumbnail`: giữ chỗ trước khi gọi AI, trả lại khi AI lỗi.
- [ ] [BE] Ảnh thay thế (bìa mới đè bìa cũ): trả lại dung lượng bản cũ nếu không còn tham chiếu (CAS dùng chung hash).
- [ ] [QA] Test hết hạn mức → 409/422 trước khi ghi file; lỗi ghi file → `UsedStorageBytes` không đổi.

#### OPS-03 · Trừ token AI nguyên tử — BE ❌
- [ ] [BE] Giữ chỗ token ước lượng trước khi gọi, chốt số thật sau khi có `usage`, trả phần thừa; dùng cùng cơ chế khoá lạc quan như dung lượng.
- [ ] [QA] Test hai yêu cầu song song không vượt hạn mức.

#### OPS-04 · Hiện thanh hạn mức cho Producer — FE ❌
- [ ] [FE] Render `StudioGovernanceBar` trong `StudioOverviewView` (đã viết sẵn), dữ liệu từ API quota hiện có.
- [ ] [FE] i18n VI/EN, `npm run i18n:check`.

#### OPS-05 · Rà màn Admin rồi khoá route FE — FE + BE ❌
BR-07, câu Q11 của tài liệu nguồn. BE đã gỡ bypass, FE chưa.
- [ ] [BE] Lập danh sách endpoint Admin cần đọc (xem Studio, hỗ trợ, audit) — viết vào plan này, chờ team chốt.
- [ ] [FE] `workspaceRoleGuard.ts` bỏ cho Admin vào mọi route Studio; màn Admin chỉ gọi API `/api/admin/*`.
- [ ] [QA] Test Admin nhận 403/redirect ở route sản xuất.

#### OPS-06 · Tách loại "Hoàn tiền" — DB + BE ❌
- [ ] [DB] Thêm `PaymentTransactionType.Refund` (giá trị mới, không đổi số cũ); migration chuyển dữ liệu hoàn tiền cũ nếu nhận diện được.
- [ ] [BE] `admin/refund` ghi đúng loại; báo cáo doanh thu không tính Refund là nạp.

#### Phụ thuộc sang plan khác (GĐ0)
- `REL`: thu hồi PreviewLink khi phát hành + watermark ở server; Publisher tải được export (`ExportsController` `Download`).
- `RDR`/MO: kiểm lại luồng thanh toán giả và token Google giả trên Flutter (🔍 ở §1).

### GĐ1 · Chuẩn hoá tài chính Q13 (cần trả lời C1, C2)

#### OPS-10 · Tài khoản ngân hàng của nền tảng — DB + BE + FE ❌
- [ ] [DB] Bảng riêng `platform_bank_accounts` (một bản ghi đang dùng, lịch sử append-only); bỏ dần cột ngân hàng trên `studio_workspaces`.
- [ ] [BE] Nạp ví không phụ thuộc Studio; cấu hình `SePay:DefaultBank` thành giá trị khởi tạo.
- [ ] [BE] Đổi số tài khoản bắt nhập mã 2FA (đã có) và ghi audit.
- [ ] [BE] Quyền cấu hình và duyệt VietQR theo phương án C1 (2A: Publisher cấu hình, chỉ Admin duyệt; 2B: Admin nắm hết).
- [ ] [FE] Màn cấu hình ngân hàng nền tảng ở đúng vai trò; gỡ màn ngân hàng theo Studio của Producer.

#### OPS-11 · Gỡ VIP khỏi Backend — BE + FE ❌
Câu C2 (Q6 nguồn). Flutter đã gỡ 20/11.
- [ ] [BE] Bỏ `SubscribeVip`, bỏ nhánh `HasActiveVipAsync` trong `ChapterReadAccess`; giữ bản ghi giao dịch cũ.
- [ ] [FE] Bỏ breakdown VIP ở doanh thu.

#### OPS-12 · Chống webhook SePay trùng — BE ✅
- [x] [BE] Kiểm khoá duy nhất theo mã giao dịch ngân hàng; nhận trùng thì trả 200 không cộng lần hai. BE `55f6952`: cột `payment_transactions.provider_reference` (`sepay:{Id}`, unique có lọc, migration `AddPaymentProviderReference`). Cùng giao dịch gửi lại hoặc đơn đã duyệt tay → `IgnoredAlreadyProcessed`; giao dịch khác cho đơn đã xong → `IgnoredPaidTwice` + log cảnh báo để đối soát, không cộng.

### GĐ2 · Quản trị tài nguyên đầy đủ (phương án 1B, nhịp 2)

#### OPS-20 · Chính sách hạn mức mặc định — DB + BE + FE ❌
- [ ] [DB] Bảng chính sách (dung lượng, token AI/tháng, ảnh AI/tháng); OPS-01 đọc từ đây thay cho cấu hình.
- [ ] [BE/FE] Admin sửa chính sách; không ảnh hưởng Studio đã được cấp riêng.

#### OPS-21 · Producer xin tăng hạn mức, Admin duyệt — DB + BE + FE ❌
- [ ] [DB] `quota_increase_requests` (loại, mức xin, lý do, trạng thái Pending/Approved/Rejected, người duyệt).
- [ ] [BE] Command gửi/duyệt/từ chối; thông báo cho Admin và Producer; audit.
- [ ] [FE] Nút "Xin tăng hạn mức" trên `StudioGovernanceBar`; hàng chờ duyệt ở màn Admin.

#### OPS-22 · Reset AI đầu tháng và dọn file mồ côi — BE 🔍
- [ ] [BE] Xác nhận reset tháng trong `CheckAvailabilityAsync` đủ dùng hay cần job.
- [ ] [BE] Job tính lại `UsedStorageBytes` từ asset còn tham chiếu, dọn file mồ côi (chỉ xoá file, không xoá lịch sử).

#### OPS-23 · Màn Admin Resources — FE ❌
- [ ] [FE] Bảng Studio: dung lượng/AI đã dùng, mức cấp, yêu cầu đang chờ, sửa nhanh.

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
| C1 | Ai nắm tài khoản ngân hàng và duyệt VietQR: 2A (đúng V2.6) hay 2B (Admin nắm hết, sửa spec)? | OPS-10 | 2A ngay, bàn 2B riêng |
| C2 | Gỡ VIP khỏi Backend, giữ lịch sử giao dịch? | OPS-11 | Gỡ |
| C3 | Gói export và ảnh `webp` dẫn xuất có tính vào dung lượng Studio không? | OPS-02 | Export: có, vì Studio tạo ra; `webp` cache: không |
| C4 | Danh sách màn/endpoint Admin được đọc trong Studio | OPS-05 | Lập danh sách ở OPS-05 rồi chốt |
| C5 | Phần quota Admin đang làm dở (gỡ khỏi `e79e061`) có đi theo hướng giữ chỗ ở OPS-02 không? | OPS-01..03 | Đọc OPS-02 trước khi commit tiếp |
