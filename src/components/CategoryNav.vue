<script setup>
import { useVideoStore, CATEGORIES } from '../stores/videoStore'

const store = useVideoStore()
</script>

<template>
  <nav class="cat-nav">
    <div class="cat-scroll">
      <button
        v-for="cat in CATEGORIES"
        :key="cat.id"
        :class="['cat-btn', { active: store.activeCategory === cat.id }]"
        @click="store.setCategory(cat.id)"
      >
        {{ cat.label }}
      </button>
    </div>
    <!-- 右上搜索图标 -->
    <button class="search-btn">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2">
        <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
      </svg>
    </button>
  </nav>
</template>

<style scoped>
.cat-nav {
  position: absolute;
  top: 0; left: 0; right: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  padding: 48px 12px 12px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%);
}

.cat-scroll {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  flex: 1;
  padding-bottom: 2px;
  scrollbar-width: none;
}
.cat-scroll::-webkit-scrollbar { display: none; }

.cat-btn {
  flex-shrink: 0;
  background: none;
  border: none;
  color: rgba(255,255,255,0.65);
  font-size: 15px;
  font-weight: 500;
  padding: 4px 10px;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
  white-space: nowrap;
}
.cat-btn.active {
  color: #fff;
  font-size: 16px;
  font-weight: 700;
}
.cat-btn.active::after {
  content: '';
  position: absolute;
  bottom: -2px; left: 50%;
  transform: translateX(-50%);
  width: 18px; height: 2.5px;
  background: #FE2C55;
  border-radius: 2px;
}

.search-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  flex-shrink: 0;
  margin-left: 8px;
}
</style>
