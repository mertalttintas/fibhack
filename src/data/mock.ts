// ---- Tipler ----------------------------------------------------------------

export type Department = "CRM" | "Veri Platformları" | "Legal" | "Pazarlama";

export type TaskStatus = "waiting" | "processing" | "assigned" | "done";

export type CampaignStatus = "pending" | "processing" | "completed" | "error";

export interface TraceEvent {
  id: string;
  label: string;
  detail: string;
  status: "running" | "done" | "error";
  timestamp: string;
  algorithm?: string;
  why?: string;
  inputs?: string[];
  outputs?: string[];
  score?: number;
}

export interface CampaignJob {
  id: string;
  title: string;
  idea: string;
  createdAt: string;
  status: CampaignStatus;
  provider?: string;
  model?: string;
  summary?: string;
  score?: number; // 0-100 kampanya başarı skoru
  trace: TraceEvent[];
  brief: CampaignBrief;
  suggestions: string[];
  routing: RouteItem[];
}

export interface DeptDetail {
  kpis: { label: string; value: string }[];
  subtasks: { name: string; owner: string; eta: string; status: "planlandı" | "sürüyor" | "hazır" }[];
  timeline: string;
  dataSources: string[];
  risk: string;
}

export interface DeptDraft {
  headline: string;
  items: { title: string; content: string }[];
  note: string;
  source: "ai" | "template";
  provider?: string;
  model?: string;
  generatedAt: string;
}

export interface DeptTask {
  id: string;
  department: Department;
  title: string;
  summary: string;
  status: TaskStatus;
  assignedAt: string;
  priority: "Yüksek" | "Orta" | "Düşük";
  rationale: string; // AI karar gerekçesi
  warning?: string;
  details?: DeptDetail;
  draft?: DeptDraft; // "AI İşliyor" aşamasının çıktısı: ön çalışma paketi
  teams?: { sentAt: string; delivered: boolean; channel: string }; // Teams botu gönderim kaydı
  ai?: {
    provider: string;
    model: string;
    analyzedAt: string;
    memoryRefs: string[];
  };
}

export interface DeptCard {
  department: Department;
  title: string;
  items: string[];
  metric?: { label: string; value: number; suffix: string };
  warning?: string | null;
  rationale: string;
  details: DeptDetail;
}

export interface AnalyzeResult {
  summary: string;
  memory: { title: string; text: string; refs: string[] };
  cards: DeptCard[];
  live: boolean; // true = gerçek Claude analizi, false = simülasyon
  provider?: string;
  model?: string;
  analyzedAt?: string;
}

// ---- Ön analiz / brief onay akışı ------------------------------------------

export interface CampaignBrief {
  title: string;
  objective: string;
  segment: string;
  channels: string;
  timing: string;
  kpi: string;
}

export interface RouteItem {
  department: Department;
  reason: string;
  priority: "Yüksek" | "Orta" | "Düşük";
}

export interface RefineResult {
  aiComment: string;
  brief: CampaignBrief;
  suggestions: string[];
  routing: RouteItem[];
  live: boolean;
  provider?: string;
  model?: string;
}

export function localRefine(idea: string, feedback?: string): RefineResult {
  const shortIdea = idea.length > 60 ? idea.slice(0, 60) + "…" : idea;
  return {
    aiComment: feedback
      ? `Değişiklik isteğinizi ("${feedback}") brief'e işledim. Hedefleme ve kanal planını buna göre güncelledim; dağıtım planı aynı kaldı. Onaylarsanız departmanlara gönderiyorum.`
      : `Fikrinizi genç segmente yönelik bir kazanım kampanyası olarak yorumladım. Eylül 2025 "Kira Öde Puan Kazan" kampanyasının %7,1 dönüşüm verisine dayanarak hedef segmenti ve kanal planını ona göre kurguladım. Eksik bıraktığınız zamanlama ve başarı ölçütünü geçmiş veriden makul varsayımlarla doldurdum — aşağıdan kontrol edip isterseniz değişiklik isteyebilirsiniz.`,
    brief: {
      title: "Kampanya Brief'i — " + shortIdea,
      objective: idea,
      segment: "18-30 yaş, aktif mobil bankacılık kullanıcısı (~124.500 kişi), kira ödeyen alt segment öncelikli",
      channels: "Push bildirimi (ana, A/B testli) + in-app story (destek)",
      timing: "T+7 gün lansman · üniversite kayıt dönemi öncesi",
      kpi: "Push açılma ≥ %40 · dönüşüm ≥ %7 · ilk 30 günde 8.500 yeni ürün",
    },
    suggestions: [
      "Kampüs anlaşmalı üniversitelerle ortak duyuru eklenebilir",
      "İlk 3 ay ücretsiz ek paket, dönüşümü geçmişte %12 artırdı",
      "Lansmanı talep sinyalindeki artış haftasına denk getirin",
    ],
    routing: [
      { department: "CRM", reason: "Hedef segment listesi ve churn önceliklendirmesi bu ekipte — geçmiş filtre seti yeniden kullanılacak.", priority: "Yüksek" },
      { department: "Legal", reason: "Puan/faiz iletişimi BDDK duyuru şartına takılabilir; Ocak 2025'teki 6 günlük gecikme yaşanmasın diye erken başlatılmalı.", priority: "Yüksek" },
      { department: "Pazarlama", reason: "Push + in-app story üretimi ve A/B varyantları — Mart 2025 %42 açılma benchmark'ı hedefleniyor.", priority: "Orta" },
      { department: "Veri Platformları", reason: "Gerçek zamanlı funnel dashboard'u ve günlük performans raporu kurulumu.", priority: "Orta" },
    ],
    live: false,
  };
}

// ---- Kampanya başarı skoru --------------------------------------------------
// Brief'in netliği + geçmiş kampanya verisiyle örtüşme üzerinden deterministik
// bir ön skor üretir. AI çıktısına bağımlı değildir; demo'da çevrimdışı çalışır.

export interface CampaignScore {
  total: number;
  label: string;
  parts: { key: string; label: string; score: number; hint: string }[];
}

export function scoreCampaign(brief: CampaignBrief): CampaignScore {
  const all = `${brief.objective} ${brief.segment} ${brief.channels} ${brief.timing} ${brief.kpi}`.toLocaleLowerCase("tr-TR");
  const hasNumber = (value: string) => /\d/.test(value);

  const clarity = Math.min(100,
    (brief.objective.length > 20 ? 30 : 15) +
    (hasNumber(brief.kpi) ? 40 : 15) +
    (/t\+|hafta|gün|ay|q[1-4]|\d/.test(brief.timing.toLocaleLowerCase("tr-TR")) ? 30 : 10));

  const channelText = brief.channels.toLocaleLowerCase("tr-TR");
  let channelFit = 45;
  if (channelText.includes("push")) channelFit += 25;
  if (channelText.includes("in-app") || channelText.includes("story")) channelFit += 20;
  if (channelText.includes("banner")) channelFit += 10;
  if (channelText.includes("e-posta")) channelFit -= 10;
  channelFit = Math.max(20, Math.min(100, channelFit));

  const segmentText = brief.segment.toLocaleLowerCase("tr-TR");
  const segmentFocus = Math.max(25, Math.min(100,
    (/\d{2}\s*-\s*\d{2}|\d{2}\+/.test(segmentText) ? 40 : 15) +
    (hasNumber(segmentText) ? 25 : 10) +
    (/mobil|aktif|kira|öğrenci|kobi|emekli|alarm/.test(segmentText) ? 35 : 15)));

  const memoryTags = ["kira", "puan", "öğrenci", "genç", "kredi", "kart", "mevduat", "faiz", "kobi", "pos", "emekli", "döviz", "konut"];
  const memoryMatch = Math.min(100, 30 + memoryTags.filter((tag) => all.includes(tag)).length * 14);

  let compliance = 88;
  if (/faiz|puan|getiri/.test(all)) compliance -= 15;
  if (/kredi/.test(all)) compliance -= 8;
  compliance = Math.max(45, compliance);

  const parts = [
    { key: "clarity", label: "Brief netliği", score: clarity, hint: "Ölçülebilir KPI ve net zamanlama", weight: 0.25 },
    { key: "channel", label: "Kanal geçmişi", score: channelFit, hint: "Seçilen kanalların geçmiş performansı", weight: 0.25 },
    { key: "segment", label: "Segment odağı", score: segmentFocus, hint: "Hedef kitle tanımının keskinliği", weight: 0.2 },
    { key: "memory", label: "Hafıza eşleşmesi", score: memoryMatch, hint: "Benzer geçmiş kampanya verisi mevcudiyeti", weight: 0.15 },
    { key: "compliance", label: "Uyum kolaylığı", score: compliance, hint: "BDDK/KVKK onay yükü düşükse yüksek", weight: 0.15 },
  ];
  const total = Math.round(parts.reduce((sum, part) => sum + part.score * part.weight, 0));
  const label = total >= 75 ? "Güçlü aday" : total >= 55 ? "Umut verici" : "Revize önerilir";
  return { total, label, parts: parts.map(({ weight: _weight, ...part }) => part) };
}

export interface PastCampaign {
  id: string;
  name: string;
  date: string;
  channel: string;
  openRate: number;
  conversion: number;
  result: "Başarılı" | "Kısmi" | "Düşük";
  insight: string;
}

export interface TrendSignal {
  id: string;
  title: string;
  change: number; // yüzde
  source: string;
  spark: number[];
  action: string;
  tone: "teal" | "green" | "amber" | "coral";
}

// ---- Canlı metrik şeridi ---------------------------------------------------

export const liveMetrics = [
  { label: "Bugün işlenen kampanya", value: 12 },
  { label: "Ortalama karar süresi", value: 40, suffix: " sn" },
  { label: "Aktif görev", value: 27 },
];

// ---- Organizational memory: geçmiş kampanyalar -----------------------------

export const pastCampaigns: PastCampaign[] = [
  {
    id: "pc1",
    name: "Genç Segment Kredi Kartı",
    date: "Mart 2025",
    channel: "Push",
    openRate: 42,
    conversion: 8.4,
    result: "Başarılı",
    insight: "Push kanalı SMS'in iki katı açılma oranı üretti (%42 vs %19).",
  },
  {
    id: "pc2",
    name: "Mevduat Faiz Kampanyası",
    date: "Kasım 2024",
    channel: "Mobil Banner",
    openRate: 31,
    conversion: 5.2,
    result: "Başarılı",
    insight: "Mobil ana ekran banner'ı e-postadan %3.4 kat daha yüksek CTR sağladı.",
  },
  {
    id: "pc3",
    name: "KOBİ İşletme Kredisi",
    date: "Ocak 2025",
    channel: "E-posta + Şube",
    openRate: 17,
    conversion: 3.1,
    result: "Kısmi",
    insight: "Legal onay süreci 6 iş günü sürdü; lansman 1 hafta gecikti.",
  },
  {
    id: "pc4",
    name: "Kira Öde Puan Kazan",
    date: "Eylül 2025",
    channel: "Push + In-app",
    openRate: 38,
    conversion: 7.1,
    result: "Başarılı",
    insight: "18-30 segmentinde in-app story formatı dönüşümü %28 artırdı.",
  },
  {
    id: "pc5",
    name: "Emekli Bankacılığı Promosyonu",
    date: "Haziran 2025",
    channel: "SMS + Çağrı Merkezi",
    openRate: 24,
    conversion: 4.6,
    result: "Kısmi",
    insight: "55+ segmentte SMS hâlâ en güvenilir kanal; push opt-in oranı düşük.",
  },
];

export const memoryBanner = {
  title: "Organizational Memory Önerisi",
  text: "Mart 2025 'Genç Segment Kredi Kartı' kampanyasında Push kanalı %42 açılma oranıyla SMS'in iki katı performans gösterdi. Ocak 2025 KOBİ kampanyasında Legal onayı 6 iş günü sürdüğü için bu kez Legal görevi en yüksek öncelikle, diğer görevlerle paralel başlatıldı.",
  refs: ["Mart 2025 · Push %42", "Ocak 2025 · Legal 6 gün", "Eylül 2025 · In-app +%28"],
};

// ---- Fikir girişi örnek senaryoları ----------------------------------------

export const exampleIdeas = [
  "Üniversite öğrencilerine özel, kira ödemelerinde puan kazandıran bir kredi kartı kampanyası başlatalım",
  "KOBİ'lere e-ticaret entegrasyonlu POS + işletme kredisi paketi sunalım",
  "Döviz kuru alarmı kuran müşterilere vadeli döviz mevduatı önerelim",
  "Yeni evlenen çiftlere konut kredisi + eşya kredisi birleşik paketi",
];

// ---- AI analiz çıktısı: departman kartları ---------------------------------

export function generateDeptCards(idea: string): DeptCard[] {
  return [
    {
      department: "CRM",
      title: "Hedef Segment Çıkarımı",
      items: [
        "18-30 yaş, aktif mobil bankacılık kullanan 124.500 müşteri filtrelendi",
        "Son 6 ayda kira ödemesi yapan alt segment: 38.200 kişi",
        "Churn riski yüksek 4.100 müşteri kampanya önceliğine alındı",
      ],
      metric: { label: "Hedef müşteri", value: 124500, suffix: "" },
      warning: null,
      rationale:
        "Eylül 2025 'Kira Öde Puan Kazan' kampanyasında bu segment tanımı %7.1 dönüşüm üretti; aynı filtre seti sıcak baz olarak yeniden kullanıldı.",
      details: {
        kpis: [
          { label: "Hedef baz", value: "124.500 müşteri" },
          { label: "Sıcak alt segment", value: "38.200 kira ödeyen" },
          { label: "Beklenen dönüşüm", value: "%7,1 (geçmiş benchmark)" },
          { label: "Churn öncelikli grup", value: "4.100 müşteri" },
        ],
        subtasks: [
          { name: "Segment filtre setinin çalıştırılması", owner: "CRM Analitik Ekibi", eta: "T+1 gün", status: "sürüyor" },
          { name: "Churn skoru ile önceliklendirme", owner: "CRM Analitik Ekibi", eta: "T+2 gün", status: "planlandı" },
          { name: "KVKK izinli iletişim listesinin doğrulanması", owner: "CRM Operasyon", eta: "T+2 gün", status: "planlandı" },
          { name: "Hedef listenin kampanya motoruna yüklenmesi", owner: "CRM Operasyon", eta: "T+3 gün", status: "planlandı" },
        ],
        timeline: "T+0 filtre · T+2 doğrulama · T+3 kampanya motoru yüklemesi",
        dataSources: ["Mobil bankacılık davranış verisi", "Kira ödeme işlem geçmişi", "Churn tahmin modeli v3", "İzinli iletişim veritabanı"],
        risk: "İzinli iletişim oranı genç segmentte %78 — liste daralması payı planlamaya dahil edildi.",
      },
    },
    {
      department: "Veri Platformları",
      title: "İzleme & Ölçüm Altyapısı",
      items: [
        "Gerçek zamanlı kampanya funnel dashboard'u kurulumu",
        "Push açılma → başvuru → onay dönüşüm hattı event şeması",
        "Günlük otomatik performans raporu (09:00, kampanya ekibine)",
      ],
      metric: { label: "Kurulum süresi", value: 2, suffix: " gün" },
      warning: null,
      rationale:
        "Önceki 4 kampanyada funnel görünürlüğü ilk 48 saatte kanal değişikliği kararlarını hızlandırdı; standart event şeması hazır şablondan türetildi.",
      details: {
        kpis: [
          { label: "Dashboard yayına alma", value: "T+2 gün" },
          { label: "Event gecikmesi", value: "< 5 dk (gerçek zamanlı)" },
          { label: "Funnel adım sayısı", value: "5 (gösterim→onay)" },
          { label: "Otomatik rapor", value: "Günlük 09:00" },
        ],
        subtasks: [
          { name: "Event şemasının şablondan türetilmesi", owner: "Veri Mühendisliği", eta: "T+1 gün", status: "sürüyor" },
          { name: "Funnel dashboard kurulumu", owner: "BI Ekibi", eta: "T+2 gün", status: "planlandı" },
          { name: "A/B test ölçüm altyapısının bağlanması", owner: "Veri Mühendisliği", eta: "T+2 gün", status: "planlandı" },
          { name: "Otomatik rapor zamanlayıcısı", owner: "BI Ekibi", eta: "T+3 gün", status: "planlandı" },
        ],
        timeline: "T+0 şema · T+2 dashboard · T+3 otomasyon",
        dataSources: ["Push bildirim event akışı", "Başvuru API logları", "Kredi onay sistemi", "A/B test platformu"],
        risk: "Başvuru API'sinde event kaybı geçmişte %0,3 ölçüldü — mutabakat job'u eklendi.",
      },
    },
    {
      department: "Legal",
      title: "Uyum & Mevzuat Kontrolü",
      items: [
        "Kampanya koşullarının BDDK duyuru gerekliliği kontrolü",
        "KVKK: puan programı için açık rıza metni güncellemesi",
        "Kampanya taahhüt metninin reklam kurulu kriterlerine uyumu",
      ],
      warning:
        "Faiz/puan oranı iletişimi BDDK duyuru şartına takılabilir — onay süreci erken başlatıldı.",
      metric: { label: "Hedef onay süresi", value: 3, suffix: " gün" },
      rationale:
        "Ocak 2025 KOBİ kampanyasında Legal onayı 6 iş günü sürüp lansmanı geciktirdi; bu kez görev en yüksek öncelikle ve diğer iş akışlarıyla paralel açıldı.",
      details: {
        kpis: [
          { label: "Hedef onay süresi", value: "3 iş günü (önceki: 6)" },
          { label: "Kontrol kalemi", value: "12 madde" },
          { label: "Rıza metni güncellemesi", value: "1 revizyon" },
        ],
        subtasks: [
          { name: "BDDK duyuru gerekliliği ön incelemesi", owner: "Uyum Ofisi", eta: "T+1 gün", status: "sürüyor" },
          { name: "KVKK açık rıza metni revizyonu", owner: "Hukuk Müşavirliği", eta: "T+2 gün", status: "planlandı" },
          { name: "Reklam kurulu kriter kontrol listesi", owner: "Uyum Ofisi", eta: "T+2 gün", status: "planlandı" },
          { name: "Nihai onay ve imza turu", owner: "Hukuk Müşavirliği", eta: "T+3 gün", status: "planlandı" },
        ],
        timeline: "T+0 ön inceleme · T+2 revizyonlar · T+3 nihai onay",
        dataSources: ["BDDK mevzuat takip sistemi", "KVKK rıza yönetim platformu", "Önceki kampanya onay arşivi"],
        risk: "Puan oranı iletişimi 'faiz benzeri getiri' sayılırsa BDDK duyurusu zorunlu — alternatif metin hazır tutuluyor.",
      },
    },
    {
      department: "Pazarlama",
      title: "Kanal & İçerik Stratejisi",
      items: [
        "Ana kanal: Push bildirimi (2 varyantlı A/B testi)",
        "Destek kanal: In-app story formatı, 18-30 segmentine özel",
        "Görsel dil: kampüs/genç yaşam teması, deneme marka kiti",
      ],
      metric: { label: "Beklenen açılma", value: 42, suffix: "%" },
      warning: null,
      rationale:
        "Push kanalı seçildi çünkü Mart 2025 kampanyasında %42 açılma oranıyla SMS'in iki katı performans gösterdi; in-app story eklendi çünkü Eylül 2025'te dönüşümü %28 artırdı.",
      details: {
        kpis: [
          { label: "Beklenen push açılma", value: "%42 (Mart 2025 benchmark)" },
          { label: "In-app story katkısı", value: "+%28 dönüşüm" },
          { label: "A/B varyant sayısı", value: "2 metin + 2 görsel" },
          { label: "Lansman hedefi", value: "T+7 gün" },
        ],
        subtasks: [
          { name: "Push metni A/B varyantlarının yazılması", owner: "İçerik Ekibi", eta: "T+2 gün", status: "sürüyor" },
          { name: "Kampüs temalı story setinin tasarımı", owner: "Kreatif Stüdyo", eta: "T+4 gün", status: "planlandı" },
          { name: "Kanal takvimi ve frekans planı", owner: "Kampanya Yönetimi", eta: "T+3 gün", status: "planlandı" },
          { name: "Lansman sonrası 48 saat optimizasyon nöbeti", owner: "Kampanya Yönetimi", eta: "T+7 gün", status: "planlandı" },
        ],
        timeline: "T+0 brief · T+4 kreatif teslim · T+7 lansman · T+9 optimizasyon",
        dataSources: ["Mart 2025 kampanya sonuç raporu", "In-app etkileşim analitiği", "Marka kiti v4", "Talep sinyali paneli"],
        risk: "Genç segmentte push yorgunluğu izleniyor — haftalık frekans limiti 2 bildirimle sınırlandı.",
      },
    },
  ];
}

export const analysisSteps = [
  "Geçmiş 14 kampanya sonucu taranıyor…",
  "Müşteri segmentleri ve davranış verileri eşleştiriliyor…",
  "Mevsimsellik ve piyasa trendleri analiz ediliyor…",
  "Departman görevleri ve öncelikler oluşturuluyor…",
];

// ---- Kanban görevleri ------------------------------------------------------

export const initialTasks: DeptTask[] = [
  {
    id: "t1",
    department: "Pazarlama",
    title: "Push A/B varyantları hazırlanacak",
    summary: "Genç segment kredi kartı kampanyası için 2 push metni varyantı.",
    status: "waiting",
    assignedAt: "Bugün 09:42",
    priority: "Yüksek",
    rationale:
      "Push kanalı seçildi çünkü Mart 2025 kampanyasında %42 açılma oranıyla SMS'in iki katı performans gösterdi. A/B testi öneriliyor çünkü geçmiş 3 kampanyada varyant testi ortalama %11 açılma artışı sağladı.",
    details: {
      kpis: [
        { label: "Beklenen açılma", value: "%42" },
        { label: "A/B artış hedefi", value: "+%11" },
        { label: "Varyant sayısı", value: "2 metin" },
      ],
      subtasks: [
        { name: "Varyant A: fayda odaklı metin", owner: "İçerik Ekibi", eta: "T+1 gün", status: "planlandı" },
        { name: "Varyant B: aciliyet odaklı metin", owner: "İçerik Ekibi", eta: "T+1 gün", status: "planlandı" },
        { name: "%10 test grubunda ön gönderim", owner: "Kampanya Yönetimi", eta: "T+2 gün", status: "planlandı" },
      ],
      timeline: "T+0 brief · T+1 metinler · T+2 test gönderimi",
      dataSources: ["Mart 2025 kampanya raporu", "Push etkileşim analitiği"],
      risk: "Genç segmentte push yorgunluğu — haftalık frekans limiti 2.",
    },
  },
  {
    id: "t2",
    department: "CRM",
    title: "Hedef segment listesi çıkarılacak",
    summary: "18-30 yaş, son 6 ayda kira ödemesi yapan aktif mobil kullanıcılar.",
    status: "waiting",
    assignedAt: "Bugün 09:41",
    priority: "Yüksek",
    rationale:
      "Bu segment tanımı seçildi çünkü Eylül 2025 'Kira Öde Puan Kazan' kampanyasında aynı filtre %7.1 dönüşüm üretti — banka ortalamasının 1.6 katı. Churn riski yüksek müşteriler önceliklendirildi çünkü elde tutma maliyeti yeni kazanımın 1/5'i.",
    details: {
      kpis: [
        { label: "Hedef baz", value: "124.500 müşteri" },
        { label: "Beklenen dönüşüm", value: "%7,1" },
        { label: "Churn öncelikli", value: "4.100 müşteri" },
      ],
      subtasks: [
        { name: "Filtre setinin çalıştırılması", owner: "CRM Analitik Ekibi", eta: "T+1 gün", status: "sürüyor" },
        { name: "Churn skoruyla önceliklendirme", owner: "CRM Analitik Ekibi", eta: "T+2 gün", status: "planlandı" },
        { name: "İzinli iletişim doğrulaması", owner: "CRM Operasyon", eta: "T+2 gün", status: "planlandı" },
      ],
      timeline: "T+0 filtre · T+2 doğrulama · T+3 yükleme",
      dataSources: ["Kira ödeme işlem geçmişi", "Churn tahmin modeli v3"],
      risk: "İzinli iletişim oranı %78 — liste daralması planlandı.",
    },
  },
  {
    id: "t3",
    department: "Legal",
    title: "BDDK duyuru gerekliliği kontrolü",
    summary: "Puan oranı iletişiminin mevzuat uyumu ve açık rıza metni.",
    status: "waiting",
    assignedAt: "Bugün 09:41",
    priority: "Yüksek",
    warning: "Mevzuat riski — erken başlatıldı",
    rationale:
      "Legal görevi diğer tüm görevlerle paralel ve en yüksek öncelikle açıldı çünkü Ocak 2025 KOBİ kampanyasında onay süreci 6 iş günü sürerek lansmanı 1 hafta geciktirdi. Hedef onay süresi 3 güne çekildi.",
    details: {
      kpis: [
        { label: "Hedef onay süresi", value: "3 iş günü" },
        { label: "Kontrol kalemi", value: "12 madde" },
        { label: "Önceki süre", value: "6 iş günü" },
      ],
      subtasks: [
        { name: "BDDK duyuru gerekliliği ön incelemesi", owner: "Uyum Ofisi", eta: "T+1 gün", status: "sürüyor" },
        { name: "KVKK açık rıza metni revizyonu", owner: "Hukuk Müşavirliği", eta: "T+2 gün", status: "planlandı" },
        { name: "Nihai onay ve imza turu", owner: "Hukuk Müşavirliği", eta: "T+3 gün", status: "planlandı" },
      ],
      timeline: "T+0 ön inceleme · T+2 revizyon · T+3 onay",
      dataSources: ["BDDK mevzuat takip sistemi", "KVKK rıza platformu"],
      risk: "Puan oranı 'faiz benzeri getiri' sayılırsa BDDK duyurusu zorunlu.",
    },
  },
  {
    id: "t4",
    department: "Veri Platformları",
    title: "Kampanya funnel dashboard kurulumu",
    summary: "Push açılma → başvuru → onay gerçek zamanlı izleme ekranı.",
    status: "assigned",
    assignedAt: "Bugün 09:40",
    priority: "Orta",
    rationale:
      "Gerçek zamanlı funnel kuruldu çünkü önceki 4 kampanyada ilk 48 saatlik veri, kanal bütçe kaydırma kararlarını ortalama 2 gün hızlandırdı. Standart event şeması kullanılarak kurulum 2 güne indirildi.",
  },
  {
    id: "t5",
    department: "Pazarlama",
    title: "In-app story tasarım brief'i",
    summary: "Kampüs temalı story seti, 18-30 segmentine özel.",
    status: "assigned",
    assignedAt: "Bugün 09:40",
    priority: "Orta",
    rationale:
      "In-app story formatı eklendi çünkü Eylül 2025 kampanyasında bu format 18-30 segmentinde dönüşümü %28 artırdı. Kampüs teması seçildi çünkü talep sinyali panelinde 'öğrenci hesabı' aramaları %31 arttı.",
  },
  {
    id: "t6",
    department: "CRM",
    title: "Mevduat kampanyası sonuç raporu",
    summary: "Kasım ayı mevduat kampanyasının segment bazlı dönüşüm analizi.",
    status: "done",
    assignedAt: "Dün 16:20",
    priority: "Düşük",
    rationale:
      "Kampanya kapanışlarından sonra 48 saat içinde segment bazlı analiz standarttır; bu rapor bir sonraki mevduat kararında organizational memory girdisi olarak kullanılacak.",
  },
  {
    id: "t7",
    department: "Veri Platformları",
    title: "Döviz alarm verisi entegrasyonu",
    summary: "Alarm kuran müşteri davranış verisinin sinyal paneline akışı.",
    status: "done",
    assignedAt: "Dün 11:05",
    priority: "Orta",
    rationale:
      "Döviz alarmı kurulumları son 30 günde %21 arttı; bu davranış verisi proaktif talep sinyali üretmek için panele bağlandı. Benzer entegrasyon konut kredisi ekranında 2 hafta önce talep sinyalini doğru öngördü.",
  },
  {
    id: "t8",
    department: "Legal",
    title: "KVKK açık rıza metni güncellemesi",
    summary: "Puan programı veri işleme kapsamının rıza metnine eklenmesi.",
    status: "done",
    assignedAt: "Dün 10:30",
    priority: "Yüksek",
    rationale:
      "Puan programları müşteri harcama verisi işlediği için KVKK kapsamı genişliyor; geçmiş denetim bulguları rıza metninin kampanya lansmanından önce güncellenmesini zorunlu kılıyor.",
  },
];

// ---- AI ön çalışma taslağı: yerel şablon fallback'i -------------------------
// /api/prepare erişilemezse demo kesintiye uğramasın diye departmana özel
// önceden yazılmış taslaklar kullanılır.

export function localDraft(department: Department): DeptDraft {
  const base = {
    source: "template" as const,
    generatedAt: new Date().toISOString(),
    note: "Taslak, departman onayı olmadan yayına çıkmaz; tüm içerik insan denetiminden geçer.",
  };
  switch (department) {
    case "Pazarlama":
      return { ...base, headline: "Push A/B varyantları ve in-app story taslağı", items: [
        { title: "Varyant A · fayda odaklı push", content: "Kiranı öde, puanları topla 🎓 Genç Kart'la her kira ödemesinde puan seni bekliyor. 3 dakikada başvur." },
        { title: "Varyant B · aciliyet odaklı push", content: "Kayıt haftası bitmeden Genç Kart'ını al — ilk kira ödemene ekstra puan. Son günler!" },
        { title: "In-app story başlığı", content: "Kira ödemek hiç bu kadar kazandırmamıştı → 3 adımda başvuru" },
      ]};
    case "CRM":
      return { ...base, headline: "Hedef segment filtre seti taslağı", items: [
        { title: "Filtre kriterleri", content: "Yaş 18-30 · son 6 ayda ≥3 kira ödemesi · aktif mobil kullanıcı · izinli iletişim = evet" },
        { title: "Önceliklendirme kuralı", content: "Churn skoru ≥ 0.6 olan müşteriler ilk gönderim dalgasına alınır (elde tutma maliyeti avantajı)" },
        { title: "Hariç tutma listesi", content: "Son 30 günde 2+ kampanya bildirimi almış müşteriler — push yorgunluk limiti" },
      ]};
    case "Legal":
      return { ...base, headline: "Uyum kontrol listesi taslağı", items: [
        { title: "BDDK duyuru gerekliliği", content: "Puan oranı iletişimi 'faiz benzeri getiri' kapsamına giriyor mu — ön inceleme formu hazırlandı" },
        { title: "KVKK açık rıza", content: "Puan programı harcama verisi işlediği için rıza metnine ek madde taslağı hazır" },
        { title: "Reklam kurulu kriterleri", content: "'En avantajlı' türü karşılaştırmalı ifadeler metinlerden çıkarılmalı; taahhüt metni sadeleştirilmeli" },
      ]};
    case "Veri Platformları":
      return { ...base, headline: "Funnel event şeması taslağı", items: [
        { title: "Event zinciri", content: "push_sent → push_opened → campaign_view → application_started → application_approved" },
        { title: "Dashboard panelleri", content: "Saatlik açılma oranı · kanal bazlı dönüşüm · A/B varyant karşılaştırması" },
        { title: "Otomatik rapor", content: "Her gün 09:00'da kampanya ekibine özet rapor (şablon: funnel-daily-v2)" },
      ]};
  }
}

// ---- Demo: kuyruğa önceden işlenmiş kampanyalar -----------------------------

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

function demoTrace(offsetMinutes: number, memoryDetail: string, channelDetail: string, memoryScore: number, channelScore: number): TraceEvent[] {
  const at = (step: number) => minutesAgo(offsetMinutes - step);
  return [
    { id: "intake", label: "Kampanya girdisi ayrıştırıldı", detail: "Amaç ve ürün terimleri çıkarıldı", status: "done", timestamp: at(0), algorithm: "Lexical intent parser v2", why: "Hangi analizlerin çalıştırılacağını ve doğru referans havuzunu belirlemek için.", inputs: ["Onaylanan kampanya brief'i"], outputs: ["ürün", "segment", "kanal terimleri"] },
    { id: "segment", label: "Segment sinyalleri çıkarıldı", detail: "Hedef kitle sinyalleri brief'ten doğrulandı", status: "done", timestamp: at(1), algorithm: "Kural tabanlı segment sınıflandırıcı", why: "Kanal uygunluğu ve CRM veri talebini hedef kitleye göre özelleştirmek için.", inputs: ["Yaş", "ürün", "davranış anahtar kelimeleri"], outputs: ["Segment profili"], score: 86 },
    { id: "memory", label: "Benzer kampanyalar sıralandı", detail: memoryDetail, status: "done", timestamp: at(2), algorithm: "Weighted Jaccard Retrieval", why: "Yeni kararı ölçülmüş geçmiş sonuçlarla temellendirmek için.", inputs: ["5 geçmiş kampanya", "ürün ve segment etiketleri"], outputs: [memoryDetail], score: memoryScore },
    { id: "channels", label: "Kanal alternatifleri skorlandı", detail: channelDetail, status: "done", timestamp: at(3), algorithm: "Ağırlıklı MCDA kanal skoru", why: "Performans, segment uyumu, uygunluk ve hazırlığı birlikte değerlendirmek için.", inputs: ["%45 geçmiş performans", "%30 segment uyumu", "%15 uygunluk", "%10 hazırlık"], outputs: [channelDetail], score: channelScore },
    { id: "rules", label: "Risk ve uygunluk kuralları çalıştı", detail: "BDDK iletişim kontrolü · KVKK izinli iletişim kontrolü", status: "done", timestamp: at(4), algorithm: "Deterministic compliance ruleset", why: "Model yorumundan bağımsız, tekrarlanabilir mevzuat kontrolü için.", inputs: ["Ürün türü", "müşteri verisi", "iletişim kanalı"], outputs: ["2 aktif kontrol"], score: 78 },
    { id: "model", label: "AI görev sentezi tamamlandı", detail: "Yapılandırılmış çıktı alındı, dört departman kartı üretildi", status: "done", timestamp: at(5), algorithm: "OpenAI structured synthesis", why: "Analitik bulguları ekiplerin uygulayabileceği görev paketlerine çevirmek için.", inputs: ["4 analitik aşamanın çıktıları"], outputs: ["4 departman kartı", "14 alt görev"], score: 100 },
    { id: "validation", label: "Departman kapsamı doğrulandı", detail: "CRM · Veri Platformları · Legal · Pazarlama eksiksiz", status: "done", timestamp: at(6), algorithm: "Set coverage validator", why: "Hiçbir departmanın model tarafından atlanmasını engellemek için.", inputs: ["Beklenen departman kümesi: 4"], outputs: ["4/4 kapsam"], score: 100 },
    { id: "dispatch", label: "Team-bot mesajları hazırlandı", detail: "Her departmana ihtiyaç, veri talebi ve gerekçe bağlandı", status: "done", timestamp: at(7), algorithm: "Department payload composer", why: "Analiz sonucunu ekiplerin doğrudan aksiyona çevirebileceği mesajlara dönüştürmek için.", inputs: ["Departman kartları", "alt görevler", "ETA"], outputs: ["4 team-bot paketi"], score: 100 },
  ];
}

export const seedCampaigns: CampaignJob[] = [
  {
    id: "cmp-demo-genc",
    title: "Genç Segment Kredi Kartı — Kampüs Lansmanı",
    idea: "Üniversite öğrencilerine kira ödemelerinde puan kazandıran kredi kartı kampanyası",
    createdAt: minutesAgo(96),
    status: "completed",
    provider: "openai",
    model: "gpt-4o",
    score: 84,
    summary: "18-30 kira ödeyen segment (38.200 kişi) push + in-app story ile hedeflendi; Legal görevi geçmiş gecikme verisi nedeniyle en yüksek öncelikle paralel açıldı.",
    trace: demoTrace(96, "Kira Öde Puan Kazan %81 · Genç Segment Kredi Kartı %74", "Push 87/100 · In-app 84/100 · SMS 58/100", 81, 87),
    brief: {
      title: "Genç Segment Kredi Kartı — Kampüs Lansmanı",
      objective: "Üniversite öğrencilerine kira ödemelerinde puan kazandıran kredi kartıyla genç segment kazanımı",
      segment: "18-30 yaş, aktif mobil bankacılık kullanıcısı (~124.500 kişi), kira ödeyen alt segment öncelikli",
      channels: "Push bildirimi (ana, A/B testli) + in-app story (destek)",
      timing: "T+7 gün lansman · üniversite kayıt dönemi öncesi",
      kpi: "Push açılma ≥ %40 · dönüşüm ≥ %7 · ilk 30 günde 8.500 yeni ürün",
    },
    suggestions: ["Kampüs anlaşmalı üniversitelerle ortak duyuru", "İlk 3 ay ücretsiz ek paket"],
    routing: [
      { department: "CRM", reason: "Hedef segment listesi ve churn önceliklendirmesi bu ekipte.", priority: "Yüksek" },
      { department: "Legal", reason: "Puan iletişimi BDDK duyuru şartına takılabilir; erken başlatıldı.", priority: "Yüksek" },
      { department: "Pazarlama", reason: "Push + in-app story üretimi ve A/B varyantları.", priority: "Orta" },
      { department: "Veri Platformları", reason: "Gerçek zamanlı funnel dashboard kurulumu.", priority: "Orta" },
    ],
  },
  {
    id: "cmp-demo-doviz",
    title: "Döviz Alarmı Kuranlara Vadeli Mevduat Önerisi",
    idea: "Döviz kuru alarmı kuran müşterilere vadeli döviz mevduatı önerelim",
    createdAt: minutesAgo(41),
    status: "completed",
    provider: "openai",
    model: "gpt-4o",
    score: 71,
    summary: "Alarm kuran 12.400 müşteriye davranış tetikli push önerildi; mevduat getiri iletişimi için BDDK kontrolü Legal'e yönlendirildi.",
    trace: demoTrace(41, "Mevduat Faiz Kampanyası %68 · Döviz sinyali +%21", "Push 79/100 · Mobil Banner 74/100 · E-posta 52/100", 68, 79),
    brief: {
      title: "Döviz Alarmı Kuranlara Vadeli Mevduat Önerisi",
      objective: "Döviz alarmı kuran müşterileri davranış tetikli teklifle vadeli döviz mevduatına dönüştürmek",
      segment: "Son 30 günde döviz alarmı kuran aktif mobil müşteriler (~12.400 kişi)",
      channels: "Davranış tetikli push + mobil ana ekran banner",
      timing: "T+3 gün lansman · alarm tetiklendiği anda gönderim",
      kpi: "Push açılma ≥ %35 · mevduat dönüşümü ≥ %4,5 · 60 günde 550 yeni hesap",
    },
    suggestions: ["Alarm eşiğine yaklaşıldığında ikinci hatırlatma", "Getiri simülasyonu ekranı ile teklifi destekle"],
    routing: [
      { department: "CRM", reason: "Alarm kuran müşteri listesinin tetik bazlı segmentasyonu.", priority: "Yüksek" },
      { department: "Legal", reason: "Getiri oranı iletişimi BDDK duyuru kontrolü gerektiriyor.", priority: "Yüksek" },
      { department: "Pazarlama", reason: "Tetikli push metinleri ve banner kreatifi.", priority: "Orta" },
      { department: "Veri Platformları", reason: "Alarm event akışının kampanya motoruna bağlanması.", priority: "Orta" },
    ],
  },
];

export const statusColumns: { key: TaskStatus; label: string }[] = [
  { key: "waiting", label: "Bekliyor" },
  { key: "processing", label: "AI İşliyor" },
  { key: "assigned", label: "Departmana Atandı" },
  { key: "done", label: "Tamamlandı" },
];

// ---- Proaktif talep sinyalleri ---------------------------------------------

export const trendSignals: TrendSignal[] = [
  {
    id: "s1",
    title: "Konut kredisi hesaplama ekranı kullanımı",
    change: 34,
    source: "Mobil uygulama · son 30 gün",
    spark: [12, 14, 13, 16, 18, 17, 21, 24, 23, 27, 30, 34],
    action: "Konut kredisi ön onay kampanyası başlat — faiz indirimi dönemi talebi karşıla.",
    tone: "teal",
  },
  {
    id: "s2",
    title: "Döviz alarmı kurulumları",
    change: 21,
    source: "Mobil uygulama · son 30 gün",
    spark: [8, 9, 11, 10, 12, 14, 13, 15, 17, 18, 19, 21],
    action: "Alarm kuran müşterilere vadeli döviz mevduatı önerisi gönder.",
    tone: "green",
  },
  {
    id: "s3",
    title: "'Öğrenci hesabı' arama hacmi",
    change: 31,
    source: "Uygulama içi arama · üniversite kayıt dönemi",
    spark: [5, 6, 5, 7, 9, 12, 15, 19, 22, 26, 29, 31],
    action: "Genç segment hoş geldin paketini kayıt haftasından önce lansmana hazırla.",
    tone: "amber",
  },
  {
    id: "s4",
    title: "Kredi kartı borç yapılandırma sayfası",
    change: 18,
    source: "Web + mobil · son 14 gün",
    spark: [10, 10, 11, 12, 11, 13, 14, 15, 15, 16, 17, 18],
    action: "Yapılandırma teklifini proaktif sun — çağrı merkezi yükünü azalt.",
    tone: "coral",
  },
];

export const topTabs = [
  { label: "Para Transferi", value: 100 },
  { label: "Kredi Hesaplama", value: 78 },
  { label: "Döviz & Altın", value: 64 },
  { label: "Kart İşlemleri", value: 52 },
  { label: "Yatırım", value: 38 },
];

export const topSearches = [
  { term: "kira öderken puan", count: 4210 },
  { term: "öğrenci hesabı", count: 3860 },
  { term: "konut kredisi faiz", count: 3120 },
  { term: "döviz alarmı", count: 2540 },
  { term: "borç yapılandırma", count: 1980 },
  { term: "vadeli hesap", count: 1720 },
];
