<script setup>
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const route  = useRoute()
</script>

<template>
  <nav class="app-nav">
    <button :class="['nav-item', { active: route.path === '/' }]" @click="router.push('/')">
      <span class="nav-icon">🔥</span>
      <span class="nav-label">发现</span>
    </button>
    <button :class="['nav-item', { active: route.path === '/template' }]" @click="router.push('/template')">
      <span class="nav-icon">📋</span>
      <span class="nav-label">模板库</span>
    </button>
    <button class="nav-item publish-btn">
      <div class="publish-icon">+</div>
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
/* ═══ 移动端：底部导航 ═══ */
.app-nav {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: 60px;
  display: flex; flex-direction: row; align-items: center;
  background: rgba(0,0,0,.88);
  backdrop-filter: blur(16px);
  border-top: 1px solid rgba(255,255,255,.08);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  z-index: 50;
}

.nav-item {
  flex: 1; background: none; border: none;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 2px; cursor: pointer; padding: 6px 0;
  color: rgba(255,255,255,.45);
  transition: color .15s;
}
.nav-item.active { color: #fff; }
.nav-icon  { font-size: 20px; }
.nav-label { font-size: 10px; font-weight: 600; }

.publish-btn { color: transparent !important; }
.publish-icon {
  width: 44px; height: 28px;
  background: linear-gradient(90deg, #25F4EE, #FE2C55);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; font-weight: 300; color: #fff;
  position: relative;
}
.publish-icon::before,
.publish-icon::after {
  content: ''; position: absolute; top: 0; bottom: 0;
  width: 6px; border-radius: 4px;
}
.publish-icon::before { right: 100%; background: #25F4EE; margin-right: -3px; }
.publish-icon::after  { left: 100%;  background: #FE2C55; margin-left:  -3px; }

/* ═══ 桌面端：左侧导航栏 ═══ */
@media (min-width: 768px) {
  .app-nav {
    top: 0; bottom: 0; left: 0; right: auto;
    width: 80px; height: 100vh;
    flex-direction: column;
    justify-content: flex-start; align-items: center;
    padding: 0 0 24px 0; gap: 2px;
    border-top: none;
    border-right: 1px solid rgba(255,255,255,.08);
  }
  .nav-item {
    flex: none; width: 100%; padding: 12px 0;
    border-radius: 0;
  }
  .nav-item.active { color: #fff; background: rgba(255,255,255,.06); }
  .nav-label { font-size: 10px; }
}
</style>
