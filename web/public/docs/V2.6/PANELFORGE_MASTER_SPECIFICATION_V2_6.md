# 📘 ĐẶC TẢ TỔNG THỂ LUỒNG NGHIỆP VỤ, KIẾN TRÚC MODULE & BUSINESS RULES — PANELFORGE (V2.6 FINAL)

> **Dự án:** PanelForge — Nền tảng Quản lý Sản xuất Truyện tranh Manga có Cấu trúc & Truy vết Phiên bản  
> **Kiến trúc kỹ thuật:** .NET 9 Clean Architecture (CQRS/MediatR, SignalR) + React 19 (TypeScript, Konva/Canvas API) + Flutter Mobile + PostgreSQL 17, Marten Event Store & Cloudflare R2 (CAS SHA-256)  
> **Trọng tâm phiên bản V2.6 (Final):**
> 1. Tối giản cấu trúc kịch bản theo `Trang -> Panel -> Nội dung`, nhân vật quần chúng ghi trực tiếp trong chỉ dẫn/dẫn truyện (không cần tạo Bible trước).
> 2. Artist làm chủ hoàn toàn bước Layout + Pencil trên trang được giao và mặc định có sẵn quyền đặt bóng thoại (Lettering); Letterer là vai trò phụ việc tùy chọn (chỉ mở công cụ chữ trên trang được giao, khóa lớp tranh vẽ).
> 3. Cô lập sửa lỗi cấp Panel tại Gate 2, hỗ trợ từ 1 đến nhiều Artist làm việc song song không xung đột.
> 4. Định vị Publisher là đối tác phát hành bên ngoài Studio (External Stakeholder) nhận chuyển giao gói xuất bản từ Producer qua **Publisher Portal**. Publisher không tác động vào nội dung sản xuất, nhưng **là người quy định thương mại của từng ấn bản ngôn ngữ: loại Free / Trả phí, giá tiền và số trang xem trước** (BR-33).
> 5. Kiếm tiền chương bằng **tiền thật (VNĐ)**: độc giả trả tiền để mở khóa ấn bản trả phí. Hệ thống dùng **một đơn vị tiền tệ duy nhất là VNĐ**, không có token, không quy đổi tỷ giá ngoại tệ.
> 6. **Producer** là người xem số liệu đọc và doanh thu (Dashboard 360°, BR-32).
> 7. **Ấn bản ngôn ngữ (Language Edition):** Series khai báo ngôn ngữ gốc và các ngôn ngữ phát hành; mỗi bóng thoại có bản chữ theo từng ngôn ngữ trên cùng một vị trí. Mỗi cặp *(Chương, Ngôn ngữ)* là một **ấn bản** được Producer nghiệm thu riêng, Publisher đặt giá riêng, độc giả mua riêng: **mua ngôn ngữ nào đọc ngôn ngữ đó** (BR-34).
>
> **Nhật ký quyết định (chốt ngày 2026-11-12):**
>
> | # | Quyết định | Phần bị ảnh hưởng |
> |---|---|---|
> | Q1 | Trạng thái `Locked` gộp vào `ChapterApproved` | §5.2 |
> | Q2 | Lỗi vắt nhiều Panel → nhiều ChangeRequest gom bằng `group_id` | Module 3, §6.1.1 |
> | Q3 | Báo cáo Gross Revenue từ Publisher triển khai giai đoạn sau | Module 5 mục 3B |
> | Q4 | Không có gói VIP / thuê bao | BR-33 |
> | Q5 | Scene mặc định ẩn mỗi chương, `scene_id` giữ NOT NULL | §1.2 |
> | Q6 | ~~Token mua theo gói cố định~~ → **thay bằng Q11** | — |
> | Q7 | **Publisher** quy định xem trước & đặt giá chương (thay cho "chỉ Producer"). Publish/Reopen vẫn do Producer | Module 5, BR-33, §5.1, §5.3 |
> | Q8 | **Producer** xem lượt đọc & doanh thu | Module 5 mục 3, BR-32, §5.1 |
> | Q9 | Ngôn ngữ bóng thoại theo cấu hình ngôn ngữ của Series; độc giả chọn ngôn ngữ đọc | Module 2, Module 5 mục 5, BR-34, §6.1.6 |
> | Q10 | Producer **nghiệm thu từng ngôn ngữ**; **giá khác nhau theo ngôn ngữ**; **mua ngôn ngữ nào đọc ngôn ngữ đó** → khái niệm Ấn bản ngôn ngữ `ChapterEdition` | Module 2, Module 5 mục 1–5, BR-12/19/33/34, §5.1, §5.2, §6.1.5–6 |
> | Q11 | **Không dùng token, dùng tiền thật**: giá, ví, giao dịch, doanh thu đều bằng VNĐ; một đơn vị tiền tệ, không quy đổi ngoại tệ (thay Q6) | Module 5 mục 3–4, BR-32/33, §6.1.5 |
> | Q12 | **Toàn hệ thống chỉ có một tài khoản Publisher**, phát hành cho mọi Workspace và Series | Module 5 mục 2 & 4, BR-33, §5.1 |
> | Q13 | Tiền nạp Ví chuyển vào **tài khoản ngân hàng của nền tảng**; doanh thu Workspace tính từ giao dịch mở khóa | Module 5 mục 4, BR-33, §6.1.5 |
> | Q14 | Ấn bản ngôn ngữ dịch: **Editor duyệt**, **Producer cho phép phát hành** | Module 5 mục 1, BR-12/34, §5.1, §5.2 |
> | Q15 | **Vòng đời kịch bản riêng `ScriptStatus` (`Draft ↔ InReview → Frozen`)**, không còn là stage pipeline / Assignment. Lưu = commit (phiên bản bất biến, băm SHA-256), Gửi duyệt = push (con trỏ bản đã gửi). Editor đọc bản đã gửi và chỉ góp ý theo dòng; Writer vẫn sửa, lưu và gửi lại khi `InReview`; Producer bấm *Bắt đầu sản xuất* (chương `PreProduction → InProduction`). Chốt 2026-11-13 | Module 1 mục 4, §5.2 |
> | Q16 | **Series Bible chốt theo chương** (thay `@Tag` và mốc chương hiệu lực): kịch bản là chữ thuần. **Tên người nói** tự khớp tên/bí danh (`aliases`) mục Bible; chưa có thì hệ thống **tự tạo bản nháp** nhân vật, Writer gắn cờ **Quần chúng** nếu không cần thiết kế. **Lời dẫn / mô tả không tự khớp**: Writer **bôi đen** đoạn chữ để tham chiếu mục có sẵn hoặc tạo bản nháp. **Gắn vào chương là tự động**: mục nào có trong kịch bản chương thì thuộc Danh sách thực thể chương; bản tạo hình chương dùng cũng được hệ thống tự chọn (biến thể theo nhãn, không theo số chương; **chỉ Writer** đổi được biến thể cho một chương khi cần — timeskip, hồi tưởng, đổi trang phục) và lưu ở `chapter_bible_bindings`, khoá cùng kịch bản ở Gate 1. **Gate 1 chỉ kiểm khoá Canon**: mọi mục (trừ Quần chúng) phải `CanonLocked`. Producer chỉ đọc kịch bản (BR-07); chỉ Producer mở lại kịch bản đã chốt. Chốt 2026-11-14 | §1.1, §1.2, §2.1, Module 1 mục 2–4, BR-01/15/21/30/35, §5.1, §5.2 máy 1, §5.3 |
> | Q17 | **Bôi đen tham chiếu chỉ Writer**; ~~Writer và Producer gắn/gỡ cờ Quần chúng~~ (Q19: chỉ Writer). **Duyệt thiết kế Series Bible: Writer góp ý, Editor chốt** (~~xác nhận `WriterEndorsed`; Producer khoá Canon~~ → Q20: Editor xác nhận là khoá Canon). Chốt 2026-11-14 | Module 1 mục 2–3, BR-35, §5.1, §5.2 máy 1 |
> | Q18 | **Đổi biến thể tạo hình theo chương: chỉ Writer**. Hệ thống tự gắn bản (chương gần nhất phía trước / biến thể mặc định); khi thực thể có ≥ 2 biến thể `CanonLocked`, Writer chọn biến thể khác cho chương (timeskip, hồi tưởng, đổi trang phục) trước Gate 1; lựa chọn này thành bản tự gắn cho các chương sau. Chốt 2026-11-14 | Module 1 mục 3, BR-15, BR-35, §5.1 |
> | Q19 | **Danh sách thực thể chương do Writer quản lý**: chỉ Writer bôi đen tham chiếu, gắn/gỡ cờ Quần chúng (thay phần "Writer và Producer" của Q17), viết định nghĩa mục nháp, đổi biến thể. Bôi đen chỉ trên dòng **Mô tả (Action), Lời dẫn, SFX**; không trên tiêu đề Panel (chỉ ghi chú góc máy) và lời thoại. Cờ Quần chúng bật/tắt bất kỳ lúc nào; chương đã chốt giữ giá trị lúc chốt. ~~Supersede: chương chưa chốt giữ bản cũ tới khi bản thay thế được khoá rồi tự chuyển sang~~ (Q23: không tự chuyển, chương sau kế thừa về phía sau). Chốt 2026-11-14 | §1.2, §2.1, Module 1 mục 2–3, BR-01, BR-35, §5.1 |
> | Q20 | **Editor chốt Series Bible, Producer chỉ chốt kịch bản** (thay phần duyệt của Q17): Editor **xác nhận = khoá Canon luôn** (`ConceptSubmitted → CanonLocked`, bỏ trạng thái `WriterEndorsed`); Writer và Editor **góp ý** và **yêu cầu vẽ lại** (Q22: Producer cũng được yêu cầu vẽ lại); ngoài quyền đó Producer chỉ đọc Series Bible, chỉ *Bắt đầu sản xuất* / *Mở lại* kịch bản. **Phiên bản concept quản lý giống kịch bản**: mỗi lần Artist nộp Model Sheet là một **phiên bản concept** bất biến (số tăng dần, SHA-256); góp ý gắn theo phiên bản, có **trả lời** (luồng hội thoại); Editor xác nhận đúng phiên bản đang nộp. Chốt 2026-11-14 | Module 1 mục 3, BR-01, BR-06, §5.1, §5.2 máy 1 |
> | Q21 | **Chốt Bible hai mốc theo chương.** (1) **Gửi duyệt** kịch bản chỉ thành công khi Writer đã chốt Danh sách thực thể chương: không còn mục nháp chưa định nghĩa mà chưa gắn cờ Quần chúng, và mọi mục (trừ Quần chúng) đã có **biến thể (giai đoạn)** cho chương (Q22: biến thể mặc định do hệ thống đề xuất là hợp lệ, không cần Writer xác nhận). (2) **Biến thể chọn theo nhãn, kể cả biến thể chưa khoá** (ví dụ "Timeskip 18 tuổi" mới tạo, Artist đang vẽ); bản tạo hình của chương = bản `CanonLocked` mới nhất của biến thể đó. (3) **Bắt đầu sản xuất** chặn khi biến thể chương dùng chưa có bản `CanonLocked` — hình ảnh của đúng giai đoạn có trong kịch bản phải chốt trước. Thay điều kiện "≥ 2 biến thể `CanonLocked`" của Q18. Chốt 2026-11-14 | Module 1 mục 3–4, BR-15, BR-35, §5.1, §5.2 máy 5 |
> | Q22 | (1) **Producer được yêu cầu vẽ lại** concept Series Bible (`ReworkRequired`, bắt buộc nhận xét) như Writer và Editor; Producer vẫn không góp ý thường, không xác nhận/khoá. (2) **Chọn giai đoạn là thủ công và tuỳ chọn**: hệ thống tự đề xuất giai đoạn mặc định (giai đoạn chương gần nhất phía trước dùng, chưa có thì biến thể mặc định); Writer thấy cần thì vào đổi, không đổi thì giai đoạn mặc định được dùng — Gửi duyệt không đòi xác nhận giai đoạn. Chốt 2026-11-14 | Module 1 mục 3–4, BR-35, §5.1, §5.2 máy 1 |
> | Q23 | **Chương gắn bản cụ thể, kế thừa về phía sau, giai đoạn theo Panel** (thay phần "theo nhãn biến thể" của Q21/Q22 và luật "khoá bản thay thế thì mọi chương chưa chốt tự chuyển" của Q19): (1) Mỗi thực thể trong chương gắn **một bản cụ thể** (ví dụ Naruto "Mặc định" v1), có thể là bản chưa khoá. (2) **Kế thừa**: chương Writer không tự chọn thì dùng bản của **chương gần nhất phía trước** có thực thể đó (chưa có thì bản mới nhất của biến thể mặc định), tính lại cho tới khi chương chốt; Writer đổi chương N thì các chương sau chưa chốt kế thừa theo, chương trước không đổi. (3) **Giai đoạn theo Panel**: Writer đặt bản riêng cho thực thể trong các Panel cần (ví dụ hồi tưởng "Lúc nhỏ" v1); chương sau chỉ kế thừa bản mặc định của chương, không kế thừa bản theo Panel. (4) **Gate 1** chặn khi bất kỳ bản nào chương dùng (mặc định + theo Panel) chưa `CanonLocked`; không tự rơi về bản cũ. (5) Chương đã chốt giữ nguyên bản; mở lại cũng không tự kế thừa lại, chỉ đổi khi Writer chủ động (gắn ⚑). (6) Cảnh báo khi đổi bản mà chương phía sau đã chốt với bản khác (không chặn); báo trước các chương phía sau sẽ kế thừa; Writer được *Huỷ bản thay thế* chưa có sự kiện duyệt, chương đang chờ quay về bản kế thừa. Ví dụ: Ch1 đang sản xuất giữ Naruto v1; Writer tạo v2 khi viết Ch2 → Ch2 chờ v2 (Gate 1 chặn tới khi Editor khoá v2); Ch3 tự kế thừa v2. Chốt 2026-11-14 | Module 1 mục 3–4, BR-01, BR-15, BR-35, §5.1 |
> | Q24 | **Chi tiết Q23.** (1) **Kế thừa theo chuỗi thay thế**: bản kế thừa từ chương trước đã bị thay bằng một bản `CanonLocked` thì chương chưa chốt (Writer không tự chọn) dùng bản thay thế đã khoá mới nhất; bản thay thế còn đang duyệt không tính. (2) **Giai đoạn theo Panel là nội dung kịch bản**: lưu cùng lần Lưu (đi theo Panel trong cấu trúc Trang → Panel), không phải thao tác rời. (3) **Phiên bản kịch bản gồm lựa chọn của Writer**: bản Writer tự chọn cho chương và giai đoạn theo Panel nằm trong `ScriptVersion` và mã băm; đổi sau khi gửi thì phải gửi duyệt lại. Bản kế thừa không nằm trong mã băm (hiện ở màn Gate 1). Chốt 2026-11-14 | Module 1 mục 3–4, BR-35 |
> | Q25 | **Đề xuất AI là phiên bản kịch bản.** Mỗi lần AI sinh/sửa kịch bản tạo một `ScriptVersion` loại **Đề xuất AI** (`AiProposal`, ghi nguồn gợi ý), không đổi kịch bản chính, không gửi duyệt được. Writer đọc, so với kịch bản hiện tại, chấp nhận toàn bộ hoặc từng dòng vào bản đang soạn; bấm **Lưu** → commit `ScriptVersion` loại `Commit` (ghi bản đề xuất đã dùng). `ScriptVersion` là **nguồn duy nhất** cho lịch sử, gửi duyệt, chốt Gate 1, snapshot và lần nộp; `ContentRevision` không còn dùng cho kịch bản. Chốt 2026-11-14 | Module 1 mục 4, §5.2 máy 5 |
> | Q26 | **Bản chốt là bản gửi mới nhất; báo khi có bản mới.** Lưu → Gửi duyệt; bản gửi luôn là bản lưu mới nhất. *Bắt đầu sản xuất* gửi kèm bản Producer đang xem; nếu Writer đã gửi bản mới hơn trong lúc đó (ví dụ Producer xem v1, Writer gửi v2) → hệ thống từ chối (`409`) và **báo có phiên bản mới** kèm thay đổi v1 → v2; Producer xem rồi bấm chốt lại trên bản mới. Màn Gate 1 cũng hiện thông báo ngay khi có lần gửi mới. Chương lưu `frozen_script_version_id`; snapshot Gate 3 và lần nộp của Artist ghi bản này. Chốt 2026-11-14 | Module 1 mục 4, Module 5, §5.2 máy 5 |
> | Q27 | **Editor mở lại trang đã duyệt (trước Gate 3).** Editor (Producer dự phòng) khoanh lỗi trên trang đã `Approved` → chỉ Panel lỗi về `PanelReworkRequired` kèm phiếu `ChangeRequest` (bắt buộc nhận xét, ghi Audit), Panel khác giữ `Approved`. Artist sửa hoặc **khôi phục bản ảnh cũ** (tạo bản ghi mới trỏ file cũ, append-only) rồi nộp lại. Sau Gate 3 vẫn phải Producer mở lại chương. **Ảnh cuối** dùng cho Preview, Gate 3, xuất bản = bản của lần duyệt Gate 2 gần nhất, không phải bản upload mới nhất. Chốt 2026-11-14 | Module 3, §5.1, §5.2 máy 2 |
> | Q28 | **Đa ngôn ngữ làm trong hệ thống, tại công đoạn Lettering.** Artist/Letterer của trang nhập chữ dịch cho từng bóng thoại ngay trên màn đặt chữ (bộ chọn ngôn ngữ đang soạn), theo `release_languages` của Series; **không tải ảnh trang đã dịch** từ ngoài. Bản dịch không ảnh hưởng Pencil/Ink; Gate 2 chỉ cần chữ ngôn ngữ gốc. Mỗi ấn bản ngôn ngữ: *Nộp bản dịch* → **Editor duyệt** → **Producer cho phép phát hành và phát hành**; ảnh trang theo ngôn ngữ do hệ thống ghép (lớp tranh + lớp chữ ngôn ngữ đó) vào Snapshot của ấn bản. Publisher chỉ đặt giá; luồng Publisher tải ảnh dịch (`PageTranslation`) trong code bị gỡ. Chốt 2026-11-14 | Module 2, Module 5 mục 1–2, BR-34, §5.1 |

---

## PHẦN I. TỔNG QUAN LUỒNG NGHIỆP VỤ XUYÊN SUỐT (END-TO-END MASTER WORKFLOW)

### 1.1. Sơ Đồ Kiến Trúc Luồng Tinh Gọn (Mermaid Flowchart)

```mermaid
flowchart TD
    classDef gate fill:#FFF7ED,stroke:#EA580C,stroke-width:2px,color:#9A3412,font-weight:bold;
    classDef step fill:#EFF6FF,stroke:#2563EB,stroke-width:1.5px,color:#1E40AF;
    classDef para fill:#F0FDF4,stroke:#16A34A,stroke-width:1.5px,color:#166534;
    classDef err fill:#FEF2F2,stroke:#DC2626,stroke-width:1.5px,color:#991B1B;
    classDef ext fill:#FAF5FF,stroke:#9333EA,stroke-width:1.5px,color:#581C87;

    subgraph M1 ["GIAI ĐOẠN 1: KHỞI TẠO & TIỀN KỲ SONG SONG (WRITER ↔ ARTIST ↔ PRODUCER)"]
        S0["Producer tạo Studio Workspace ➔ Tạo Series (Hướng đọc RTL/LTR) ➔ Mời thành viên"]:::step
        S1["Writer soạn Kịch bản chữ thuần: Trang ➔ Panel ➔ (Mô tả vẽ, Thoại, Lời dẫn, SFX)<br/>• Người nói tự khớp Series Bible; tên mới ➔ hệ thống tự tạo bản nháp (gắn cờ Quần chúng nếu không cần)<br/>• Nhân vật không thoại: Writer bôi đen trong mô tả/lời dẫn để tham chiếu"]:::step
        S2["Artist vào Series Bible tải ảnh thiết kế cho các thực thể chính của chương<br/>(Draft ➔ ConceptSubmitted ➔ Editor xác nhận = CanonLocked; Writer/Editor góp ý; Writer/Editor/Producer yêu cầu vẽ lại)"]:::step
        G1{"🚪 GATE 1: CHỐT TIỀN KỲ<br/>Producer bấm 1 nút duy nhất:<br/>Approve Script & Start Production<br/>(chặn nếu thực thể không Quần chúng chưa CanonLocked)"}:::gate

        S0 --> S1 & S2
        S1 & S2 --> G1
    end

    subgraph M2 ["GIAI ĐOẠN 2: DỰNG KHUNG, VẼ PENCIL/INK & ĐẶT THOẠI (ARTIST CHỦ ĐẠO + LETTERER PHỤ VIỆC)"]
        P1["Artist (theo Page được Assign): Chọn Frame Template dựng tọa độ Panel {x,y,w,h}<br/>+ Ánh xạ Nội dung Panel + Vẽ phác thảo PENCIL (Tự chủ hoàn toàn)"]:::step
      
        G1 -->|"1. Khóa Bản đồ thực thể chương (chapter_bible_bindings 🔒)<br/>2. Đóng băng Kịch bản (Frozen ❄️)<br/>3. Giao Page cho các Artist trên Kanban"| P1

        P1 -->|"Nộp Pencil (Lưu mã băm SHA-256 & Tọa độ Panel cố định)<br/>Mở khóa đi nét INK & đặt BÓNG THOẠI"| I1 & L1

        I1["Nhánh A (Graphic Layer - Artist của Page): Đi nét mực INK<br/>• Có nút [↺ Self-Rollback] tự quay lại sửa Pencil nếu thấy sai sót<br/>• Nộp bản vẽ Ink theo từng Panel/Trang"]:::para
        L1["Nhánh B (Vector Layer - Artist tự làm HOẶC giao Letterer phụ việc):<br/>• Đặt BÓNG THOẠI gắn 1-1 với dòng Thoại/Dẫn truyện/SFX<br/>• Lưu Position Record {x,y,w,h} cố định, không xê dịch khi Ink cập nhật"]:::para

        COMP["Hệ thống tự động kiểm tra an toàn chữ (BR-20)<br/>& Ghép phẳng (Graphic Layer + Vector Layer) thành ảnh Composite 1200×1800"]:::step
        I1 & L1 --> COMP
    end

    subgraph M3 ["GIAI ĐOẠN 3: KIỂM ĐỊNH CHẤT LƯỢNG & CÔ LẬP LỖI CẤP PANEL"]
        G2{"🚪 GATE 2: QUALITY & COMPOSITE GATE<br/>Editor duyệt trang ghép 1200×1800<br/>(Luật 4 mắt BR-06: Reviewer != Assignee)"}:::gate
        COMP --> G2

        BOX["Editor kéo chuột khoanh vùng lỗi Bounding Box {x,y,w,h}<br/>Thuật toán hình học tự động tìm đúng các Panel giao thoa (Panel X)"]:::err
        G2 -->|"Phát hiện lỗi (ReworkRequired)"| BOX

        RW_LET["Nếu lỗi Chữ/Bóng thoại:<br/>• Trả về cho người giữ trách nhiệm chữ (Letterer hoặc Artist của Page) sửa tại Panel X<br/>• Bản vẽ Ink giữ nguyên Approved 🔒"]:::err
        RW_ART["Nếu lỗi Nét vẽ (Pencil/Ink):<br/>• Chỉ mở khóa Rework riêng cho Panel X (Các Panel khác trên trang giữ nguyên Approved 🔒)<br/>• Tự động bật viền Cam [⚠️ Check Balloon] báo kiểm tra lại bóng thoại trong Panel X"]:::err

        BOX --> RW_LET & RW_ART
        RW_LET & RW_ART --> COMP
    end

    subgraph M4 ["GIAI ĐOẠN 4: NGHIỆM THU CHƯƠNG, CHUYỂN GIAO PUBLISHER, THEO DÕI ĐỘC GIẢ & DOANH THU"]
        G3{"🚪 GATE 3: RELEASE GATE<br/>Producer quét chốt an toàn BR-12<br/>(100% Trang Approved, 0 CR mở, 0 Cờ ⚑)"}:::gate
        G2 -->|"100% Trang đạt Approved ✅"| G3

        SNAP["Tạo ChapterSnapshot bất biến (CAS SHA-256)<br/>• Cấp Preview Link (Watermark SVG) & Xuất gói file PDF / CBZ / Webtoon / JSON"]:::step
        PUB["Chuyển giao gói xuất bản cho PUBLISHER qua Publisher Portal<br/>• Producer nghiệm thu từng ấn bản ngôn ngữ & bấm Phát hành<br/>• Publisher quy định Free / Trả phí, giá VNĐ, số trang xem trước cho từng ấn bản<br/>• Reader chọn ngôn ngữ, trả tiền mở khóa đúng ấn bản ngôn ngữ đó<br/>• Producer Dashboard: Lượt xem, Tỷ lệ đọc hết & Doanh thu VNĐ theo ngôn ngữ"]:::ext

        G3 --> SNAP --> PUB
    end
```

### 1.2. Chuẩn Hóa Cấu Trúc Kịch Bản & Quy Tắc Thực Thể Quần Chúng

Khác với kịch bản điện ảnh tính theo thời gian quay (Scene), kịch bản truyện tranh là nghệ thuật sắp đặt không gian vật lý trên trang giấy. Do đó, hệ thống loại bỏ tầng Scene khỏi luồng soạn thảo và tổ chức dữ liệu đi thẳng theo 3 cấp bên dưới. **Quyết định kỹ thuật (D2, chốt 2026-11-12):** mỗi Chương có sẵn **một Scene mặc định ẩn** do hệ thống tạo khi tạo Chương; mọi dòng kịch bản gắn vào Scene này, giao diện không hiển thị Scene. Cột `scene_id` giữ `NOT NULL` dưới DB (không đổi sang `nullable`) để không phá vỡ lịch sử revision và luồng AI đang chạy theo Scene. Chương cũ có nhiều Scene vẫn hoạt động; Scene khi đó chỉ là nhóm hiển thị tùy chọn.

1. **Page (Trang truyện):** Sắp xếp thứ tự bằng thuật toán `LexoRank` để dễ dàng chèn trang bổ sung vào giữa mà không phải đánh lại số thứ tự toàn chương.
2. **Panel (Khung tranh):** Thuộc về một Trang, lưu tọa độ chuẩn hóa BoundingBox `{x, y, w, h}` (tỉ lệ $0..1$ trên khung trang chuẩn $1200 \times 1800$) và thứ tự đọc (`panelIndex`).
3. **Panel Contents (Nội dung bên trong Panel):** Mỗi Panel chứa một danh sách các mục nội dung có thứ tự:
   - **ACTION_DIRECTION (Artist phải vẽ gì?):** Mô tả bối cảnh, góc máy camera, hành động, biểu cảm nhân vật và mô tả trực tiếp các thực thể quần chúng/vật phụ.
     - **Nhân vật chính/cốt lõi (Canon Entity):** không cần cú pháp `@` (Q16, BR-35). Nhân vật có thoại được nhận diện qua tên người nói (khớp tên/bí danh Series Bible, chưa có thì tự tạo bản nháp); nhân vật chỉ xuất hiện trong mô tả (ví dụ *"Akira rút kiếm"*) thì Writer bôi đen "Akira" và tham chiếu. Thực thể vào Danh sách thực thể chương, Model Sheet đã chốt hiện cạnh khung vẽ và bắt buộc có bản `CanonLocked` tại Gate 1.
     - **Thực thể quần chúng (Mob / Minor Entity):** tả trực tiếp, không bôi đen thì không vào Bible; nếu có thoại thì mục nháp tự tạo được Writer gắn cờ *Quần chúng* (một lần, dùng cho cả Series) và không chặn Gate 1. Writer chỉ cần viết mô tả bình thường trong phần `ACTION_DIRECTION` hoặc `NARRATION` (ví dụ: *"Góc rộng hai tên lính gác mặc áo giáp xám đứng canh trước cổng thành, người dân xung quanh chạy tán loạn"*) để Artist đọc hiểu và tự do sáng tạo khi vẽ mà không làm nghẽn tiến độ tiền kỳ.
   - **DIALOGUE / THOUGHT (Nhân vật có lời thoại/suy nghĩ gì?):** Ghi tên người nói vào `speaker_label` (chữ thuần; mỗi lần lưu tự đối sánh với tên chính/bí danh Series Bible, BR-35) + nội dung lời thoại (không bôi đen trong lời thoại, Q19) để tạo bóng thoại (`SPEECH_BALLOON` / `THOUGHT_BALLOON`).
   - **NARRATION (Có lời dẫn truyện không?):** Nội dung hộp dẫn chuyện của tác giả (`NARRATION_BOX`), có thể dùng để giới thiệu nhanh bối cảnh hoặc đám đông quần chúng.
   - **SFX (Có hiệu ứng âm thanh gì?):** Chữ tượng thanh minh họa tiếng động trên tranh (`SOUND_EFFECT`).

### 1.3. Thuật Toán Hình Học Đánh Số Thứ Tự Đọc Panel Theo Hướng Đọc (Reading Order Algorithm)

Hệ thống áp dụng thuật toán phân hàng hình học (Row-Banding Geometric Sort) tự động tính toán `panelIndex` ($1, 2, 3\dots$) ngay khi Artist chọn Frame Template hoặc kẻ khung trên trang được giao:

* **Không gian tọa độ:** Tọa độ chuẩn hóa $[0..1] \times [0..1]$ trên khung canvas $1200 \times 1800$.
* Mỗi Panel $i$ có BoundingBox $(x_i, y_i, w_i, h_i)$ và tâm trọng tâm $(cx_i, cy_i) = (x_i + \frac{w_i}{2}, y_i + \frac{h_i}{2})$.
* **Các bước sắp xếp:**
  1. **Bước 1 (Trục dọc):** Sắp xếp danh sách Panel theo tọa độ đỉnh trên $y$ tăng dần từ trên xuống dưới.
  2. **Bước 2 (Gom cụm hàng ngang - Row Banding):** Hai Panel $A$ và $B$ được coi là thuộc cùng một hàng ngang khi:
     $$|cy_A - cy_B| < \frac{\min(h_A, h_B)}{2}$$
  3. **Bước 3 (Sắp xếp trong hàng theo `ReadingDirection` của Series):**
     - **Manga Nhật Bản (`RightToLeft` — RTL):** Sắp xếp giảm dần theo $cx$ (Phải ➔ Trái, $cx$ lớn hơn đọc trước).
     - **Comics Âu Mỹ (`LeftToRight` — LTR):** Sắp xếp tăng dần theo $cx$ (Trái ➔ Phải, $cx$ nhỏ hơn đọc trước).
     - **Webtoon Cuộn Dọc (`Vertical`):** Bỏ qua phân hàng, sắp xếp tuần tự theo $cy$ tăng dần từ trên xuống dưới.
  4. **Bước 4 (Đánh số `panelIndex` & Quyền tùy biến của Artist):** Gán chỉ số đọc tăng dần $1, 2, 3, \dots, N$. Artist phụ trách trang đó có quyền đổi số thứ tự đọc thủ công trên giao diện `ArtistDeskView` nếu trang có bố cục nghệ thuật phá cách (Panel lồng, Panel chéo).

---

## PHẦN II. ĐỊNH NGHĨA LUỒNG GIAO VIỆC & PHỐI HỢP ĐA HỌA SĨ (ASSIGNMENT ENGINE & MULTI-ARTIST WORKFLOW)

### 2.1. Nguyên Tắc Giao Việc Qua Từng Giai Đoạn (Ai Quản Lý, Thủ Công hay Tự Động?)

| Giai đoạn (Stage) | Đơn vị giao việc (Scope) | Ai thực hiện? | Cơ chế điều phối (Thủ công vs. Tự động) |
|---|---|---|---|
| **1. Soạn Kịch Bản (Script)** | Toàn Chương (Chapter) | Writer | **Tự động (Ngoài luồng Assignment):** Writer chủ động tạo và viết kịch bản chương. Producer không cần tạo thẻ giao việc Script. |
| **2. Thiết kế Nhân vật chính (Series Bible)** | Từng thực thể trong Danh sách thực thể chương | Writer viết định nghĩa $\rightarrow$ Artist vẽ Model Sheet $\rightarrow$ Writer/Editor góp ý, Writer/Editor/Producer yêu cầu vẽ lại $\rightarrow$ Editor xác nhận = khoá Canon (Q20) | **Bán tự động:** Tên người nói chưa có trong Bible → hệ thống tự tạo mục `Draft`; Writer bôi đen nhân vật không thoại để tạo/tham chiếu. Mục mới chờ Writer viết định nghĩa, rồi mới vào hàng đợi `Pending Concept Art` cho Artist (hiển thị chương đang chờ). Mục gắn cờ **Quần chúng** không qua bước này. |
| **3. Dựng Khung & Vẽ Chì (Layout + Pencil)** | Theo Trang (Page) | Artist (Ai được assign Page nào thì làm nhiệm vụ trên Page đó) | **Producer phân công tại Gate 1 (Hoặc kế thừa mặc định):** Khi bấm Gate 1, Producer gán 1 Artist cho cả chương hoặc chia dải trang (VD: Artist A làm Trang 1..10, Artist B làm Trang 11..20). Artist nào nhận Page nào sẽ toàn quyền chọn Frame Template, dựng khung và vẽ Pencil trên Page đó. |
| **4. Đi Nét Mực (Ink)** | Theo Trang (Page) hoặc Khung (Panel) | Artist | **Tự động 100% (Auto-Handoff):** Ngay khi Artist nộp xong Pencil của Page X, hệ thống tự động mở khóa bước Ink của Page X cho chính Artist đó (hoặc chuyển sang Inker chuyên trách nếu Producer cấu hình sẵn). |
| **5. Đặt Chữ / Bóng Thoại (Lettering)** | Theo Trang (Page) | Artist (Mặc định) hoặc Letterer (Phụ việc nếu được gán) | **Cơ chế Kế thừa & Phụ việc linh hoạt (BR-31):**<br>• *Mặc định:* Role Artist có sẵn công cụ thêm chữ (Vector Text Tools) trên trang mình được giao để tự đặt bóng thoại luôn.<br>• *Khi có Letterer phụ việc:* Nếu Producer gán một Letterer vào Page X, hệ thống mở quyền truy cập Page X cho Letterer đó, nhưng trên màn hình của Letterer chỉ mở khóa duy nhất công cụ thêm chữ (lớp tranh vẽ của Artist bị khóa Read-only). |
| **6. Kiểm Định Gate 2 (Quality Review)** | Theo Trang (Page) | Editor | **Tự động định tuyến:** Khi cả lớp tranh (Ink) và lớp chữ (Lettering) của Page X đã hoàn tất (Submitted), hệ thống tự ghép ảnh $1200 \times 1800$ và đẩy vào hàng đợi của Editor (đảm bảo Luật 4 mắt BR-06: `EditorId != ArtistId`). |
| **7. Sửa Lỗi Cấp Panel (Rework)** | Cô lập đúng Panel X bị lỗi | Artist hoặc Letterer | **Tự động định tuyến theo vùng khoanh lỗi:** Editor khoanh vùng lỗi trên Panel X. Nếu lỗi nét vẽ $\rightarrow$ trả về đúng Artist giữ Panel X. Nếu lỗi chữ $\rightarrow$ trả về cho Letterer (nếu trang có gán Letterer) hoặc trả về cho chính Artist của trang đó. |

### 2.2. Kịch Bản Vận Hành Khi Có 1, 2, 3 Hoặc Nhiều Artist (Multi-Artist Scaling)

Hệ thống giải quyết bài toán từ 1 đến $N$ họa sĩ thông qua cơ chế Phân quyền theo Phạm vi Trang/Khung (Granular Page/Panel-Scoped ABAC) với thứ tự ưu tiên: `Panel Assignment > Page Assignment > Chapter Default Assignment`.

* **Kịch bản 1 Artist (Solo / All-in-One Mangaka):**
  * Producer gán Artist A làm người phụ trách mặc định của Chương.
  * Khi qua Gate 1, toàn bộ các trang trong chương thuộc về Artist A. Vì mặc định role Artist đã có quyền thêm chữ, Artist A tự chọn Frame Template, vẽ Pencil, đi nét Ink và dùng luôn công cụ Vector Text ngay trên cùng một màn hình `ArtistDeskView` để đặt bóng thoại mà không cần bất kỳ tài khoản Letterer nào tham gia.
* **Kịch bản 2 Artist (Chia dải trang song song hoặc Bóc tách ứng cứu — Scope Carve-out):**
  * *Chia trang từ đầu:* Tại Gate 1, Producer gán Artist A phụ trách Trang 1..10, Artist B phụ trách Trang 11..20. Ai được assign trang nào thì toàn quyền làm Layout + Pencil + Ink (và đặt chữ nếu không có Letterer) trên đúng các trang đó. Artist A mở Trang 11 sẽ chỉ ở chế độ Read-only (chặn ghi `403 Forbidden`).
  * *Bóc tách / Chuyển giao giữa chừng (Mid-flight Transfer — BR-30):* Giả sử Artist A nhận cả 10 trang, đã làm xong Trang 1..4, nhưng Trang 5..6 bị Editor trả về bắt sửa (`ReworkRequired`) trong khi A đang bận vẽ Trang 7..10. Producer thực hiện Transfer Scope riêng Trang 5..6 (hoặc riêng Panel 2 của Trang 5) sang cho Artist B. Hệ thống lập tức thu hồi quyền ghi của A trên Trang 5..6, cấp quyền ghi cho B và chuyển toàn bộ phiếu ChangeRequest đang mở trên phạm vi đó sang hàng đợi của B.
* **Kịch bản 3+ Artist & Letterer phụ việc (Dây chuyền Studio Công nghiệp):**
  * Studio lớn có thể chia theo cả Dải trang lẫn Chuyên môn hóa công đoạn:
    * Artist 1 được assign dựng khung Layout + Pencil từ Trang 1..10; Artist 2 dựng Layout + Pencil từ Trang 11..20.
    * Ngay khi một trang nộp xong Pencil, hệ thống tự động mở khóa cuốn chiếu cho Artist 3 (chuyên đi nét Ink) và Letterer C (nhân sự phụ việc chuyên đặt bóng thoại được assign vào chương/trang đó).
    * Nhờ tách biệt Graphic Layer (cho Artist) và Vector Text Layer (cho Letterer), Artist 3 và Letterer C có thể mở cùng một trang làm việc song song theo thời gian thực mà không bao giờ ghi đè làm hỏng dữ liệu của nhau.

---

## PHẦN III. CHI TIẾT ĐẶC TẢ THEO 5 MODULE PHÁT TRIỂN

### MODULE 1: Quản Trị Studio, Series Bible Tinh Gọn & Soạn Thảo Kịch Bản (CF1 & Pre-CF2)
* **Actor:** Administrator, Producer, Writer, Artist.
* **Luồng chi tiết:**
  1. **Thiết lập Studio & Series:** Producer tạo Workspace, tạo Series (cấu hình hướng đọc RTL, LTR hoặc Vertical), mời các thành viên vào Workspace theo 5 vai trò nội bộ (Producer, Writer, Artist, Letterer, Editor).
  2. **Soạn Kịch bản Độc lập & Phân biệt Nhân vật Chính / Quần chúng:**
     - Writer chủ động tạo và viết kịch bản chương theo cấu trúc `Trang dự kiến -> Panel -> Nội dung` mà không cần chờ Producer giao thẻ việc.
     - Kịch bản là **chữ thuần** (Q16): không có cú pháp `@`, không chọn người nói từ Bible. Tên nhân vật viết bình thường; người nói ghi ở trường người nói của dòng thoại (`speaker_label`).
     - Đối với Thực thể quần chúng / Bối cảnh phụ thoáng qua: Writer không tạo mục trong Series Bible, mà ghi trực tiếp mô tả vào dòng `ACTION_DIRECTION` hoặc `NARRATION` của Panel để Artist đọc và vẽ trực tiếp.
     - **Danh sách thực thể chương (Chapter Cast Manifest — BR-35):** hiện ở ngăn bên phải màn Kịch bản và màn Gate 1 của Producer, lập từ 2 nguồn:
       - **Người nói (tự động):** mỗi lần lưu, tên người nói của dòng thoại được so **khớp nguyên chuỗi** (bỏ hậu tố `(nghĩ)`, không phân biệt hoa thường, chuẩn hoá NFC) với tên chính hoặc bí danh (`aliases`) của mục Nhân vật. Khớp → thực thể của chương. Không khớp → hệ thống **tự tạo mục Nhân vật `Draft`** tên đó (mô tả trống) và đưa vào danh sách. Người nói là quần chúng ("Lính gác A", "Đám đông") → Writer bấm **Quần chúng** trên mục đó: cờ lưu ở mục Bible nên chương sau tự nhận ra, không hỏi lại; gỡ cờ được nếu nhân vật trở thành nhân vật chính.
       - **Bôi đen (thủ công, Q19):** chỉ trên dòng **Mô tả (Action), Lời dẫn, SFX**; tiêu đề Panel (ghi chú góc máy) và lời thoại không bôi đen. Các dòng này **không tự khớp** (tránh nhầm từ thường như "An" trong "bình an"). Nhân vật, địa điểm, đạo cụ không có thoại: Writer bôi đen đoạn chữ → chọn mục Bible có sẵn (gợi ý theo tên/bí danh) hoặc, nếu chưa có trong Bible, **Tạo bản nháp** ngay tại chỗ (`Draft`, tên lấy từ đoạn bôi, sửa được, chọn loại Nhân vật / Địa điểm / Đạo cụ; **không bắt nhập mô tả** lúc tạo để không cắt mạch viết — thông tin bổ sung sau, Artist vẽ sau). Đoạn được tham chiếu hiển thị gạch chân (mỗi dòng tham chiếu một mục tối đa một lần; mọi chỗ cùng chữ trong dòng đều gạch chân); tham chiếu đi cùng lần Lưu kịch bản, lưu theo dòng và theo phiên bản kịch bản, sửa chữ làm mất đoạn đã bôi thì tham chiếu bị gỡ và Writer được báo.
       - Mục mới (tự tạo hoặc bôi đen) đi luồng mục 3: **Writer viết định nghĩa** (mô tả, ngoại hình) → mục mới vào hàng đợi của **Artist vẽ** Model Sheet → Editor xác nhận = khoá Canon (Q20). Mục còn nháp chưa có định nghĩa thì Artist không nộp concept được (`409`).
       - **Chỉ Writer** (Q19): bôi đen / gỡ tham chiếu khi kịch bản chưa `Frozen` (tham chiếu là một phần nội dung kịch bản, đổi mã băm phiên bản); gắn/gỡ cờ Quần chúng (bất kỳ lúc nào; chương đã chốt giữ giá trị lúc chốt); viết định nghĩa mục nháp; đổi biến thể cho chương (Q18). Việc gắn mục vào chương và chọn bản tạo hình mặc định là **tự động**. Producer chỉ xem.
     - **Luồng tạo Series Bible trước:** nếu nhân vật đã có trong Bible từ trước, Writer chỉ cần ghi đúng tên/bí danh ở ô người nói là tự tham chiếu; trong lời dẫn vẫn bôi đen để tham chiếu.
  3. **Quy trình Duyệt Series Bible & Biến thể Tạo hình (Q16, Q20):**
     - Mỗi mục `BibleEntry` có tên chính và danh sách **bí danh** (`aliases`, ví dụ `name = "Trần Minh"`, `aliases = ["Minh", "Tiểu Minh"]`); bí danh không được trùng với tên/bí danh của mục khác trong cùng Series (`409 Conflict`).
     - Ngoại hình quản lý theo **biến thể tạo hình** (`variant_label`, ví dụ "Mặc định / Lúc nhỏ", "Timeskip 18 tuổi", "Giáp chiến đấu"), **không** theo mốc chương hiệu lực: nhân vật có thể vắng mặt ngắt quãng, và khi viết một chương không thể biết trước toàn bộ series. Một mục có thể có nhiều biến thể cùng `CanonLocked`.
     - **Bản kế thừa của chương (Q23):** chương gắn **một bản cụ thể** cho mỗi thực thể (ví dụ Naruto "Mặc định" v1). Khi Writer không tự chọn, chương dùng bản của **chương gần nhất trước N có thực thể đó** (không bắt buộc là N−1); chưa có thì bản mới nhất của biến thể mặc định (ưu tiên bản `CanonLocked`). Nếu bản đó đã bị thay bằng một bản `CanonLocked` thì dùng bản thay thế đã khoá mới nhất (Q24; bản thay thế còn đang duyệt không tính). Chỉ xét các chương **cùng Series**, theo `ChapterNumber`. Bản kế thừa được tính lại mỗi lần lưu cho tới khi chương chốt, nên Writer đổi bản ở chương N thì các chương sau chưa chốt tự theo; chương trước N không bao giờ đổi. Writer không phải xác nhận (Q22).
     - **Writer đổi bản của chương khi cần (Q18, Q21, Q23):** cạnh tên trong Danh sách thực thể chương có ô chọn bản (mọi biến thể và bản của mục, **kể cả bản chưa khoá** như giai đoạn mới Artist đang vẽ hoặc bản thay thế v2); **chỉ Writer** đổi, chỉ khi kịch bản chưa `Frozen`; nút *Về bản kế thừa* bỏ lựa chọn. Khi đổi, hệ thống liệt kê các chương phía sau chưa chốt sẽ kế thừa theo, và **cảnh báo** (không chặn) nếu có chương phía sau đã chốt với bản khác (muốn đồng bộ thì Producer mở lại chương đó). Ví dụ: chương 15 timeskip → Writer chọn "Timeskip 18 tuổi" v1, chương 16 trở đi tự dùng.
     - **Giai đoạn theo Panel (Q23):** một chương có thể dùng thực thể ở nhiều giai đoạn (ví dụ cảnh hồi tưởng). Writer chọn các Panel và đặt bản riêng cho thực thể trong các Panel đó (ví dụ Naruto "Lúc nhỏ" v1 cho Panel 5.1–5.4); người nói và đoạn bôi đen trong Panel theo bản của Panel; Panel không đặt riêng dùng bản của chương. Chương sau chỉ kế thừa bản của chương, không kế thừa bản theo Panel. Giai đoạn theo Panel là **nội dung kịch bản** (Q24): lưu cùng lần Lưu, đi theo Panel khi Writer chèn/xoá/đổi thứ tự Panel.
     - **Bước 1 (Nộp concept — phiên bản như kịch bản, Q20):** Artist tải Model Sheet lên → tạo một **phiên bản concept** bất biến (`v1, v2…`, ảnh băm SHA-256 lưu Cloudflare R2) và đánh dấu là bản đang nộp → `Draft/ReworkRequired → ConceptSubmitted`. Nộp lại sau khi bị trả là phiên bản mới, không ghi đè; lịch sử giữ đủ để so sánh hai phiên bản cạnh nhau.
     - **Bước 2 (Góp ý & vẽ lại):** Writer và Editor **góp ý** trên đúng phiên bản concept (có thể khoanh vùng trên ảnh); Artist và người khác **trả lời** trong cùng luồng góp ý; góp ý không đổi trạng thái. Writer, Editor hoặc Producer (Q22) **yêu cầu vẽ lại** → `ReworkRequired` (bắt buộc nhận xét, hiện trong luồng góp ý của phiên bản), Artist nhận thông báo.
     - **Bước 3 (Editor xác nhận = khoá Canon):** Editor bấm xác nhận trên phiên bản đang nộp → `CanonLocked` 🔒 ngay (không còn bước `WriterEndorsed` chờ Producer khoá). Editor xác nhận phải khác Artist đã nộp concept (BR-06). Cấm sửa đè hay mở khóa (`/unlock` bị loại bỏ).
     - **Thay bản đã khoá (Q23):** Writer tạo bản thay thế **cho cùng một biến thể** qua `/supersede` (kèm lý do), thường ngay khi viết chương cần thiết kế mới; tạo từ màn kịch bản chương N thì chương N gắn luôn bản mới. Bản thay thế đi lại Bước 1–3. Chương nào gắn bản mới (tự chọn hoặc kế thừa) thì chờ bản đó được khoá mới qua Gate 1; chương gắn bản cũ giữ bản cũ — **không tự chuyển**. Khi bản thay thế được khoá, bản cũ thành `Superseded` (không chọn tay được nữa, chương đang gắn vẫn dùng được). Writer được *Huỷ bản thay thế* khi bản đó chưa có sự kiện duyệt; chương đang chờ quay về bản kế thừa. Tạo biến thể mới là thêm bản mới với `variant_label` khác, không supersede.
  4. **Vòng đời kịch bản & Cổng Chốt Tiền Kỳ (Gate 1 — Pre-Production Gate) — Q15:**
     - Chương mới ở trạng thái `PreProduction`; kịch bản chương có vòng đời riêng `ScriptStatus` (§5.2 máy 5), không phải một stage của pipeline và không đi qua Assignment.
     - **Lưu = commit:** mỗi lần Writer lưu, hệ thống chụp toàn bộ cây `Trang → Panel → dòng` thành một phiên bản bất biến `ScriptVersion` (số tăng dần, mã băm SHA-256 nội dung; nội dung trùng bản gần nhất thì không tạo bản mới).
     - **Đề xuất AI (Q25):** AI sinh hoặc sửa kịch bản tạo một phiên bản loại *Đề xuất AI* (không đổi kịch bản chính, không gửi duyệt được). Writer mở bản đề xuất, so với bản hiện tại, chấp nhận toàn bộ hoặc từng dòng; dòng được chấp nhận vào bản đang soạn và chỉ thành kịch bản chính khi Writer bấm **Lưu** (commit ghi lại bản đề xuất nguồn). Danh sách thực thể chương chỉ tính lại ở commit, nên đề xuất chưa chấp nhận không tạo mục Bible.
     - **Gửi duyệt = push:** Writer bấm *Gửi duyệt* → `Draft → InReview`. **Điều kiện chốt Bible khi gửi (Q21):** mọi mục nháp (`IsStub`) trong Danh sách thực thể chương đã được Writer viết định nghĩa hoặc gắn cờ Quần chúng; mọi mục không Quần chúng có biến thể cho chương (mặc định do hệ thống đề xuất hoặc Writer đã đổi — không cần xác nhận, Q22). Thiếu → `409 Conflict` kèm danh sách (không cần ảnh `CanonLocked` ở mốc này — Artist có thể đang vẽ). Gửi duyệt lại kiểm lại điều kiện này; chương ghi con trỏ bản đã gửi (`last_submitted_version_id`) và bản gửi trước đó (`previous_submitted_version_id`). Editor và Producer nhận thông báo.
     - Editor đọc **đúng bản đã gửi**, góp ý theo dòng (không đổi trạng thái, không bắt buộc trước Gate 1) và xem tab *Thay đổi* (diff từng dòng giữa hai lần gửi). Writer nhận thông báo khi có góp ý.
     - Trong lúc `InReview` Writer vẫn sửa và lưu (commit) tiếp; Editor chỉ thấy bản mới khi Writer bấm *Gửi duyệt lại*. Writer có thể *Hủy gửi duyệt* (`InReview → Draft`).
     - Producer bấm **Bắt đầu sản xuất** khi `InReview` → kịch bản `Frozen` (chỉ đọc, `is_script_frozen = true`, lưu `script_content_hash`), chương `PreProduction → InProduction`, Writer nhận thông báo. Hệ thống từ chối nếu Writer đã lưu thay đổi sau lần gửi mà chưa gửi lại (bản chốt sản xuất phải trùng bản Editor đã đọc). **Báo phiên bản mới (Q26):** lệnh gửi kèm bản Producer đang xem; Writer đã gửi bản mới hơn → `409` kèm thông báo "Có phiên bản mới vX" và thay đổi giữa hai bản, Producer xem rồi chốt lại; màn Gate 1 hiện thông báo ngay khi có lần gửi mới. Chốt thành công thì chương lưu `frozen_script_version_id`.
     - **Chốt Bible của Gate 1 (BR-21, BR-35):** *Bắt đầu sản xuất* chỉ thành công khi mọi thực thể trong Danh sách thực thể chương (trừ mục gắn cờ Quần chúng) đều có **mọi bản chương dùng** ở trạng thái `CanonLocked` — bản của chương và các bản đặt riêng theo Panel (Q21, Q23); bản mới chưa được Editor khoá thì chặn kèm lý do (ví dụ "chờ Naruto Mặc định v2, kế thừa từ chương 2"), không tự rơi về bản cũ. Mục nháp tự tạo từ người nói chưa xử lý cũng chặn: phải thiết kế xong hoặc gắn cờ Quần chúng. Thiếu điều kiện → `409 Conflict` kèm danh sách. Thành công thì **Bản đồ thực thể chương** (`chapter_bible_bindings`: chương, mục Bible, bản đã gắn, nguồn Người nói/Bôi đen, người và lúc gắn) cùng **bản theo Panel** (`panel_bible_variants`) khoá cùng lúc với kịch bản; `ArtistDeskView` chỉ đọc hai bảng này để hiện Model Sheet đúng bản của từng Panel (lọc theo thực thể có trong Panel đang vẽ), nên tạo bản mới ở chương sau không đổi tạo hình đã chốt của chương này.
     - Mở lại kịch bản đã chốt: **chỉ Producer** *Mở lại* kèm lý do (Audit Log) → `Frozen → Draft` (không có luồng Writer xin mở lại); Bản đồ thực thể chương cũng mở để chỉnh nhưng **không tự kế thừa lại** — chương giữ bản đã chốt trừ khi Writer chủ động đổi (Q23). Khi chốt lại, Panel có dòng bị sửa, xoá, thêm **hoặc** có thực thể bị đổi bản tạo hình (của chương hoặc theo Panel) được gắn cờ ảnh hưởng ⚑.
     - Producer **chỉ đọc** nội dung kịch bản, Danh sách thực thể chương và Series Bible (BR-07, Q19, Q20); Producer góp ý kịch bản, yêu cầu vẽ lại concept Bible (Q22), *Bắt đầu sản xuất* và *Mở lại*.

### MODULE 2: Bàn Vẽ Dựng Khung, Đi Nét & Đặt Chữ Linh Hoạt (CF2)
* **Actor:** Artist (Chủ đạo — có quyền vẽ và thêm chữ), Letterer (Phụ việc tùy chọn — chỉ có quyền thêm chữ), Producer.
* **Luồng chi tiết:**
  1. **Dựng Khung (Layout) và Vẽ Phác Thảo (Pencil) theo Page được Assign:** Artist nào được assign Page nào thì mở bàn vẽ (`ArtistDeskView`) của Page đó, chọn mẫu khung từ thư viện Frame Templates (hoặc tự kẻ khung), ánh xạ các dòng nội dung kịch bản vào từng Panel (thanh Script Coverage Counter báo đủ 100% dòng thoại của trang), vẽ phác thảo Pencil và bấm **Submit Pencil**.
  2. **Mở khóa Đi Nét (Ink) và Đặt Chữ (Lettering) ngay sau Pencil:**
     - Ngay khi bản Pencil của trang được nộp, tọa độ các khung Panel đã cố định. Hệ thống mở khóa đồng thời 2 nhánh công việc trên trang đó:
       - **Nhánh Graphic Layer (Ink):** Artist của trang đó tiếp tục đi nét mực và dán screentone.
       - **Nhánh Vector Text Layer (Lettering — Linh hoạt theo phân công BR-31):**
         - *Trường hợp 1 (Không gán Letterer riêng):* Chính Artist của trang đó sử dụng bộ công cụ chữ (Vector Text Tools được mở sẵn mặc định cho role Artist) để đặt bóng thoại (SPEECH, THOUGHT, NARRATION, SFX) gắn 1-1 với `script_line_id`.
         - *Trường hợp 2 (Có gán Letterer phụ việc):* Nhân sự có role Letterer được assign vào trang đó sẽ vào đặt bóng thoại trên nền bản vẽ Pencil. Trên màn hình của Letterer, hệ thống chỉ hiển thị duy nhất thanh công cụ thêm/chỉnh sửa chữ (`letter:write`), tuyệt đối không cho phép thay đổi khung Panel hay tải đè ảnh Artwork của Artist.
     - Mỗi bóng thoại lưu tọa độ độc lập Position Record: `{x, y, width, height}`. Khi Artist tải bản vẽ Ink hoàn chỉnh lên lớp dưới, vị trí bóng thoại ở lớp trên hoàn toàn giữ nguyên.
     - **Ngôn ngữ Bóng thoại (Balloon Localization — BR-34):**
       - **Cấu hình ở Series:** Producer khai báo `original_language` (ngôn ngữ kịch bản gốc, ví dụ `'vi'`) và danh sách `release_languages` (các ngôn ngữ sẽ phát hành, ví dụ `['vi', 'en', 'ja']`, luôn chứa ngôn ngữ gốc). Mã ngôn ngữ theo chuẩn BCP 47 rút gọn (`vi`, `en`, `ja`, `ko`, `fr`…).
       - **Một vị trí, nhiều bản chữ:** Mỗi bóng thoại có một Position Record `{x, y, w, h}` và kiểu chữ dùng chung, cùng một bản chữ cho **mỗi** ngôn ngữ trong `release_languages`. Bản chữ ngôn ngữ gốc lấy từ dòng kịch bản (BR-05); bản dịch do Artist/Letterer của trang nhập **trong hệ thống, tại công đoạn Lettering** (có thể nhận đề xuất AI, tuân BR-02); không tải ảnh trang đã dịch từ ngoài (Q28).
       - **Chuyển ngôn ngữ trên bàn vẽ:** `ArtistDeskView` / `LetteringWorkspace` có bộ chọn ngôn ngữ đang soạn; đổi ngôn ngữ chỉ đổi chữ hiển thị, không đổi khung Panel hay lớp Ink. Kiểm tra BR-20 (tràn chữ, thứ tự đọc, đè nét vẽ) chạy riêng cho từng ngôn ngữ vì độ dài chữ khác nhau.
       - **Điều kiện hoàn tất:** Lớp chữ của một trang được nộp vào Gate 2 (BR-19) khi mọi bóng thoại đã có chữ ở **ngôn ngữ gốc**. Bản dịch các ngôn ngữ khác được nhập song song hoặc sau đó, và được nghiệm thu riêng theo từng **ấn bản ngôn ngữ** ở Gate 3 (Module 5 mục 1), nên thêm hay sửa bản dịch không cần mở lại chương.
  3. **Cơ chế Artist tự thu hồi / quay lui (Self-Rollback: Ink ➔ Pencil):** Nếu đang làm ở bước Ink mà Artist tự phát hiện bản Pencil trước đó có sai sót (và trang chưa bị khóa bởi phiên duyệt `UnderReview` của Editor), Artist bấm nút `[ ↺ Quay lại sửa Pencil ]` để chủ động lùi trạng thái về Pencil (`InProgress`), tải lên bản sửa Version n+1. Nếu trên trang đã có bóng thoại được đặt trước đó, hệ thống tự động bật cờ nhắc kiểm tra lại vị trí bóng thoại.

### MODULE 3: Kiểm Định Chất Lượng, Cô Lập Lỗi Cấp Panel & Cảnh Báo Liên Đới (CF3)
* **Actor:** Editor (Reviewer), Artist, Letterer, AI Continuity Service.
* **Luồng chi tiết:**
  1. **Cổng Kiểm Định Hợp Nhất (Gate 2 — Quality & Composite Gate):** Khi cả lớp tranh (Ink) và lớp chữ (Lettering) của trang đã hoàn tất, hệ thống ghép phẳng thành trang Composite $1200 \times 1800$ và mở màn hình `ReviewView` cho Editor. Editor sử dụng 3 chế độ đối chiếu phiên bản (Side-by-side, Swipe slider, Onion-skin) và bộ lọc Canvas Pixel Diff.
  2. **Khoanh vùng lỗi Bounding Box $0..1$ & Cô lập sửa lỗi theo Panel:**
     - Khi phát hiện lỗi, Editor kéo chuột khoanh vùng lỗi trên ảnh (`AnchorCoordinates: {x, y, w, h}`).
     - Thuật toán hình học `FindIntersectingPanelIds()` tự động xác định chính xác Panel (hoặc nhóm Panel nếu lỗi nằm vắt ngang ranh giới khung với tỷ lệ giao thoa $\ge 15\%$) chứa vùng khoanh lỗi:
       - **Chỉ cô lập đúng Panel lỗi:** Chỉ Panel bị khoanh lỗi chuyển về trạng thái `ReworkRequired` kèm phiếu `ChangeRequest` (`Open`). Các Panel khác trên cùng trang vẫn giữ nguyên trạng thái `Approved` 🔒.
       - **Lỗi vắt nhiều Panel:** Mỗi Panel giao thoa $\ge 15\%$ sinh **một phiếu `ChangeRequest` riêng** (cùng nội dung nhận xét). Các phiếu sinh ra từ cùng một vùng khoanh dùng chung một `group_id` để màn hình gom lại thành một góp ý. Mỗi phiếu đóng độc lập theo Panel của nó, nên Panel sửa xong trước không phải chờ Panel còn lại.
  3. **Định tuyến thông minh & Cảnh báo liên đới:**
     - Nếu Editor chọn lỗi thuộc lớp Lettering (Chữ/Bóng thoại): Phiếu sửa chỉ gửi cho người phụ trách chữ của trang đó (Letterer được assign, hoặc Artist của trang nếu Artist tự làm chữ); phần tranh vẽ giữ nguyên.
     - Nếu Editor chọn lỗi thuộc lớp Artwork (Pencil/Ink): Phiếu sửa gửi cho Artist phụ trách Panel đó vẽ lại. Đồng thời, nếu trong Panel đó đã có bóng thoại, hệ thống tự động bật cờ `is_artwork_updated_alert = true` (hiển thị viền cảnh báo màu Cam `⚠️ Check Balloon Fit`) để Artist hoặc Letterer kiểm tra lại vị trí bóng thoại sau khi cập nhật nét vẽ mới.
  4. **Vòng đời đóng phiếu sửa lỗi (Open ➔ Resolved ➔ Verified):** Khi sửa xong và nộp lại, phiếu chuyển sang `Resolved`. Editor vào đối chiếu bản mới và bấm Verify (`Verified`). Nút `Approve Page` chỉ mở khóa khi 100% phiếu ChangeRequest trên trang đã đạt `Verified`.

  5. **Mở lại trang đã duyệt trước Gate 3 (Q27):** khi phát hiện lỗi muộn trên trang đã `Approved` (ví dụ màu tóc sai so với Model Sheet), Editor (Producer dự phòng) khoanh vùng lỗi như bước 2 → chỉ Panel lỗi chuyển `Approved → PanelReworkRequired` kèm `ChangeRequest` (bắt buộc nhận xét, Audit Log); trang tạm rời trạng thái duyệt nên Gate 3 chờ trang này. Artist sửa hoặc **khôi phục bản ảnh cũ** (tạo `AssetReference` mới trỏ lại file cũ, `VersionNumber` tăng, không tải lại file) rồi nộp lại, đi tiếp vòng 4. Sau Gate 3 thì phải Producer mở lại chương.
  6. **Ảnh cuối của trang (Q27):** Preview, Gate 3, Snapshot và xuất bản dùng bản ảnh của **lần duyệt Gate 2 gần nhất**; ảnh Artist vừa upload hoặc khôi phục chưa duyệt không thay ảnh cuối.

### MODULE 4: Xử Lý Bổ Sung / Sửa Kịch Bản Muộn & Truy Vết Lịch Sử (CF4 - Xương Sống)
* **Actor:** Hệ thống tự động, Producer, Writer, Artist, Letterer.
* **Luồng chi tiết:**
  1. **Lưu vết sự kiện bất biến (Append-Only Event Sourcing & CAS):** Mọi thao tác thay đổi trạng thái, sửa kịch bản, tải ảnh artwork hay di chuyển bóng thoại đều được ghi thành sự kiện append-only trong PostgreSQL & Marten Event Store. Mọi file ảnh đều được định danh bằng mã băm nội dung SHA-256 (Content-Addressed Storage). Khôi phục phiên bản cũ (Restore) luôn tạo ra phiên bản mới Version n+1 sao chép trạng thái cũ, tuyệt đối không xóa lịch sử.
  2. **Cơ chế Xử lý Bổ sung / Sửa Kịch bản sau khi đã Đóng băng (Chia 2 cấp độ):**
     - **Cấp độ Cơ bản (Sprint MVP):** Producer bấm `Unfreeze / Reopen Script` (bắt buộc nhập lý do vào Audit Log) $\rightarrow$ Writer sửa nội dung Panel $\rightarrow$ Producer khóa lại (`Frozen`) $\rightarrow$ Hệ thống gửi thông báo cho Artist và Letterer phụ trách trang đó.
     - **Cấp độ Nâng cao (Sprint Mở rộng):** Khi Writer sửa một dòng thoại/mô tả đã gắn vào Panel X, hệ thống tự động gắn cờ `FlagImpactReview` (⚑) lên Panel X và đánh dấu `isStale = true` lên bóng thoại tương ứng. Ê-kíp chỉ cần xem đúng Panel X để bấm chọn `Keep` (giữ nguyên tranh nếu chỉ sửa chính tả/từ ngữ nhẹ) hoặc `Rework` (vẽ lại riêng khung đó).

### MODULE 5: Nghiệm Thu Chương, Chuyển Giao Cho Publisher (External Stakeholder), Giám Sát Độc Giả & Báo Cáo Doanh Thu (CF5)
* **Actor:** Producer (Studio Owner), Publisher (External Stakeholder qua Publisher Portal: nhận bàn giao, quy định xem trước & giá), Public Reader.
* **Luồng chi tiết:**
  1. **Cổng Nghiệm Thu (Gate 3 — Release Gate) theo 2 cấp:**
     - **Cấp Chương — `Approve Chapter` (khóa tranh & ấn bản ngôn ngữ gốc):** Producer bấm `Approve Chapter`. Hệ thống chạy chốt kiểm tra tự động (`ChapterLockGate`):
       - Chương có ít nhất 1 trang (`Pages.Count >= 1`).
       - 100% các trang trong chương đã đạt `Approved` ở Gate 2.
       - Không còn bất kỳ phiếu `ChangeRequest` nào chưa đóng (`UnclosedCR == 0`).
       - Không còn lỗi nhất quán mức độ chặn (`BlockingFinding == 0`) hoặc cờ ảnh hưởng ⚑ chưa giải quyết.
       - Nếu thiếu bất kỳ điều kiện nào, Backend trả về ngay `HTTP 409 Conflict` kèm danh sách các trang còn vướng.
       - Đạt: chương chuyển `ChapterApproved` (lớp tranh và bố cục khóa Read-only) và **ấn bản ngôn ngữ gốc** chuyển `Approved`.
     - **Cấp Ấn bản — duyệt từng ngôn ngữ (quyết định Q10, Q14):** Mỗi ngôn ngữ còn lại trong `release_languages` là một ấn bản `ChapterEdition(chapter, lang)` đi qua 2 bước riêng, theo thứ tự ngôn ngữ tùy ý:
       1. **Nộp bản dịch:** Artist/Letterer phụ trách chữ bấm nộp khi chương đã `ChapterApproved` (tranh đã khóa) và mọi bóng thoại có chữ ở ngôn ngữ `lang`, không còn cảnh báo BR-20 mức chặn của ngôn ngữ đó (tràn chữ chưa xác nhận lý do, đè vùng nét vẽ chính). Ấn bản chuyển `InReview`.
       2. **Editor duyệt bản dịch:** Editor xem bản ghép theo ngôn ngữ `lang`, khoanh lỗi như Gate 2 (phiếu `ChangeRequest` lớp Lettering gắn `language_code`) hoặc duyệt → `EditorApproved`. Luật 4 mắt BR-06 áp dụng: Editor duyệt phải khác người đã nhập bản dịch của ấn bản đó.
       3. **Producer cho phép phát hành (`Approve Edition`):** chỉ với ấn bản `EditorApproved` → `Approved`, sinh `EditionSnapshot`. Producer sau đó bấm `Publish Edition` (có thể ngay hoặc lên lịch).
       - Thiếu điều kiện ở bất kỳ bước nào → `409 Conflict` kèm danh sách bóng thoại/trang còn vướng.
  2. **Snapshot Bất Biến theo Ấn bản & Chuyển Giao Cho Publisher (External Stakeholder):**
     - Mỗi lần nghiệm thu một ấn bản sinh một `EditionSnapshot` bất biến: danh sách mã băm SHA-256 ảnh trang đã ghép lớp tranh với lớp chữ ngôn ngữ đó. Ấn bản gốc dùng chung `ChapterSnapshot` của cấp Chương.
     - `ChapterApproved` **chính là trạng thái khóa chương**; không có trạng thái `Locked` riêng. Muốn sửa tranh phải `Reopen` chương về `InProduction` kèm lý do (ghi Audit); khi đó mọi ấn bản chưa phát hành quay về `Draft`, ấn bản đã phát hành vẫn phục vụ độc giả bằng Snapshot cũ cho tới khi được nghiệm thu và phát hành lại.
     - Sửa bản dịch của một ấn bản đã `EditorApproved` / `Approved`: Producer `Reopen Edition(lang)` kèm lý do → ấn bản về `Draft` (phải qua lại Editor), không ảnh hưởng chương và các ấn bản khác.
     - **Định vị vai trò Publisher:** Publisher (Nhà xuất bản / Đơn vị phát hành) là một **External Stakeholder**, không tham gia vào quy trình sản xuất nội bộ của Studio. **Toàn hệ thống chỉ có đúng một tài khoản Publisher** (quyết định Q12), phát hành cho mọi Workspace và Series:
       - Producer gửi `PreviewLink` bảo mật (có hạn tối đa 72 giờ, gắn email định danh của Publisher, chọn ấn bản ngôn ngữ, phủ Watermark SVG lặp chéo) để Publisher xem trước, hoặc xuất gói file bàn giao theo từng ấn bản (Release Package: PDF bản in, CBZ, Webtoon Vertical Slice, JSON Provenance).
       - Publisher có tài khoản đăng nhập vào **Publisher Portal** gồm hai phần:
         - **Bàn giao (chỉ đọc):** xem danh sách gói Release, PreviewLink và tải gói được chuyển giao.
         - **Quy định thương mại:** đặt loại Free / Trả phí, giá (VNĐ) và số trang xem trước (`free_preview_pages`) cho **từng ấn bản ngôn ngữ** của mọi chương trên nền tảng (chi tiết ở mục 4, BR-33).
       - Publisher **không** được sửa nội dung, duyệt, nghiệm thu, từ chối, phát hành hay mở lại chương/ấn bản.
       - **Phát hành (`Publish Edition(lang)`) và mở lại chỉ do Producer thực hiện**, theo từng ấn bản đã được Producer cho phép phát hành (`Approved`). Ấn bản `Published` xuất hiện trên Web Catalog và Mobile Reader. Ấn bản chưa được Publisher cấu hình thương mại mặc định là **Free**.
  3. **Bảng Điều Khiển Tổng Quan Dành Cho Producer (Owner 360° Dashboard): Phân Tích Độc Giả & Doanh Thu (Readership Analytics & Revenue — BR-32):**
     - **Người xem:** Producer của Workspace (và Admin). Publisher và các vai trò sản xuất khác không xem Dashboard này.
     - Mọi chỉ số lọc được theo Series, Chương, **Ấn bản ngôn ngữ** và kỳ (ngày/tháng/quý).
     - **A. Chỉ số Hành vi Độc giả & Mức độ Tiêu thụ (Readership & Consumption Analytics):**
       - **Tổng lượt xem / lượt mở đọc (Total Views / Impressions):** Thống kê số lần ấn bản được mở đọc trên Web Catalog và Mobile Reader.
       - **Độc giả thực tế (Unique Readers):** Xác định theo tài khoản độc giả hoặc thiết bị duy nhất.
       - **Tỷ lệ hoàn thành đọc (Completion Rate — Hook / Retention Rate):** Tỷ lệ phần trăm độc giả cuộn/lật đến trang cuối cùng của chương. Đây là chỉ số then chốt giúp Producer và Writer đánh giá độ lôi cuốn của kịch bản (ví dụ: 10.000 lượt mở, 8.200 lượt đọc đến trang cuối $\rightarrow 82\%$).
       - **Thời gian đọc trung bình (Average Reading Time):** Đo lường thời lượng dừng lại (Dwell Time) trên mỗi chương (tính bằng giây).
       - **Phân bố nền tảng tiêu thụ (Platform Distribution):** Tỷ lệ phần trăm đọc qua Web Browser vs. Ứng dụng Mobile Reader.
       - **Phân bố ngôn ngữ đọc (Language Distribution):** Tỷ lệ lượt đọc theo từng ấn bản ngôn ngữ.
       - **Đánh giá & Mức độ yêu thích (Reader Rating & Feedback):** Điểm đánh giá trung bình (1..5 sao) và số lượt phản hồi từ độc giả.
     - **A2. Doanh thu bán ấn bản trong ứng dụng (In-app Revenue, VNĐ):**
       - Tổng tiền (VNĐ) độc giả đã trả để mở khóa, số lượt mở khóa, theo Chương / Ấn bản ngôn ngữ / kỳ; doanh thu trung bình trên 1.000 lượt xem (RPM = doanh thu / lượt xem × 1000).
       - Tính từ sổ giao dịch mở khóa (append-only), không nhập tay.
     - **B. Báo Cáo Doanh Thu Thương Mại Từ Publisher (Commercial Gross Revenue Tracking) — ⏸️ triển khai giai đoạn sau:**
       - *Ghi chú phạm vi:* Phần này giữ trong đặc tả để theo dõi nhưng chưa triển khai trong đợt hiện tại. Cách xử lý khi sửa số liệu (ghi đè hay append-only tạo bản mới kèm Audit) sẽ chốt khi bắt đầu triển khai; hướng đề xuất là append-only theo BR-18.
       - Cho phép Producer cập nhật số liệu **Tổng doanh thu (Gross Revenue, VNĐ)** mà bộ truyện mang về từ kênh phân phối bên ngoài của Publisher theo từng kỳ (tháng/quý), kèm tên đơn vị phát hành (Publisher Name) và mã hợp đồng/đối soát ngoài (External Reference).
       - **Ranh giới phạm vi (Scope Boundary):** Hệ thống chỉ lưu trữ và hiển thị số liệu doanh thu và tương tác độc giả để Studio nắm bắt hiệu quả kinh doanh; các nghiệp vụ kế toán phức tạp như tính toán tỷ lệ chia lợi nhuận (*royalty split*), đối soát công nợ hay thanh toán lương cho từng thành viên nằm ngoài phạm vi hệ thống (*Out-of-Scope*).
  4. **Kiếm Tiền Bằng Tiền Thật Theo Ấn Bản Ngôn Ngữ (Chapter Edition Monetization — BR-33):**
     - **Đơn vị tiền tệ (quyết định Q11):** mọi giá, số dư, giao dịch và doanh thu tính bằng **VNĐ** (số nguyên đồng). Không có token, xu hay đơn vị ảo; không quy đổi ngoại tệ.
     - **Ví VNĐ của độc giả:** Ví dùng chung cho mọi Workspace. Độc giả nạp tiền thật vào Ví bằng chuyển khoản/QR **vào tài khoản ngân hàng của nền tảng** (quyết định Q13; không nạp vào tài khoản riêng của từng Workspace), có hạn mức tối thiểu/tối đa mỗi lần nạp; giao dịch nạp chỉ được cộng vào Ví sau khi thanh toán được xác nhận. Doanh thu của từng Workspace tính từ các giao dịch mở khóa ấn bản thuộc Series của Workspace đó. Mở khóa trừ tiền trong Ví. Mọi giao dịch nạp và mở khóa ghi sổ append-only.
     - **Hai loại ấn bản:**
       - **Free:** độc giả đọc toàn bộ ấn bản, không trả tiền.
       - **Trả phí:** độc giả chưa mở khóa chỉ xem được `free_preview_pages` trang đầu (N ≥ 0) của ấn bản đó. Hết phần xem trước, ứng dụng hiện màn hình mở khóa với giá `price_vnd` của ấn bản. Mở khóa có hiệu lực vĩnh viễn cho tài khoản đó.
     - **Giá theo ngôn ngữ & mua ngôn ngữ nào đọc ngôn ngữ đó (quyết định Q10):** mỗi ấn bản ngôn ngữ có loại, giá và số trang xem trước riêng (ví dụ bản `vi` 5.000đ, bản `en` 15.000đ, bản `ja` Free). Mở khóa ấn bản `vi` **chỉ** cho đọc trọn bản `vi`; muốn đọc bản `en` phải mở khóa bản `en`.
     - **Không có gói VIP / thuê bao:** cách duy nhất để đọc trọn ấn bản trả phí là mở khóa từng ấn bản.
     - **Người cấu hình (quyết định Q7):** chỉ tài khoản **Publisher** (duy nhất của nền tảng, Q12) được đặt loại, giá và số trang xem trước của từng ấn bản. Producer và các vai trò Studio khác chỉ xem cấu hình. Thao tác này không đụng nội dung nên được phép ở mọi trạng thái ấn bản (kể cả `Approved` và `Published`), có ghi Audit. Đổi giá không ảnh hưởng độc giả đã mở khóa trước đó.
     - **Bảo vệ ở Backend:** Server chỉ trả danh sách trang và URL ảnh của N trang đầu khi độc giả chưa mở khóa ấn bản đó; yêu cầu ảnh trang thứ N+1 trở đi bị chặn (`403 Forbidden`). Không chỉ ẩn ở giao diện.
     - Thành viên đang hoạt động của Workspace sở hữu truyện, cùng Publisher và Admin, đọc toàn bộ mọi ấn bản mà không trả tiền.
  5. **Độc Giả Chọn Ngôn Ngữ Đọc (Reader Language Selection — BR-34):**
     - Web Catalog và Mobile Reader hiển thị các ấn bản ngôn ngữ **đã phát hành** của chương, mỗi ấn bản kèm trạng thái: Free, Đã mở khóa, hoặc giá mở khóa. Độc giả chọn một ngôn ngữ; lựa chọn được nhớ theo tài khoản (hoặc thiết bị nếu chưa đăng nhập) và áp dụng cho các chương sau nếu chương đó có ấn bản ngôn ngữ ấy.
     - Ngôn ngữ mặc định khi chưa chọn: ngôn ngữ giao diện của độc giả nếu có ấn bản đã phát hành, ngược lại là `original_language`.
     - Ảnh trang trả cho độc giả lấy từ Snapshot của đúng ấn bản đã chọn. Đổi ngôn ngữ **không** chuyển quyền mở khóa: ấn bản chưa mở khóa của ngôn ngữ mới chỉ hiện phần xem trước.

---

## PHẦN IV. HỆ THỐNG QUY TẮC NGHIỆP VỤ CHUẨN HÓA (MASTER BUSINESS RULES)

| Mã Quy Tắc | Tên Quy Tắc | Đặc Tả Ràng Buộc Kỹ Thuật & Mã Phản Hồi HTTP | Module Áp Dụng |
|---|---|---|---|
| **BR-01 (BR-25)** | Tính bất biến của Series Bible (CanonLocked) | Một khi Revision của Series Bible đã được Editor xác nhận khoá (`CanonLocked`, Q20), cấm mọi thao tác sửa đè hoặc mở khóa (`/unlock` bị loại bỏ hoàn toàn). Thay bản của cùng biến thể bắt buộc gọi `POST /api/bible/{id}/supersede` (Writer); bản cũ chỉ thành `Superseded` khi bản thay thế được khoá; chương gắn bản cũ giữ bản cũ, chương gắn (hoặc kế thừa) bản mới chờ bản mới được khoá (Q23); biến thể mới tạo Revision mới với `variant_label` khác. Bản đã gắn vào chương đã qua Gate 1 không bao giờ đổi theo (BR-35). | Module 1 (CF1) |
| **BR-02 & BR-10** | Minh bạch nguồn gốc AI (AI Provenance) | AI chỉ đóng vai trò đề xuất. Mọi gợi ý từ AI phải lưu lại `provider`, `model`, `promptHash` và quyết định của con người (`Accepted`, `Edited`, `Rejected`) vào bảng sự kiện Provenance. | Module 1, 2, 3, 4 |
| **BR-04 & BR-13** | Toàn vẹn file bằng mã băm (CAS SHA-256) | Khi tải lên Model Sheet hoặc Artwork (Pencil/Ink), Client tính mã SHA-256 và gửi kèm file; Server tính lại và đối chiếu. Nếu lệch mã băm trả về `HTTP 400 Bad Request`. Nếu trùng mã băm trong cùng Workspace thì tái sử dụng file qua `AssetReference`. | Module 1, 2, 4 |
| **BR-05** | Liên kết 1-1 giữa Bóng thoại và Kịch bản | Mỗi phần tử bóng thoại (SPEECH, THOUGHT, NARRATION, SFX) trên Vector Layer bắt buộc gắn với đúng một `script_line_id` hợp lệ của Panel đó và lưu Position Record `{x,y,w,h}`. | Module 2 (CF2) |
| **BR-06 (BR-26)** | Quy tắc 4 mắt & Chống tự duyệt (Four-Eyes Principle) | Người duyệt bài (`ReviewerId`) tại Gate 2 bắt buộc phải khác với người được giao việc (`AssigneeId`) và người nộp bài (`SubmitterId`). Nếu vi phạm trả về ngay `HTTP 403 Forbidden`. Khi trả bài (`ReworkRequired`) bắt buộc phải đính kèm vùng khoanh lỗi và nhận xét. | Module 3 (CF3) |
| **BR-07 & BR-23** | Phân quyền cô lập theo Workspace & Page Assignment | Thành viên chỉ truy cập được Workspace mình tham gia. Đặc quyền viết kịch bản thuộc về Writer (`403 Forbidden` nếu Producer sửa đè thoại). Ở bước sản xuất, Artist/Letterer nào được assign trên Page/Panel nào chỉ có quyền ghi trên đúng Page/Panel đó. | Toàn hệ thống |
| **BR-08** | Khôi phục không phá hủy (Non-Destructive Restore) | Thao tác khôi phục phiên bản cũ (Restore) luôn tạo ra một Version n+1 mới sao chép dữ liệu của phiên bản cũ, tuyệt đối không xóa các phiên bản trung gian. | Module 2, 4 (CF4) |
| **BR-09, BR-16, BR-17** | Bảo vệ bản quyền xem thử & Chuyển giao Publisher | Tài nguyên ảnh gốc chỉ truy cập qua Signed URL ngắn hạn (10 phút). Link xem thử gửi cho Publisher/Đối tác (`PreviewLink`) có thời hạn tối đa 72 giờ, gắn email người nhận và bắt buộc phủ Watermark SVG lặp chéo. | Module 5 (CF5) |
| **BR-11** | Chống ghi đè đồng thời (Optimistic Concurrency) | Mọi thao tác cập nhật Kịch bản, Panel hoặc Bóng thoại phải gửi kèm `expectedVersion` (VersionVector). Nếu lệch phiên bản trên Server, trả về ngay `HTTP 409 Conflict`. | Module 1, 2, 4 |
| **BR-12 (BR-28)** | Chốt an toàn khóa chương (ChapterLockGate) | Producer chỉ được duyệt khóa chương tại Gate 3 khi: `Pages.Count >= 1`, 100% Trang == `Approved`, `UnclosedCR == 0`, `BlockingFindings == 0`, `ImpactFlags == 0`. Vi phạm trả về `HTTP 409 Conflict`. Ấn bản ngôn ngữ khác chỉ được Producer cho phép phát hành (`Approve Edition`) khi chương đã `ChapterApproved`, ấn bản đã được Editor duyệt (`EditorApproved`), đủ bản dịch và không còn cảnh báo BR-20 mức chặn của ngôn ngữ đó (BR-34). | Module 5 (CF5) |
| **BR-15** | Biến thể tạo hình & bản Bible theo chương (Q16, thay Era Versioning) | Mỗi `BibleEntryRevision` mang `variant_label`; **không** dùng `effective_from_chapter_number` để chọn bản. Bản dùng ở Chương N là bản ghi trong `chapter_bible_bindings` của Chương N; chương gắn **một bản cụ thể** (kế thừa bản của chương gần nhất trước N có thực thể đó, chưa có thì bản mới nhất của biến thể mặc định; chỉ Writer đổi khi cần, kể cả sang bản chưa khoá — Q18, Q22, Q23), cộng các bản đặt riêng theo Panel trong `panel_bible_variants` (giai đoạn khác trong cùng chương, không kế thừa sang chương sau). Kiểm tra nhất quán (Module 3) và AI tra bản theo binding của chương, không tính theo mốc chương. | Module 1, 3 |
| **BR-18** | Ghi nhật ký kiểm toán bắt buộc (Transactional Audit) | Mọi hành động đổi trạng thái ở cả 5 Module phải ghi `AuditLog` / `ProvenanceEvent` trong cùng một Transaction. Nếu không ghi được log thì hủy toàn bộ thao tác. | Module 4 (CF4) |
| **BR-19** | Kiểm soát phụ thuộc công đoạn (Stage Dependency) | Chỉ khi Artist nộp xong Pencil của trang mới mở khóa cho bước Ink và bước đặt chữ (Lettering); chỉ khi cả Ink và Lettering trên trang hoàn tất (Lettering hoàn tất = mọi bóng thoại có chữ ở ngôn ngữ gốc; bản dịch được nghiệm thu riêng theo ấn bản, BR-34) mới mở khóa Gate 2 Review. | Module 2 (CF2) |
| **BR-20** | Kiểm tra an toàn kỹ thuật Lettering (Geometry Guard) | Hệ thống tự động tính toán hình học trên Vector Layer để cảnh báo 3 lỗi: Tràn chữ khỏi bóng thoại (`TEXT_OVERFLOW`), Ngược chiều đọc Manga/Comic (`READING_ORDER_MISMATCH`), và Đè lên vùng nét vẽ chính (`OVERLAPS_KEY_ARTWORK_REGION`). | Module 2, 3 |
| **BR-21 & BR-30** | Kiểm tra nhất quán Nhân vật chính & Miễn trừ Quần chúng | Chỉ các thực thể nằm trong Danh sách thực thể chương (người nói tự khớp/tự tạo, hoặc đoạn Writer bôi đen tham chiếu) mới bắt buộc gắn bản `CanonLocked` để qua Gate 1. Thực thể quần chúng (tả trực tiếp trong mô tả/dẫn truyện không bôi đen, hoặc mục Bible gắn cờ *Quần chúng*) không cần thiết kế và không chặn Gate 1. | Module 1, 3, 5 |
| **BR-27** | Tự thu hồi bước vẽ & Cảnh báo liên đới cấp Panel | (1) Artist được quyền Self-Rollback từ Ink về Pencil nếu trang chưa vào `UnderReview` (tự động nhắc kiểm tra lại bóng thoại nếu trang đã đặt chữ).<br>(2) Khi một Panel bị đánh dấu sửa nét vẽ ở Gate 2, hệ thống tự động bật cờ `CheckBalloonPlacement` cho các bóng thoại thuộc Panel đó. | Module 2, 3 |
| **BR-31 (Mới)** | Quyền thêm chữ mặc định của Artist & Giới hạn công cụ của Letterer | (1) Role Artist mặc định có cả quyền vẽ (`graphic:write`) lẫn quyền thêm chữ (`letter:write`) trên Page mình được assign.<br>(2) Role Letterer là vai trò phụ việc tùy chọn; nếu được assign vào Page nào thì chỉ được mở duy nhất công cụ thêm chữ (`letter:write`) trên Page đó, cấm thao tác lên Layout hoặc Graphic Layer (`403 Forbidden`). | Module 2 (CF2) |
| **BR-32** | Ranh giới Publisher, Phân tích Độc giả & Doanh thu | (1) Publisher là External Stakeholder, nhận chuyển giao qua Publisher Portal; Publisher chỉ được ghi cấu hình thương mại của ấn bản (BR-33), mọi thao tác sửa nội dung, nghiệm thu, phát hành, mở lại của Publisher trả `403 Forbidden`. (2) Dashboard 360° chỉ dành cho **Producer** của Workspace (và Admin); vai trò khác gọi API thống kê/doanh thu trả `403`. (3) Dashboard gồm: chỉ số độc giả (Tổng lượt xem, Độc giả thực tế, Tỷ lệ hoàn thành đọc, Thời gian đọc trung bình, Phân bố Web/Mobile, Phân bố ngôn ngữ, Đánh giá); doanh thu bán ấn bản trong ứng dụng tính bằng **VNĐ** từ sổ giao dịch mở khóa, lọc theo Chương / Ấn bản ngôn ngữ / kỳ; và Gross Revenue do Publisher báo về theo kỳ (triển khai giai đoạn sau). (4) Chia lợi nhuận (royalty split, hoa hồng) nằm ngoài phạm vi (*Out-of-Scope*). | Module 5 (CF5) |
| **BR-33** | Kiếm tiền theo Ấn bản bằng Tiền thật & Xem trước | (1) Mọi giá, số dư Ví, giao dịch và doanh thu tính bằng **VNĐ** (số nguyên ≥ 0); không có token/đơn vị ảo, không quy đổi ngoại tệ. Ví dùng chung, tiền nạp chuyển vào tài khoản của nền tảng; nạp Ví chỉ cộng tiền sau khi thanh toán được xác nhận; doanh thu Workspace tính từ giao dịch mở khóa. (2) Mỗi ấn bản ngôn ngữ `ChapterEdition(chapter, lang)` có loại Free/Trả phí, `price_vnd` và `free_preview_pages` riêng. Ấn bản Trả phí: độc giả chưa mở khóa ấn bản đó chỉ nhận N trang đầu; trang thứ N+1 trở đi trả `403 Forbidden`. (3) Chỉ tài khoản **Publisher** (duy nhất của nền tảng) được đặt loại, giá và N (`403` với mọi vai trò khác, kể cả Producer); được phép ở mọi trạng thái ấn bản và ghi Audit. Ấn bản chưa cấu hình là Free. (4) Mở khóa khi Ví không đủ tiền trả `400 Bad Request` kèm số tiền còn thiếu; mở khóa thành công trừ đúng `price_vnd` hiện hành, ghi giao dịch append-only và có hiệu lực vĩnh viễn **chỉ cho ấn bản ngôn ngữ đó**. (5) Mở khóa lại ấn bản đã mở không trừ thêm tiền. (6) Không có gói VIP/thuê bao; quyền đọc ấn bản trả phí chỉ đến từ mở khóa ấn bản đó (hoặc là thành viên Studio, Publisher, Admin). | Module 5 (CF5) |
| **BR-34** | Ngôn ngữ Bóng thoại & Ấn bản Ngôn ngữ | (1) Series khai báo `original_language` và `release_languages` (chứa ngôn ngữ gốc); chỉ Producer sửa. Mỗi ngôn ngữ trong `release_languages` tạo một ấn bản `ChapterEdition` cho mỗi chương. (2) Mỗi bóng thoại (SPEECH, THOUGHT, NARRATION, SFX) có một vị trí `{x,y,w,h}` dùng chung và một bản chữ cho mỗi ngôn ngữ; bản ngôn ngữ gốc gắn với `script_line_id` (BR-05). (3) Artist/Letterer của trang nhập bản dịch; đổi bản dịch không đổi hình học Panel hay lớp Ink; kiểm tra BR-20 chạy theo từng ngôn ngữ. (4) Gate 2 chỉ cần lớp chữ ngôn ngữ gốc đầy đủ. (5) Duyệt **từng ấn bản**: ấn bản gốc cùng `Approve Chapter`; ấn bản khác đi qua *Nộp bản dịch* (chương đã `ChapterApproved`, đủ bản dịch, thiếu thì `409 Conflict` kèm danh sách bóng thoại) → **Editor duyệt** (luật 4 mắt BR-06 với người dịch) → **Producer cho phép phát hành** (`Approve Edition`, sinh Snapshot riêng của ấn bản). (6) Phát hành, mở lại theo từng ấn bản, chỉ Producer. Mở lại chương (tranh) đưa mọi ấn bản chưa phát hành về `Draft`; ấn bản đã phát hành tiếp tục phục vụ Snapshot cũ. (7) Độc giả chọn ngôn ngữ trong các ấn bản đã phát hành; quyền mở khóa không chuyển giữa các ngôn ngữ. (8) Bản dịch chỉ nhập trong hệ thống tại công đoạn Lettering; không tải ảnh trang đã dịch; Publisher không tham gia dịch, chỉ đặt giá (Q28). | Module 2, 5 (CF2, CF5) |
| **BR-35 (Mới, Q16)** | Danh sách & Bản đồ thực thể chương | (1) Mục Bible có `name` + `aliases`; tên/bí danh trùng giữa hai mục cùng Series → `409 Conflict`. (2) **Người nói:** mỗi lần lưu kịch bản, `speaker_label` (bỏ hậu tố `(nghĩ)`, cắt khoảng trắng, NFC, không phân biệt hoa thường) được so **khớp nguyên chuỗi** với tên/bí danh mục Bible loại Nhân vật; khớp → thực thể của chương; không khớp → hệ thống **tự tạo mục Nhân vật `Draft`** (tên = người nói, mô tả trống) và gắn vào chương. (3) **Lời dẫn / mô tả / SFX không tự khớp:** Writer bôi đen đoạn chữ và tham chiếu tới một mục Bible có sẵn (Nhân vật, Địa điểm, Đạo cụ) hoặc tạo mục mới (`Draft`, tên lấy từ đoạn bôi, sửa được); tham chiếu lưu theo dòng (`script_line_entity_refs`: dòng, mục, vị trí, chữ gốc) và đi cùng phiên bản kịch bản. (4) Mục có cờ **Quần chúng** (`is_crowd`, chỉ Writer bật/tắt, bất kỳ lúc nào) không cần thiết kế, không vào hàng đợi Artist và không chặn Gate 1; giá trị cờ được ghi vào bản đồ chương lúc chốt nên đổi cờ sau đó không ảnh hưởng chương đã chốt. (5) **Gửi duyệt** trả `409` kèm danh sách nếu còn mục nháp chưa định nghĩa và không Quần chúng, hoặc mục không Quần chúng chưa có biến thể (Q21; biến thể mặc định là hợp lệ, Q22). **Gate 1** trả `409` kèm danh sách nếu còn thực thể (không Quần chúng) mà biến thể chương dùng chưa có bản `CanonLocked`. (6) `chapter_bible_bindings` và `panel_bible_variants` khoá cùng kịch bản tại Gate 1, chỉ sửa được khi Producer mở lại kịch bản (mở lại không tự kế thừa lại, Q23); Gate 1 kiểm mọi bản chương dùng (của chương + theo Panel) đã `CanonLocked`; đổi bản đã gắn sau khi chương đã vào sản xuất gắn cờ ⚑ cho các Panel có thực thể đó. (7) Không xoá mục Bible đang được chương nào gắn (`409`); mục `Draft` do hệ thống tự tạo mà không còn chương nào dùng (người nói bị đổi tên/xoá) và chưa có sự kiện duyệt thì được dọn tự động. (8) Bản đồ thực thể (gồm giai đoạn theo Panel) được đưa vào `ChapterSnapshot` ở Gate 3. (9) Lựa chọn bản của Writer (cho chương và theo Panel) thuộc nội dung `ScriptVersion` và mã băm; bản kế thừa thì không (Q24). Chỉ Writer bôi đen / gỡ tham chiếu (chỉ trên dòng Mô tả, Lời dẫn, SFX), gắn cờ Quần chúng, viết định nghĩa mục nháp và đổi biến thể cho chương (Q18, Q19); Producer và vai trò khác chỉ đọc (403). | Module 1, 2, 3, 5 |

---

## PHẦN V. MA TRẬN PHÂN QUYỀN, MÁY TRẠNG THÁI & ĐIỀU HƯỚNG MÀN HÌNH

### 5.1. Ma Trận Phân Quyền Theo Vai Trò (RBAC & Page-Scoped ABAC Matrix)

*(Lưu ý: Publisher là External Stakeholder tương tác qua Publisher Portal (bàn giao chỉ đọc + quy định thương mại) và PreviewLink; đối soát tài chính thực hiện bên ngoài. Cột cuối gộp Publisher và Reader, ô ghi rõ ai được phép.)*

| Hành động Nghiệp vụ | Admin | Producer | Writer | Artist (Chủ đạo) | Letterer (Phụ việc) | Editor | Publisher / Reader (Ngoài HT) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Cấu hình ngôn ngữ gốc & ngôn ngữ phát hành của Series | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Quản lý tài khoản hệ thống (gồm tài khoản Publisher duy nhất), tài khoản ngân hàng nền tảng, AI Quota & Cấp quyền tạo Studio | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Tạo Studio Workspace, Tạo Series & Mời thành viên nội bộ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Viết/Sửa Kịch bản (Page -> Panel -> Contents, chữ thuần, tả quần chúng) | ❌ | 👁️ (Chỉ đọc) | ✅ (Độc quyền) | 👁️ (Chỉ đọc) | 👁️ (Chỉ đọc) | 👁️ (Comment) | ❌ |
| Bôi đen tham chiếu Series Bible / tạo bản nháp từ đoạn bôi (khi kịch bản chưa Frozen) | ❌ | 👁️ (Chỉ đọc) | ✅ (Độc quyền) | 👁️ (Chỉ đọc) | 👁️ (Chỉ đọc) | 👁️ (Chỉ đọc) | ❌ |
| Đổi bản (giai đoạn) của thực thể cho chương hoặc cho từng Panel khi cần, kể cả sang bản chưa khoá; không đổi thì dùng bản kế thừa; huỷ bản thay thế chưa duyệt (khi kịch bản chưa Frozen, Q18, Q22, Q23) | ❌ | 👁️ (Chỉ đọc) | ✅ (Độc quyền) | 👁️ (Chỉ đọc) | 👁️ (Chỉ đọc) | 👁️ (Chỉ đọc) | ❌ |
| Gắn / gỡ cờ Quần chúng trên mục Series Bible (Q19) | ❌ | 👁️ (Chỉ đọc) | ✅ (Độc quyền) | 👁️ (Chỉ đọc) | 👁️ (Chỉ đọc) | 👁️ (Chỉ đọc) | ❌ |
| Tạo mục Series Bible, viết định nghĩa mục nháp, tạo biến thể / bản thay thế (`/supersede`) (Q19, Q20) | ❌ | 👁️ (Chỉ đọc) | ✅ | 👁️ (Chỉ đọc) | 👁️ (Chỉ đọc) | 👁️ (Chỉ đọc) | ❌ |
| Tải ảnh thiết kế nhân vật chính (Model Sheet) lên Series Bible (mỗi lần nộp là một phiên bản concept) | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Góp ý / trả lời góp ý trên phiên bản concept | ❌ | 👁️ | ✅ | ✅ (Trả lời) | ❌ | ✅ | ❌ |
| Yêu cầu vẽ lại concept (`ReworkRequired`, Q22) | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Xác nhận thiết kế = khoá chuẩn Series Bible (🔒 CanonLocked, Q20) | ❌ | ❌ | ❌ | ❌ (Chặn tự duyệt) | ❌ | ✅ (Độc quyền) | ❌ |
| Bấm chốt kịch bản, Giao Page cho Artist & Bắt đầu sản xuất (Gate 1) | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Dựng khung Frame Template, vẽ Pencil/Ink & Self-Rollback | ❌ | ❌ | ❌ | ✅ (Trên Page được assign) | ❌ (Khóa cứng) | ❌ | ❌ |
| Sử dụng công cụ đặt bóng thoại Vector (Balloon/Caption/SFX) | ❌ | ❌ | ❌ | ✅ (Mặc định có sẵn trên Page được assign) | ✅ (Chỉ mở công cụ chữ trên Page được assign) | ❌ | ❌ |
| Nhập bản dịch bóng thoại theo ngôn ngữ phát hành | ❌ | ❌ | ❌ | ✅ (Trên Page được assign) | ✅ (Trên Page được assign) | ❌ | ❌ |
| Khoanh vùng lỗi Bounding Box, tạo ChangeRequest & Duyệt Gate 2 | ❌ | ✅ (Dự phòng) | ❌ | ❌ (Chặn tự duyệt) | ❌ (Chặn tự duyệt) | ✅ (Chính) | ❌ |
| Mở lại trang đã duyệt trước Gate 3 (khoanh lỗi Panel, Q27) | ❌ | ✅ (Dự phòng) | ❌ | ❌ | ❌ | ✅ (Chính) | ❌ |
| Khôi phục bản ảnh cũ của Panel/Trang (khi chưa duyệt hoặc đang sửa lỗi, Q27) | ❌ | ❌ | ❌ | ✅ (Trên Page được assign) | ❌ | ❌ | ❌ |
| Bóc tách phạm vi trang (Carve-out / Scope Transfer từ Artist A $\rightarrow$ B) | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Duyệt khóa chương (Gate 3 Snapshot), Xuất gói file chuyển giao cho Publisher & Ghi nhận Doanh thu | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Duyệt bản dịch của ấn bản ngôn ngữ (khoanh lỗi, `EditorApproved`) | ❌ | ✅ (Dự phòng) | ❌ | ❌ (Chặn tự duyệt) | ❌ (Chặn tự duyệt) | ✅ (Chính) | ❌ |
| Cho phép phát hành từng ấn bản ngôn ngữ (`Approve Edition`) | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Phát hành & Mở lại chương / ấn bản (`Publish`, `Reopen`) | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Quy định ấn bản Free / Trả phí, giá VNĐ & số trang xem trước | ❌ | 👁️ (Chỉ xem) | ❌ | ❌ | ❌ | ❌ | ✅ (Publisher) |
| Xem Dashboard lượt đọc & doanh thu (BR-32) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Xem thử qua PreviewLink (Watermark), Nhận gói chuyển giao thương mại & Đọc truyện đã phát hành | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Publisher & Reader) |
| Publisher Portal: xem & tải gói Release | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ (Publisher, chỉ đọc) |
| Nạp tiền vào Ví & Mở khóa ấn bản trả phí (VNĐ) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (Reader) |
| Chọn ngôn ngữ đọc | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Publisher & Reader) |

### 5.2. Chuẩn Hóa 6 Máy Trạng Thái Cốt Lõi (Unified State Machines)

```mermaid
stateDiagram-v2
    direction LR

    state "1. Series Bible Revision (Chỉ cho Nhân vật/Bối cảnh chính, theo biến thể tạo hình)" as S_BIBLE {
        [*] --> Draft: Writer tạo mục, hệ thống tự tạo từ người nói mới, hoặc Writer bôi đen tạo mục (cờ IsStub = chờ Writer viết định nghĩa, chưa nộp concept được)
        Draft --> ConceptSubmitted: Artist nộp phiên bản concept v1 (SHA-256), sau khi Writer viết định nghĩa
        ConceptSubmitted --> ConceptSubmitted: Writer/Editor góp ý, Artist trả lời (theo phiên bản)
        ConceptSubmitted --> ReworkRequired: Writer, Editor hoặc Producer yêu cầu vẽ lại (kèm nhận xét, Q22)
        ReworkRequired --> ConceptSubmitted: Artist nộp phiên bản concept mới
        ConceptSubmitted --> CanonLocked: Editor xác nhận = khoá 🔒 (Q20, BR-01, BR-06)
        CanonLocked --> Superseded: Bản thay thế cùng biến thể được khoá (BR-01); chương đang gắn bản cũ giữ nguyên, không tự chuyển (Q23)
    }

    state "2. Page / Panel Stage Progress (Theo Page Assignment)" as S_PANEL {
        [*] --> PencilInProgress: Sau Gate 1 (Giao Page cho Artist)
        PencilInProgress --> InkAndLetterTrack: Artist nộp Layout + Pencil
        InkAndLetterTrack --> PencilInProgress: Artist bấm [↺ Self-Rollback] (Báo kiểm tra lại chữ nếu đã đặt)
        InkAndLetterTrack --> CompositeUnderReview: Đã nộp xong Ink & Đặt xong Bóng thoại (bởi Artist hoặc Letterer)
        CompositeUnderReview --> PanelReworkRequired: Editor khoanh Box lỗi tại Panel X
        PanelReworkRequired --> CompositeUnderReview: Sửa xong Panel X & Xác nhận lại Balloon
        CompositeUnderReview --> Approved: Editor duyệt Gate 2 (0 CR mở)
        Approved --> PanelReworkRequired: Editor/Producer mở lại trang đã duyệt, khoanh lỗi Panel X (trước Gate 3, Q27)
    }

    state "3. Change Request (Gate 2)" as S_CR {
        [*] --> Open: Editor khoanh vùng lỗi {x,y,w,h} (1 phiếu / Panel giao thoa, chung group_id)
        Open --> Resolved: Artist / Letterer nộp bản sửa
        Resolved --> Open: Editor kiểm tra thấy chưa đạt
        Resolved --> Verified: Editor xác nhận đã sửa đúng
    }

    state "4. Chapter Lifecycle & Publisher Handoff (Gate 3)" as S_CHAP {
        [*] --> PreProduction: Chương mới (mặc định) — đang viết Script & thiết kế Bible chính
        PreProduction --> InProduction: Gate 1 — Producer bấm Bắt đầu sản xuất (ScriptStatus InReview → Frozen)
        InProduction --> ChapterApproved: Gate 3 (100% Trang Approved ➔ Tạo Snapshot bất biến, khóa chương)
        ChapterApproved --> InProduction: Producer Reopen kèm lý do Audit
        ChapterApproved --> HandedOffAndPublished: Producer chuyển giao gói cho Publisher & Phát hành ấn bản gốc
    }

    state "5. Kịch bản chương ScriptStatus (Q15: Lưu = commit, Gửi duyệt = push)" as S_SCRIPT {
        [*] --> ScriptDraft: Writer viết; mỗi lần Lưu tạo ScriptVersion (SHA-256)
        ScriptDraft --> ScriptInReview: Writer Gửi duyệt (push bản mới nhất; chặn nếu Danh sách thực thể chương chưa chốt: mục nháp, Quần chúng, biến thể — Q21)
        ScriptInReview --> ScriptInReview: Writer Lưu tiếp / Gửi duyệt lại; Editor góp ý theo dòng
        ScriptInReview --> ScriptDraft: Writer Hủy gửi duyệt
        ScriptInReview --> ScriptFrozen: Producer Bắt đầu sản xuất (bản live = bản đã gửi; mọi biến thể chương dùng đã CanonLocked — Q21)
        ScriptFrozen --> ScriptDraft: Producer Mở lại kèm lý do (Audit Log)
    }

    state "6. Ấn bản Ngôn ngữ ChapterEdition (chapter, lang)" as S_EDITION {
        [*] --> Draft: Ngôn ngữ có trong release_languages
        Draft --> InReview: Artist/Letterer nộp bản dịch (chương đã ChapterApproved, đủ bản dịch)
        InReview --> Draft: Editor khoanh lỗi bản dịch (ChangeRequest lớp Lettering)
        InReview --> EditorApproved: Editor duyệt (khác người dịch, BR-06)
        EditorApproved --> Approved: Producer cho phép phát hành ➔ EditionSnapshot
        EditorApproved --> Draft: Producer Reopen Edition kèm lý do / Reopen chương
        Approved --> Draft: Producer Reopen Edition kèm lý do / Reopen chương (nếu chưa phát hành)
        Approved --> Published: Producer Publish Edition
        Published --> Approved: Có Snapshot mới được nghiệm thu, chờ phát hành lại (bản cũ vẫn phục vụ độc giả)
    }
```

> **Ghi chú máy trạng thái Kịch bản (Q15):** tên trong code là `ScriptStatus.Draft / InReview / Frozen` (tiền tố `Script` trong sơ đồ chỉ để không trùng tên với máy 6). Chỉ `Frozen` khoá sửa kịch bản; chương `Approved`/`Published` cũng khoá nội dung. Không còn `ChangesRequested` / `Amending` và không duyệt kịch bản qua Assignment hay stage Script của pipeline.
>
> **Ghi chú máy trạng thái Chương:** `ChapterApproved` là trạng thái khóa chương; không tồn tại trạng thái `Locked` riêng (đã gộp, quyết định 2026-11-12). Cấu hình Free/Trả phí và giá VNĐ (BR-33, do Publisher đặt) là thuộc tính của **ấn bản**, không phải trạng thái, nên đổi được ở mọi trạng thái mà không cần Reopen. Bản dịch bóng thoại (BR-34) thuộc nội dung của ấn bản: sửa bản dịch của ấn bản đã `Approved` chỉ cần `Reopen Edition` ngôn ngữ đó, không mở lại chương.

### 5.3. Luồng Điều Hướng Màn Hình Thống Nhất (Unified Screen Navigation)

Toàn bộ các vai trò nội bộ trong Studio đều đi theo trục điều hướng đồng nhất trong khung `<AppShell>`, tự động hiển thị công cụ theo đúng quyền hạn và Page được giao:

```text
[Bước 1: Đăng nhập (/login)]
   │
   ▼
[Bước 2: Chọn Studio Workspace (/workspaces ➔ WorkspaceListView)]
   │  • Lưu activeWorkspaceId & lấy đúng WorkspaceRole của người dùng tại Studio đó.
   ▼
[Bước 3: Tổng quan Studio & Chọn Bộ Truyện (/workspace/:wId/series ➔ Series Hub)]
   │  • Header Breadcrumb: Workspaces / <Tên Studio>
   │  • Hiển thị danh sách Series của Studio kèm tiến độ; Producer thấy thêm tổng lượt đọc & doanh thu (VNĐ) mỗi Series.
   ▼
[Bước 4: Không Gian Dự Án Của Series (/workspace/:wId/series/:sId)]
   │  • Left Sidebar cố định gồm:
   │      1. 📊 Dashboard, Readership & Revenue (Tiến độ Chương & ấn bản; riêng Producer: Lượt xem, Tỷ lệ đọc hết, Phân bố ngôn ngữ, Doanh thu VNĐ theo ấn bản)
   │      2. 📋 Production Pipeline (Bảng Kanban chia Page cho các Artist & Letterer phụ việc)
   │      3. 📖 Series Bible (Kho Nhân vật chính, Bối cảnh, Model Sheet & Khóa Canon)
   │      4. 👥 Members & Roles (Quản lý nhân sự tham gia Series)
   │      5. 📜 Audit Log & Provenance (Lịch sử sự kiện & Truy vết AI)
   ▼
[Bước 5: Bàn Làm Việc Chuyên Môn Khi Chọn 1 Chương / Trang (/workspace/:wId/chapters/:cId/...)]
   ├── WRITER   ➔ ScriptEditorView.tsx     (Soạn Trang ➔ Panel ➔ Mô tả/Thoại/Dẫn truyện/SFX bằng chữ thuần; bôi đen để tham chiếu nhân vật trong lời dẫn; ngăn phải: Danh sách thực thể chương — người nói tự khớp/tự tạo, đoạn bôi đen, cờ Quần chúng)
   ├── ARTIST   ➔ ArtistDeskView.tsx       (Mở Page được assign: Chọn Frame Template, vẽ Pencil/Ink, Self-Rollback VÀ có sẵn công cụ đặt Bóng thoại Vector)
   ├── LETTERER ➔ LetteringWorkspace.tsx   (Role phụ việc - Mở Page được assign: Chỉ hiển thị duy nhất công cụ đặt Bóng thoại Vector, khóa lớp vẽ của Artist)
   ├── EDITOR   ➔ ReviewView.tsx           (So sánh Side-by-side/Swipe/Pixel Diff, khoanh Box lỗi cô lập Panel, Verify CR; duyệt bản dịch từng ấn bản ngôn ngữ)
   └── PRODUCER ➔ ChapterReleaseModal.tsx  (Chốt Gate 1 & Giao Page, Carve-out/Transfer trang giữa các Artist, Chốt Gate 3 Snapshot, Nghiệm thu & Phát hành từng ấn bản ngôn ngữ, Xem cấu hình giá do Publisher đặt, Xuất gói chuyển giao theo ấn bản & Nhập số liệu Doanh thu [giai đoạn sau])
   (ARTIST / LETTERER có bộ chọn "ngôn ngữ đang soạn" trên bàn vẽ để nhập bản dịch bóng thoại)

[Ngoài AppShell sản xuất]
   ├── PUBLISHER ➔ Publisher Portal  (Bàn giao chỉ đọc: gói Release & PreviewLink, tải gói · Quy định thương mại theo ấn bản: Free/Trả phí, giá VNĐ, số trang xem trước; không có nút hành động sản xuất)
   └── READER    ➔ Web Catalog / Mobile Reader (Chọn ấn bản ngôn ngữ, đọc ấn bản Free, xem trước N trang ấn bản Trả phí, Ví VNĐ, nạp tiền & mở khóa đúng ấn bản)
```

---

## PHẦN VI. KIẾN TRÚC KỸ THUẬT NÂNG CAO & GIẢI PHÁP TỐI ƯU CÔNG NGHỆ

### 6.1. Tối Ưu Cơ Sở Dữ Liệu & Backend (.NET 9 + PostgreSQL 17)

1. **Toán Tử Hình Học Native PostgreSQL (`box` & GiST Index) Cho Bounding Box:**
   * Lưu trữ tọa độ Panel và vùng khoanh lỗi bằng kiểu dữ liệu hình học native `box` trong PostgreSQL, lập chỉ mục `GiST (boundingBox)` để tối ưu hóa truy vấn không gian.
   * **Công thức xác định Panel giao thoa (`FindIntersectingPanelIds`):**
     $$\text{OverlapRatio} = \frac{\text{Area}(\text{ErrorBox} \cap \text{PanelBox})}{\text{Area}(\text{ErrorBox})}$$
     Nếu $\text{OverlapRatio} \ge 0.15$ (15%), Panel đó được đưa vào danh sách mở khóa Rework. Giải quyết triệt để lỗi nét vẽ hoặc bóng thoại nằm vắt ngang giữa 2 Panel.
   * Với mỗi Panel trong danh sách, hệ thống tạo một dòng `change_requests` riêng (`panel_id` = Panel đó); các dòng sinh từ cùng một vùng khoanh dùng chung cột `group_id UUID NULL`. Không dùng bảng nối nhiều-nhiều.

2. **SignalR (.NET 9) Cho Bảng Kanban & Cảnh Báo Liên Đới Thời Gian Thực:**
   * Sử dụng ASP.NET Core SignalR (nhóm kết nối theo `ChapterId` hoặc `PageId`).
   * Ngay khi Artist tải bản vẽ Ink mới hoặc bấm Self-Rollback, giao diện `LetteringWorkspace.tsx` của Letterer đang mở sẽ tự động cập nhật lớp ảnh nền bên dưới lớp Vector tức thời mà không cần reload trang, đồng thời kích hoạt viền cảnh báo màu cam `⚠️ Check Balloon Fit` theo thời gian thực.

3. **Background Worker Ghép Phẳng Composite 1200×1800 (SkiaSharp / NetVips):**
   * Sử dụng thư viện đồ họa hiệu năng cao SkiaSharp hoặc NetVips chạy ngầm qua `System.Threading.Channels` trên .NET 9 để ghép Graphic Layer và Vector Layer thành ảnh Composite 1200×1800, sinh mã băm SHA-256 lưu trữ CAS trên Cloudflare R2 mà không làm nghẽn luồng xử lý HTTP request chính.

4. **Schema Cơ Sở Dữ Liệu Tinh Gọn Cho Phân Tích Độc Giả & Báo Cáo Doanh Thu (Readership & Revenue Schemas):**
   * **Bảng `chapter_readership_metrics`:** Tự động ghi nhận và tổng hợp các chỉ số hành vi độc giả từ Web Viewer và Flutter Mobile Reader:
     ```sql
     CREATE TABLE chapter_readership_metrics (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
         series_id UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
         language_code VARCHAR(10) NOT NULL,             -- Ấn bản ngôn ngữ (BR-34)
         total_views BIGINT NOT NULL DEFAULT 0,          -- Tổng số lượt mở xem chương
         unique_readers BIGINT NOT NULL DEFAULT 0,       -- Số độc giả duy nhất
         completed_reads BIGINT NOT NULL DEFAULT 0,      -- Số lượt đọc đến trang cuối cùng
         completion_rate DECIMAL(5, 2) DEFAULT 0.00,     -- Tỷ lệ đọc hết = (completed_reads / total_views) * 100
         avg_reading_time_seconds INT NOT NULL DEFAULT 0,-- Thời gian đọc trung bình (giây)
         web_views BIGINT NOT NULL DEFAULT 0,            -- Lượt đọc qua Web Browser
         mobile_views BIGINT NOT NULL DEFAULT 0,         -- Lượt đọc qua Flutter Mobile App
         rating_score DECIMAL(3, 2) DEFAULT 5.00,        -- Điểm đánh giá trung bình (1..5)
         total_ratings INT NOT NULL DEFAULT 0,           -- Tổng số lượt đánh giá
         last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
         CONSTRAINT uq_chapter_readership UNIQUE (chapter_id, language_code)
     );
     CREATE INDEX idx_readership_series_chapter ON chapter_readership_metrics(series_id, chapter_id);
     ```
   * **Bảng `chapter_revenue_reports` (⏸️ triển khai giai đoạn sau):** Ghi nhận số liệu thương mại do Publisher chuyển giao đối soát theo từng kỳ:
     ```sql
     CREATE TABLE chapter_revenue_reports (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
         series_id UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
         reporting_period VARCHAR(20) NOT NULL,           -- Ví dụ: "2026-Q4", "2026-11"
         gross_revenue NUMERIC(15, 2) NOT NULL,           -- Tổng doanh thu thương mại báo về
         currency VARCHAR(10) NOT NULL DEFAULT 'VND',     -- Đơn vị: 'VND', 'USD', 'JPY'
         publisher_name VARCHAR(100) NOT NULL,           -- Tên đối tác phát hành
         external_reference VARCHAR(100),                -- Mã biên bản đối soát / hợp đồng ngoài
         reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
         notes TEXT
     );
     CREATE INDEX idx_revenue_series_period ON chapter_revenue_reports(series_id, reporting_period);
     ```
   * **Cơ chế Ingestion Không Nghẽn (Non-blocking Ingestion Buffer):** Khi độc giả đọc truyện, Client gửi beacon nhẹ `POST /api/catalog/chapters/{id}/read-heartbeat` (trang hiện tại, thời gian đọc, hoàn thành). Server đưa vào bộ đệm Redis/MemoryCache và định kỳ (batch 1–5 phút) cập nhật lũy kế vào `chapter_readership_metrics`, đảm bảo không làm quá tải database PostgreSQL.

5. **Schema Ấn Bản Ngôn Ngữ & Kiếm Tiền Bằng VNĐ (BR-33, BR-34):**
   * **Bảng `series`:** `original_language VARCHAR(10) NOT NULL DEFAULT 'vi'`, `release_languages VARCHAR(10)[] NOT NULL DEFAULT '{vi}'` (CHECK chứa `original_language`). Mã ngôn ngữ BCP 47 rút gọn.
   * **Bảng `chapter_editions`** — một dòng cho mỗi cặp (chương, ngôn ngữ phát hành), thay cho các cột `is_locked`, `price_vnd` đang nằm trên `chapters`:
     ```sql
     CREATE TABLE chapter_editions (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
         language_code VARCHAR(10) NOT NULL,
         status VARCHAR(20) NOT NULL DEFAULT 'Draft',      -- Draft | InReview | EditorApproved | Approved | Published
         is_paid BOOLEAN NOT NULL DEFAULT FALSE,           -- do Publisher đặt (BR-33)
         price_vnd INT NOT NULL DEFAULT 0 CHECK (price_vnd >= 0),
         free_preview_pages INT NOT NULL DEFAULT 0 CHECK (free_preview_pages >= 0),
         current_snapshot_id UUID NULL,                    -- Snapshot đang phục vụ độc giả
         approved_at TIMESTAMPTZ NULL, approved_by UUID NULL,
         published_at TIMESTAMPTZ NULL,
         version BIGINT NOT NULL DEFAULT 0,                -- BR-11
         CONSTRAINT uq_chapter_edition UNIQUE (chapter_id, language_code),
         CONSTRAINT ck_free_has_no_price CHECK (is_paid OR price_vnd = 0)
     );
     ```
   * **Snapshot ấn bản:** `edition_snapshots(id, edition_id, snapshot_number, manifest_json, manifest_hash, created_by, created_at)` — append-only, manifest gồm hash ảnh trang đã ghép lớp chữ của ngôn ngữ đó. Ấn bản gốc tham chiếu `ChapterSnapshot` của cấp Chương.
   * **Ví & sổ giao dịch (VNĐ):** `wallets.balance_vnd BIGINT NOT NULL CHECK (balance_vnd >= 0)`. Mọi biến động ghi một dòng append-only vào bảng giao dịch với `amount_vnd` (dương khi nạp đã xác nhận, âm khi mở khóa); giao dịch mở khóa lưu `chapter_edition_id` (suy ra Workspace để tính doanh thu). Không có cột tỷ giá hay đơn vị tiền tệ khác. Thông tin tài khoản ngân hàng nhận tiền nạp là cấu hình **cấp nền tảng** (Admin quản lý), không theo Workspace.
   * **Quyền đọc đã mua:** `edition_entitlements(user_id, chapter_edition_id, price_paid_vnd, unlocked_at)`, UNIQUE `(user_id, chapter_edition_id)` — bảo đảm mở khóa lại không trừ tiền (BR-33.5) và quyền không chuyển giữa ngôn ngữ (BR-34.7).
   * **Ghi cấu hình thương mại:** `is_paid`, `price_vnd`, `free_preview_pages` chỉ ghi qua lệnh `SetEditionMonetization` với quyền Publisher (BR-33.3), có Audit.

6. **Schema Bóng Thoại Đa Ngôn Ngữ & Ngôn Ngữ Đọc (BR-34):**
   * **Phần tử chữ trên canvas (`ElementState` trong Marten):** giữ một Position Record + `TextStyle`; nội dung chữ chuyển thành từ điển `texts: { "<language_code>": "<chữ>" }`. Bản ngôn ngữ gốc tiếp tục gắn `script_line_id` (BR-05) và cờ `isStale` (Module 4). Sửa bản dịch là sự kiện append-only `ElementTranslationUpdated { elementId, languageCode, text, expectedVersion }` (BR-11).
   * **Reader API:** nhận `?lang=`; trả danh sách ấn bản đã phát hành của chương (ngôn ngữ, Free/giá, đã mở khóa hay chưa) và ảnh trang từ `current_snapshot_id` của ấn bản đã chọn; `lang` không có ấn bản phát hành → ấn bản `original_language`.
   * **Ngôn ngữ đọc của độc giả:** `users.preferred_reading_language VARCHAR(10) NULL`; khách chưa đăng nhập lưu ở thiết bị.
   * **Thống kê:** beacon read-heartbeat gửi thêm `languageCode`; `chapter_readership_metrics` tách theo `(chapter_id, language_code)` để tính Phân bố ngôn ngữ và doanh thu theo ấn bản (BR-32).

### 6.2. Tối Ưu Giao Diện & Trải Nghiệm Người Dùng (React 19 + Konva.js)

1. **Thanh Trượt Đối Chiếu "Ghost Pencil Overlay":**
   * Trên thanh công cụ của `LetteringWorkspace.tsx` và `ReviewView.tsx`, tích hợp thanh trượt độ mờ (Opacity Slider: Pencil $\leftrightarrow$ Ink). Letterer có thể kéo mờ lớp Ink để soi lại lớp phác thảo Pencil ban đầu, kiểm tra xem nét mực mới có vô tình lấn vào không gian bóng thoại đã định vị hay không.

2. **Bắt Dính Khung Tự Động (Magnetic Snapping & Gutter Guide):**
   * Khi Artist tự kẻ hoặc chỉnh sửa khung tranh trên Konva Canvas, áp dụng thuật toán Magnetic Snapping: tự động hút cạnh Panel vào lề an toàn Safe Margin (3%) hoặc bắt thẳng hàng với cạnh Panel lân cận khi khoảng cách nhỏ hơn $8\text{px}$, loại bỏ hoàn toàn hiện tượng lệch lề 1-2px gây mất thẩm mỹ.

3. **Băm SHA-256 Bất Đồng Bộ Bằng Web Crypto API & Presigned PUT R2:**
   * Theo quy tắc BR-04, Client tính mã băm SHA-256 của file ảnh Artwork (10MB–30MB) bằng `window.crypto.subtle.digest('SHA-256', arrayBuffer)` chạy bên trong một **Web Worker** dưới nền, đảm bảo giao diện vẽ không bị đơ giật.
   * Upload file trực tiếp lên Cloudflare R2 thông qua **Presigned PUT URL** ngắn hạn, không đẩy file qua máy chủ .NET Server để tiết kiệm băng thông và tài nguyên RAM backend.