<script setup>
import { ref, computed } from 'vue'

const props = defineProps({ video: Object, visible: Boolean })
const emit  = defineEmits(['close'])

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

// ── 状态机 ────────────────────────────────────────────────
// upload → stg1_loading → confirm → select_style → stg2_loading → done → error
const uiStage  = ref('upload')
const taskId   = ref(null)
const errorMsg = ref('')

// ── 上传 ──────────────────────────────────────────────────
const fileInput = ref(null)
const previews  = ref([])
const fileList  = ref([])

function pickImages() { fileInput.value?.click() }

function onFilePick(e) {
  const files = Array.from(e.target.files)
  if (!files.length) return
  fileList.value = files.slice(0, 9)
  previews.value = []
  fileList.value.forEach(f => {
    const r = new FileReader()
    r.onload = ev => previews.value.push(ev.target.result)
    r.readAsDataURL(f)
  })
  e.target.value = ''
}

function removeImg(i) {
  previews.value.splice(i, 1)
  fileList.value.splice(i, 1)
}

// ── 进度轮询 ──────────────────────────────────────────────
const progress = ref(0)
let   pollTimer = null

function stopPoll() { clearInterval(pollTimer); pollTimer = null }

const progressTxt = computed(() => {
  if (uiStage.value === 'stg1_loading') return 'AI 正在生成产品三视图...'
  if (uiStage.value === 'stg2_loading')
    return progress.value < 50 ? '场景图生成中...' : '视频渲染中...'
  return ''
})

async function pollStatus() {
  if (!taskId.value) return
  try {
    const r    = await fetch(`${API_BASE}/v1/task/status/${taskId.value}`)
    const data = await r.json()
    progress.value = data.progress ?? 0

    if (data.status === 'AWAITING_CONFIRM') {
      stopPoll()
      viewUrls.value      = data.view_image_urls || []
      selectedViews.value = viewUrls.value.length ? [viewUrls.value[0]] : []
      uiStage.value = 'confirm'
    }
    if (data.status === 'COMPLETED') {
      stopPoll()
      resultVideoUrl.value = data.video_url
      uiStage.value = 'done'
    }
    if (data.status === 'FAILED') {
      stopPoll()
      errorMsg.value = data.error || '生成失败，请重试'
      uiStage.value = 'error'
    }
  } catch { /* 网络波动继续轮询 */ }
}

// ── Stage1：上传 → 三视图 ─────────────────────────────────
async function startStage1() {
  if (!fileList.value.length) return
  uiStage.value  = 'stg1_loading'
  progress.value = 0

  const form = new FormData()
  form.append('style_id', props.video?.id?.toString() ?? 'tmpl_001')
  form.append('category', props.video?.category ?? 'clothing')
  fileList.value.forEach(f => form.append('images', f))

  try {
    const r = await fetch(`${API_BASE}/v1/task/init_views`, { method: 'POST', body: form })
    if (!r.ok) {
      const err = await r.json().catch(() => ({}))
      errorMsg.value = err.detail || `服务器错误 (${r.status})，请重试`
      uiStage.value  = 'error'
      return
    }
    const data = await r.json()
    if (!data.task_id) {
      errorMsg.value = '服务器返回数据异常，请重试'
      uiStage.value  = 'error'
      return
    }
    taskId.value = data.task_id
    pollTimer = setInterval(pollStatus, 2000)
  } catch (e) {
    errorMsg.value = '网络连接失败，请检查网络或稍后重试'
    uiStage.value  = 'error'
  }
}

// ── 三视图确认 ────────────────────────────────────────────
const viewUrls      = ref([])
const selectedViews = ref([])

function toggleView(url) {
  const idx = selectedViews.value.indexOf(url)
  if (idx === -1) selectedViews.value.push(url)
  else            selectedViews.value.splice(idx, 1)
}

async function goToStyleSelect() {
  uiStage.value = 'select_style'
  await loadStyles()
}

// ── 风格模板选择 ──────────────────────────────────────────
const styles          = ref([])
const selectedStyleId = ref('')

async function loadStyles() {
  try {
    const r = await fetch(`${API_BASE}/v1/styles`)
    styles.value = await r.json()
    if (styles.value.length) selectedStyleId.value = styles.value[0].id
  } catch {
    selectedStyleId.value = props.video?.id?.toString() ?? 'tmpl_001'
  }
}

// ── Stage2：场景图 + 视频 ─────────────────────────────────
const resultVideoUrl = ref('')

async function startStage2() {
  if (!selectedViews.value.length || !selectedStyleId.value) return
  uiStage.value  = 'stg2_loading'
  progress.value = 0

  try {
    await fetch(`${API_BASE}/v1/task/generate_video`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_id:              taskId.value,
        confirmed_image_urls: selectedViews.value,
        style_id:             selectedStyleId.value,
      }),
    })
    pollTimer = setInterval(pollStatus, 3000)
  } catch {
    errorMsg.value = '网络错误'
    uiStage.value  = 'error'
  }
}

// ── 重置关闭 ──────────────────────────────────────────────
function resetAndClose() {
  stopPoll()
  uiStage.value        = 'upload'
  previews.value       = []
  fileList.value       = []
  viewUrls.value       = []
  selectedViews.value  = []
  styles.value         = []
  selectedStyleId.value= ''
  resultVideoUrl.value = ''
  progress.value       = 0
  taskId.value         = null
  errorMsg.value       = ''
  emit('close')
}
</script>

<template>
  <Transition name="sheet">
    <div v-if="visible" class="overlay" @click.self="resetAndClose">
      <div class="sheet">
        <div class="drag-bar"></div>

        <!-- ══ 阶段1：上传产品图 ══ -->
        <template v-if="uiStage === 'upload'">
          <div class="sheet-header">
            <h3>✨ 一键做同款</h3>
            <button class="close-btn" @click="resetAndClose">✕</button>
          </div>

          <div class="source-card">
            <div class="source-thumb">
              <video :src="video?.videoUrl" class="thumb-video" muted autoplay loop playsinline />
              <span class="duration-tag">{{ video?.duration }}s</span>
            </div>
            <div class="source-info">
              <div class="source-stats">❤️ {{ (video?.likes/10000).toFixed(1) }}万 &nbsp;💰 ¥{{ video?.profit?.toLocaleString() }}</div>
              <div class="source-title">{{ video?.title }}</div>
            </div>
          </div>

          <div class="section-title">上传你的产品图（1-9张）</div>

          <div class="img-grid">
            <div v-for="(src, i) in previews" :key="i" class="img-thumb">
              <img :src="src" />
              <button class="img-remove" @click="removeImg(i)">✕</button>
            </div>
            <button v-if="previews.length < 9" class="img-add" @click="pickImages">
              <span>+</span>
              <span class="img-add-sub">添加图片</span>
            </button>
          </div>
          <input ref="fileInput" type="file" accept="image/*" multiple
            style="display:none" @change="onFilePick" />

          <div class="tip">📌 建议上传正面、侧面、细节图，AI 会自动生成标准三视图</div>

          <button class="generate-btn" :disabled="!previews.length" @click="startStage1">
            🚀 开始生成三视图
          </button>
        </template>

        <!-- ══ Stage1 加载中 ══ -->
        <template v-else-if="uiStage === 'stg1_loading'">
          <div class="loading-view">
            <div class="spinner stg1"></div>
            <p class="loading-title">{{ progressTxt }}</p>
            <div class="progress-wrap">
              <div class="progress-track">
                <div class="progress-bar-fill stg1" :style="{ width: progress + '%' }"></div>
              </div>
              <span class="progress-num">{{ progress }}%</span>
            </div>
            <p class="loading-sub">Seedream V4 分析产品角度，生成标准化三视图</p>
            <div class="status-steps">
              <span class="step done">✅ 图片上传</span>
              <span class="step active">⏳ 三视图生成</span>
              <span class="step">○ 选风格</span>
              <span class="step">○ 视频渲染</span>
            </div>
          </div>
        </template>

        <!-- ══ 确认三视图 ══ -->
        <template v-else-if="uiStage === 'confirm'">
          <div class="sheet-header">
            <h3>✅ 确认三视图</h3>
            <button class="close-btn" @click="resetAndClose">✕</button>
          </div>
          <p class="confirm-tip">点击图片可取消选择，至少保留一张</p>

          <div class="view-grid">
            <div
              v-for="(url, i) in viewUrls" :key="i"
              :class="['view-item', { selected: selectedViews.includes(url) }]"
              @click="toggleView(url)"
            >
              <img :src="url" />
              <span v-if="selectedViews.includes(url)" class="view-check">✓</span>
              <span class="view-label">{{ ['正面','侧面','背面','细节'][i] || '视图'+(i+1) }}</span>
            </div>
          </div>

          <div class="confirm-actions">
            <button class="btn-secondary" @click="uiStage = 'upload'">重新上传</button>
            <button class="btn-primary" :disabled="!selectedViews.length" @click="goToStyleSelect">
              下一步：选风格 →
            </button>
          </div>
        </template>

        <!-- ══ 选择风格模板 ══ -->
        <template v-else-if="uiStage === 'select_style'">
          <div class="sheet-header">
            <h3>🎨 选择视频风格</h3>
            <button class="close-btn" @click="resetAndClose">✕</button>
          </div>
          <p class="confirm-tip">选一个你喜欢的场景风格，AI 会把你的产品融入其中</p>

          <div v-if="!styles.length" class="style-loading">加载中...</div>
          <div v-else class="style-list">
            <div
              v-for="s in styles" :key="s.id"
              :class="['style-card', { selected: selectedStyleId === s.id }]"
              @click="selectedStyleId = s.id"
            >
              <video :src="s.preview_url" class="style-preview"
                muted autoplay loop playsinline />
              <div class="style-info">
                <span class="style-name">{{ s.name }}</span>
                <span class="style-cat">{{ s.category }}</span>
              </div>
              <div v-if="selectedStyleId === s.id" class="style-check">✓</div>
            </div>
          </div>

          <div class="confirm-actions">
            <button class="btn-secondary" @click="uiStage = 'confirm'">← 返回</button>
            <button class="btn-primary" :disabled="!selectedStyleId" @click="startStage2">
              开始渲染视频 🚀
            </button>
          </div>
        </template>

        <!-- ══ Stage2 渲染中 ══ -->
        <template v-else-if="uiStage === 'stg2_loading'">
          <div class="loading-view">
            <div class="spinner stg2"></div>
            <p class="loading-title">{{ progressTxt }}</p>
            <div class="progress-wrap">
              <div class="progress-track">
                <div class="progress-bar-fill stg2" :style="{ width: progress + '%' }"></div>
              </div>
              <span class="progress-num">{{ progress }}%</span>
            </div>
            <p class="loading-sub">
              {{ progress < 50 ? 'Seedream V4 生成场景图...' : 'Kling 2.1 图生视频中，预计 1-3 分钟' }}
            </p>
            <div class="status-steps">
              <span class="step done">✅ 图片上传</span>
              <span class="step done">✅ 三视图确认</span>
              <span class="step done">✅ 风格选择</span>
              <span class="step active">⏳ 视频渲染</span>
            </div>
          </div>
        </template>

        <!-- ══ 完成 ══ -->
        <template v-else-if="uiStage === 'done'">
          <div class="done-view">
            <div class="done-icon">🎉</div>
            <h3>视频生成完成！</h3>
            <video v-if="resultVideoUrl" :src="resultVideoUrl"
              class="result-video" controls autoplay muted loop playsinline />
            <div v-else class="result-placeholder">视频生成完毕</div>
            <div class="done-actions">
              <button class="btn-secondary" @click="resetAndClose">返回浏览</button>
              <a v-if="resultVideoUrl" :href="resultVideoUrl" download class="btn-primary">
                ⬇️ 下载视频
              </a>
              <button class="btn-primary qianchuan">🚀 直接投千川</button>
            </div>
          </div>
        </template>

        <!-- ══ 错误 ══ -->
        <template v-else-if="uiStage === 'error'">
          <div class="error-view">
            <div class="error-icon">⚠️</div>
            <p class="error-msg">{{ errorMsg }}</p>
            <button class="generate-btn" @click="uiStage = 'upload'">重新尝试</button>
          </div>
        </template>

      </div>
    </div>
  </Transition>
</template>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.6);
  z-index: 100;
  display: flex; align-items: flex-end; justify-content: center;
}
.sheet {
  width: 100%; max-width: 480px; max-height: 92vh;
  background: #18181f;
  border-radius: 20px 20px 0 0;
  padding: 14px 18px 40px;
  overflow-y: auto;
  display: flex; flex-direction: column; gap: 14px;
}
.drag-bar {
  width: 40px; height: 4px;
  background: rgba(255,255,255,.2);
  border-radius: 2px; margin: 0 auto 2px;
}
.sheet-header {
  display: flex; align-items: center; justify-content: space-between;
}
.sheet-header h3 { font-size: 18px; font-weight: 700; color: #fff; }
.close-btn {
  background: rgba(255,255,255,.1); border: none;
  color: rgba(255,255,255,.6); font-size: 15px;
  width: 28px; height: 28px; border-radius: 50%;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}

/* Source card */
.source-card {
  display: flex; gap: 12px;
  background: rgba(255,255,255,.06); border-radius: 12px; padding: 10px;
}
.source-thumb {
  width: 52px; height: 68px; border-radius: 8px; flex-shrink: 0;
  position: relative; overflow: hidden; background: #222;
}
.thumb-video {
  width: 100%; height: 100%; object-fit: cover;
}
.duration-tag {
  position: absolute; bottom: 4px; right: 4px;
  background: rgba(0,0,0,.6); color: #fff;
  font-size: 10px; padding: 1px 5px; border-radius: 4px;
}
.source-info { display: flex; flex-direction: column; gap: 6px; justify-content: center; }
.source-stats { font-size: 11px; color: rgba(255,255,255,.5); }
.source-title {
  font-size: 12px; color: rgba(255,255,255,.75); line-height: 1.4;
  display: -webkit-box; -webkit-box-orient: vertical;
  -webkit-line-clamp: 2; overflow: hidden;
}
.section-title {
  font-size: 12px; font-weight: 700;
  color: rgba(255,255,255,.45); letter-spacing: 0.5px;
}

/* 图片网格 */
.img-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
}
.img-thumb {
  aspect-ratio: 3/4; border-radius: 10px;
  overflow: hidden; position: relative; background: #222;
}
.img-thumb img { width: 100%; height: 100%; object-fit: cover; }
.img-remove {
  position: absolute; top: 4px; right: 4px;
  background: rgba(0,0,0,.6); border: none;
  color: #fff; font-size: 11px;
  width: 20px; height: 20px; border-radius: 50%;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.img-add {
  aspect-ratio: 3/4; border-radius: 10px;
  border: 1.5px dashed rgba(255,255,255,.2);
  background: rgba(255,255,255,.04);
  cursor: pointer;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 4px; color: rgba(255,255,255,.4);
}
.img-add span:first-child { font-size: 28px; line-height: 1; }
.img-add-sub { font-size: 11px; }

.tip {
  font-size: 12px; color: rgba(255,255,255,.4);
  background: rgba(255,255,255,.05);
  border-radius: 8px; padding: 8px 12px;
}

/* 生成按钮 */
.generate-btn {
  width: 100%;
  background: linear-gradient(135deg, #FE2C55, #FF6B35);
  border: none; border-radius: 14px;
  color: #fff; font-size: 15px; font-weight: 700;
  padding: 15px; cursor: pointer;
  box-shadow: 0 4px 20px rgba(254,44,85,.4);
  transition: opacity .15s;
}
.generate-btn:disabled { opacity: .4; cursor: not-allowed; }

/* 加载视图 */
.loading-view {
  display: flex; flex-direction: column;
  align-items: center; gap: 14px; padding: 24px 0;
}
.spinner {
  width: 52px; height: 52px; border-radius: 50%;
  border: 4px solid rgba(255,255,255,.1);
  animation: spin .9s linear infinite;
}
.spinner.stg1 { border-top-color: #7ECFFF; }
.spinner.stg2 { border-top-color: #FE2C55; }
@keyframes spin { to { transform: rotate(360deg); } }
.loading-title { font-size: 16px; font-weight: 700; color: #fff; }
.loading-sub   { font-size: 12px; color: rgba(255,255,255,.45); text-align: center; }

.progress-wrap {
  width: 100%; display: flex; align-items: center; gap: 10px;
}
.progress-track {
  flex: 1; height: 6px; background: rgba(255,255,255,.1);
  border-radius: 3px; overflow: hidden;
}
.progress-bar-fill {
  height: 100%; border-radius: 3px; transition: width .4s ease;
}
.progress-bar-fill.stg1 { background: #7ECFFF; }
.progress-bar-fill.stg2 { background: linear-gradient(90deg, #FE2C55, #FF6B35); }
.progress-num {
  font-size: 13px; font-weight: 700; color: #fff; min-width: 36px; text-align: right;
}

.status-steps {
  display: flex; gap: 6px; flex-wrap: wrap; justify-content: center;
}
.step       { font-size: 11px; color: rgba(255,255,255,.3); }
.step.done  { color: #4ade80; }
.step.active{ color: #FE2C55; font-weight: 700; }

/* 三视图确认 */
.confirm-tip { font-size: 12px; color: rgba(255,255,255,.5); }
.view-grid   { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.view-item {
  aspect-ratio: 4/5; border-radius: 10px; overflow: hidden;
  position: relative; cursor: pointer;
  border: 2px solid transparent; transition: border-color .15s;
}
.view-item.selected { border-color: #FE2C55; }
.view-item img { width: 100%; height: 100%; object-fit: cover; }
.view-check {
  position: absolute; top: 6px; right: 6px;
  background: #FE2C55; color: #fff;
  width: 20px; height: 20px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
}
.view-label {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: rgba(0,0,0,.6); color: #fff;
  font-size: 11px; text-align: center; padding: 4px;
}
.confirm-actions { display: flex; gap: 10px; }

/* 风格选择 */
.style-loading {
  text-align: center; color: rgba(255,255,255,.4);
  padding: 20px; font-size: 13px;
}
.style-list {
  display: flex; flex-direction: column; gap: 10px;
  max-height: 380px; overflow-y: auto;
}
.style-card {
  display: flex; gap: 12px; align-items: center;
  background: rgba(255,255,255,.06);
  border-radius: 12px; padding: 10px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color .15s, background .15s;
}
.style-card.selected {
  border-color: #FE2C55;
  background: rgba(254,44,85,.08);
}
.style-preview {
  width: 54px; height: 72px;
  border-radius: 8px; object-fit: cover; flex-shrink: 0;
  background: #333;
}
.style-info {
  flex: 1;
  display: flex; flex-direction: column; gap: 4px;
}
.style-name { font-size: 14px; font-weight: 600; color: #fff; }
.style-cat  { font-size: 11px; color: rgba(255,255,255,.4); }
.style-check {
  width: 24px; height: 24px; border-radius: 50%;
  background: #FE2C55; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; flex-shrink: 0;
}

/* 完成 */
.done-view {
  display: flex; flex-direction: column;
  align-items: center; gap: 14px; padding: 16px 0;
}
.done-icon { font-size: 44px; }
.done-view h3 { font-size: 20px; font-weight: 800; color: #fff; }
.result-video {
  width: 100%; border-radius: 14px; max-height: 240px; object-fit: cover; background: #000;
}
.result-placeholder {
  width: 100%; height: 160px; background: rgba(255,255,255,.1);
  border-radius: 14px; display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,.4); font-size: 14px;
}
.done-actions { display: flex; gap: 10px; width: 100%; flex-wrap: wrap; }

/* 按钮 */
.btn-secondary {
  flex: 1; background: rgba(255,255,255,.1); border: none;
  color: #fff; border-radius: 12px; padding: 13px;
  font-size: 13px; font-weight: 600; cursor: pointer;
}
.btn-primary {
  flex: 1;
  background: linear-gradient(135deg, #FE2C55, #FF6B35);
  border: none; color: #fff; border-radius: 12px;
  padding: 13px; font-size: 13px; font-weight: 700; cursor: pointer;
  text-decoration: none; text-align: center;
}
.btn-primary:disabled { opacity: .4; cursor: not-allowed; }
.qianchuan { background: linear-gradient(135deg, #06b6d4, #3b82f6); }

/* 错误 */
.error-view {
  display: flex; flex-direction: column;
  align-items: center; gap: 16px; padding: 32px 0;
}
.error-icon { font-size: 48px; }
.error-msg  { font-size: 14px; color: rgba(255,255,255,.7); text-align: center; }

/* Transition */
.sheet-enter-active, .sheet-leave-active { transition: transform .32s ease, opacity .32s; }
.sheet-enter-from { transform: translateY(100%); opacity: 0; }
.sheet-leave-to   { transform: translateY(100%); opacity: 0; }
</style>
