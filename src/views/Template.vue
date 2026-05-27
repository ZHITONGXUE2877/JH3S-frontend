<script setup>
import { ref } from 'vue'
import { useVideoStore, CATEGORIES } from '../stores/videoStore'
import BottomNav from '../components/BottomNav.vue'
import OneTapModal from '../components/OneTapModal.vue'

const store = useVideoStore()
const filterCat = ref('all')
const modalVisible = ref(false)
const modalVideo = ref(null)

const filtered = () => filterCat.value === 'all'
  ? store.filteredVideos
  : store.filteredVideos.filter(v => v.category === filterCat.value)

function openModal(v) { modalVideo.value = v; modalVisible.value = true }
</script>

<template>
  <div class="tpl-page">
    <!-- 标题栏 -->
    <div class="tpl-header">
      <h2>模板库</h2>
      <span class="tpl-count">{{ store.filteredVideos.length }} 个模板</span>
    </div>

    <!-- 分类筛选 -->
    <div class="filter-row">
      <button
        v-for="cat in CATEGORIES" :key="cat.id"
        :class="['filter-btn', { active: filterCat === cat.id }]"
        @click="filterCat = cat.id"
      >{{ cat.label }}</button>
    </div>

    <!-- 模板卡片网格 -->
    <div class="tpl-grid">
      <div
        v-for="v in store.filteredVideos" :key="v.id"
        class="tpl-card"
        @click="openModal(v)"
      >
        <!-- 封面 -->
        <div class="tpl-thumb" :style="{ background: v.gradient }">
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

    <div style="height: 90px"></div>
    <BottomNav />
    <OneTapModal :video="modalVideo" :visible="modalVisible" @close="modalVisible = false" />
  </div>
</template>

<style scoped>
.tpl-page {
  position: relative;
  min-height: 100vh;
  background: #0d0d12;
  color: #fff;
  padding-top: 56px;
  max-width: 430px;
  margin: 0 auto;
}

.tpl-header {
  position: fixed; top: 0; left: 0; right: 0;
  max-width: 430px; margin: 0 auto;
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 16px 10px;
  background: #0d0d12;
  z-index: 20;
}
.tpl-header h2 { font-size: 20px; font-weight: 800; }
.tpl-count { font-size: 12px; color: rgba(255,255,255,0.4); }

.filter-row {
  display: flex; gap: 6px; overflow-x: auto;
  padding: 0 14px 12px;
  scrollbar-width: none;
}
.filter-btn {
  flex-shrink: 0;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.6);
  border-radius: 20px; padding: 5px 14px;
  font-size: 13px; cursor: pointer; transition: all 0.15s;
}
.filter-btn.active {
  background: #FE2C55; border-color: #FE2C55; color: #fff; font-weight: 700;
}

.tpl-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 0 12px;
}

.tpl-card {
  background: #1a1a22; border-radius: 14px;
  overflow: hidden; cursor: pointer;
  transition: transform 0.15s;
}
.tpl-card:active { transform: scale(0.97); }

.tpl-thumb {
  width: 100%; padding-top: 133%; /* 3:4 ratio */
  position: relative;
}
.tpl-hot {
  position: absolute; top: 8px; left: 8px;
  background: linear-gradient(90deg, #FE2C55, #FF6B35);
  color: #fff; font-size: 10px; font-weight: 700;
  padding: 2px 8px; border-radius: 8px;
}
.tpl-duration {
  position: absolute; bottom: 8px; right: 8px;
  background: rgba(0,0,0,0.5); color: #fff;
  font-size: 10px; padding: 2px 6px; border-radius: 4px;
}
.tpl-onetap {
  position: absolute; bottom: 8px; left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #FE2C55, #FF6B35);
  color: #fff; font-size: 11px; font-weight: 700;
  padding: 4px 12px; border-radius: 12px;
  white-space: nowrap;
  box-shadow: 0 2px 10px rgba(254,44,85,0.4);
}

.tpl-info { padding: 10px 10px 12px; }
.tpl-hook {
  font-size: 11px; color: #FE2C55; font-weight: 700; margin-bottom: 4px;
}
.tpl-title {
  font-size: 12px; color: rgba(255,255,255,0.8); line-height: 1.4;
  display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden;
  margin-bottom: 6px;
}
.tpl-stats { font-size: 11px; color: rgba(255,255,255,0.45); }
</style>
