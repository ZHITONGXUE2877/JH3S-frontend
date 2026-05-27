<script setup>
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const route = useRoute()
</script>

<template>
  <nav class="bottom-nav">
    <button :class="['nav-item', { active: route.path === '/' }]" @click="router.push('/')">
      <span class="nav-icon">🔥</span>
      <span class="nav-label">发现</span>
    </button>
    <button :class="['nav-item', { active: route.path === '/template' }]" @click="router.push('/template')">
      <span class="nav-icon">📋</span>
      <span class="nav-label">模板库</span>
    </button>
    <button class="nav-item publish-btn">
      <span class="publish-icon">+</span>
    </button>
    <button class="nav-item">
      <span class="nav-icon">💬</span>
      <span class="nav-label">消息</span>
    </button>
    <button class="nav-item">
      <span class="nav-icon">👤</span>
      <span class="nav-label">我的</span>
    </button>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 80px;
  display: flex; align-items: center;
  background: rgba(0,0,0,0.85);
  backdrop-filter: blur(16px);
  border-top: 1px solid rgba(255,255,255,0.08);
  padding-bottom: 10px;
  z-index: 20;
}

.nav-item {
  flex: 1; background: none; border: none;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 3px; cursor: pointer; padding: 8px 0;
  color: rgba(255,255,255,0.5);
}
.nav-item.active { color: #fff; }
.nav-icon { font-size: 22px; }
.nav-label { font-size: 10px; font-weight: 600; }

.publish-btn {
  color: transparent !important;
}
.publish-icon {
  width: 44px; height: 30px;
  background: linear-gradient(90deg, #25F4EE, #FE2C55);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; font-weight: 300; color: #fff;
  position: relative;
}
.publish-icon::before, .publish-icon::after {
  content: '';
  position: absolute;
  top: 0; bottom: 0;
  width: 8px;
  border-radius: 4px;
}
.publish-icon::before { right: 100%; background: #25F4EE; margin-right: -4px; }
.publish-icon::after  { left: 100%;  background: #FE2C55; margin-left: -4px; }
</style>
