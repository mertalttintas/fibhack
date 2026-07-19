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
  why?: string; // neden bu algoritma seçildi (2-3 cümle)
  method?: string[]; // adım adım nasıl analiz etti
  meaning?: string; // skor/sonuç ne anlama geliyor
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
  details?: {
    objective: string;
    segment: string;
    duration: string;
    reach: string;
    kpis: { label: string; target: string; actual: string; hit: boolean }[];
    learnings: string[]; // organizational memory'ye işlenen dersler
    departments: string[];
    spark: number[]; // haftalık dönüşüm eğrisi
  };
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

const coreCampaigns: PastCampaign[] = [
  {
    id: "pc4",
    name: "Kira Öde Puan Kazan",
    date: "Eylül 2025",
    channel: "Push + In-app",
    openRate: 38,
    conversion: 7.1,
    result: "Başarılı",
    insight: "18-30 segmentinde in-app story formatı dönüşümü %28 artırdı.",
    details: {
      objective: "Kira ödemelerini kredi kartına taşıyarak genç segmentte kart kullanımını artırmak",
      segment: "18-30 yaş, kira ödeyen aktif mobil kullanıcılar (38.200 kişi)",
      duration: "6 hafta · Eylül-Ekim 2025",
      reach: "36.400 müşteriye ulaşıldı (%95 erişim)",
      kpis: [
        { label: "Push açılma", target: "%35", actual: "%38", hit: true },
        { label: "Dönüşüm", target: "%6", actual: "%7,1", hit: true },
        { label: "Yeni ürün adedi", target: "2.300", actual: "2.710", hit: true },
      ],
      learnings: [
        "In-app story formatı 18-30 segmentinde dönüşümü %28 artırıyor — genç segment kampanyalarında standart destek kanalı yapıldı",
        "Kira ödeme günü (ayın 1-5'i) gönderimleri, ay ortasına göre %19 daha yüksek etkileşim aldı",
      ],
      departments: ["CRM", "Pazarlama", "Veri Platformları"],
      spark: [3.8, 4.6, 5.9, 6.8, 7.3, 7.1],
    },
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
    details: {
      objective: "Emekli maaş müşterilerini promosyon teklifiyle bankaya taşımak",
      segment: "55+ yaş, maaş hesabı başka bankada olan müşteriler (61.000 kişi)",
      duration: "8 hafta · Haziran-Temmuz 2025",
      reach: "54.200 müşteriye ulaşıldı (%89 erişim)",
      kpis: [
        { label: "SMS okunma", target: "%30", actual: "%24", hit: false },
        { label: "Dönüşüm", target: "%5", actual: "%4,6", hit: false },
        { label: "Maaş taşıma adedi", target: "3.000", actual: "2.780", hit: false },
      ],
      learnings: [
        "55+ segmentte push opt-in %31'de kalıyor — bu kitleye SMS + çağrı merkezi kombinasyonu zorunlu",
        "Çağrı merkezi destekli aramalar dönüşümü tek başına SMS'e göre 2,1 kat artırdı ama maliyetli — sadece yüksek değerli müşteriye uygulanmalı",
      ],
      departments: ["CRM", "Pazarlama", "Legal"],
      spark: [2.1, 3.0, 3.8, 4.2, 4.5, 4.6],
    },
  },
  {
    id: "pc6",
    name: "Konut Kredisi Ön Onay",
    date: "Nisan 2025",
    channel: "Push + Web",
    openRate: 35,
    conversion: 5.8,
    result: "Başarılı",
    insight: "Hesaplama ekranını kullananlara tetikli teklif, soğuk gönderimden 3 kat iyi dönüştü.",
    details: {
      objective: "Konut kredisi hesaplama ekranı kullanıcılarına ön onaylı teklif sunmak",
      segment: "Son 30 günde hesaplama ekranını 2+ kez kullanan müşteriler (18.700 kişi)",
      duration: "5 hafta · Nisan-Mayıs 2025",
      reach: "17.900 müşteriye ulaşıldı (%96 erişim)",
      kpis: [
        { label: "Push açılma", target: "%30", actual: "%35", hit: true },
        { label: "Başvuru dönüşümü", target: "%4", actual: "%5,8", hit: true },
        { label: "Kullandırım hacmi", target: "₺850M", actual: "₺1.04Mr", hit: true },
      ],
      learnings: [
        "Davranış tetikli gönderim (hesaplama ekranı kullanımı) soğuk listeye göre 3 kat dönüşüm üretiyor — tetikli kampanya standardı buradan doğdu",
        "Ön onay tutarının mesajda açıkça yazılması tıklamayı %22 artırdı",
      ],
      departments: ["CRM", "Veri Platformları", "Pazarlama", "Legal"],
      spark: [2.9, 4.1, 5.2, 5.9, 6.1, 5.8],
    },
  },
  {
    id: "pc1",
    name: "Genç Segment Kredi Kartı",
    date: "Mart 2025",
    channel: "Push",
    openRate: 42,
    conversion: 8.4,
    result: "Başarılı",
    insight: "Push kanalı SMS'in iki katı açılma oranı üretti (%42 vs %19).",
    details: {
      objective: "Üniversite öğrencilerine ilk kredi kartını edindirme",
      segment: "18-26 yaş, öğrenci belgeli mobil kullanıcılar (94.000 kişi)",
      duration: "6 hafta · Mart-Nisan 2025",
      reach: "88.500 müşteriye ulaşıldı (%94 erişim)",
      kpis: [
        { label: "Push açılma", target: "%30", actual: "%42", hit: true },
        { label: "Dönüşüm", target: "%6", actual: "%8,4", hit: true },
        { label: "Yeni kart adedi", target: "5.500", actual: "7.430", hit: true },
      ],
      learnings: [
        "Push, genç segmentte SMS'in iki katı açılma üretiyor (%42 vs %19) — genç kampanyalarında ana kanal artık push",
        "A/B testinde fayda odaklı metin, aciliyet odaklıdan %11 daha iyi performans gösterdi",
      ],
      departments: ["CRM", "Pazarlama", "Veri Platformları"],
      spark: [4.2, 5.8, 7.1, 8.0, 8.6, 8.4],
    },
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
    details: {
      objective: "KOBİ'lere dönem sonu nakit akışı için işletme kredisi sunmak",
      segment: "Yıllık cirosu 5-50M ₺ arası, POS kullanan işletmeler (12.300 firma)",
      duration: "7 hafta · Ocak-Şubat 2025",
      reach: "10.900 firmaya ulaşıldı (%89 erişim)",
      kpis: [
        { label: "E-posta açılma", target: "%25", actual: "%17", hit: false },
        { label: "Dönüşüm", target: "%4", actual: "%3,1", hit: false },
        { label: "Kullandırım hacmi", target: "₺600M", actual: "₺495M", hit: false },
      ],
      learnings: [
        "Legal onayı 6 iş günü sürüp lansmanı 1 hafta geciktirdi — bu dersten sonra Legal görevi tüm kampanyalarda en yüksek öncelikle paralel açılıyor",
        "KOBİ sahipleri e-postayı mesai saatinde açmıyor; şube ziyareti + mobil bildirim kombinasyonu önerildi",
      ],
      departments: ["CRM", "Legal", "Pazarlama"],
      spark: [1.8, 2.2, 2.6, 3.0, 3.2, 3.1],
    },
  },
  {
    id: "pc7",
    name: "Yeni Yıl Taksit Erteleme",
    date: "Aralık 2024",
    channel: "Push + SMS",
    openRate: 29,
    conversion: 4.2,
    result: "Kısmi",
    insight: "Yoğun kampanya döneminde bildirim yorgunluğu açılmayı %8 düşürdü.",
    details: {
      objective: "Yılbaşı harcamaları için kart taksit erteleme teklifi",
      segment: "Aktif kredi kartı borcu olan, düzenli ödeme yapan müşteriler (142.000 kişi)",
      duration: "4 hafta · Aralık 2024",
      reach: "131.000 müşteriye ulaşıldı (%92 erişim)",
      kpis: [
        { label: "Açılma", target: "%33", actual: "%29", hit: false },
        { label: "Dönüşüm", target: "%4,5", actual: "%4,2", hit: false },
        { label: "Erteleme adedi", target: "6.000", actual: "5.500", hit: false },
      ],
      learnings: [
        "Aralık ayında tüm bankalar kampanya yağdırıyor — bildirim yorgunluğu açılmayı %8 düşürdü; yoğun dönemde frekans limiti haftalık 2'ye indirildi",
        "Erteleme teklifleri ayın son haftası (ekstre kesimi öncesi) 1,7 kat daha iyi dönüşüyor",
      ],
      departments: ["CRM", "Pazarlama", "Legal"],
      spark: [3.1, 3.6, 4.4, 4.5, 4.0, 4.2],
    },
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
    details: {
      objective: "Vadesiz bakiyesi yüksek müşterileri vadeli mevduata yönlendirmek",
      segment: "Vadesiz hesabında 30 gün+ süreyle 100K ₺ üstü tutan müşteriler (27.500 kişi)",
      duration: "6 hafta · Kasım-Aralık 2024",
      reach: "26.100 müşteriye ulaşıldı (%95 erişim)",
      kpis: [
        { label: "Banner CTR", target: "%25", actual: "%31", hit: true },
        { label: "Dönüşüm", target: "%4", actual: "%5,2", hit: true },
        { label: "Toplanan mevduat", target: "₺2Mr", actual: "₺2.6Mr", hit: true },
      ],
      learnings: [
        "Mobil ana ekran banner'ı e-postanın 3,4 katı CTR üretti — birikim ürünlerinde ana kanal banner oldu",
        "Faiz oranını banner'da açıkça göstermek BDDK duyuru şartına takıldı; 'size özel oran' formülü hem uyumlu hem etkili",
      ],
      departments: ["CRM", "Pazarlama", "Legal", "Veri Platformları"],
      spark: [2.8, 3.9, 4.7, 5.3, 5.5, 5.2],
    },
  },
  {
    id: "pc8",
    name: "Maaş Müşterisi Kazanımı",
    date: "Şubat 2025",
    channel: "Şube + SMS",
    openRate: 21,
    conversion: 3.9,
    result: "Kısmi",
    insight: "Promosyon tutarı tek başına yetmiyor; ek fayda paketi dönüşümü belirledi.",
    details: {
      objective: "Maaşını başka bankadan alan müşterileri promosyonla taşımak",
      segment: "Bankada ürünü olup maaşı dışarıda olan müşteriler (88.000 kişi)",
      duration: "8 hafta · Şubat-Mart 2025",
      reach: "76.500 müşteriye ulaşıldı (%87 erişim)",
      kpis: [
        { label: "SMS okunma", target: "%28", actual: "%21", hit: false },
        { label: "Dönüşüm", target: "%4", actual: "%3,9", hit: false },
        { label: "Maaş taşıma", target: "3.500", actual: "3.420", hit: false },
      ],
      learnings: [
        "Promosyon tutarı rakiplerle aynıysa fark yaratmıyor — kredi faiz indirimi + aidatsız kart içeren paket teklifi dönüşümü taşıdı",
        "Şube yönlendirmeli akışta form doldurma terki %41 — dijital uçtan uca akış şart",
      ],
      departments: ["CRM", "Pazarlama", "Veri Platformları"],
      spark: [2.4, 2.9, 3.5, 4.0, 4.1, 3.9],
    },
  },
  {
    id: "pc9",
    name: "e-Ticaret POS Paketi",
    date: "Mayıs 2025",
    channel: "E-posta + Saha",
    openRate: 19,
    conversion: 2.4,
    result: "Düşük",
    insight: "Ürün-kitle uyumsuzluğu: hedef listede e-ticaret yapan işletme oranı %12'ydi.",
    details: {
      objective: "İşletmelere sanal POS + e-ticaret entegrasyon paketi satmak",
      segment: "POS kullanan tüm KOBİ'ler (31.000 firma) — segment daraltılmadı",
      duration: "6 hafta · Mayıs-Haziran 2025",
      reach: "26.700 firmaya ulaşıldı (%86 erişim)",
      kpis: [
        { label: "E-posta açılma", target: "%25", actual: "%19", hit: false },
        { label: "Dönüşüm", target: "%5", actual: "%2,4", hit: false },
        { label: "Paket satışı", target: "1.500", actual: "640", hit: false },
      ],
      learnings: [
        "Hedef listede fiilen e-ticaret yapan işletme oranı sadece %12'ydi — segment daraltılmadan gönderim yapmak dönüşümü yarıya düşürdü; artık segment odak skoru zorunlu kontrol",
        "Saha ekibi ziyaretleri e-postadan 4 kat iyi dönüştü ama birim maliyet 9 kat — yalnızca yüksek cirolu firmalara uygulanmalı",
      ],
      departments: ["CRM", "Pazarlama", "Veri Platformları"],
      spark: [1.6, 2.0, 2.5, 2.7, 2.3, 2.4],
    },
  },
  {
    id: "pc10",
    name: "Bayram Alışveriş Kart Kampanyası",
    date: "Mayıs 2024",
    channel: "In-app",
    openRate: 33,
    conversion: 6.0,
    result: "Başarılı",
    insight: "Bayram öncesi 10 günlük dar pencere, yıl geneline göre 1,8 kat etkileşim üretti.",
    details: {
      objective: "Bayram alışverişinde kart harcamasını taksit avantajıyla artırmak",
      segment: "Son 3 ayda market/giyim harcaması olan kart müşterileri (203.000 kişi)",
      duration: "3 hafta · Mayıs 2024",
      reach: "192.000 müşteriye ulaşıldı (%95 erişim)",
      kpis: [
        { label: "In-app etkileşim", target: "%28", actual: "%33", hit: true },
        { label: "Dönüşüm", target: "%5", actual: "%6,0", hit: true },
        { label: "Ek harcama hacmi", target: "₺1.2Mr", actual: "₺1.5Mr", hit: true },
      ],
      learnings: [
        "Bayram öncesi 10 günlük dar pencere yıl ortalamasının 1,8 katı etkileşim üretiyor — dönemsel kampanyalar dar ve yoğun kurgulanmalı",
        "Kategori bazlı kişiselleştirme (market vs giyim) genel mesaja göre %15 daha iyi dönüştü",
      ],
      departments: ["CRM", "Pazarlama", "Veri Platformları"],
      spark: [3.5, 5.2, 6.4, 6.0, 5.8, 6.0],
    },
  },
];

// Arşivin geri kalanı: seed listesinden detayları türetilen 30 kampanya.
type CampaignSeed = {
  name: string; date: string; channel: string; openRate: number; conversion: number;
  result: "Başarılı" | "Kısmi" | "Düşük"; insight: string;
  objective: string; segment: string; reachK: number; weeks: number;
};

const CHANNEL_LESSONS: Record<string, string> = {
  Push: "Push gönderiminde 20:00-21:00 aralığı gün içi ortalamadan daha yüksek açılma üretti",
  "In-app": "In-app yerleşimlerde ilk ekran görünürlüğü, menü içi yerleşime göre belirgin fark yarattı",
  SMS: "SMS'te 160 karakteri aşan mesajların okunma oranı ölçülebilir şekilde düştü",
  "E-posta": "E-posta konu satırında kişiselleştirme, açılmayı çift haneli artırdı",
  "Mobil Banner": "Banner kreatifinde tek mesaj + tek buton kuralı CTR'ı artırdı",
  Şube: "Şube yönlendirmeli akışlarda randevu linki eklemek terk oranını azalttı",
  "Çağrı Merkezi": "Çağrı listesi churn skoruyla önceliklendirilince erişim verimi arttı",
};

function buildPastCampaign(seed: CampaignSeed, index: number): PastCampaign {
  const hit = seed.result === "Başarılı";
  const partial = seed.result === "Kısmi";
  const openTarget = Math.round(seed.openRate * (hit ? 0.88 : 1.12));
  const convTarget = Number((seed.conversion * (hit ? 0.85 : partial ? 1.08 : 1.5)).toFixed(1));
  const c = seed.conversion;
  const spark = (hit ? [0.5, 0.68, 0.85, 1.02, 1.08, 1] : partial ? [0.55, 0.75, 0.95, 1.05, 0.98, 1] : [0.7, 0.95, 1.1, 1.0, 0.9, 1])
    .map((k) => Number((c * k).toFixed(1)));
  const mainChannel = seed.channel.split(" + ")[0];
  const departments = ["CRM", "Pazarlama"];
  if (/kredi|mevduat|faiz|sigorta|fon|puan/i.test(seed.name)) departments.push("Legal");
  if (/Push|In-app|Banner/i.test(seed.channel)) departments.push("Veri Platformları");
  return {
    id: `pcx${index + 1}`,
    name: seed.name,
    date: seed.date,
    channel: seed.channel,
    openRate: seed.openRate,
    conversion: seed.conversion,
    result: seed.result,
    insight: seed.insight,
    details: {
      objective: seed.objective,
      segment: seed.segment,
      duration: `${seed.weeks} hafta · ${seed.date}`,
      reach: `~${Math.round(seed.reachK * 0.92)}.000 müşteriye ulaşıldı (%92 erişim)`,
      kpis: [
        { label: "Açılma", target: `%${openTarget}`, actual: `%${seed.openRate}`, hit: seed.openRate >= openTarget },
        { label: "Dönüşüm", target: `%${convTarget}`, actual: `%${seed.conversion}`, hit: seed.conversion >= convTarget },
        { label: "Erişim", target: "%88", actual: "%92", hit: true },
      ],
      learnings: [seed.insight, CHANNEL_LESSONS[mainChannel] ?? "Kanal karması sonuçlara göre bir sonraki kampanyada yeniden ağırlıklandırıldı"],
      departments,
      spark,
    },
  };
}

const extraSeeds: CampaignSeed[] = [
  { name: "Okula Dönüş Genç Paketi", date: "Ağustos 2025", channel: "Push + In-app", openRate: 36, conversion: 6.4, result: "Başarılı", insight: "Kayıt haftasından 10 gün önce başlayan iletişim, hafta içine sıkışan kurguya göre daha iyi dönüştü.", objective: "Üniversiteye başlayan öğrencilere hesap + kart paketi", segment: "17-20 yaş, yeni kayıt dönemi kullanıcıları", reachK: 74, weeks: 4 },
  { name: "Yaz Tatili Taksit Kampanyası", date: "Temmuz 2025", channel: "In-app", openRate: 31, conversion: 5.1, result: "Başarılı", insight: "Tatil kategorisinde harcaması olanlara tetikli teklif genel gönderimden 2,2 kat iyi dönüştü.", objective: "Tatil harcamalarında ek taksit teklifi", segment: "Son 60 günde seyahat/konaklama harcaması olanlar", reachK: 96, weeks: 5 },
  { name: "Serbest Meslek Kredi Paketi", date: "Temmuz 2025", channel: "E-posta", openRate: 18, conversion: 2.9, result: "Kısmi", insight: "Serbest meslek segmentinde gelir belgesi adımı dönüşümün önündeki ana engel oldu.", objective: "Serbest çalışanlara esnek geri ödemeli kredi", segment: "Fatura kesen serbest meslek sahipleri", reachK: 22, weeks: 6 },
  { name: "Altın Hesabı Birikim", date: "Haziran 2025", channel: "Mobil Banner", openRate: 28, conversion: 4.4, result: "Başarılı", insight: "Gram bazlı küçük birikim mesajı ('günde 1 gram') toplu yatırım mesajından iyi çalıştı.", objective: "Düzenli altın birikim talimatı açtırmak", segment: "Altın fiyat ekranını takip eden kullanıcılar", reachK: 58, weeks: 5 },
  { name: "Babalar Günü Kart Harcama", date: "Haziran 2025", channel: "Push", openRate: 30, conversion: 4.9, result: "Kısmi", insight: "Hediye kategorisi tahmini bazı segmentlerde isabetsizdi; kategori modeli güncellendi.", objective: "Babalar Günü haftasında kart harcamasını artırmak", segment: "Aktif kart kullanıcıları", reachK: 150, weeks: 2 },
  { name: "Çiftçi Destek Kredisi", date: "Mayıs 2025", channel: "Şube + SMS", openRate: 22, conversion: 3.6, result: "Kısmi", insight: "Tarım bölgelerinde SMS + şube araması kombinasyonu tek kanala göre belirgin fark yarattı.", objective: "Hasat öncesi dönemde işletme kredisi", segment: "Tarım sektörü kayıtlı işletme müşterileri", reachK: 18, weeks: 7 },
  { name: "Anneler Günü Alışveriş", date: "Mayıs 2025", channel: "Push + In-app", openRate: 34, conversion: 6.2, result: "Başarılı", insight: "Son 3 gün hatırlatma dalgası toplam dönüşümün üçte birini tek başına üretti.", objective: "Anneler Günü haftasında kart kampanyası", segment: "Hediye kategorisi harcaması olan müşteriler", reachK: 168, weeks: 2 },
  { name: "Dijital Onboarding Hoş Geldin", date: "Nisan 2025", channel: "In-app", openRate: 41, conversion: 7.8, result: "Başarılı", insight: "İlk 7 gün içinde verilen hoş geldin teklifi, 30. günden sonra verilene göre 3 kat iyi dönüştü.", objective: "Yeni dijital müşterileri ilk üründe aktive etmek", segment: "Son 30 günde uygulamaya kayıt olanlar", reachK: 42, weeks: 4 },
  { name: "Ramazan Market Taksit", date: "Mart 2025", channel: "Push", openRate: 32, conversion: 5.7, result: "Başarılı", insight: "İftar saatine yakın gönderimler gün içi ortalamadan %24 daha yüksek açılma aldı.", objective: "Market harcamalarına ek taksit", segment: "Düzenli market harcaması olan kart müşterileri", reachK: 185, weeks: 4 },
  { name: "Vergi Dönemi KOBİ Nakit", date: "Mart 2025", channel: "E-posta + Şube", openRate: 16, conversion: 2.6, result: "Düşük", insight: "Vergi haftasında işletmeler teklif değerlendirmeye vakit ayırmıyor — dönem 2 hafta öne çekilmeli.", objective: "Vergi ödemesi dönemi için köprü kredisi", segment: "KDV mükellefi KOBİ'ler", reachK: 26, weeks: 3 },
  { name: "Kadınlar Günü Girişimci Kredisi", date: "Mart 2025", channel: "E-posta", openRate: 23, conversion: 3.8, result: "Kısmi", insight: "Başvuru formundaki teminat sorusu erken terk noktası oldu; adım sona taşındı.", objective: "Kadın girişimcilere avantajlı işletme kredisi", segment: "Kadın ortaklı işletme müşterileri", reachK: 14, weeks: 4 },
  { name: "Sömestr Genç Harcama", date: "Şubat 2025", channel: "In-app", openRate: 35, conversion: 6.0, result: "Başarılı", insight: "Sinema/oyun kategorili teklifler genç segmentte genel teklife göre %31 iyi performans gösterdi.", objective: "Sömestr tatilinde genç kart kullanımı", segment: "18-24 yaş aktif kart kullanıcıları", reachK: 66, weeks: 3 },
  { name: "Yılbaşı Mevduat Hoş Geldin Faizi", date: "Ocak 2025", channel: "Mobil Banner", openRate: 29, conversion: 4.7, result: "Başarılı", insight: "'İlk 3 ay özel oran' kurgusu süresiz orandan daha çok yeni müşteri getirdi.", objective: "Yeni yıl birikimlerini vadeliye çekmek", segment: "Vadesizde bakiye tutan müşteriler", reachK: 48, weeks: 5 },
  { name: "Eğitim Sigortası Çapraz Satış", date: "Aralık 2024", channel: "Çağrı Merkezi", openRate: 15, conversion: 2.2, result: "Düşük", insight: "Sigorta ürünlerinde soğuk arama dönüşümü düşük — dijital ön ısıtma olmadan arama yapılmamalı.", objective: "Çocuklu ailelere eğitim sigortası", segment: "18 yaş altı çocuğu olan müşteriler", reachK: 31, weeks: 6 },
  { name: "Black Friday Kart Kampanyası", date: "Kasım 2024", channel: "Push + In-app", openRate: 39, conversion: 7.2, result: "Başarılı", insight: "Saatlik kontenjanlı teklif kurgusu ('bu saat için 500 kişilik') etkileşimi rekor seviyeye taşıdı.", objective: "Black Friday haftasında kart harcaması", segment: "E-ticaret harcaması olan tüm kart müşterileri", reachK: 240, weeks: 1 },
  { name: "Kış Lastiği Taksit Anlaşması", date: "Kasım 2024", channel: "SMS", openRate: 20, conversion: 3.3, result: "Kısmi", insight: "Anlaşmalı bayi listesinin mesaja eklenmesi tıklamayı artırdı ama bölgesel kapsam yetersizdi.", objective: "Kış lastiği alımında anlaşmalı taksit", segment: "Araç sahibi kart müşterileri", reachK: 92, weeks: 3 },
  { name: "Cumhuriyet Bayramı Özel Mevduat", date: "Ekim 2024", channel: "Mobil Banner", openRate: 27, conversion: 4.3, result: "Başarılı", insight: "Dönemsel tema + sınırlı süre kombinasyonu standart mevduat mesajına göre iyi çalıştı.", objective: "Bayram haftası özel vadeli mevduat", segment: "Birikim eğilimli müşteriler", reachK: 55, weeks: 2 },
  { name: "Okul Dönemi Veli Kredisi", date: "Eylül 2024", channel: "Push", openRate: 28, conversion: 4.5, result: "Kısmi", insight: "Okul taksit takvimiyle eşleşen geri ödeme planı talep gördü; tutar üst limiti dar kaldı.", objective: "Eğitim masrafları için taksitli kredi", segment: "Okul çağında çocuğu olan müşteriler", reachK: 84, weeks: 5 },
  { name: "Üniversite Hoş Geldin Hesabı", date: "Eylül 2024", channel: "Push + In-app", openRate: 37, conversion: 6.8, result: "Başarılı", insight: "Kampüs bölgesi hedeflemesi şehir geneli hedeflemeye göre dönüşümü %26 artırdı.", objective: "Yeni üniversitelilere ücretsiz hesap paketi", segment: "18-21 yaş, kampüs bölgesi kullanıcıları", reachK: 51, weeks: 4 },
  { name: "Yaz Sonu Döviz Vadeli", date: "Ağustos 2024", channel: "Push", openRate: 25, conversion: 4.0, result: "Kısmi", insight: "Kur sakinken döviz ürünü ilgisi düşüyor — kampanya volatilite dönemine planlanmalı.", objective: "Döviz birikimlerini vadeliye çekmek", segment: "Döviz hesabı olan müşteriler", reachK: 63, weeks: 4 },
  { name: "Tatil Kredisi", date: "Temmuz 2024", channel: "E-posta", openRate: 14, conversion: 2.1, result: "Düşük", insight: "'Tatil için kredi' çerçevesi güven yaratmadı; 'esnek nakit' kurgusu sonraki dönemde daha iyi çalıştı.", objective: "Yaz tatili harcamaları için ihtiyaç kredisi", segment: "Yaz döneminde seyahat harcaması olanlar", reachK: 70, weeks: 4 },
  { name: "Aidatsız Kart Geçişi", date: "Haziran 2024", channel: "SMS + Push", openRate: 30, conversion: 5.3, result: "Başarılı", insight: "Rakip kart aidat dönemine denk getirilen zamanlama kampanyanın ana başarı faktörüydü.", objective: "Rakip banka kartlılarını aidatsız karta geçirmek", segment: "Bankada hesabı olup kartı dışarıda olanlar", reachK: 88, weeks: 6 },
  { name: "Konut Sigortası Çapraz", date: "Mayıs 2024", channel: "E-posta", openRate: 17, conversion: 2.7, result: "Kısmi", insight: "Konut kredisi müşterisine sigorta teklifi kredi kapanış anında sunulunca dönüşüm 2 kat arttı.", objective: "Konut kredili müşterilere konut sigortası", segment: "Aktif konut kredisi olan müşteriler", reachK: 25, weeks: 5 },
  { name: "Emeklilik Fonu Otomatik Katılım", date: "Nisan 2024", channel: "Şube", openRate: 19, conversion: 3.0, result: "Kısmi", insight: "Şube görüşmesinde fon getiri simülasyonu gösterilen müşterilerde katılım belirgin arttı.", objective: "Bireysel emeklilik fonuna katılımı artırmak", segment: "30-45 yaş maaş müşterileri", reachK: 40, weeks: 8 },
  { name: "Nevruz Bölgesel Kampanya", date: "Mart 2024", channel: "SMS", openRate: 21, conversion: 3.4, result: "Kısmi", insight: "Bölgesel içerik yerelleştirmesi genel içeriğe göre okunmayı artırdı; teklif derinliği yetersizdi.", objective: "Bölgesel bayram dönemi kart kampanyası", segment: "Seçili iller, aktif kart müşterileri", reachK: 47, weeks: 2 },
  { name: "Şubat Kart Borç Transferi", date: "Şubat 2024", channel: "Push", openRate: 33, conversion: 5.9, result: "Başarılı", insight: "Ekstre kesiminden 3 gün önce gönderim, borç transfer teklifinde en verimli zamanlama oldu.", objective: "Rakip kart borcunu avantajlı faizle taşımak", segment: "Yüksek ekstre bakiyeli kart kullanıcıları", reachK: 76, weeks: 5 },
  { name: "Yeni Yıl Fatura Talimatı", date: "Ocak 2024", channel: "In-app", openRate: 26, conversion: 4.1, result: "Başarılı", insight: "Tek tıkla talimat akışı, form doldurmalı akışa göre terk oranını yarıya indirdi.", objective: "Otomatik fatura ödeme talimatı açtırmak", segment: "Düzenli fatura ödeyen, talimatı olmayanlar", reachK: 120, weeks: 6 },
  { name: "Aralık Altın Günleri", date: "Aralık 2023", channel: "Mobil Banner", openRate: 24, conversion: 3.7, result: "Kısmi", insight: "Fiziksel altın teslim seçeneği beklenmedik ilgi gördü; operasyon kapasitesi dar kaldı.", objective: "Yıl sonu altın hesabı açılışı", segment: "Birikim eğilimli mobil kullanıcılar", reachK: 52, weeks: 3 },
  { name: "e-Fatura KOBİ Geçiş", date: "Kasım 2023", channel: "E-posta", openRate: 13, conversion: 1.9, result: "Düşük", insight: "Teknik ürünlerde e-posta tek başına yetersiz — mali müşavir kanalı üzerinden iletişim önerildi.", objective: "KOBİ'leri bankanın e-fatura çözümüne geçirmek", segment: "e-Fatura mükellefi KOBİ'ler", reachK: 29, weeks: 6 },
  { name: "Maaş Avans Limiti", date: "Ekim 2023", channel: "Push", openRate: 29, conversion: 4.8, result: "Başarılı", insight: "Ay sonuna 5 gün kala gönderilen avans teklifi ay başı gönderimine göre 2,4 kat dönüştü.", objective: "Maaş müşterilerine hazır avans limiti tanımlamak", segment: "Düzenli maaş yatan müşteriler", reachK: 132, weeks: 4 },
];

const MONTH_ORDER: Record<string, number> = { Ocak: 1, Şubat: 2, Mart: 3, Nisan: 4, Mayıs: 5, Haziran: 6, Temmuz: 7, Ağustos: 8, Eylül: 9, Ekim: 10, Kasım: 11, Aralık: 12 };
function dateKey(date: string) {
  const [month, year] = date.split(" ");
  return Number(year) * 100 + (MONTH_ORDER[month] ?? 0);
}

export const pastCampaigns: PastCampaign[] = [...coreCampaigns, ...extraSeeds.map(buildPastCampaign)]
  .sort((a, b) => dateKey(b.date) - dateKey(a.date));

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

function demoTrace(offsetMinutes: number, memoryDetail: string, channelDetail: string, memoryScore: number, channelScore: number, signalDetail: string, signalScore: number, timingDetail: string, timingScore: number): TraceEvent[] {
  const at = (step: number) => minutesAgo(offsetMinutes - step);
  return [
    { id: "intake", label: "Kampanya girdisi ayrıştırıldı", detail: "Amaç ve ürün terimleri çıkarıldı", status: "done", timestamp: at(0), algorithm: "Lexical intent parser v2", why: "Serbest metni doğrudan modele vermek yerine önce yapılandırıyoruz: hangi analizlerin çalışacağı ve hangi referans havuzunun kullanılacağı burada belirlenir. İlk aşamadaki yanlış ayrıştırma zincirdeki her kararı saptıracağı için deterministik bir sözlük ayrıştırıcısı tercih edildi.", method: ["Brief normalize edildi (küçük harf, noktalama temizliği)", "Ürün, segment ve kanal terimleri banka terim sözlüğüyle eşleştirildi", "Çıkan terimler sonraki 6 analiz aşamasına parametre olarak geçildi"], inputs: ["Onaylanan kampanya brief'i — amaç, hedef kitle, kanallar, zamanlama ve KPI alanlarıyla"], outputs: ["Ürün, segment ve kanal terim seti çıkarıldı"], meaning: "Brief makine tarafından işlenebilir hale geldi; sonraki tüm aşamalar bu terim setini kullanacak." },
    { id: "segment", label: "Segment sinyalleri çıkarıldı", detail: "Hedef kitle sinyalleri brief'ten doğrulandı", status: "done", timestamp: at(1), algorithm: "Kural tabanlı segment sınıflandırıcı", why: "Kanal skoru ve CRM veri talebi hedef kitleye göre tamamen değişir. Makine öğrenmesi yerine kural tabanlı sınıflandırıcı kullanıyoruz çünkü sonuç deterministik, denetlenebilir ve mevzuat denetiminde savunulabilir olmalı.", method: ["Yaş, eğitim ve işletme kalıpları kurallarla tarandı", "Davranış kelimeleri (kira, ödeme, mobil) segment profiline eklendi", "Eşleşme yoksa 'geniş taban' işaretlenip insan netleştirmesi önerilir"], inputs: ["Intake aşamasından gelen terim seti", "Yaş/eğitim/işletme kural kalıpları"], outputs: ["Segment profili çıkarıldı ve doğrulandı"], score: 86, meaning: "Segment tanımı net — hedefleme kriterleri doğrudan CRM filtresine çevrilebilir." },
    { id: "signals", label: "Talep sinyalleri tarandı", detail: signalDetail, status: "done", timestamp: at(2), algorithm: "Momentum sinyal eşleştirici", why: "Kampanya kararını varsayıma değil, müşterilerin uygulamada bugün fiilen ne aradığına dayandırıyoruz. Eşleştirici arama hacmini ve 30 günlük artış hızını birlikte tartar; böylece küçük ama hızla büyüyen talep de gözden kaçmaz.", method: ["Brief terimleri 14 arama teriminin etiketleriyle eşleştirildi", "Eşleşen aramaların hacmi ve 30 günlük değişimi toplandı (düşüşler negatif katkı yapar)", "Ekran kullanım değişimleri destek sinyali olarak eklendi", "Hacim + ivme ağırlıklandırılıp 0-100 momentum skoru üretildi"], inputs: ["Mobil arama günlüğü: 14 terim, 26.5K aylık sorgu", "9 ekran kullanım metriği"], outputs: [signalDetail], score: signalScore, meaning: `Momentum ${signalScore}/100: talep organik olarak mevcut — kampanya bu aramayı yakalayacak şekilde konumlanmalı.` },
    { id: "memory", label: "Benzer kampanyalar sıralandı", detail: memoryDetail, status: "done", timestamp: at(3), algorithm: "Weighted Jaccard Retrieval", why: "Kurumsal hafıza bu sistemin kalbi: yeni kararı sıfırdan tahmin etmek yerine ölçülmüş geçmiş sonuçlara dayandırıyoruz. Anahtar kelime isabetine %72 ağırlık verilir çünkü ürün eşleşmesi kelime benzerliğinden daha güçlü bir performans göstergesidir.", method: ["Brief kelime kümesine çevrilip arşivdeki etiketli kampanyalarla kesiştirildi", "Jaccard oranı + anahtar kelime isabeti hesaplandı (%28/%72)", "En benzer 3 kampanya performans metrikleriyle modele aktarıldı"], inputs: ["Kurumsal hafıza: 40 kampanyalık arşiv (kanal, açılma, dönüşüm)", "Ürün ve segment etiket kümeleri"], outputs: [memoryDetail], score: memoryScore, meaning: `En yakın geçmiş örneğin ölçülmüş sonuçları (%${memoryScore} benzerlik) yeni karar için referans alındı.` },
    { id: "channels", label: "Kanal alternatifleri skorlandı", detail: channelDetail, status: "done", timestamp: at(4), algorithm: "Ağırlıklı MCDA kanal skoru", why: "Tek metriğe güvenmek yanıltır: geçmişte iyi çalışan kanal bu segmente uymayabilir ya da mevzuata takılabilir. Çok kriterli karar analizi dört boyutu tek skora indirger; her kanala aynı formül uygulanır — kayırma yok, tekrarlanabilirlik var.", method: ["5 kanal 4 boyutta puanlandı: performans, segment uyumu, uygunluk, hazırlık", "Segment uyumu 2. aşamadaki profile göre kanala özel ayarlandı", "Boyutlar %45/%30/%15/%10 ağırlıkla birleştirildi", "İlk 2 kanal ana + destek olarak önerildi"], inputs: ["Geçmiş kanal performans matrisi (%45)", "Segment-kanal uyum profili (%30)", "Mevzuat uygunluğu (%15)", "Operasyonel hazırlık (%10)"], outputs: [channelDetail], score: channelScore, meaning: `En yüksek skorlu kanal ana kanal olarak önerildi (${channelScore}/100); ikinci kanal destek olarak eklendi.` },
    { id: "timing", label: "Zamanlama & mevsimsellik analizi", detail: timingDetail, status: "done", timestamp: at(5), algorithm: "Seasonal window scorer", why: "Aynı kampanya doğru haftada açıldığında bambaşka sonuç verir — geçmişte kayıt dönemi kaçırıldığı için bir kampanya hedefin altında kalmıştı. Skorlayıcı, kampanya temasını dönemsel takvimle eşleştirip lansman penceresinin gücünü puanlar.", method: ["Kampanya teması dönemsel olay takvimiyle eşleştirildi", "Talep sinyali ivmesi pencere gücüne kanıt olarak eklendi", "Maaş döngüsü ve push frekans limiti kısıt olarak işlendi"], inputs: ["Kampanya teması ve segment profili", "Dönemsel olay takvimi (kayıt/vergi/maaş/kur)"], outputs: [`Önerilen pencere: ${timingDetail}`, "Haftalık push frekans limiti: 2 bildirim"], score: timingScore, meaning: `Pencere skoru ${timingScore}/100: lansman doğru döneme denk geliyor — zamanlama kritik başarı faktörü.` },
    { id: "rules", label: "Risk ve uygunluk kuralları çalıştı", detail: "BDDK iletişim kontrolü · KVKK izinli iletişim kontrolü", status: "done", timestamp: at(6), algorithm: "Deterministic compliance ruleset", why: "Mevzuat kontrolü asla üretken modele bırakılmaz: BDDK ve KVKK kuralları yoruma açık olmamalı, her çalıştırmada aynı sonucu vermelidir. Model yalnızca bu motorun bulgularını görev planına işler.", method: ["Ürün türü mevzuat kural tablosuyla eşleştirildi", "Müşteri verisi kullanımı KVKK gereklilikleriyle kontrol edildi", "Tetiklenen kurallar Legal paketine zorunlu madde olarak eklendi"], inputs: ["Ürün türü ve teklif yapısı", "Müşteri veri alanları", "Planlanan kanallar"], outputs: ["Tetiklenen kontrol: BDDK iletişim ve ürün koşulu", "Tetiklenen kontrol: KVKK izinli iletişim"], score: 78, meaning: "2 kontrol tetiklendi — Legal görevi diğer işlerle paralel ve erken başlatılmalı (Ocak 2025'teki 6 günlük gecikme dersi)." },
    { id: "model", label: "AI görev sentezi tamamlandı", detail: "Yapılandırılmış çıktı alındı, dört departman kartı üretildi", status: "done", timestamp: at(7), algorithm: "LLM structured synthesis (şema kısıtlı)", why: "Önceki 6 aşamanın tamamı deterministik hesaptı; üretken model yalnızca son adımda bu doğrulanmış bulguları iş paketlerine çevirir. Model katı JSON şemasına uymak zorunda — halüsinasyon alanı bilinçli olarak daraltılmıştır.", method: ["6 aşamanın çıktısı yapılandırılmış bağlam olarak modele verildi", "Her departman için görev + alt görev + sahip + ETA + risk üretildi", "Çıktı JSON şema doğrulamasından geçti"], inputs: ["6 analitik aşamanın doğrulanmış çıktıları"], outputs: ["4 departman görev kartı", "14 alt görev — her biri sahip ve ETA ile", "Her kartta insan onayına açık karar gerekçesi"], score: 100, meaning: "Analitik bulgular kayıpsız şekilde uygulanabilir görev planına dönüştü; hiçbir karar kaynaksız verilmedi." },
    { id: "validation", label: "Departman kapsamı doğrulandı", detail: "CRM · Veri Platformları · Legal · Pazarlama eksiksiz", status: "done", timestamp: at(8), algorithm: "Set coverage validator", why: "Üretken modele güven ama doğrula: model bir departmanı atlarsa o ekip görevden haberdar olmaz. Doğrulayıcı, çıktıyı beklenen departman kümesiyle karşılaştırır; eksik varsa süreç durdurulur, kısmi dağıtım yapılmaz.", method: ["Model çıktısındaki departmanlar kümeye çevrildi", "Beklenen 4 departmanla birebir karşılaştırıldı", "Uyumsuzlukta süreç hata ile durduruluyor"], inputs: ["Beklenen küme: CRM, Veri Platformları, Legal, Pazarlama", "Model çıktısı: 4 kart"], outputs: ["CRM ✓", "Veri Platformları ✓", "Legal ✓", "Pazarlama ✓"], score: 100, meaning: "4/4 kapsam sağlandı — hiçbir departman atlanmadı, dağıtım güvenle yapılabilir." },
    { id: "dispatch", label: "Team-bot mesajları hazırlandı", detail: "Her departmana ihtiyaç, veri talebi ve gerekçe bağlandı", status: "done", timestamp: at(9), algorithm: "Department payload composer", why: "Analiz ne kadar iyi olursa olsun, ekibin eline geçen mesaj uygulanabilir değilse değer üretmez. Bu adım görevi, veriyi, alt görevleri ve gerekçeyi tek pakette birleştirir — ekip 'neden ben, neden şimdi, ne yapacağım' cevaplarını aynı kartta görür.", method: ["Her kart team-bot mesaj şablonuna yerleştirildi", "Alt görevler sahip ve ETA ile sıralandı", "Karar gerekçesi ve risk notu pakete eklendi"], inputs: ["4 doğrulanmış departman kartı", "Alt görev listeleri", "Karar gerekçeleri"], outputs: ["4 team-bot paketi hazır — panoda ve Slack köprüsünde gönderime açık"], score: 100, meaning: "Görev paketleri dağıtıma hazır; departmanlar panodan veya Slack kanalından tek tıkla devralabilir." },
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
    trace: demoTrace(96, "Kira Öde Puan Kazan %81 · Genç Segment Kredi Kartı %74", "Push 87/100 · In-app 84/100 · SMS 58/100", 81, 87, "\"kira öderken puan\" 4.210 arama +%31 · \"öğrenci hesabı\" 3.860 +%31", 92, "Üniversite kayıt dönemi öncesi hafta — öğrenci aramaları zirvede", 90),
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
    trace: demoTrace(41, "Mevduat Faiz Kampanyası %68 · Döviz sinyali +%21", "Push 79/100 · Mobil Banner 74/100 · E-posta 52/100", 68, 79, "\"döviz alarmı\" 2.540 arama +%21 · Döviz & Altın sekmesi +%9", 78, "Kur hareketliliği haftası — alarm kurulumları artışta", 82),
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
    tone: "amber",
  },
  {
    id: "s5",
    title: "'Pos komisyon' arama hacmi (KOBİ)",
    change: 16,
    source: "Uygulama içi arama · son 30 gün",
    spark: [7, 8, 8, 9, 10, 10, 11, 12, 13, 14, 15, 16],
    action: "KOBİ'lere e-ticaret entegrasyonlu POS + işletme kredisi paketini öne çıkar.",
    tone: "teal",
  },
  {
    id: "s6",
    title: "Kampanyalar sekmesi görüntülenmesi",
    change: 15,
    source: "Mobil uygulama · son 30 gün",
    spark: [18, 19, 18, 20, 21, 22, 24, 25, 27, 29, 31, 33],
    action: "Kampanya vitrini talebi artıyor — kişiselleştirilmiş sıralama testine başla.",
    tone: "green",
  },
  {
    id: "s7",
    title: "Altın hesabı açılışları",
    change: 14,
    source: "Mobil uygulama · son 30 gün",
    spark: [6, 6, 7, 8, 8, 9, 10, 11, 11, 12, 13, 14],
    action: "Gram bazlı düzenli birikim talimatı kampanyasını öne al — Haziran 2025 öğrenimi geçerli.",
    tone: "green",
  },
  {
    id: "s8",
    title: "'Evlilik kredisi' arama hacmi",
    change: 19,
    source: "Uygulama içi arama · düğün sezonu",
    spark: [4, 5, 6, 7, 9, 10, 12, 13, 15, 16, 18, 19],
    action: "Konut + eşya kredisi birleşik paketini düğün sezonu bitmeden lansmana hazırla.",
    tone: "teal",
  },
  {
    id: "s9",
    title: "Şube randevu talepleri",
    change: -14,
    source: "Mobil + web randevu sistemi · son 30 gün",
    spark: [28, 27, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18],
    action: "Şube ziyareti gerektiren kampanya akışlarını dijital uçtan uca akışa taşı.",
    tone: "coral",
  },
  {
    id: "s10",
    title: "E-posta kampanya tıklamaları",
    change: -12,
    source: "Kampanya e-postaları · son 60 gün",
    spark: [21, 20, 20, 19, 19, 18, 17, 17, 16, 15, 15, 14],
    action: "E-postayı ana kanal olarak kullanma — yalnızca doküman/detay destek kanalı olarak tut.",
    tone: "coral",
  },
  {
    id: "s11",
    title: "SMS okunma oranı (18-30 segment)",
    change: -17,
    source: "SMS kanal analitiği · son 90 gün",
    spark: [24, 23, 22, 22, 21, 20, 19, 18, 17, 16, 15, 14],
    action: "Genç segmentte SMS'i kanal karmasından çıkar; bütçeyi push + in-app'e kaydır.",
    tone: "coral",
  },
  {
    id: "s12",
    title: "Mevduat hesaplama ekranı kullanımı",
    change: -9,
    source: "Mobil uygulama · son 30 gün",
    spark: [17, 17, 16, 16, 15, 15, 14, 14, 13, 13, 12, 12],
    action: "Birikim kampanyasını ertele ya da teklifi güçlendir — organik ilgi zayıflıyor.",
    tone: "coral",
  },
];

export const topTabs = [
  { label: "Para Transferi", value: 100 },
  { label: "Kredi Hesaplama", value: 78 },
  { label: "Döviz & Altın", value: 64 },
  { label: "Kart İşlemleri", value: 52 },
  { label: "Fatura Ödeme", value: 47 },
  { label: "Yatırım", value: 38 },
  { label: "Kampanyalar", value: 33 },
  { label: "Başvurular", value: 29 },
];

export const topSearches = [
  { term: "kira öderken puan", count: 4210 },
  { term: "öğrenci hesabı", count: 3860 },
  { term: "konut kredisi faiz", count: 3120 },
  { term: "döviz alarmı", count: 2540 },
  { term: "borç yapılandırma", count: 1980 },
  { term: "vadeli hesap", count: 1720 },
  { term: "pos komisyon", count: 1490 },
  { term: "emekli promosyon", count: 1310 },
  { term: "altın hesabı", count: 1240 },
  { term: "taşıt kredisi", count: 1150 },
  { term: "kredi kartı limit artırma", count: 1080 },
  { term: "evlilik kredisi", count: 940 },
];
