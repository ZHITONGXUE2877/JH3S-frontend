<script setup>
import { ref, watch, onMounted } from 'vue'
import { useVideoStore, getSessionId, getDeviceType } from '../stores/videoStore'

const props = defineProps({ video: Object })
const emit  = defineEmits(['oneTap'])

const store     = useVideoStore()
const API_BASE  = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
const sessionId = getSessionId()
const device    = getDeviceType()

// ── 本地互动状态（乐观更新）─────────────────────────────────────
const liked      = ref(false)
const saved      = ref(false)
const likeCount  = ref(0)
const favCount   = ref(0)
const shareCount = ref(0)

// ── 防重复发送 ────────────────────────────────────────────────
let lastContentId = ''

// ── 加载该视频的实时统计 ─────────────────────────────────────────
async function loadStats() {
  if (!props.video?.content_id) return
  const cid = props.video.content_id
  if (cid === lastContentId) return
  lastContentId = cid

  try {
    // 拉取聚合统计
    const [statsR, stateR] = await Promise.all([
      fetch(`${API_BASE}/v1/engagement/stats/${cid}`),
      fetch(`${API_BASE}/v1/engagement/user_state?content_id=${cid}&session_id=${sessionId}`),
    ])
    const stats = await statsR.json()
    const state = await stateR.json()

    likeCount.value  = stats.like_count     || 0
    favCount.value   = stats.favorite_count || 0
    shareCount.value = stats.share_count    || 0
    liked.value      = state.liked     || false
    saved.value      = state.favorited || false
  } catch {
    // 网络失败时保持 0，不崩溃
    likeCount.value = favCount.value = shareCount.value = 0
  }
}

// ── 发送互动事件 ──────────────────────────────────────────────
async function sendEvent(eventType) {
  if (!props.video?.content_id) return
  try {
    await fetch(`${API_BASE}/v1/engagement/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content_id:  props.video.content_id,
        event_type:  eventType,
        session_id:  sessionId,
        device_type: device,
      }),
    })
  } catch { /* 发送失败不影响 UI */ }
}

// ── 交互函数 ──────────────────────────────────────────────────
function toggleLike() {
  liked.value = !liked.value
  likeCount.value += liked.value ? 1 : -1
  sendEvent(liked.value ? 'like' : 'unlike')
}

function toggleFavorite() {
  saved.value = !saved.value
  favCount.value += saved.value ? 1 : -1
  sendEvent(saved.value ? 'favorite' : 'unfavorite')
}

async function doShare() {
  shareCount.value++
  sendEvent('share')
  // 原生分享（移动端支持时）
  if (navigator.share && props.video?.title) {
    try {
      await navigator.share({
        title: props.video.title,
        text:  props.video.title,
        url:   window.location.href,
      })
    } catch { /* 用户取消分享 */ }
  }
}

function doMakeSame() {
  sendEvent('make_same')
  emit('oneTap', props.video)
}

// ── 视频切换时刷新 ────────────────────────────────────────────
watch(() => props.video?.content_id, () => {
  liked.value = saved.value = false
  likeCount.value = favCount.value = shareCount.value = 0
  loadStats()
})

onMounted(loadStats)
</script>

<template>
  <div class="sidebar" v-if="video">
    <!-- 头像 + 关注 -->
    <div class="avatar-wrap">
      <div class="avatar" :style="{ background: video.account.color }">
        {{ video.account.avatar }}
      </div>
      <div class="follow-btn">+</div>
    </div>

    <!-- 点赞 -->
    <button class="action-item" @click="toggleLike">
      <span class="action-icon" :class="{ liked }">
        <svg viewBox="0 0 24 24" width="32" height="32">
          <path :fill="liked ? '#FE2C55' : 'white'"
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.27 2 8.5
               2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08
               C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.41 22 8.5
               c0 3.77-3.4 6.86-8.55 11.53L12 21.35z"/>
        </svg>
      </span>
      <span class="action-label">{{ store.formatCount(likeCount) }}</span>
    </button>

    <!-- 收藏 -->
    <button class="action-item" @click="toggleFavorite">
      <span class="action-icon" :class="{ saved }">
        <svg viewBox="0 0 24 24" width="32" height="32">
          <path :fill="saved ? '#FFD700' : 'white'"
            d="M17 3H7a2 2 0 00-2 2v16l7-3 7 3V5a2 2 0 00-2-2z"/>
        </svg>
      </span>
      <span class="action-label">{{ store.formatCount(favCount) }}</span>
    </button>

    <!-- 分享 -->
    <button class="action-item" @click="doShare">
      <span class="action-icon">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="white">
          <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7
                   c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11
                   c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3
                   -3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81
                   C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3
                   c.79 0 1.5-.31 2.04-.81l7.12 4.15c-.05.21-.08.43-.08.66
                   0 1.61 1.31 2.91 2.92 2.91 1.61 0 2.92-1.3 2.92-2.91
                   s-1.31-2.92-2.92-2.92z"/>
        </svg>
      </span>
      <span class="action-label">{{ store.formatCount(shareCount) }}</span>
    </button>

    <!-- 盈利：前端隐藏，后台有接口 -->
    <!-- <div class="action-item profit-item">
      <span class="action-icon profit-icon">💰</span>
      <span class="action-label profit-label">¥{{ video.profit.toLocaleString() }}</span>
      <span class="profit-sub">预估收益</span>
    </div> -->

    <!-- 一键做同款 -->
    <button class="onetap-btn" @click="doMakeSame">
      <span class="onetap-icon">✨</span>
      <span class="onetap-text">同款</span>
    </button>
  </div>
</template>

<style scoped>
.sidebar {
  position: absolute;
  right: 12px;
  bottom: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  z-index: 15;
}

.avatar-wrap { position: relative; }
.avatar {
  width: 50px; height: 50px;
  border-radius: 50%;
  border: 2px solid #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 700; color: #fff;
}
.follow-btn {
  position: absolute;
  bottom: -8px; left: 50%;
  transform: translateX(-50%);
  width: 20px; height: 20px;
  background: #FE2C55;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; color: #fff;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(254,44,85,.5);
}

.action-item {
  background: none;
  border: none;
  display: flex; flex-direction: column;
  align-items: center; gap: 3px;
  cursor: pointer; padding: 0;
}
.action-icon {
  display: flex; align-items: center; justify-content: center;
  width: 48px; height: 48px;
  background: rgba(255,255,255,0.15);
  border-radius: 50%;
  backdrop-filter: blur(8px);
  transition: transform 0.15s, background 0.15s;
}
.action-icon:active { transform: scale(0.88); }
.action-icon.liked  { background: rgba(254,44,85,0.2); }
.action-icon.saved  { background: rgba(255,215,0,0.2); }

.action-label {
  font-size: 12px; font-weight: 600;
  color: #fff;
  text-shadow: 0 1px 4px rgba(0,0,0,0.6);
  min-width: 28px; text-align: center;
}

.onetap-btn {
  background: linear-gradient(135deg, #FE2C55, #FF6B35);
  border: none;
  border-radius: 20px;
  padding: 8px 10px;
  display: flex; flex-direction: column;
  align-items: center; gap: 2px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(254,44,85,0.5);
  transition: transform 0.15s, box-shadow 0.15s;
}
.onetap-btn:active {
  transform: scale(0.92);
  box-shadow: 0 2px 8px rgba(254,44,85,0.4);
}
.onetap-icon { font-size: 20px; }
.onetap-text {
  font-size: 11px; font-weight: 700; color: #fff;
  line-height: 1;
}
</style>
