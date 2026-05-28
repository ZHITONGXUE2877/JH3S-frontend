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
  { id: 'clothing', label: '服饰鞋包' },
  { id: 'beauty',   label: '美妆护肤' },
  { id: 'food',     label: '食品饮料' },
  { id: 'home',     label: '家居个清' },
  { id: 'digital',  label: '3C数码' },
  { id: 'baby',     label: '母婴宠物' },
  { id: 'jewelry',  label: '珠宝文玩' },
  { id: 'sport',    label: '运动户外' },
  { id: 'fresh',    label: '生鲜果蔬' },
  { id: 'auto',     label: '汽车用品' },
  { id: 'other',    label: '其他' },
]

// ── 品类渐变色映射 ───────────────────────────────────────────────
const CATEGORY_GRADIENT = {
  clothing: 'linear-gradient(160deg,#e96c35,#c0392b)',
  beauty:   'linear-gradient(160deg,#f953c6,#b91d73)',
  food:     'linear-gradient(160deg,#f7971e,#ffd200)',
  home:     'linear-gradient(160deg,#fc5c7d,#6a3093)',
  digital:  'linear-gradient(160deg,#0575e6,#021b79)',
  baby:     'linear-gradient(160deg,#ffd89b,#19547b)',
  jewelry:  'linear-gradient(160deg,#f6d365,#fda085)',
  sport:    'linear-gradient(160deg,#1d976c,#93f9b9)',
  fresh:    'linear-gradient(160deg,#56ab2f,#a8e063)',
  auto:     'linear-gradient(160deg,#373b44,#4286f4)',
  other:    'linear-gradient(160deg,#8e9eab,#eef2f3)',
  default:  'linear-gradient(160deg,#6366f1,#8b5cf6)',
}

const CATEGORY_COLOR = {
  clothing: '#e96c35', beauty: '#f953c6', food: '#f7971e',
  home: '#fc5c7d', digital: '#0575e6', baby: '#19547b',
  jewelry: '#fda085', sport: '#1d976c', fresh: '#56ab2f',
  auto: '#4286f4', other: '#8e9eab', default: '#8b5cf6',
}

// ── API 地址 ─────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

// ── StyleTemplate → Video 对象映射 ──────────────────────────────
function styleToVideo(s, index) {
  const cat = s.category || 'default'
  const creatorName = s.creator_name || s.name || '创作者'
  const avatarChar  = creatorName.slice(0, 1)
  return {
    id:          index + 1,
    content_id:  s.id,
    category:    cat,
    videoUrl:    s.demo_video_url || '',
    gradient:    CATEGORY_GRADIENT[cat] || CATEGORY_GRADIENT.default,
    account: {
      name:   creatorName,
      handle: '@' + s.id.slice(0, 8),
      avatar: avatarChar,
      color:  CATEGORY_COLOR[cat] || CATEGORY_COLOR.default,
      fans:   '0',
    },
    likes: 0, favorites: 0, shares: 0, profit: 0,
    duration: s.video_duration || 5,
    title:    s.name || '精品视频',
    tags:     [s.category || '推荐'],
    music:    '专属配乐',
    hookType: '产品展示型',
    hookEmoji: '✨',
    hookDesc:  s.name || '',
    isHot:     false,
  }
}

// ── 兜底演示视频（后台还没有发布内容时展示）───────────────────────
const DEMO_VIDEOS = [
  {
    id: 1, content_id: 'demo_1',
    category: 'beauty',
    videoUrl: '/videos/building_fx.mp4',
    gradient: 'linear-gradient(160deg,#f953c6,#b91d73)',
    account: { name: '演示账号', handle: '@demo', avatar: '示', color: '#f953c6', fans: '—' },
    likes: 0, favorites: 0, shares: 0, profit: 0,
    duration: 10,
    title: '（演示）管理员发布视频后将在此展示',
    tags: ['演示'],
    music: '—',
    hookType: '演示', hookEmoji: '🎬', hookDesc: '后台审核通过并发布后自动出现', isHot: false,
  },
]

export const useVideoStore = defineStore('video', () => {
  const activeCategory = ref('all')
  const currentIndex   = ref(0)
  const allVideos      = ref([])
  const loading        = ref(false)

  // ── 从后端拉取已发布视频 ──────────────────────────────────────
  async function fetchVideos() {
    loading.value = true
    try {
      const res = await fetch(`${API_BASE}/v1/styles?published=true`)
      if (!res.ok) throw new Error('API error')
      const styles = await res.json()
      // 过滤掉没有 demo_video_url 的
      const valid = styles.filter(s => s.demo_video_url)
      allVideos.value = valid.length > 0
        ? valid.map((s, i) => styleToVideo(s, i))
        : DEMO_VIDEOS
    } catch {
      // 网络失败 → 用演示视频
      allVideos.value = DEMO_VIDEOS
    } finally {
      loading.value = false
    }
  }

  const filteredVideos = computed(() => {
    const vids = allVideos.value.length ? allVideos.value : DEMO_VIDEOS
    if (activeCategory.value === 'all') return vids
    return vids.filter(v => v.category === activeCategory.value)
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

  return {
    activeCategory, currentIndex, allVideos, loading,
    filteredVideos, currentVideo,
    fetchVideos, setCategory, nextVideo, prevVideo, formatCount,
  }
})
