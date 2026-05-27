<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useVideoStore, CATEGORIES } from '../stores/videoStore'
import BottomNav from '../components/BottomNav.vue'
import OneTapModal from '../components/OneTapModal.vue'

const router = useRouter()
const store = useVideoStore()
const filterCat = ref('all')
const modalVisible = ref(false)
const modalVideo = ref(null)

const filtered = () => filterCat.value === 'all'
  ? store.filteredVideos
  : store.filteredVideos.filter(v => v.category === filterCat.value)

function openModal(v) { modalVideo.value = v; modalVisible.value = true }

function hoverPlay(e)  { e.target.play().catch(() => {}) }
function hoverPause(e) { e.target.pause(); e.target.currentTime = 0 }
</script>

<template>
  <div class="tpl-page">

    <!-- ── 顶部标题栏 ─────────────────────────────── -->
    <div class="tpl-header">
      <button class="back-btn" @click="router.push('/')">
        ← <span class="back-txt">返回发现</span>
      </button>
      <h2>模板库</h2>
      <span class="tpl-count">{{ store.filteredVideos.length }} 个模板</span>
    </div>

    <!-- ── 分类筛选 ─────────────────────────────────── -->
    <div class="filter-row">
      <button
        v-for="cat in CATEGORIES" :key="cat.id"
        :class="['filter-btn', { active: filterCat === cat.id }]"
        @click="filterCat = cat.id"
      >{{ cat.label }}</button>
    </div>

    <!-- ── 模板卡片网格 ─────────────────────────────── -->
    <div class="tpl-grid">
      <div
        v-for="v in store.filteredVideos" :key="v.id"
        class="tpl-card"
        @click="openModal(v)"
      >
        <!-- 封面（桌面端悬停播放视频） -->
        <div class="tpl-thumb" :style="{ background: v.gradient }">
          <video
            v-if="v.videoUrl"
            :src="v.videoUrl"
            class="tpl-video"
            muted loop playsinline preload="none"
            @mouseenter="hoverPlay"
            @mouseleave="hoverPause"
          />
          <span v-if="v.isHot" class="tpl-hot">🔥 爆款</span>
          <span class="tpl-duration">{{ v.duration }}s</span>
          <div class="tpl-onetap">✨ 做同款</div>
        </div>

        <!-- 信息 -->
        <div class="tpl-info">
          <div class="tpl-hook">{{ v.hookEmoji }} {{ v.hookType }}</div>
          <div class="tpl-title">{{ v.title }}</div>
          <div class="tpl-stats">
            ❤️ {{ (v.likes/10000).toFixed(1) }}万 &nbsp;
            💰 ¥{{ v.profit.toLocaleString() }}
          </div>
        </div>
      </div>
    </div>

    <div class="spacer"></div>
    <BottomNav />
    <OneTapModal :video="modalVideo" :visible="modalVisible" @close="modalVisible = false" />
  </div>
</template>

<style scoped>
/* ═══ 基础（移动优先）═══ */
.tpl-page {
  position: relative;
  min-height: 100vh;
  background: #0d0d12;
  color: #fff;
  padding-top: 56px;
}

/* ── 标题栏 ── */
.tpl-header {
  position: fixed; top: 0; left: 0; right: 0;
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px 10px;
  background: rgba(13,13,18,.95);
  backdrop-filter: blur(12px);
  z-index: 30;
}
.back-btn {
  background: rgba(255,255,255,.08); border: none;
  color: rgba(255,255,255,.7); font-size: 13px;
  padding: 5px 12px; border-radius: 20px;
  cursor: pointer; display: flex; align-items: center; gap: 4px;
  transition: background .15s;
}
.back-btn:hover { background: rgba(255,255,255,.15); }
.back-txt { display: none; } /* 手机端只显示箭头 */

.tpl-header h2 { font-size: 18px; font-weight: 800; }
.tpl-count { font-size: 12px; color: rgba(255,255,255,.4); min-width: 60px; text-align: right; }

/* ── 分类筛选 ── */
.filter-row {
  display: flex; gap: 6px; overflow-x: auto;
  padding: 0 14px 12px;
  scrollbar-width: none;
}
.filter-row::-webkit-scrollbar { display: none; }
.filter-btn {
  flex-shrink: 0;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.12);
  color: rgba(255,255,255,.6);
  border-radius: 20px; padding: 5px 14px;
  font-size: 13px; cursor: pointer; transition: all .15s;
}
.filter-btn.active {
  background: #FE2C55; border-color: #FE2C55; color: #fff; font-weight: 700;
}

/* ── 卡片网格（移动端 2列）── */
.tpl-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 0 12px;
}

.tpl-card {
  background: #1a1a22; border-radius: 14px;
  overflow: hidden; cursor: pointer;
  transition: transform .15s, box-shadow .15s;
}
.tpl-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,.4); }
.tpl-card:active { transform: scale(0.97); }

.tpl-thumb {
  width: 100%; padding-top: 133%;
  position: relative; overflow: hidden;
}
.tpl-video {
  position: absolute; inset: 0;
  width: 100%; height: 100%; object-fit: cover;
  opacity: 0; transition: opacity .3s;
}
.tpl-card:hover .tpl-video { opacity: 1; }

.tpl-hot {
  position: absolute; top: 8px; left: 8px;
  background: linear-gradient(90deg, #FE2C55, #FF6B35);
  color: #fff; font-size: 10px; font-weight: 700;
  padding: 2px 8px; border-radius: 8px;
  z-index: 2;
}
.tpl-duration {
  position: absolute; bottom: 48px; right: 8px;
  background: rgba(0,0,0,.55); color: #fff;
  font-size: 10px; padding: 2px 6px; border-radius: 4px;
  z-index: 2;
}
.tpl-onetap {
  position: absolute; bottom: 10px; left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #FE2C55, #FF6B35);
  color: #fff; font-size: 11px; font-weight: 700;
  padding: 5px 14px; border-radius: 12px;
  white-space: nowrap;
  box-shadow: 0 2px 12px rgba(254,44,85,.45);
  z-index: 2;
}

.tpl-info { padding: 10px 10px 12px; }
.tpl-hook { font-size: 11px; color: #FE2C55; font-weight: 700; margin-bottom: 4px; }
.tpl-title {
  font-size: 12px; color: rgba(255,255,255,.8); line-height: 1.4;
  display: -webkit-box; -webkit-box-orient: vertical;
  -webkit-line-clamp: 2; overflow: hidden; margin-bottom: 6px;
}
.tpl-stats { font-size: 11px; color: rgba(255,255,255,.45); }

.spacer { height: 80px; }

/* ═══ 桌面端（≥ 768px）═══ */
@media (min-width: 768px) {
  .tpl-page {
    padding-left: 80px;   /* 让出左侧导航栏宽度 */
    padding-top: 64px;
  }

  .tpl-header {
    left: 80px;           /* 标题栏从导航栏右边开始 */
    padding: 16px 32px 12px;
  }
  .back-txt { display: inline; } /* 桌面显示「返回发现」文字 */

  .filter-row { padding: 0 32px 16px; }

  /* 桌面端：自适应多列，最小卡片宽度 200px */
  .tpl-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    padding: 0 32px;
    max-width: 1280px;
  }

  .tpl-card { border-radius: 16px; }

  .tpl-info { padding: 12px 12px 14px; }
  .tpl-hook { font-size: 12px; }
  .tpl-title { font-size: 13px; }
  .tpl-stats { font-size: 12px; }

  .spacer { height: 40px; }
}

@media (min-width: 1200px) {
  .tpl-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
}
</style>
