export const features = [
  "Quản lý hội viên",
  "Quản lý gói tập",
  "Check-in tự động",
  "Thanh toán",
  "Lịch lớp học",
  "Huấn luyện viên",
  "Báo cáo doanh thu",
  "Chăm sóc khách hàng",
];

export const modules = [
  {
    title: "Quản lý hội viên",
    text: "Lưu trữ hồ sơ, trạng thái gói tập, lịch sử check-in và chăm sóc hội viên tập trung.",
  },
  {
    title: "Quản lý bán hàng",
    text: "Theo dõi thanh toán, công nợ, doanh thu theo ngày, tháng và từng cơ sở.",
  },
  {
    title: "Quản lý lớp & lịch tập",
    text: "Sắp xếp lớp học, booking, huấn luyện viên và số lượng học viên trong từng buổi.",
  },
  {
    title: "Báo cáo vận hành",
    text: "Dashboard tổng quan giúp chủ phòng tập nắm nhanh tình hình kinh doanh.",
  },
];

export const faqs = [
  {
    question: "FitLife có phù hợp với phòng gym nhỏ không?",
    answer:
      "Có. FitLife phù hợp từ phòng tập một cơ sở đến chuỗi nhiều chi nhánh.",
  },
  {
    question: "Có thể quản lý nhiều chi nhánh không?",
    answer:
      "Có. Dữ liệu hội viên, doanh thu và vận hành có thể được theo dõi theo từng cơ sở.",
  },
  {
    question: "Có kết nối với máy check-in không?",
    answer:
      "Có thể tích hợp QR, máy quét mã và các thiết bị check-in phù hợp với hệ thống.",
  },
  {
    question: "Có báo cáo doanh thu và hội viên hết hạn không?",
    answer:
      "Có. Dashboard hỗ trợ theo dõi doanh thu, công nợ và hội viên sắp hoặc đã hết hạn.",
  },
];

export const productGroups = [
  {
    heading: "QUẢN LÝ PHÒNG TẬP",
    items: [
      [
        "👥",
        "FitLife Hội viên",
        "Quản lý thẻ tập, gói dịch vụ, vòng đời hội viên",
      ],
      [
        "▣",
        "FitLife Lịch tập",
        "Đặt lịch PT, lớp học nhóm, sân bãi trực tuyến",
      ],
      ["▤", "FitLife Thu phí", "Quản lý học phí, công nợ và thanh toán online"],
      [
        "🏋",
        "FitLife PT & HLV",
        "Quản lý huấn luyện viên, buổi PT và hiệu suất",
      ],
    ],
  },
  {
    heading: "MARKETING & TĂNG TRƯỞNG",
    items: [
      [
        "✉",
        "FitLife Marketing",
        "Zalo OA, SMS, chăm sóc và tái kích hoạt hội viên",
      ],
      [
        "☆",
        "FitLife Loyalty",
        "Tích điểm, hạng thành viên và chương trình giữ chân",
      ],
      ["▯", "FitLife App", "Ứng dụng mobile cho hội viên — iOS & Android"],
    ],
  },
  {
    heading: "CHUỖI & VẬN HÀNH",
    items: [
      ["▥", "FitLife Chuỗi", "Quản lý đa chi nhánh — chuẩn hoá và so sánh KPI"],
      ["▥", "FitLife Báo cáo", "Dashboard doanh thu, KPI, retention realtime"],
      ["⌁", "API & Webhook", "Kết nối hệ thống bên thứ ba qua API chuẩn"],
    ],
  },
];

export const industries = [
  {
    id: "gym",
    label: "Phòng tập / Fitness",
    title: "GYM / Fitness Club",
    subtitle: "Tự động nhắc gia hạn, quản lý lịch PT và dòng tiền realtime",
    button: "Xem giải pháp GYM / Fitness Club",
    flowTitle: "⚡ FitLife GYM CRM",
    cards: [
      ["🏋️", "Hội viên & thẻ tập"],
      ["📅", "Đặt lịch PT / lớp"],
      ["💰", "Doanh thu realtime"],
    ],

    badge: "🏋️ GYM & Fitness",
    detailTitle:
      "Quản lý phòng tập toàn diện — từ hội viên, lịch PT, đến dòng tiền",

    benefits: [
      "278 màn hình quản lý",
      "Check-in nhận diện khuôn mặt",
      "Loyalty & chăm sóc hội viên",
    ],

    flowLabel: "HÀNH TRÌNH HỘI VIÊN",

    channels: ["🌐 Website", "📱 App", "📞 Hotline"],

    crmName: "💪 FitLife GYM CRM",

    detailCards: [
      ["🏋️", "Đăng ký PT", "Gói tập & lịch"],
      ["⭐", "Loyalty", "Tích điểm đổi thưởng"],
    ],

    results: [
      ["🔔", "Nhắc gia hạn"],
      ["📊", "Báo cáo"],
    ],
  },

  {
    id: "yoga",
    label: "Yoga & Pilates Studio",
    title: "Yoga & Pilates Studio",
    subtitle:
      "Quản lý lịch lớp, học viên, giáo viên và học phí trên một nền tảng",
    button: "Xem giải pháp Yoga & Pilates Studio",
    flowTitle: "⚡ FitLife Yoga",
    cards: [
      ["🧘", "Quản lý lớp học"],
      ["💳", "Gói tập linh hoạt"],
      ["📊", "Tỉ lệ lấp đầy"],
    ],

    badge: "🧘 Yoga & Pilates Studio",
    detailTitle:
      "Quản lý studio Yoga & Pilates toàn diện — từ học viên, lịch lớp đến học phí",

    benefits: [
      "Đặt lớp online 24/7",
      "Quản lý gói tập & học phí linh hoạt",
      "Nhắc lịch tự động cho học viên",
    ],

    flowLabel: "HÀNH TRÌNH HỌC VIÊN",

    channels: ["🌐 Website", "📱 Mobile App", "💬 Zalo OA"],

    crmName: "🧘 FitLife Yoga CRM",

    detailCards: [
      ["🧘", "Quản lý lớp", "Slot, điểm danh tự động"],
      ["💳", "Gói tập linh hoạt", "Tháng, buổi, năm"],
    ],

    results: [
      ["📅", "Tối ưu lịch lớp"],
      ["📈", "Tăng học viên"],
    ],
  },

  {
    id: "martial",
    label: "Võ thuật & Martial Arts",
    title: "Võ thuật & Martial Arts",
    subtitle:
      "Quản lý học viên theo lớp, đai, huấn luyện viên và tiến độ tập luyện",
    button: "Xem giải pháp Võ thuật & Martial Arts",
    flowTitle: "⚡ FitLife Võ thuật",
    cards: [
      ["🥋", "Học viên & đẳng cấp"],
      ["📅", "Lịch học theo lớp"],
      ["💰", "Học phí tự động"],
    ],

    badge: "🥋 Võ thuật & Martial Arts",
    detailTitle:
      "Quản lý trung tâm võ thuật — từ học viên, cấp đai đến học phí",

    benefits: [
      "Theo dõi cấp đai và tiến độ học viên",
      "Quản lý lịch học theo lớp và huấn luyện viên",
      "Tự động theo dõi học phí và gia hạn",
    ],

    flowLabel: "HÀNH TRÌNH HỌC VIÊN",

    channels: ["🌐 Website", "📱 App", "💬 Facebook"],

    crmName: "🥋 FitLife Martial CRM",

    detailCards: [
      ["🥋", "Học viên & đẳng cấp", "Theo dõi thăng đai"],
      ["📅", "Lịch học theo lớp", "Nhắc cấp độ, HLV"],
    ],

    results: [
      ["🏆", "Chuẩn hóa đào tạo"],
      ["💪", "Giữ học viên lâu dài"],
    ],
  },

  {
    id: "swim",
    label: "Bơi lội & Aqua Center",
    title: "Bơi lội & Aqua Center",
    subtitle: "Đặt làn bơi, quản lý thẻ hội viên và nhắc gia hạn tự động",
    button: "Xem giải pháp Bơi lội & Aqua Center",
    flowTitle: "⚡ FitLife Bơi lội",
    cards: [
      ["🏊", "Đăng ký học bơi"],
      ["🎫", "Vé vào bể bơi"],
      ["🧑‍🏫", "HLV bơi lội"],
    ],

    badge: "🏊 Bơi lội & Aqua Center",
    detailTitle:
      "Quản lý bể bơi & Aqua Center toàn diện — từ học viên, ca bơi đến học phí",

    benefits: [
      "Quản lý ca bơi và làn bơi",
      "Thẻ hội viên & vé vào cổng tự động",
      "Nhắc học phí và gia hạn thông minh",
    ],

    flowLabel: "HÀNH TRÌNH HỌC VIÊN",

    channels: ["🌐 Website", "📱 Mobile App", "💬 Zalo OA"],

    crmName: "🏊 FitLife Aqua CRM",

    detailCards: [
      ["🏊", "Đăng ký học bơi", "Lớp trẻ em & người lớn"],
      ["🎫", "Vé vào bể bơi", "Lượt, tháng, năm"],
    ],

    results: [
      ["🌊", "Tối ưu công suất bể"],
      ["📈", "Tăng học viên"],
    ],
  },

  {
    id: "spa",
    label: "Spa / Thẩm mỹ",
    title: "Spa / Thẩm mỹ viện",
    subtitle:
      "Nhận diện khách quen, gợi ý dịch vụ tiếp theo và chăm sóc tự động",
    button: "Xem giải pháp Spa / Thẩm mỹ viện",
    flowTitle: "⚡ FitLife Spa",
    cards: [
      ["📅", "Đặt lịch online"],
      ["👤", "Hồ sơ khách hàng"],
      ["🎁", "Loyalty & Upsell"],
    ],

    badge: "💆 Spa & Thẩm mỹ",
    detailTitle: "Quản lý spa & thẩm mỹ viện — lịch hẹn, khách VIP, loyalty",

    benefits: [
      "Đặt lịch online 24/7",
      "Loyalty VIP tích điểm",
      "Chăm sóc sau dịch vụ tự động",
    ],

    flowLabel: "HÀNH TRÌNH KHÁCH HÀNG SPA",

    channels: ["💬 Zalo OA", "📱 Facebook", "📞 Gọi điện"],

    crmName: "✨ FitLife Spa CRM",

    detailCards: [
      ["📅", "Đặt lịch", "Tự động xác nhận"],
      ["👤", "Hồ sơ dịch vụ", "Lịch sử liệu trình"],
    ],

    results: [
      ["🎁", "Upsell gói"],
      ["🔁", "Khách quay lại"],
    ],
  },

  {
    id: "golf",
    label: "Golf 3D & Giải trí",
    title: "Golf 3D & Indoor Sports",
    subtitle: "Tự động đặt slot, thu tiền và nhắc khách quay lại tập",
    button: "Xem giải pháp Golf 3D & Indoor Sports",
    flowTitle: "⚡ FitLife Golf",
    cards: [
      ["🏌️", "Đặt phòng online"],
      ["👥", "Thành viên VIP"],
      ["📊", "Doanh thu phòng"],
    ],

    badge: "⛳ Golf 3D & Indoor Sports",
    detailTitle:
      "Quản lý Golf 3D & Indoor Sports — đặt phòng, thành viên VIP và doanh thu",

    benefits: [
      "Đặt phòng và slot chơi online",
      "Quản lý thành viên VIP & ưu đãi",
      "Theo dõi doanh thu theo phòng và khung giờ",
    ],

    flowLabel: "HÀNH TRÌNH KHÁCH HÀNG",

    channels: ["🌐 Website", "💬 Zalo OA", "📞 Hotline"],

    crmName: "⛳ FitLife Golf CRM",

    detailCards: [
      ["🏌️", "Đặt phòng online", "Slot realtime"],
      ["👥", "Thành viên VIP", "Gói & ưu đãi"],
    ],

    results: [
      ["⛳", "Lấp đầy phòng"],
      ["💎", "Trải nghiệm VIP"],
    ],
  },
];

export const pricingPlans = [
  {
    name: "Starter",
    price: "3.990.000đ",
    note: "1 cơ sở · Tối đa 200 hội viên · Thẻ tập, check-in QR, thu phí",
  },
  {
    name: "Standard",
    price: "7.200.000đ",
    note: "1 cơ sở · Tối đa 500 hội viên · Lịch PT, lớp học, báo cáo",
    popular: true,
  },
  {
    name: "Professional",
    price: "12.000.000đ",
    note: "1 cơ sở · Không giới hạn hội viên · Toàn bộ tính năng + API",
  },
  {
    name: "Enterprise",
    price: "Liên hệ",
    note: "Chuỗi nhiều cơ sở · Tuỳ chỉnh theo yêu cầu · On-premise",
  },
];
