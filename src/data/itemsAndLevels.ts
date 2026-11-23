import type {
  AchievementDef,
  ItemShapeId,
  ItemTemplate,
  LevelConfig,
  LuggageCase,
  LuggageStyle,
  PackedItem,
} from '../types/game';

export const ITEM_CATALOG: Record<ItemShapeId, ItemTemplate> = {
  // === PROHIBITED / DANGEROUS ITEMS ===
  knife_hunting: {
    id: 'knife_hunting',
    name: 'Dao găm quân dụng',
    category: 'blade',
    isProhibited: true,
    material: 'metal',
    densityLabel: 'Thép rèn mật độ cao (Z=26) · Cạnh sắc',
    reason: 'Vũ khí sắc nhọn bị cấm tuyệt đối mang lên khoang hành khách.',
    minLevel: 1,
    baseWidth: 112,
    baseHeight: 34,
  },
  knife_utility: {
    id: 'knife_utility',
    name: 'Dao rọc giấy',
    category: 'blade',
    isProhibited: true,
    material: 'mixed',
    densityLabel: 'Lưỡi thép carbon + Vỏ nhựa cứng',
    reason: 'Dụng cụ có lưỡi dao sắc rời, tiềm ẩn nguy cơ uy hiếp an toàn bay.',
    minLevel: 1,
    baseWidth: 96,
    baseHeight: 28,
  },
  scissors_large: {
    id: 'scissors_large',
    name: 'Kéo mũi nhọn >6cm',
    category: 'blade',
    isProhibited: true,
    material: 'metal',
    densityLabel: 'Hợp kim thép không gỉ · Chốt xoay',
    reason: 'Kéo có lưỡi dài trên 6cm không được phép mang theo hành lý xách tay.',
    minLevel: 1,
    baseWidth: 98,
    baseHeight: 42,
  },
  handgun: {
    id: 'handgun',
    name: 'Súng ngắn kim loại',
    category: 'firearm',
    isProhibited: true,
    material: 'metal',
    densityLabel: 'Nòng thép dày + Lò xo hộp tiếp đạn',
    reason: 'Vũ khí quân dụng / công cụ hỗ trợ bị cấm tuyệt đối tại sân bay.',
    minLevel: 1,
    baseWidth: 114,
    baseHeight: 78,
  },
  ammo_clip: {
    id: 'ammo_clip',
    name: 'Băng đạn kim loại',
    category: 'firearm',
    isProhibited: true,
    material: 'metal',
    densityLabel: 'Vỏ đồng + Đầu đạn chì mật độ cực cao',
    reason: 'Đạn dược và vật liệu nổ quân dụng bị nghiêm cấm vận chuyển.',
    minLevel: 2,
    baseWidth: 74,
    baseHeight: 46,
  },
  taser: {
    id: 'taser',
    name: 'Súng điện ngụy trang',
    category: 'firearm',
    isProhibited: true,
    material: 'inorganic',
    densityLabel: 'Mạch kích áp cao + Hai cực phóng điện',
    reason: 'Công cụ gây choáng điện áp cao bị cấm mang lên tàu bay.',
    minLevel: 3,
    baseWidth: 102,
    baseHeight: 40,
  },
  c4_ied: {
    id: 'c4_ied',
    name: 'Thiết bị nổ tự chế (IED)',
    category: 'explosive',
    isProhibited: true,
    material: 'organic',
    densityLabel: 'Khối hữu cơ đặc màu cam + Kíp nối dây',
    reason: 'Phát hiện khối thuốc nổ dẻo kèm mạch hẹn giờ kích nổ cực kỳ nguy hiểm!',
    minLevel: 3,
    baseWidth: 110,
    baseHeight: 68,
  },
  fireworks: {
    id: 'fireworks',
    name: 'Pháo nổ / Thuốc pháo',
    category: 'explosive',
    isProhibited: true,
    material: 'organic',
    densityLabel: 'Ống thuốc phóng hữu cơ nén + Ngòi cháy',
    reason: 'Vật liệu gây nổ và phát hỏa bị cấm trên mọi chuyến bay thương mại.',
    minLevel: 2,
    baseWidth: 88,
    baseHeight: 60,
  },
  gas_canister: {
    id: 'gas_canister',
    name: 'Bình gas nén áp suất',
    category: 'explosive',
    isProhibited: true,
    material: 'mixed',
    densityLabel: 'Vỏ nhôm chịu áp + Khí hóa lỏng dễ cháy',
    reason: 'Bình khí nén dễ cháy có thể phát nổ khi thay đổi áp suất khoang bay.',
    minLevel: 1,
    baseWidth: 56,
    baseHeight: 98,
  },
  torch_lighter: {
    id: 'torch_lighter',
    name: 'Bật lửa khò phản lực',
    category: 'explosive',
    isProhibited: true,
    material: 'mixed',
    densityLabel: 'Bình chứa gas áp suất cao + Đầu khò nhiệt',
    reason: 'Bật lửa ngọn lửa xanh / khò nhiệt lượng cao bị cấm lên máy bay.',
    minLevel: 1,
    baseWidth: 52,
    baseHeight: 74,
  },
  pepper_spray: {
    id: 'pepper_spray',
    name: 'Bình xịt hơi cay',
    category: 'chemical',
    isProhibited: true,
    material: 'mixed',
    densityLabel: 'Bình xịt áp suất + Hợp chất kích ứng hữu cơ',
    reason: 'Chất gây mất khả năng tự vệ / hơi cay bị cấm hoàn toàn trên tàu bay.',
    minLevel: 2,
    baseWidth: 46,
    baseHeight: 88,
  },
  acid_bottle: {
    id: 'acid_bottle',
    name: 'Chai hóa chất ăn mòn >100ml',
    category: 'chemical',
    isProhibited: true,
    material: 'inorganic',
    densityLabel: 'Dung dịch vô cơ đậm đặc 350ml · Ăn mòn',
    reason: 'Dung dịch hóa chất ăn mòn vượt dung tích và thuộc danh mục hàng nguy hiểm.',
    minLevel: 3,
    baseWidth: 58,
    baseHeight: 102,
  },
  over_battery: {
    id: 'over_battery',
    name: 'Pin Lithium công nghiệp >160Wh',
    category: 'battery',
    isProhibited: true,
    material: 'inorganic',
    densityLabel: 'Khối pin Li-Ion 240Wh · Mật độ điện cực lớn',
    reason: 'Pin Lithium vượt ngưỡng 160Wh có nguy cơ quá nhiệt cháy nổ trong khoang.',
    minLevel: 2,
    baseWidth: 104,
    baseHeight: 56,
  },
  ceramic_knife: {
    id: 'ceramic_knife',
    name: 'Dao lưỡi gốm tàng hình',
    category: 'blade',
    isProhibited: true,
    material: 'inorganic',
    densityLabel: 'Zirconium Oxide (Xanh lá) · Lưỡi sắc không từ tính',
    reason: 'Dao gốm không hiện màu xanh kim loại nhưng vẫn là vũ khí sắc nhọn bị cấm.',
    minLevel: 4,
    baseWidth: 108,
    baseHeight: 32,
  },
  disassembled_gun: {
    id: 'disassembled_gun',
    name: 'Linh kiện nòng súng tháo rời',
    category: 'firearm',
    isProhibited: true,
    material: 'metal',
    densityLabel: 'Ống thép khương tuyến + Cụm kim hỏa',
    reason: 'Các bộ phận cấu thành vũ khí tháo rời nhằm qua mặt máy soi chiếu.',
    minLevel: 5,
    baseWidth: 104,
    baseHeight: 42,
  },

  // === SAFE / ALLOWED ITEMS ===
  clothes_folded: {
    id: 'clothes_folded',
    name: 'Quần áo gấp gọn',
    category: 'safe',
    isProhibited: false,
    material: 'organic',
    densityLabel: 'Sợi vải hữu cơ mật độ thấp (Màu cam nhạt)',
    reason: 'Hành lý cá nhân thông thường, hoàn toàn hợp lệ.',
    minLevel: 1,
    baseWidth: 132,
    baseHeight: 92,
  },
  sneakers: {
    id: 'sneakers',
    name: 'Giày thể thao',
    category: 'safe',
    isProhibited: false,
    material: 'organic',
    densityLabel: 'Đế cao su + Vải tổng hợp + Lỗ xỏ dây nhẹ',
    reason: 'Trang phục cá nhân hợp lệ.',
    minLevel: 1,
    baseWidth: 102,
    baseHeight: 62,
  },
  laptop: {
    id: 'laptop',
    name: 'Máy tính xách tay',
    category: 'safe',
    isProhibited: false,
    material: 'inorganic',
    densityLabel: 'Bo mạch điện tử + Pin <100Wh + Vỏ nhôm mỏng',
    reason: 'Thiết bị điện tử cá nhân được phép mang theo hành lý xách tay.',
    minLevel: 1,
    baseWidth: 136,
    baseHeight: 96,
  },
  camera_dslr: {
    id: 'camera_dslr',
    name: 'Máy ảnh DSLR',
    category: 'safe',
    isProhibited: false,
    material: 'mixed',
    densityLabel: 'Thấu kính thủy tinh (Xanh lá) + Thân hợp kim nhẹ',
    reason: 'Thiết bị nhiếp ảnh hợp lệ mang lên khoang hành khách.',
    minLevel: 2,
    baseWidth: 88,
    baseHeight: 72,
  },
  powerbank_safe: {
    id: 'powerbank_safe',
    name: 'Sạc dự phòng 20.000mAh (74Wh)',
    category: 'safe',
    isProhibited: false,
    material: 'inorganic',
    densityLabel: 'Pin Li-Po tiêu chuẩn 74Wh · Đạt chuẩn hàng không',
    reason: 'Sạc dự phòng dưới 100Wh được phép mang trong hành lý xách tay.',
    minLevel: 1,
    baseWidth: 74,
    baseHeight: 40,
  },
  headphones: {
    id: 'headphones',
    name: 'Tai nghe chụp tai không dây',
    category: 'safe',
    isProhibited: false,
    material: 'mixed',
    densityLabel: 'Cuộn loa đồng nhỏ + Đệm mút hữu cơ',
    reason: 'Phụ kiện âm thanh cá nhân hợp lệ.',
    minLevel: 1,
    baseWidth: 84,
    baseHeight: 82,
  },
  book: {
    id: 'book',
    name: 'Sách / Tài liệu dày',
    category: 'safe',
    isProhibited: false,
    material: 'organic',
    densityLabel: 'Giấy xenlulo hữu cơ xếp lớp đều',
    reason: 'Tài liệu giấy thông thường, hoàn toàn hợp lệ.',
    minLevel: 1,
    baseWidth: 94,
    baseHeight: 74,
  },
  umbrella: {
    id: 'umbrella',
    name: 'Ô dù gấp gọn',
    category: 'safe',
    isProhibited: false,
    material: 'metal',
    densityLabel: 'Nan thép rỗng mỏng đối xứng + Tay cầm nhựa',
    reason: 'Ô dù gấp không có đầu nhọn nguy hiểm được phép mang lên tàu bay.',
    minLevel: 2,
    baseWidth: 118,
    baseHeight: 34,
  },
  keys: {
    id: 'keys',
    name: 'Chùm chìa khóa nhà',
    category: 'safe',
    isProhibited: false,
    material: 'metal',
    densityLabel: 'Hợp kim đồng thau kích thước nhỏ <5cm',
    reason: 'Chìa khóa cá nhân hợp lệ.',
    minLevel: 1,
    baseWidth: 54,
    baseHeight: 38,
  },
  glasses: {
    id: 'glasses',
    name: 'Kính mắt trong hộp',
    category: 'safe',
    isProhibited: false,
    material: 'mixed',
    densityLabel: 'Gọng kim loại mảnh + Tròng kính polycarbonate',
    reason: 'Vật dụng cá nhân hợp lệ.',
    minLevel: 1,
    baseWidth: 80,
    baseHeight: 36,
  },
  electric_toothbrush: {
    id: 'electric_toothbrush',
    name: 'Bàn chải điện cá nhân',
    category: 'safe',
    isProhibited: false,
    material: 'inorganic',
    densityLabel: 'Mô-tơ rung mini + Pin AAA + Đầu bàn chải nhựa',
    reason: 'Thiết bị vệ sinh cá nhân hợp lệ (dễ nhầm với kíp nổ nếu không soi kỹ).',
    minLevel: 3,
    baseWidth: 96,
    baseHeight: 26,
  },
  hairdryer: {
    id: 'hairdryer',
    name: 'Máy sấy tóc du lịch',
    category: 'safe',
    isProhibited: false,
    material: 'mixed',
    densityLabel: 'Cuộn dây nhiệt lò xo + Cánh quạt nhựa (Không có nòng thép)',
    reason: 'Thiết bị tạo hình dáng giống súng trên X-ray nhưng bên trong là mô-tơ quạt.',
    minLevel: 2,
    baseWidth: 108,
    baseHeight: 80,
  },
  mini_toiletries: {
    id: 'mini_toiletries',
    name: 'Lọ mỹ phẩm du lịch 80ml',
    category: 'safe',
    isProhibited: false,
    material: 'organic',
    densityLabel: 'Dung tích 80ml (<100ml) · Chất lỏng hữu cơ an toàn',
    reason: 'Chất lỏng cá nhân dưới 100ml hợp lệ mang lên khoang.',
    minLevel: 2,
    baseWidth: 44,
    baseHeight: 68,
  },
  thermos_empty: {
    id: 'thermos_empty',
    name: 'Bình giữ nhiệt rỗng',
    category: 'safe',
    isProhibited: false,
    material: 'metal',
    densityLabel: 'Thép không gỉ thành kép · Bên trong rỗng khí',
    reason: 'Bình nước rỗng đã đổ hết chất lỏng hoàn toàn hợp lệ.',
    minLevel: 2,
    baseWidth: 52,
    baseHeight: 96,
  },
  tripod_compact: {
    id: 'tripod_compact',
    name: 'Chân máy ảnh mini',
    category: 'safe',
    isProhibited: false,
    material: 'metal',
    densityLabel: 'Ống nhôm rỗng gập 3 khớp · Không sắc nhọn',
    reason: 'Chân máy ảnh gấp gọn dưới 30cm được phép mang lên máy bay.',
    minLevel: 3,
    baseWidth: 110,
    baseHeight: 36,
  },
};

export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    level: 1,
    terminalName: 'Ga T1 · Cửa Nội Địa (Ca Sáng)',
    flightRoute: 'HAN → SGN · VN217',
    bagCount: 8,
    timeLimitSec: 95,
    beltSpeed: 210,
    threatProbability: 0.45,
    overlapDensity: 0.15,
    foilProbability: 0,
    edgeOnProbability: 0,
    description: 'Làm quen máy soi hai mức năng lượng. Phát hiện dao, kéo, bình gas và bật lửa.',
  },
  {
    level: 2,
    terminalName: 'Ga T2 · Khởi Hành Quốc Tế',
    flightRoute: 'HAN → NRT · NH898',
    bagCount: 10,
    timeLimitSec: 105,
    beltSpeed: 235,
    threatProbability: 0.48,
    overlapDensity: 0.35,
    foilProbability: 0,
    edgeOnProbability: 0.1,
    description: 'Xuất hiện đồ đánh lừa như máy sấy tóc và pin công suất lớn lẫn trong hành lý.',
  },
  {
    level: 3,
    terminalName: 'Hub Chuyển Tiếp · Giờ Cao Điểm',
    flightRoute: 'SGN → ICN · KE476',
    bagCount: 12,
    timeLimitSec: 115,
    beltSpeed: 255,
    threatProbability: 0.5,
    overlapDensity: 0.55,
    foilProbability: 0.15,
    edgeOnProbability: 0.22,
    description: 'Đồ đạc xếp chồng nhiều lớp. Hãy dùng Nghi ngờ kiểm tra kỹ để bóc tách lớp và xoay góc.',
  },
  {
    level: 4,
    terminalName: 'Cửa An Ninh · Cảnh Báo Vàng',
    flightRoute: 'HAN → CDG · AF257',
    bagCount: 14,
    timeLimitSec: 125,
    beltSpeed: 275,
    threatProbability: 0.54,
    overlapDensity: 0.65,
    foilProbability: 0.28,
    edgeOnProbability: 0.28,
    description: 'Cảnh giác dao gốm tàng hình (xanh lá) và thiết bị nổ IED giấu dưới quần áo, laptop.',
  },
  {
    level: 5,
    terminalName: 'Khu Kiểm Soát Hải Quan Đặc Biệt',
    flightRoute: 'SGN → LHR · BA094',
    bagCount: 16,
    timeLimitSec: 135,
    beltSpeed: 295,
    threatProbability: 0.56,
    overlapDensity: 0.78,
    foilProbability: 0.42,
    edgeOnProbability: 0.35,
    description: 'Nhiều hành lý bọc giấy bạc cản tia. Kết hợp lọc HI-PEN và kiểm tra chuyên sâu.',
  },
  {
    level: 6,
    terminalName: 'Cao Điểm Quốc Tế · Toàn Cầu',
    flightRoute: 'INTL → JFK · AA182',
    bagCount: 20,
    timeLimitSec: 150,
    beltSpeed: 315,
    threatProbability: 0.6,
    overlapDensity: 0.88,
    foilProbability: 0.52,
    edgeOnProbability: 0.4,
    description: 'Thử thách tối thượng: mật độ hành lý dày, ngụy trang tinh vi, đòi hỏi tốc độ và độ chính xác tuyệt đối.',
  },
];

export function getLevelConfig(level: number): LevelConfig {
  if (level <= LEVEL_CONFIGS.length) {
    return LEVEL_CONFIGS[level - 1];
  }
  const extra = level - LEVEL_CONFIGS.length;
  return {
    level,
    terminalName: `Ca Tăng Cường Quốc Tế #${extra}`,
    flightRoute: 'INTL → ZRH · LX161',
    bagCount: 20 + Math.min(extra * 2, 10),
    timeLimitSec: 155 + Math.min(extra * 5, 30),
    beltSpeed: Math.min(365, 315 + extra * 10),
    threatProbability: 0.62,
    overlapDensity: 0.92,
    foilProbability: Math.min(0.65, 0.52 + extra * 0.04),
    edgeOnProbability: 0.45,
    description: 'Ca trực tăng cường cấp độ cao nhất với mọi loại nguy cơ an ninh hàng không.',
  };
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_shift',
    title: 'Ca Trực Đầu Tiên',
    description: 'Hoàn thành an toàn Màn 1 tại Ga Nội Địa.',
  },
  {
    id: 'eagle_eye',
    title: 'Mắt Đại Bàng',
    description: 'Hoàn thành một màn với độ chính xác 100%.',
  },
  {
    id: 'speed_screener',
    title: 'Tốc Độ Ánh Sáng',
    description: 'Kết thúc một màn khi đồng hồ còn dư ít nhất 40 giây.',
  },
  {
    id: 'detective',
    title: 'Chuyên Gia Soi Chiếu',
    description: 'Gắn thẻ chính xác vật cấm trong Bàn Kiểm Tra Chuyên Sâu.',
  },
  {
    id: 'streak_5',
    title: 'Chuỗi Bất Bại 5',
    description: 'Xử lý chính xác 5 hành lý liên tiếp không sai sót.',
  },
  {
    id: 'streak_12',
    title: 'Chuỗi Bất Bại 12',
    description: 'Đạt chuỗi 12 hành lý chính xác liên tiếp.',
  },
  {
    id: 'zero_false_alarm',
    title: 'Không Oan Sai',
    description: 'Hoàn thành Màn 3 trở lên mà không giữ nhầm hành lý vô hại.',
  },
  {
    id: 'bomb_defuser',
    title: 'Chặn Đứng Chất Nổ',
    description: 'Ngăn chặn thành công thiết bị nổ IED hoặc pháo nổ lên tàu bay.',
  },
  {
    id: 'terminal_master',
    title: 'Chỉ Huy Trưởng Terminal',
    description: 'Chinh phục thành công toàn bộ 6 màn sân bay quốc tế.',
  },
  {
    id: 'veteran_50',
    title: 'Chiến Binh 50 Kiện',
    description: 'Tích lũy soi chiếu thành công 50 kiện hành lý qua các ca trực.',
  },
];

export function computeOfficerRank(score: number): string {
  if (score >= 30000) return 'Tổng Thanh Tra An Ninh';
  if (score >= 20000) return 'Chỉ Huy Trưởng Terminal';
  if (score >= 12000) return 'Chuyên Gia Soi Chiếu Cấp Cao';
  if (score >= 6000) return 'Cán Bộ An Ninh Chính';
  if (score >= 2500) return 'Nhân Viên Soi Chiếu Bậc 2';
  return 'Thực Tập Sinh An Ninh';
}

const ORIGINS = ['HAN · Hà Nội', 'SGN · TP.HCM', 'DAD · Đà Nẵng', 'NRT · Tokyo', 'ICN · Seoul', 'SIN · Singapore', 'CDG · Paris', 'LHR · London'];
const STYLES: LuggageStyle[] = ['hardcase', 'duffel', 'backpack', 'briefcase'];

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateLuggageBatch(config: LevelConfig): LuggageCase[] {
  const allTemplates = Object.values(ITEM_CATALOG).filter(
    (item) => item.minLevel <= config.level
  );
  const prohibitedPool = allTemplates.filter((i) => i.isProhibited);
  const safePool = allTemplates.filter((i) => !i.isProhibited);

  // Ensure exact threat count scales predictably with level
  const targetThreatCount = Math.max(
    2,
    Math.round(config.bagCount * config.threatProbability)
  );
  const threatFlags: boolean[] = Array.from({ length: config.bagCount }, (_, idx) =>
    idx < targetThreatCount
  );
  // Shuffle threatFlags
  for (let i = threatFlags.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [threatFlags[i], threatFlags[j]] = [threatFlags[j], threatFlags[i]];
  }

  return threatFlags.map((hasThreat, index) => {
    const style = pickRandom(STYLES);
    const width =
      style === 'hardcase'
        ? 390
        : style === 'duffel'
          ? 420
          : style === 'briefcase'
            ? 370
            : 320;
    const height =
      style === 'hardcase'
        ? 265
        : style === 'duffel'
          ? 240
          : style === 'briefcase'
            ? 250
            : 275;

    const hasFoilShield =
      config.foilProbability > 0 && Math.random() < config.foilProbability;

    const baseSafeCount =
      3 + Math.floor(config.overlapDensity * 3.2) + Math.floor(Math.random() * 2);

    const items: PackedItem[] = [];

    // Clutter / safe items
    for (let s = 0; s < baseSafeCount; s++) {
      const tpl = pickRandom(safePool);
      const isClutterCover =
        tpl.id === 'clothes_folded' || tpl.id === 'laptop' || tpl.id === 'book';
      items.push({
        uid: `item_${config.level}_${index}_s_${s}`,
        templateId: tpl.id,
        name: tpl.name,
        category: tpl.category,
        isProhibited: false,
        material: tpl.material,
        densityLabel: tpl.densityLabel,
        reason: tpl.reason,
        relX: randRange(-0.31, 0.31),
        relY: randRange(-0.29, 0.29),
        rotation: randRange(-0.45, 0.45),
        scale: randRange(0.88, 1.06),
        layer: isClutterCover && Math.random() < 0.72 ? 'top' : 'bottom',
        edgeOn: false,
        hiddenByFoil: false,
        scanned: false,
        taggedAsThreat: false,
      });
    }

    const threatItems: PackedItem[] = [];
    if (hasThreat) {
      const threatCount = config.level >= 5 && Math.random() < 0.22 ? 2 : 1;
      for (let t = 0; t < threatCount; t++) {
        const tpl = pickRandom(prohibitedPool);
        const edgeOn =
          (tpl.category === 'blade' || tpl.id === 'disassembled_gun') &&
          Math.random() < config.edgeOnProbability;
        // Put threat underneath a top-layer item if overlapDensity is high
        const topClutter = items.find((it) => it.layer === 'top');
        const relX =
          topClutter && Math.random() < config.overlapDensity
            ? topClutter.relX + randRange(-0.08, 0.08)
            : randRange(-0.28, 0.28);
        const relY =
          topClutter && Math.random() < config.overlapDensity
            ? topClutter.relY + randRange(-0.08, 0.08)
            : randRange(-0.26, 0.26);

        const packedThreat: PackedItem = {
          uid: `item_${config.level}_${index}_t_${t}`,
          templateId: tpl.id,
          name: tpl.name,
          category: tpl.category,
          isProhibited: true,
          material: tpl.material,
          densityLabel: tpl.densityLabel,
          reason: tpl.reason,
          relX,
          relY,
          rotation: randRange(-0.65, 0.65),
          scale: randRange(0.92, 1.05),
          layer: 'bottom',
          edgeOn,
          hiddenByFoil: hasFoilShield,
          scanned: false,
          taggedAsThreat: false,
        };
        items.unshift(packedThreat);
        threatItems.push(packedThreat);
      }
    }

    // Sort bottom layer first, top layer second for realistic painter order
    items.sort((a, b) => (a.layer === b.layer ? 0 : a.layer === 'bottom' ? -1 : 1));

    const tagNum = 100 + config.level * 100 + index + Math.floor(Math.random() * 89);
    return {
      id: `bag_${config.level}_${index}_${Date.now()}`,
      tagCode: `AX-${tagNum}`,
      passengerOrigin: pickRandom(ORIGINS),
      flightCode: config.flightRoute.split('·')[1]?.trim() || 'VN217',
      style,
      width,
      height,
      hasFoilShield,
      items,
      hasThreat,
      threatItems,
    };
  });
}
