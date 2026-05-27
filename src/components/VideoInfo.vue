<script setup>
defineProps({ video: Object })
</script>

<template>
  <div class="video-info" v-if="video">
    <!-- 账号名 -->
    <div class="account-row">
      <span class="account-name">@{{ video.account.name }}</span>
      <span v-if="video.isHot" class="hot-badge">🔥 爆款</span>
    </div>

    <!-- 标题 -->
    <p class="video-title">{{ video.title }}</p>

    <!-- 话题标签 -->
    <div class="tags-row">
      <span v-for="tag in video.tags" :key="tag" class="tag">#{{ tag }}</span>
    </div>

    <!-- 钩子类型 -->
    <div class="hook-row">
      <span class="hook-badge">
        {{ video.hookEmoji }} {{ video.hookType }}
      </span>
      <span class="hook-desc">{{ video.hookDesc }}</span>
    </div>

    <!-- 音乐 -->
    <div class="music-row">
      <span class="music-icon">♪</span>
      <span class="music-text">{{ video.music }}</span>
    </div>
  </div>
</template>

<style scoped>
.video-info {
  position: absolute;
  left: 14px;
  bottom: 100px;
  right: 80px;
  z-index: 15;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.account-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.account-name {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 6px rgba(0,0,0,0.5);
}
.hot-badge {
  background: linear-gradient(90deg, #FE2C55, #FF6B35);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
}

.video-title {
  font-size: 13.5px;
  line-height: 1.45;
  color: rgba(255,255,255,0.92);
  text-shadow: 0 1px 6px rgba(0,0,0,0.5);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.tag {
  font-size: 12px;
  color: #7ECFFF;
  font-weight: 600;
}

.hook-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.hook-badge {
  background: rgba(255,255,255,0.18);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 10px;
  padding: 2px 10px;
  font-size: 11px;
  color: #fff;
  font-weight: 600;
}
.hook-desc {
  font-size: 11px;
  color: rgba(255,255,255,0.65);
}

.music-row {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 2px;
}
.music-icon {
  font-size: 13px;
  color: rgba(255,255,255,0.7);
}
.music-text {
  font-size: 12px;
  color: rgba(255,255,255,0.7);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 200px;
}
</style>
