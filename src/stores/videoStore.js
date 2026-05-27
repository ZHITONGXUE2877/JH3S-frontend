import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const CATEGORIES = [
  { id: 'all',      label: '推荐' },
  { id: 'clothing', label: '女装' },
  { id: 'food',     label: '白牌食品' },
  { id: 'beauty',   label: '美妆' },
  { id: 'home',     label: '家居' },
  { id: 'digital',  label: '数码' },
  { id: 'baby',     label: '母婴' },
  { id: 'sport',    label: '运动' },
]

// 视频文件对应真实内容（文字信息必须与视频画面一致）：
//   file1772678460526.mp4  → 绿色+紫色芦荟纤维袜，自然旋涡背景
//   building_fx.mp4        → 紫色霓虹城市夜景，品牌感（适合美妆/数码/时尚）
//   cat_cry.mp4            → 萌系橘猫，适合宠物/家居/母婴
const VID = {
  socks:  '/videos/file1772678460526.mp4',
  city:   '/videos/building_fx.mp4',
  cat:    '/videos/cat_cry.mp4',
}

const ALL_VIDEOS = [
  // ─── 女装：芦荟抑菌袜（视频=绿紫袜子+芦荟背景）───────────────
  {
    id: 1,
    category: 'clothing',
    videoUrl: VID.socks,
    gradient: 'linear-gradient(160deg,#134e2a,#56c57a,#a8edca)',
    account: { name: '袜子研究所', handle: '@socks_lab', avatar: '穿', color: '#56c57a', fans: '45.2万' },
    likes: 128400, favorites: 34200, shares: 8900, profit: 2340,
    duration: 15,
    title: '芦荟抑菌袜真的绝！穿了一周脚不臭，宿舍室友全来问我买哪家',
    tags: ['女装', '抑菌袜', '芦荟纤维'],
    music: '清新自然音 · 芦荟研究所',
    hookType: '痛点共鸣型', hookEmoji: '😰',
    hookDesc: '前3秒脚臭尴尬场景放大，产品一出立刻对比解决',
    isHot: true,
  },

  // ─── 白牌食品：猫咪冻干零食（视频=橘猫萌系）────────────────────
  {
    id: 2,
    category: 'food',
    videoUrl: VID.cat,
    gradient: 'linear-gradient(160deg,#f7971e,#ffd200)',
    account: { name: '猫的零食铺', handle: '@cat_snacks', avatar: '猫', color: '#f7971e', fans: '28.7万' },
    likes: 89600, favorites: 21300, shares: 5600, profit: 1890,
    duration: 12,
    title: '猫咪看一眼就扑过来！进口冻干零食连挑食星人都疯狂，一袋才9.9',
    tags: ['宠物零食', '猫零食', '白牌食品'],
    music: '萌宠BGM · 猫咪日记',
    hookType: '萌宠反应型', hookEmoji: '🐱',
    hookDesc: '前2秒猫咪飞奔扑食反应，宠物情绪瞬间带动购买欲',
    isHot: true,
  },

  // ─── 美妆：护肤品（视频=紫色城市夜景品牌感）─────────────────────
  {
    id: 3,
    category: 'beauty',
    videoUrl: VID.city,
    gradient: 'linear-gradient(160deg,#f953c6,#b91d73)',
    account: { name: 'Lily美妆笔记', handle: '@beauty_lily', avatar: '妆', color: '#f953c6', fans: '112万' },
    likes: 234500, favorites: 67800, shares: 18200, profit: 5670,
    duration: 18,
    title: '平价代替贵妇面霜！皮肤科医生亲测这个成分，用完皮肤直接封神',
    tags: ['美妆', '护肤', '平替'],
    music: '氛围感纯音乐 · 霓虹城市',
    hookType: '权威背书型', hookEmoji: '👨‍⚕️',
    hookDesc: '霓虹城市夜景烘托高端感，皮肤科医生资质背书引出产品',
    isHot: true,
  },

  // ─── 家居：记忆棉坐垫（视频=橘猫蜷缩舒适感）────────────────────
  {
    id: 4,
    category: 'home',
    videoUrl: VID.cat,
    gradient: 'linear-gradient(160deg,#fc5c7d,#6a3093)',
    account: { name: '橘猫居家日记', handle: '@cat_home', avatar: '家', color: '#fc5c7d', fans: '33.1万' },
    likes: 67200, favorites: 28900, shares: 4300, profit: 1240,
    duration: 10,
    title: '橘猫睡着都不肯走！这款记忆棉坐垫软度封神，久坐腰不酸的秘密',
    tags: ['家居', '坐垫', '记忆棉'],
    music: '治愈猫咪音乐 · 慵懒午后',
    hookType: '场景代入型', hookEmoji: '🐈',
    hookDesc: '前3秒橘猫舒展蜷缩反应，用萌宠体验代入居家舒适感',
    isHot: false,
  },

  // ─── 数码：手机（视频=赛博朋克城市夜景）──────────────────────────
  {
    id: 5,
    category: 'digital',
    videoUrl: VID.city,
    gradient: 'linear-gradient(160deg,#0575e6,#021b79)',
    account: { name: '数码老狗', handle: '@tech_dog', avatar: '数', color: '#0575e6', fans: '89.4万' },
    likes: 156700, favorites: 43200, shares: 22100, profit: 4320,
    duration: 20,
    title: '799手机打游戏不输iPhone！发布会现场不敢公布的实测数据来了',
    tags: ['数码', '手机', '性价比'],
    music: '赛博朋克电子乐 · 未来感',
    hookType: '反常识冲击型', hookEmoji: '🤯',
    hookDesc: '赛博朋克城市建立科技感，反常识标题前3秒引爆好奇心',
    isHot: true,
  },

  // ─── 母婴：安抚玩具（视频=萌猫画面营造亲近感）───────────────────
  {
    id: 6,
    category: 'baby',
    videoUrl: VID.cat,
    gradient: 'linear-gradient(160deg,#ffd89b,#19547b)',
    account: { name: '宝宝成长日记', handle: '@baby_grow', avatar: '婴', color: '#19547b', fans: '67.3万' },
    likes: 98300, favorites: 54100, shares: 12300, profit: 2890,
    duration: 14,
    title: '儿科医生推荐！猫咪安抚玩具让宝宝自主入睡，宝妈终于解放了',
    tags: ['母婴', '安抚玩具', '婴儿睡眠'],
    music: '温馨摇篮曲 · 猫咪轻音乐',
    hookType: '专家背书型', hookEmoji: '👶',
    hookDesc: '萌猫画面引发情感共鸣，儿科医生专业背书建立购买信任',
    isHot: false,
  },

  // ─── 运动：防滑运动袜（视频=绿紫运动袜）──────────────────────────
  {
    id: 7,
    category: 'sport',
    videoUrl: VID.socks,
    gradient: 'linear-gradient(160deg,#1d976c,#93f9b9)',
    account: { name: '运动装备测评', handle: '@gear_test', avatar: '运', color: '#1d976c', fans: '201万' },
    likes: 312400, favorites: 89600, shares: 34500, profit: 8760,
    duration: 16,
    title: '马拉松冠军同款！这双防滑运动袜跑50公里不起泡，脚感绝了',
    tags: ['运动', '专业运动袜', '马拉松'],
    music: '运动节奏BGM · 燃爆',
    hookType: '专业测评型', hookEmoji: '🏃',
    hookDesc: '前3秒展示实测跑步数据，精准触达跑步党和运动爱好者',
    isHot: true,
  },

  // ─── 女装（第2条）：显瘦直筒裤（视频=霓虹城市时尚感）───────────
  {
    id: 8,
    category: 'clothing',
    videoUrl: VID.city,
    gradient: 'linear-gradient(160deg,#e96c35,#c0392b)',
    account: { name: '夜场穿搭星球', handle: '@night_style', avatar: '穿', color: '#e96c35', fans: '78.9万' },
    likes: 187300, favorites: 62100, shares: 15600, profit: 4230,
    duration: 11,
    title: '微胖也能驾驭！这条直筒裤把我168穿出172感，腿长显瘦绝了',
    tags: ['女装', '显瘦', '直筒裤'],
    music: '流行时尚热歌 · 霓虹夜',
    hookType: '情绪共鸣型', hookEmoji: '❤️',
    hookDesc: '霓虹城市夜景烘托时尚感，穿搭前后对比情绪共鸣爆棚',
    isHot: true,
  },
]

export const useVideoStore = defineStore('video', () => {
  const activeCategory = ref('all')
  const currentIndex = ref(0)

  const filteredVideos = computed(() => {
    if (activeCategory.value === 'all') return ALL_VIDEOS
    return ALL_VIDEOS.filter(v => v.category === activeCategory.value)
  })

  const currentVideo = computed(() => filteredVideos.value[currentIndex.value] || null)

  function setCategory(catId) {
    activeCategory.value = catId
    currentIndex.value = 0
  }

  function nextVideo() {
    if (currentIndex.value < filteredVideos.value.length - 1) {
      currentIndex.value++
    }
  }

  function prevVideo() {
    if (currentIndex.value > 0) {
      currentIndex.value--
    }
  }

  function formatCount(n) {
    if (n >= 10000) return (n / 10000).toFixed(1) + '万'
    return n.toString()
  }

  return { activeCategory, currentIndex, filteredVideos, currentVideo, setCategory, nextVideo, prevVideo, formatCount }
})
