<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useVideoStore, getSessionId, getDeviceType } from '../stores/videoStore'

const API_BASE  = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
const sessionId = getSessionId()
const device    = getDeviceType()

// 上报曝光/播放事件（视频成为当前视频时触发）
function reportView(video) {
  if (!video?.content_id) return
  fetch(`${API_BASE}/v1/engagement/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content_id:  video.content_id,
      event_type:  'view',
      session_id:  sessionId,
      device_type: device,
    }),
  }).catch(() => {}) // 静默失败，不影响 UI
}
import CategoryNav  from '../components/CategoryNav.vue'
import ActionSidebar from '../components/ActionSidebar.vue'
import VideoInfo    from '../components/VideoInfo.vue'
import BottomNav    from '../components/BottomNav.vue'
import OneTapModal  from '../components/OneTapModal.vue'

const store = useVideoStore()

// ─── 三槽视频引用 ──────────────────────────────────
// 布局：[prev | current | next] 垂直堆叠，strip 高度 300vh
// 初始 translateY(-100vh) 让 current 居中显示
const prevEl = ref(null)
const currEl = ref(null)
const nextEl = ref(null)

// ─── 拖拽状态 ──────────────────────────────────────
const dragY      = ref(0)      // 实时手指偏移 px
const animating  = ref(false)  // 正在做 snap 动画
const dragging   = ref(false)
let   startY     = 0
let   startTime  = 0

// strip 的 transform（始终基于 -100vh + dragY）
const stripStyle = computed(() => ({
  transform  : `translateY(calc(-33.3333% + ${dragY.value}px))`,
  transition : animating.value
    ? 'transform 0.38s cubic-bezier(0.25,0.46,0.45,0.94)'
    : 'none',
  willChange : 'transform',
}))

// ─── 进度条 ────────────────────────────────────────
const progress  = ref(0)
const muted     = ref(true)
const isPlaying = ref(false)

function onTimeUpdate() {
  const el = currEl.value
  if (!el?.duration) return
  progress.value = (el.currentTime / el.duration) * 100
}
function onEnded() {
  goNext()
}

// ─── 视频源管理 ────────────────────────────────────
function urlAt(offset) {
  const idx = store.currentIndex + offset
  const list = store.filteredVideos
  if (idx < 0 || idx >= list.length) return ''
  return list[idx]?.videoUrl ?? ''
}

async function refreshSlots() {
  await nextTick()
  // 更新三个槽的 src
  if (prevEl.value) { prevEl.value.src = urlAt(-1); prevEl.value.load() }
  if (currEl.value) {
    currEl.value.src = urlAt(0)
    currEl.value.load()
    currEl.value.play().then(() => { isPlaying.value = true }).catch(() => {})
  }
  if (nextEl.value) { nextEl.value.src = urlAt(1); nextEl.value.load() }
  progress.value = 0
}

// ─── 切换动画 snap ─────────────────────────────────
function snapTo(targetY, afterCb) {
  animating.value = true
  dragY.value = targetY
  setTimeout(() => {
    animating.value = false
    dragY.value = 0      // 复位到中间，由 refreshSlots 重新填充
    if (afterCb) afterCb()
  }, 390)
}

function goNext() {
  if (animating.value) return
  if (store.currentIndex >= store.filteredVideos.length - 1) return
  snapTo(-window.innerHeight, () => {
    store.nextVideo()
    refreshSlots()
    reportView(store.currentVideo)
  })
}
function goPrev() {
  if (animating.value) return
  if (store.currentIndex <= 0) return
  snapTo(window.innerHeight, () => {
    store.prevVideo()
    refreshSlots()
    reportView(store.currentVideo)
  })
}

// ─── Touch ─────────────────────────────────────────
function onTouchStart(e) {
  if (animating.value) return
  startY   = e.touches[0].clientY
  startTime = Date.now()
  dragging.value = true
}
function onTouchMove(e) {
  if (!dragging.value || animating.value) return
  e.preventDefault()
  dragY.value = e.touches[0].clientY - startY
}
function onTouchEnd() {
  if (!dragging.value) return
  dragging.value = false
  const elapsed  = Date.now() - startTime
  const velocity = Math.abs(dragY.value) / Math.max(elapsed, 1) // px/ms
  const threshold = window.innerHeight * 0.22

  if (dragY.value < -threshold || (velocity > 0.4 && dragY.value < -30)) {
    goNext()
  } else if (dragY.value > threshold || (velocity > 0.4 && dragY.value > 30)) {
    goPrev()
  } else {
    snapTo(0)   // 回弹
  }
}

// ─── Wheel（桌面）─────────────────────────────────
let wheelLock = false
function onWheel(e) {
  if (wheelLock || animating.value) return
  wheelLock = true
  setTimeout(() => { wheelLock = false }, 600)
  if (e.deltaY > 0) goNext(); else goPrev()
}

// ─── 键盘 ──────────────────────────────────────────
function onKeydown(e) {
  if (e.key === 'ArrowDown') goNext()
  if (e.key === 'ArrowUp')   goPrev()
  if (e.key === ' ')         { e.preventDefault(); togglePlay() }
  if (e.key === 'm')         muted.value = !muted.value
}

// ─── 点击播放/暂停 ──────────────────────────────────
function togglePlay() {
  const el = currEl.value
  if (!el) return
  if (el.paused) { el.play(); isPlaying.value = true }
  else           { el.pause(); isPlaying.value = false }
}

// ─── 分类切换重置 ──────────────────────────────────
watch(() => store.activeCategory, refreshSlots)

onMounted(async () => {
  // 先拉取后端发布的视频，再初始化播放
  await store.fetchVideos()
  refreshSlots()
  window.addEventListener('keydown', onKeydown)
  // 上报首屏视频曝光
  if (store.currentVideo) reportView(store.currentVideo)
})
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

// ─── 做同款 ────────────────────────────────────────
const modalVisible = ref(false)
const modalVideo   = ref(null)
function openModal(v) { modalVideo.value = v; modalVisible.value = true }
</script>

<template>
  <div
    class="feed-container"
    @touchstart="onTouchStart"
    @touchmove.prevent="onTouchMove"
    @touchend="onTouchEnd"
    @wheel.prevent="onWheel"
  >
    <!-- ── 三槽竖排 strip ────────────────────────── -->
    <div class="strip" :style="stripStyle">

      <!-- 上一条 -->
      <div class="slot">
        <video ref="prevEl" class="vplayer" :muted="muted" playsinline preload="auto" loop />
        <div class="overlay-top"/><div class="overlay-bottom"/>
      </div>

      <!-- 当前 -->
      <div class="slot" @click="togglePlay">
        <video
          ref="currEl"
          class="vplayer"
          :muted="muted"
          playsinline preload="auto" loop
          @timeupdate="onTimeUpdate"
          @ended="onEnded"
          @play="isPlaying=true"
          @pause="isPlaying=false"
        />
        <div class="overlay-top"/><div class="overlay-bottom"/>

        <!-- 暂停提示 -->
        <Transition name="fade">
          <div v-if="!isPlaying" class="pause-icon">⏸</div>
        </Transition>
      </div>

      <!-- 下一条 -->
      <div class="slot">
        <video ref="nextEl" class="vplayer" :muted="muted" playsinline preload="auto" loop />
        <div class="overlay-top"/><div class="overlay-bottom"/>
      </div>

    </div>

    <!-- ── 进度条（固定在屏幕，不随 strip 动）── -->
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: progress + '%' }"/>
    </div>

    <!-- ── 其他 UI 层 ────────────────────────────── -->
    <CategoryNav />
    <ActionSidebar :video="store.currentVideo" @oneTap="openModal" />
    <VideoInfo     :video="store.currentVideo" />

    <div class="video-counter">
      {{ store.currentIndex + 1 }} / {{ store.filteredVideos.length }}
    </div>

    <BottomNav />

    <OneTapModal
      :video="modalVideo"
      :visible="modalVisible"
      @close="modalVisible = false"
    />
  </div>
</template>

<style scoped>
/* 外层：固定视窗，不溢出 */
.feed-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #000;
  max-width: 430px;
  margin: 0 auto;
  touch-action: none;   /* 禁用浏览器默认滚动，让我们接管 */
}

/* strip：三个 slot 竖排，高度 300vh */
.strip {
  display: flex;
  flex-direction: column;
  height: 300vh;
}

/* 每个 slot 占满一屏 */
.slot {
  flex: 0 0 100vh;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: #000;
}

/* 视频填满 slot */
.vplayer {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 渐变遮罩 */
.overlay-top {
  position: absolute;
  top: 0; left: 0; right: 0; height: 200px;
  background: linear-gradient(to bottom, rgba(0,0,0,.5), transparent);
  pointer-events: none;
}
.overlay-bottom {
  position: absolute;
  bottom: 0; left: 0; right: 0; height: 320px;
  background: linear-gradient(to top, rgba(0,0,0,.72), transparent);
  pointer-events: none;
}

/* 暂停图标 */
.pause-icon {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  font-size: 60px;
  pointer-events: none;
}

/* ── 固定在屏幕上的控件 ── */
.mute-btn {
  position: fixed;
  top: 108px; right: calc(50% - 215px + 14px);
  background: rgba(0,0,0,.4);
  border: none; border-radius: 50%;
  width: 34px; height: 34px;
  font-size: 16px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  z-index: 30;
}
@media (max-width: 430px) {
  .mute-btn { right: 14px; }
}

.progress-bar {
  position: fixed;
  bottom: 64px; left: 0; right: 0;
  height: 2px;
  background: rgba(255,255,255,.2);
  z-index: 30;
  pointer-events: none;
  max-width: 430px;
  margin: 0 auto;
}
@media (min-width: 768px) {
  .progress-bar { bottom: 16px; }
  .mute-btn { top: 80px; }
}
.progress-fill {
  height: 100%;
  background: #FE2C55;
  transition: width 100ms linear;
}

.video-counter {
  position: fixed;
  top: 52px;
  right: calc(50% - 215px + 14px);
  font-size: 11px;
  color: rgba(255,255,255,.35);
  z-index: 30;
  pointer-events: none;
}
@media (max-width: 430px) {
  .video-counter { right: 14px; }
}

/* 暂停淡入淡出 */
.fade-enter-active,.fade-leave-active { transition: opacity .25s; }
.fade-enter-from,.fade-leave-to       { opacity: 0; }
</style>
