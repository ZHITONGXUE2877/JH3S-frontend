import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// ── 匿名 Session ID（存 localStorage，跨页面保留）────────────────
export function getSessionId() {
  let sid = localStorage.getItem('jh3s_session')
  if (!sid) {
    sid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now()
    localStorage.setItem('jh3s_session', sid)
  }
  return sid
}

// ── 设备类型检测 ────────────────────────────────────────────────
export function getDeviceType() {
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
}

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

// ── 注意：likes/favorites/shares/profit 全部归零 ─────────────
// 后台会实时收集真实互动数据，前端通过 /v1/engagement/stats 接口
// 获取真实计数并动态渲染。profit 字段前端隐藏，后台预留接口。
const ALL_VIDEOS = [
  {
    id: 1, content_id: 'video_1',
    category: 'clothing',
    videoUrl: VID.socks,
    gradient: 'linear-gradient(160deg,#134e2a,#56c57a,#a8edca)',
    account: { name: '袜子研究所', handle: '@socks_lab', avatar: '穿', color: '#56c57a', fans: '45.2万' },
    likes: 0, favorites: 0, shares: 0, profit: 0,
    duration: 15,
    title: '芦荟抑菌袜真的绝！穿了一周脚不臭，宿舍室友全来问我买哪家',
    tags: ['女装', '抑菌袜', '芦荟纤维'],
    music: '清新自然音 · 芦荟研究所',
    hookType: '痛点共鸣型', hookEmoji: '😰',
    hookDesc: '前3秒脚臭尴尬场景放大，产品一出立刻对比解决',
    isHot: true,
  },
  {
    id: 2, content_id: 'video_2',
    category: 'food',
    videoUrl: VID.cat,
    gradient: 'linear-gradient(160deg,#f7971e,#ffd200)',
    account: { name: '猫的零食铺', handle: '@cat_snacks', avatar: '猫', color: '#f7971e', fans: '28.7万' },
    likes: 0, favorites: 0, shares: 0, profit: 0,
    duration: 12,
    title: '猫咪看一眼就扑过来！进口冻干零食连挑食星人都疯狂，一袋才9.9',
    tags: ['宠物零食', '猫零食', '白牌食品'],
    music: '萌宠BGM · 猫咪日记',
    hookType: '萌宠反应型', hookEmoji: '🐱',
    hookDesc: '前2秒猫咪飞奔扑食反应，宠物情绪瞬间带动购买欲',
    isHot: true,
  },
  {
    id: 3, content_id: 'video_3',
    category: 'beauty',
    videoUrl: VID.city,
    gradient: 'linear-gradient(160deg,#f953c6,#b91d73)',
    account: { name: 'Lily美妆笔记', handle: '@beauty_lily', avatar: '妆', color: '#f953c6', fans: '112万' },
    likes: 0, favorites: 0, shares: 0, profit: 0,
    duration: 18,
    title: '平价代替贵妇面霜！皮肤科医生亲测这个成分，用完皮肤直接封神',
    tags: ['美妆', '护肤', '平替'],
    music: '氛围感纯音乐 · 霓虹城市',
    hookType: '权威背书型', hookEmoji: '👨‍⚕️',
    hookDesc: '霓虹城市夜景烘托高端感，皮肤科医生资质背书引出产品',
    isHot: true,
  },
  {
    id: 4, content_id: 'video_4',
    category: 'home',
    videoUrl: VID.cat,
    gradient: 'linear-gradient(160deg,#fc5c7d,#6a3093)',
    account: { name: '橘猫居家日记', handle: '@cat_home', avatar: '家', color: '#fc5c7d', fans: '33.1万' },
    likes: 0, favorites: 0, shares: 0, profit: 0,
    duration: 10,
    title: '橘猫睡着都不肯走！这款记忆棉坐垫软度封神，久坐腰不酸的秘密',
    tags: ['家居', '坐垫', '记忆棉'],
    music: '治愈猫咪音乐 · 慵懒午后',
    hookType: '场景代入型', hookEmoji: '🐈',
    hookDesc: '前3秒橘猫舒展蜷缩反应，用萌宠体验代入居家舒适感',
    isHot: false,
  },
  {
    id: 5, content_id: 'video_5',
    category: 'digital',
    videoUrl: VID.city,
    gradient: 'linear-gradient(160deg,#0575e6,#021b79)',
    account: { name: '数码老狗', handle: '@tech_dog', avatar: '数', color: '#0575e6', fans: '89.4万' },
    likes: 0, favorites: 0, shares: 0, profit: 0,
    duration: 20,
    title: '799手机打游戏不输iPhone！发布会现场不敢公布的实测数据来了',
    tags: ['数码', '手机', '性价比'],
    music: '赛博朋克电子乐 · 未来感',
    hookType: '反常识冲击型', hookEmoji: '🤯',
    hookDesc: '赛博朋克城市建立科技感，反常识标题前3秒引爆好奇心',
    isHot: true,
  },
  {
    id: 6, content_id: 'video_6',
    category: 'baby',
    videoUrl: VID.cat,
    gradient: 'linear-gradient(160deg,#ffd89b,#19547b)',
    account: { name: '宝宝成长日记', handle: '@baby_grow', avatar: '婴', color: '#19547b', fans: '67.3万' },
    likes: 0, favorites: 0, shares: 0, profit: 0,
    duration: 14,
    title: '儿科医生推荐！猫咪安抚玩具让宝宝自主入睡，宝妈终于解放了',
    tags: ['母婴', '安抚玩具', '婴儿睡眠'],
    music: '温馨摇篮曲 · 猫咪轻音乐',
    hookType: '专家背书型', hookEmoji: '👶',
    hookDesc: '萌猫画面引发情感共鸣，儿科医生专业背书建立购买信任',
    isHot: false,
  },
  {
    id: 7, content_id: 'video_7',
    category: 'sport',
    videoUrl: VID.socks,
    gradient: 'linear-gradient(160deg,#1d976c,#93f9b9)',
    account: { name: '运动装备测评', handle: '@gear_test', avatar: '运', color: '#1d976c', fans: '201万' },
    likes: 0, favorites: 0, shares: 0, profit: 0,
    duration: 16,
    title: '马拉松冠军同款！这双防滑运动袜跑50公里不起泡，脚感绝了',
    tags: ['运动', '专业运动袜', '马拉松'],
    music: '运动节奏BGM · 燃爆',
    hookType: '专业测评型', hookEmoji: '🏃',
    hookDesc: '前3秒展示实测跑步数据，精准触达跑步党和运动爱好者',
    isHot: true,
  },
  {
    id: 8, content_id: 'video_8',
    category: 'clothing',
    videoUrl: VID.city,
    gradient: 'linear-gradient(160deg,#e96c35,#c0392b)',
    account: { name: '夜场穿搭星球', handle: '@night_style', avatar: '穿', color: '#e96c35', fans: '78.9万' },
    likes: 0, favorites: 0, shares: 0, profit: 0,
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
