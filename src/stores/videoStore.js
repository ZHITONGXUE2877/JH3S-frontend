import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const CATEGORIES = [
  { id: 'all', label: '推荐' },
  { id: 'clothing', label: '女装' },
  { id: 'food', label: '白牌食品' },
  { id: 'beauty', label: '美妆' },
  { id: 'home', label: '家居' },
  { id: 'digital', label: '数码' },
  { id: 'baby', label: '母婴' },
  { id: 'sport', label: '运动' },
]

// 本地视频循环复用（3个视频 → 8条 mock 数据）
const VIDEOS = [
  '/videos/file1772678460526.mp4',
  '/videos/building_fx.mp4',
  '/videos/cat_cry.mp4',
]
const v = (i) => VIDEOS[i % VIDEOS.length]

const ALL_VIDEOS = [
  {
    id: 1,
    category: 'clothing',
    videoUrl: v(0),
    gradient: 'linear-gradient(160deg,#3a1c71,#d76d77,#ffaf7b)',
    account: { name: '时尚穿搭日记', handle: '@fashion_daily', avatar: '穿', color: '#d76d77', fans: '45.2万' },
    likes: 128400, favorites: 34200, shares: 8900, profit: 2340,
    duration: 15,
    title: '这件拼接外套真的绝了！老板娘教你选爆款，月销3000件的秘密',
    tags: ['女装', '穿搭', '爆款外套'],
    music: '原创音乐 · 时尚穿搭日记',
    hookType: '痛点共鸣型', hookEmoji: '😱',
    hookDesc: '前3秒穿搭对比反差，瞬间抓住眼球',
    isHot: true,
  },
  {
    id: 2,
    category: 'food',
    videoUrl: v(1),
    gradient: 'linear-gradient(160deg,#11998e,#38ef7d)',
    account: { name: '白牌零食测评', handle: '@snack_lab', avatar: '食', color: '#11998e', fans: '28.7万' },
    likes: 89600, favorites: 21300, shares: 5600, profit: 1890,
    duration: 12,
    title: '超市同款！这个零食工厂直供只要9.9，好吃到停不下来',
    tags: ['白牌食品', '零食', '性价比'],
    music: '美食bgm合集 · 原声',
    hookType: '价格冲击型', hookEmoji: '💥',
    hookDesc: '前2秒报价格+展示产品，制造价格锚点',
    isHot: true,
  },
  {
    id: 3,
    category: 'beauty',
    videoUrl: v(2),
    gradient: 'linear-gradient(160deg,#f953c6,#b91d73)',
    account: { name: '美妆姐姐Lily', handle: '@beauty_lily', avatar: '妆', color: '#f953c6', fans: '112万' },
    likes: 234500, favorites: 67800, shares: 18200, profit: 5670,
    duration: 18,
    title: '平价代替贵妇面霜！皮肤科医生推荐这个成分，用完直接封神',
    tags: ['美妆', '护肤', '平替'],
    music: '氛围感纯音乐 · 治愈',
    hookType: '权威背书型', hookEmoji: '👨‍⚕️',
    hookDesc: '开头引用专业资质，建立信任感后引出产品',
    isHot: true,
  },
  {
    id: 4,
    category: 'home',
    videoUrl: v(0),
    gradient: 'linear-gradient(160deg,#1a1a2e,#16213e,#0f3460)',
    account: { name: '家居好物分享', handle: '@home_picks', avatar: '家', color: '#0f3460', fans: '33.1万' },
    likes: 67200, favorites: 28900, shares: 4300, profit: 1240,
    duration: 10,
    title: '租房党必入！这个折叠储物神器，让30㎡小户型多出5㎡空间',
    tags: ['家居', '收纳', '小户型'],
    music: '治愈生活BGM · 原声',
    hookType: '场景代入型', hookEmoji: '🏠',
    hookDesc: '前3秒展示凌乱场景，痛点直击再出解决方案',
    isHot: false,
  },
  {
    id: 5,
    category: 'digital',
    videoUrl: v(1),
    gradient: 'linear-gradient(160deg,#0575e6,#021b79)',
    account: { name: '数码老狗', handle: '@tech_dog', avatar: '数', color: '#0575e6', fans: '89.4万' },
    likes: 156700, favorites: 43200, shares: 22100, profit: 4320,
    duration: 20,
    title: '花2000块买旗舰机的都是冤种！这个配置只要799，打游戏不输iPhone',
    tags: ['数码', '手机', '性价比'],
    music: '科技感节拍 · 电子',
    hookType: '反常识冲击型', hookEmoji: '🤯',
    hookDesc: '前3秒反常识结论引发好奇，强制完播',
    isHot: true,
  },
  {
    id: 6,
    category: 'baby',
    videoUrl: v(2),
    gradient: 'linear-gradient(160deg,#ffd89b,#19547b)',
    account: { name: '宝宝成长日记', handle: '@baby_grow', avatar: '婴', color: '#19547b', fans: '67.3万' },
    likes: 98300, favorites: 54100, shares: 12300, profit: 2890,
    duration: 14,
    title: '儿科医生亲测！这个辅食方案让娃多吃2碗饭，妈妈们收藏备用',
    tags: ['母婴', '辅食', '育儿'],
    music: '温馨儿歌 · 轻音乐',
    hookType: '专家背书+数据型', hookEmoji: '📊',
    hookDesc: '引用医生+具体数据，权威感拉满',
    isHot: false,
  },
  {
    id: 7,
    category: 'sport',
    videoUrl: v(0),
    gradient: 'linear-gradient(160deg,#f7971e,#ffd200)',
    account: { name: '健身教练小王', handle: '@coach_wang', avatar: '运', color: '#f7971e', fans: '201万' },
    likes: 312400, favorites: 89600, shares: 34500, profit: 8760,
    duration: 16,
    title: '不用去健身房！这5个动作在家练，30天腰围少了10cm（附计划）',
    tags: ['运动', '减脂', '健身'],
    music: '运动节奏BGM · 燃爆',
    hookType: '结果展示型', hookEmoji: '💪',
    hookDesc: '前3秒直出before/after对比，结果冲击力最强',
    isHot: true,
  },
  {
    id: 8,
    category: 'clothing',
    videoUrl: v(1),
    gradient: 'linear-gradient(160deg,#e96c35,#c0392b)',
    account: { name: '显瘦穿搭研究所', handle: '@slim_style', avatar: '瘦', color: '#c0392b', fans: '78.9万' },
    likes: 187300, favorites: 62100, shares: 15600, profit: 4230,
    duration: 11,
    title: '微胖姐妹哭着来感谢我！这条裤子真的把腿显细了20斤',
    tags: ['女装', '显瘦', '微胖穿搭'],
    music: '流行热歌 · 精选',
    hookType: '情绪共鸣型', hookEmoji: '❤️',
    hookDesc: '前3秒引发情绪共鸣，用户代入感强烈',
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
