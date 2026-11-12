// panelforge-hub/web/src/services/dataService.ts
import { marked } from 'marked';
import type { HubState, FeatureAuditItem, DocFileItem } from '../types/hub';

// Danh sách các tài liệu trong docs/ để đọc trực tiếp trên web tĩnh
export const SYSTEM_DOCS_LIST: DocFileItem[] = [
  {
    id: 'spec-v2-6',
    title: 'Master Specification V2.6 Final',
    category: 'spec',
    path: 'docs/spec/PANELFORGE_MASTER_SPECIFICATION_V2_6.md',
    description: 'Bản đặc tả nghiệp vụ tối cao duy nhất của hệ thống PanelForge.',
  },
  {
    id: 'feature-audit-diff',
    title: 'Bản Audit Chức Năng (So với bản cũ)',
    category: 'tracking',
    path: 'docs/tracking/FEATURE_AUDIT_DIFF.md',
    description: 'Đối chiếu chi tiết từng chức năng giữa V2.0/V2.5 và V2.6.',
  },
  {
    id: 'audit-logs',
    title: 'Nhật Ký Audit & Commit Timeline',
    category: 'tracking',
    path: 'docs/tracking/AUDIT_LOGS.md',
    description: 'Tổng hợp mọi commit và thay đổi từ các lập trình viên & AI Agent.',
  },
  {
    id: 'script-spec',
    title: 'Đặc Tả Kịch Bản & Khung Tranh (Script Spec)',
    category: 'spec',
    path: 'docs/spec/CHAPTER_AND_SCRIPT_SPECIFICATION.md',
    description: 'Quy chuẩn Story Arc, Scene, ScriptLine, bóng thoại và khung tranh.',
  },
  {
    id: 'core-production',
    title: 'Kiến Trúc Quy Trình Sản Xuất (Production Arch)',
    category: 'spec',
    path: 'docs/spec/CORE_PRODUCTION_ARCHITECTURE.md',
    description: 'Phối hợp giữa Canvas Editor, AI Assistant và Pipeline sản xuất.',
  },
  {
    id: 'design-rules',
    title: 'Quy Chuẩn Thiết Kế Giao Diện (Design Rules)',
    category: 'spec',
    path: 'docs/spec/DESIGN_RULES.md',
    description: 'Nguyên tắc UI/UX, tokens, màu sắc, typography cho Studio.',
  },
  {
    id: 'ubiquitous-lang',
    title: 'Từ Điển Thuật Ngữ (Ubiquitous Language)',
    category: 'standards',
    path: 'docs/standards/PanelForge_Ubiquitous_Language_and_State_Glossary.md',
    description: 'Thuật ngữ đồng bộ giữa BE, FE, Mobile và Báo cáo Capstone.',
  },
  {
    id: 'state-machines',
    title: 'Chuẩn 5 Máy Trạng Thái (State Machine Standards)',
    category: 'standards',
    path: 'docs/standards/PanelForge_State_Machine_Naming_Standards.md',
    description: 'Định nghĩa trạng thái & chuyển đổi của 5 State Machines cốt lõi.',
  },
  {
    id: 'business-rules',
    title: 'Bộ Quy Tắc Nghiệp Vụ (Business Rules BR-xx)',
    category: 'standards',
    path: 'docs/standards/glossary-and-rules.md',
    description: 'Danh mục Business Rules chi tiết từ BR-01 đến BR-80.',
  },
  {
    id: 'clean-arch',
    title: 'Kiến Trúc Backend Clean Architecture (.NET 9)',
    category: 'architecture',
    path: 'docs/architecture/clean-architecture-structure.md',
    description: 'Phân tầng Domain, Application, Infrastructure, CQRS/MediatR.',
  },
  {
    id: 'storage-arch',
    title: 'Kiến Trúc Lưu Trữ & Cloudflare R2 (Storage Arch)',
    category: 'architecture',
    path: 'docs/architecture/storage-architecture.md',
    description: 'Quản lý Content-Addressed Storage CAS SHA-256 và Manifest.',
  },
  {
    id: 'implement-plan',
    title: 'Kế Hoạch Triển Khai Tổng Thể V2.6',
    category: 'note',
    path: 'docs/note/PANELFORGE_V2_6_IMPLEMENTATION_PLAN.md',
    description: 'Đối chiếu tiến độ code, quyết định đã chốt và changelog.',
  },
  {
    id: 'team-workboard',
    title: 'Bảng Theo Dõi Phân Công Nhóm (Team Workboard)',
    category: 'tracking',
    path: 'docs/tracking/TEAM_WORKBOARD.md',
    description: 'Phân bổ công việc giữa các thành viên trong nhóm dự án.',
  },
];

// Danh mục Audit tính năng so sánh chi tiết
export const STATIC_FEATURE_AUDIT: FeatureAuditItem[] = [
  {
    id: 'aud-01',
    code: 'AUD-01',
    featureName: 'Series Bible & Canon Management',
    module: 'BIB (Series Bible)',
    oldVersion: 'V2.0: Single-tier, chỉ Producer viết và tự duyệt. V2.5: Thảo luận tự do nhưng quyền hạn chưa phân định rõ.',
    newVersionV26: 'Quy trình 3 bên chặt chẽ: Writer tạo Draft -> Artist nộp Concept Art CAS SHA-256 -> Writer & Editor cùng Endorse -> Producer CanonLock. Hỗ trợ Multi-Era Timeskip Gate.',
    rationale: 'Bảo đảm tính nhất quán ngoại hình nhân vật trước khi vẽ bất kỳ chương truyện nào. Loại bỏ hoàn toàn lỗi vẽ sai thiết kế.',
    status: 'Done',
    commits: [
      { repo: 'BE', hash: 'c310e7c', url: 'https://github.com/DontPassAway/PanelForge_FA26SE251/commit/c310e7c' },
      { repo: 'FE', hash: '9d28f72', url: 'https://github.com/tkiennt/panelforge-fe/commit/9d28f72' },
      { repo: 'MOBILE', hash: 'be7b1db', url: 'https://github.com/tranbaoming/panelforge-mobile/commit/be7b1db' },
    ],
  },
  {
    id: 'aud-02',
    code: 'AUD-02',
    featureName: 'Independent Script Authoring & Script Freeze Gate',
    module: 'SCR (Narrative Script)',
    oldVersion: 'V2.0: Ép Writer phải chia khung tranh (Forced panel scripting). V2.5: Script độc lập nhưng chưa có cổng khóa cứng.',
    newVersionV26: 'Writer tự do sáng tác theo Story Arc -> Scene -> ScriptLine. Producer duyệt sẽ khóa cứng IsScriptFrozen = true; chỉ khi đó mới mở Kanban giao việc vẽ.',
    rationale: 'Phân tách đúng vai trò: Biên kịch tập trung cốt truyện, Họa sĩ phân cảnh quyết định nhịp tranh. Tránh sửa kịch bản giữa chừng làm vẽ lại hàng loạt.',
    status: 'Done',
    commits: [
      { repo: 'BE', hash: 'ccfe936', url: 'https://github.com/DontPassAway/PanelForge_FA26SE251/commit/ccfe936' },
      { repo: 'FE', hash: '72742be', url: 'https://github.com/tkiennt/panelforge-fe/commit/72742be' },
    ],
  },
  {
    id: 'aud-03',
    code: 'AUD-03',
    featureName: '100% ScriptLine Coverage Guard & Wireframe Guide Export',
    module: 'ART (Artwork & Layout)',
    oldVersion: 'V2.0: Không kiểm soát thoại, dễ sót lời thoại khi Lettering. V2.5: Cảnh báo mềm không chặn cứng.',
    newVersionV26: 'Bắt buộc gắn đủ 100% dòng thoại vào khung tranh mới cho phép chuyển stage. Tự động xuất ảnh khung 1200x1800 để vẽ trên Clip Studio Paint / Photoshop.',
    rationale: 'Triệt tiêu 100% rủi ro sót thoại hoặc bóng thoại che mất điểm nhấn nhân vật khi xuất bản in/webtoon.',
    status: 'Done',
    commits: [
      { repo: 'BE', hash: 'ccfe936', url: 'https://github.com/DontPassAway/PanelForge_FA26SE251/commit/ccfe936' },
      { repo: 'FE', hash: '4f568ad', url: 'https://github.com/tkiennt/panelforge-fe/commit/4f568ad' },
    ],
  },
  {
    id: 'aud-04',
    code: 'AUD-04',
    featureName: 'Content-Addressed Storage (CAS SHA-256) & Manifest Provenance',
    module: 'INFRA (Storage & Assets)',
    oldVersion: 'V2.0: Lưu file theo tên ngẫu nhiên (uuid.png), không chống trùng. V2.5: Chưa có manifest toàn chương.',
    newVersionV26: 'Mọi layer, asset được tính SHA-256 tại client trước khi tải lên Cloudflare R2. Lưu JSON manifest chứa hash toàn bộ layer, đảm bảo truy xuất bất biến.',
    rationale: 'Loại bỏ trùng lặp dữ liệu (Deduplication), tiết kiệm 60% dung lượng Cloudflare R2 và bảo vệ quyền tác giả.',
    status: 'Done',
    commits: [
      { repo: 'BE', hash: 'c93452f', url: 'https://github.com/DontPassAway/PanelForge_FA26SE251/commit/c93452f' },
      { repo: 'FE', hash: '71d45ea', url: 'https://github.com/tkiennt/panelforge-fe/commit/71d45ea' },
    ],
  },
  {
    id: 'aud-05',
    code: 'AUD-05',
    featureName: 'Granular Panel/Layer Lock & Parallel Artwork Collaboration',
    module: 'ASG (Assignments)',
    oldVersion: 'V2.0: Nộp duyệt cả trang tranh (Full page submission), khi sửa phải sửa toàn bộ.',
    newVersionV26: 'Khóa layer độc lập: Artist A vẽ background, Artist B vẽ nhân vật, Letterer xếp chữ cùng làm trên 1 trang canvas; nộp duyệt từng panel/layer.',
    rationale: 'Song song hóa quy trình sản xuất truyện tranh công nghiệp, tăng năng suất gấp 3 lần so với làm tuần tự.',
    status: 'Done',
    commits: [
      { repo: 'BE', hash: '472b36e', url: 'https://github.com/DontPassAway/PanelForge_FA26SE251/commit/472b36e' },
      { repo: 'FE', hash: '3b418cd', url: 'https://github.com/tkiennt/panelforge-fe/commit/3b418cd' },
    ],
  },
  {
    id: 'aud-06',
    code: 'AUD-06',
    featureName: 'Dual-Mode Review: Studio Pinpoint & Mobile Offline Token',
    module: 'REV (Review & Gates)',
    oldVersion: 'V2.0: Đánh giá bằng text chung chung. V2.5: Có ghim tọa độ web nhưng chưa hỗ trợ mobile offline.',
    newVersionV26: 'Web Studio: Ghim tọa độ (x, y) kèm Visual Diff so sánh phiên bản cũ. Mobile: Tải gói review token về máy, chấm feedback/vẽ ghi chú ngoại tuyến và tự sync khi có mạng.',
    rationale: 'Cho phép khách hàng và biên tập viên kiểm duyệt chương truyện mọi lúc mọi nơi ngay trên thiết bị di động.',
    status: 'Done',
    commits: [
      { repo: 'BE', hash: '916eda2', url: 'https://github.com/DontPassAway/PanelForge_FA26SE251/commit/916eda2' },
      { repo: 'FE', hash: '6580b3b', url: 'https://github.com/tkiennt/panelforge-fe/commit/6580b3b' },
      { repo: 'MOBILE', hash: '91dc1c7', url: 'https://github.com/tranbaoming/panelforge-mobile/commit/91dc1c7' },
    ],
  },
  {
    id: 'aud-07',
    code: 'AUD-07',
    featureName: 'Publisher VNĐ Pricing & Dual Language Edition',
    module: 'REL (Release & Monetization)',
    oldVersion: 'V2.0: Dùng USD hoặc Coin ảo. V2.5: Chưa có quy chuẩn giá bán cho nhà xuất bản Việt Nam.',
    newVersionV26: 'Nhà xuất bản (Publisher) trực tiếp định giá chương bằng Việt Nam Đồng (VNĐ, tối thiểu 1.000 VNĐ). Hỗ trợ phát hành song ngữ Việt - Anh độc lập trên cùng ấn bản.',
    rationale: 'Đáp ứng 100% chuẩn pháp lý và thanh toán số tại thị trường xuất bản truyện tranh Việt Nam.',
    status: 'Done',
    commits: [
      { repo: 'BE', hash: '36482cd', url: 'https://github.com/DontPassAway/PanelForge_FA26SE251/commit/36482cd' },
      { repo: 'FE', hash: 'e51a2bc', url: 'https://github.com/tkiennt/panelforge-fe/commit/e51a2bc' },
      { repo: 'MOBILE', hash: 'b45801e', url: 'https://github.com/tranbaoming/panelforge-mobile/commit/b45801e' },
    ],
  },
  {
    id: 'aud-08',
    code: 'AUD-08',
    featureName: 'Single Source of Truth Central Hub (panelforge-hub)',
    module: 'DOCS & AGENTS',
    oldVersion: 'Tài liệu nằm rải rác ở Github/note, panelforge-fe/docs, PanelForge_FA26SE251/docs, liên tục bị lệch pha.',
    newVersionV26: 'Mọi tài liệu, specs, state machines, business rules được quản lý tập trung 100% tại panelforge-hub/docs/. Website tĩnh đọc trực tiếp Markdown không qua Firebase.',
    rationale: 'Xóa bỏ hoàn toàn tình trạng lệch pha tài liệu giữa Frontend, Backend và Mobile. AI Agent luôn tuân thủ đúng chuẩn.',
    status: 'Done',
    commits: [
      { repo: 'HUB', hash: 'f8eb79e', url: 'https://github.com/tkiennt/panelforge-hubs/commit/f8eb79e' },
    ],
  },
];

// Hàm fetch hub-state.json tĩnh
export async function fetchHubState(): Promise<HubState> {
  const baseUrl = import.meta.env.BASE_URL || './';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  try {
    const res = await fetch(`${cleanBase}data/hub-state.json?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    console.warn('[dataService] Không fetch được hub-state.json chính, thử đường dẫn dự phòng:', e);
  }

  // Dự phòng đường dẫn tương đối
  const fallback = await fetch(`./data/hub-state.json?t=${Date.now()}`);
  return fallback.json();
}

// Hàm đọc và render nội dung file Markdown tĩnh từ public/docs/
export async function fetchMarkdownDoc(relativePath: string): Promise<string> {
  const baseUrl = import.meta.env.BASE_URL || './';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  // Chuẩn hóa đường dẫn: nếu bắt đầu bằng "docs/", chuyển thành "docs/..."
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;

  const url = `${cleanBase}${cleanPath}?t=${Date.now()}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: Không tìm thấy file tài liệu tại ${url}`);
    }
    const text = await res.text();
    return text;
  } catch (err) {
    console.error(`[dataService] Lỗi khi nạp file ${relativePath}:`, err);
    return `# ⚠️ Không thể tải tài liệu\n\nKhông tìm thấy file: \`${relativePath}\`\nVui lòng chạy \`node scripts/sync-hub.mjs\` để đồng bộ tài liệu vào thư mục web public.`;
  }
}

// Parse markdown sang HTML an toàn bằng marked
export function renderMarkdownToHtml(markdown: string): string {
  try {
    return marked.parse(markdown, {
      gfm: true,
      breaks: true,
    }) as string;
  } catch (e) {
    return `<pre>${markdown}</pre>`;
  }
}

// Lưu các thiết lập của người dùng vào localStorage
export function saveLocalCustomState(key: string, value: any): void {
  try {
    localStorage.setItem(`pf_${key}`, JSON.stringify(value));
  } catch (e) {
    console.warn('[dataService] Không thể lưu vào localStorage:', e);
  }
}

export function loadLocalCustomState<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(`pf_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}
