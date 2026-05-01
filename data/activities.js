// 悠行动漫社 线下活动数据
// 每次新增活动，在此数组末尾添加即可
// poster: 海报路径  |  photos: 活动照片数组  |  date: 活动日期

const ACTIVITIES_DATA = [
  {
    id: "welcome-2025",
    title: "2025届迎新大会",
    date: "2025年10月",
    category: "迎新活动",
    description: "漫影相伴，共聚华年。2025届迎新大会如期举行，新老成员齐聚一堂，共同开启新的动漫之旅。活动包括社团介绍、互动游戏、才艺展示等环节，让新成员快速融入这个温暖的大家庭。",
    poster: "../assets/images/activities/welcome-poster.jpg",
    photos: [
      { src: "../assets/images/activities/welcome-photo1.jpg", caption: "入社礼物其一" },
      { src: "../assets/images/activities/welcome-photo2.jpg", caption: "入社礼物其二" },
      { src: "../assets/images/activities/welcome-photo3.jpg", caption: "入社海报" }
    ],
    tags: ["迎新", "社团活动", "2025届"]
  },
  {
    id: "newyear-2025",
    title: "2025元旦晚会",
    date: "2025年元旦",
    category: "联欢晚会",
    description: "Beyond the Way！元旦晚会上，动漫社带来了精彩的舞台表演。成员们精心准备的节目展现了社团的活力与创意，为全校师生献上了一场视听盛宴。",
    poster: null,
    photos: [
      { src: "../assets/images/activities/newyear-photo1.jpg", caption: "成员合影正面" },
      { src: "../assets/images/activities/newyear-photo2.jpg", caption: "成员合照侧面" },
      { src: "../assets/images/activities/newyear-photo3.jpg", caption: "节目精彩瞬间" },
      { src: "../assets/images/activities/newyear-photo4.jpg", caption: "后台花絮" }
    ],
    tags: ["元旦", "晚会", "2025届", "表演"]
  },
  {
    id: "xiemeng-2025",
    title: "夕梦拼绘",
    date: "2026年4月",
    category: "手作活动",
    description: "用双手创造梦想！夕梦拼绘是一项创意手作活动，社员们用积木&纸模制作各种动漫角色和创意作品。从设计图纸到拼&剪成型，每一步都充满乐趣与成就感。",
    poster: "../assets/images/activities/xiemeng-poster.jpg",
    photos: [
      { src: "../assets/images/activities/xiemeng-photo1.jpg", caption: "" },
      { src: "../assets/images/activities/xiemeng-photo2.jpg", caption: "" },
      { src: "../assets/images/activities/xiemeng-photo3.jpg", caption: "" },
      { src: "../assets/images/activities/xiemeng-photo4.jpg", caption: "" },
      { src: "../assets/images/activities/xiemeng-photo5.jpg", caption: "" }
    ],
    tags: ["手作", "纸模","积木", "创意", "夕梦拼绘"]
  }
];
