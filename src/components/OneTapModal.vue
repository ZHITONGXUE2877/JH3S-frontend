<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({ video: Object, visible: Boolean })
const emit  = defineEmits(['close'])

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

// ── 状态机：upload → loading → done → error ──────────────
const uiStage  = ref('upload')
const taskId   = ref(null)
const errorMsg = ref('')

// ── 文件上传 ──────────────────────────────────────────────
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

// ── 风格选择（在上传阶段完成）────────────────────────────
const styles          = ref([])
const selectedStyleId = ref('')

async function loadStyles() {
  try {
    const cat = props.video?.category || ''
    let data = []
    if (cat) {
      const r = await fetch(`${API_BASE}/v1/styles?category=${cat}`)
      data = await r.json()
    }
    if (!data.length) {
      const r = await fetch(`${API_BASE}/v1/styles`)
      data = await r.json()
    }
    styles.value = data
    if (data.length) selectedStyleId.value = data[0].id
  } catch {
    selectedStyleId.value = 'tmpl_001'
  }
}

watch(() => props.visible, (v) => { if (v && !styles.value.length) loadStyles() })

// ── 进度轮询 ──────────────────────────────────────────────
const progress   = ref(0)
const backStatus = ref('')   // 后端 task.status
let   pollTimer  = null

function stopPoll() { clearInterval(pollTimer); pollTimer = null }

// 三步推断
const step1 = computed(() => {
  if (['PROCESSING_STG2','AWAITING_CONFIRM','COMPLETED'].includes(backStatus.value)) return 'done'
  if (backStatus.value === 'PROCESSING_STG1') return 'active'
  return 'wait'
})
const step2 = computed(() => {
  if (backStatus.value === 'COMPLETED') return 'done'
  if (backStatus.value === 'PROCESSING_STG2' && progress.value >= 50) return 'done'
  if (backStatus.value === 'PROCESSING_STG2') return 'active'
  return 'wait'
})
const step3 = computed(() => {
  if (backStatus.value === 'COMPLETED') return 'done'
  if (backStatus.value === 'PROCESSING_STG2' && progress.value >= 50) return 'active'
  return 'wait'
})

const loadingTitle = computed(() => {
  if (step3.value === 'active') return '视频渲染中...'
  if (step2.value === 'active') return '合成爆款场景图...'
  return 'AI 生成三视图中...'
})

const accentColor = computed(() => {
  if (step3.value === 'active') return '#FE2C55'
  if (step2.value === 'active') return '#8b5cf6'
  return '#7ECFFF'
})

const resultVideoUrl = ref('')

async function pollStatus() {
  if (!taskId.value) return
  try {
    const r    = await fetch(`${API_BASE}/v1/task/status/${taskId.value}`)
    const data = await r.json()
    progress.value   = data.progress ?? 0
    backStatus.value = data.status
    if (data.status === 'COMPLETED') {
      stopPoll()
      resultVideoUrl.value = data.video_url
      uiStage.value = 'done'
    } else if (data.status === 'FAILED') {
      stopPoll()
      errorMsg.value = data.error || '生成失败，请重试'
      uiStage.value  = 'error'
    }
    // AWAITING_CONFIRM = no style found, keep polling — backend may auto-continue
  } catch { /* 网络波动，继续轮询 */ }
}

// ── 开始生成 ──────────────────────────────────────────────
async function startGeneration() {
  if (!fileList.value.length) return
  uiStage.value    = 'loading'
  progress.value   = 0
  backStatus.value = 'PROCESSING_STG1'

  const form = new FormData()
  form.append('style_id', selectedStyleId.value || 'tmpl_001')
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
      errorMsg.value = '服务器返回异常，请重试'
      uiStage.value  = 'error'
      return
    }
    taskId.value = data.task_id
    pollTimer = setInterval(pollStatus, 2000)
  } catch {
    errorMsg.value = '网络连接失败，请检查网络后重试'
    uiStage.value  = 'error'
  }
}

// ── 反馈 ──────────────────────────────────────────────────
const feedbackDone   = ref(false)
const feedbackRating = ref('')
const showReasons    = ref(false)

const REASONS = [
  { id: 'quality',   label: '画质问题' },
  { id: 'distorted', label: '变形走样' },
  { id: 'style',     label: '风格不符' },
  { id: 'other',     label: '其他' },
]

async function submitFeedback(rating, reason = '') {
  if (rating === 'bad' && !reason) {
    feedbackRating.value = 'bad'
    showReasons.value    = true
    return
  }
  showReasons.value = false
  try {
    await fetch(`${API_BASE}/v1/feedback`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ task_id: taskId.value, rating, reason, comment: '' }),
    })
  } catch {}
  feedbackDone.value   = true
  feedbackRating.value = rating
}

// ── 重置关闭 ──────────────────────────────────────────────
function resetAndClose() {
  stopPoll()
  uiStage.value        = 'upload'
  previews.value       = []
  fileList.value       = []
  resultVideoUrl.value = ''
  progress.value       = 0
  taskId.value         = null
  errorMsg.value       = ''
  backStatus.value     = ''
  feedbackDone.value   = false
  feedbackRating.value = ''
  showReasons.value    = false
  emit('close')
}
</script>

<template>
  <Transition name="sheet">
    <div v-if="visible" class="overlay" @click.self="resetAndClose">
      <div class="sheet">
        <div class="drag-bar"></div>

        <!-- ══ 上传阶段 ══ -->
        <template v-if="uiStage === 'upload'">
          <div class="sheet-header">
            <h3>一键做同款</h3>
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

          <div class="section-title">上传产品图（1-9张）</div>

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

          <!-- 视频风格 -->
          <template v-if="styles.length">
            <div class="section-title">视频风格</div>
            <div class="style-scroll">
              <div
                v-for="s in styles" :key="s.id"
                :class="['style-chip', { active: selectedStyleId === s.id }]"
                @click="selectedStyleId = s.id"
              >
                {{ s.name }}
              </div>
            </div>
          </template>

          <div class="tip">建议上传正面、侧面、细节图，AI 自动生成爆款视频</div>

          <button class="generate-btn" :disabled="!previews.length" @click="startGeneration">
            开始生成
          </button>
        </template>

        <!-- ══ 生成中 ══ -->
        <template v-else-if="uiStage === 'loading'">
          <div class="loading-view">
            <div class="spinner" :style="{ borderTopColor: accentColor }"></div>
            <p class="loading-title">{{ loadingTitle }}</p>
            <div class="progress-wrap">
              <div class="progress-track">
                <div class="progress-fill"
                  :style="{ width: progress + '%', background: accentColor }"></div>
              </div>
              <span class="progress-num">{{ progress }}%</span>
            </div>

            <div class="step-track">
              <div :class="['step-item', step1]">
                <div class="step-dot">
                  <span v-if="step1==='done'">✓</span>
                  <span v-else-if="step1==='active'" class="dot-pulse">●</span>
                  <span v-else style="opacity:.3">○</span>
                </div>
                <span class="step-lbl">三视图</span>
              </div>
              <div class="step-line"></div>
              <div :class="['step-item', step2]">
                <div class="step-dot">
                  <span v-if="step2==='done'">✓</span>
                  <span v-else-if="step2==='active'" class="dot-pulse">●</span>
                  <span v-else style="opacity:.3">○</span>
                </div>
                <span class="step-lbl">场景图</span>
              </div>
              <div class="step-line"></div>
              <div :class="['step-item', step3]">
                <div class="step-dot">
                  <span v-if="step3==='done'">✓</span>
                  <span v-else-if="step3==='active'" class="dot-pulse">●</span>
                  <span v-else style="opacity:.3">○</span>
                </div>
                <span class="step-lbl">视频渲染</span>
              </div>
            </div>

            <p class="loading-hint">全程自动生成，无需等待确认，通常 3-5 分钟</p>
          </div>
        </template>

        <!-- ══ 完成 ══ -->
        <template v-else-if="uiStage === 'done'">
          <div class="sheet-header">
            <h3>视频已生成</h3>
            <button class="close-btn" @click="resetAndClose">✕</button>
          </div>

          <video v-if="resultVideoUrl" :src="resultVideoUrl"
            class="result-video" controls autoplay muted loop playsinline />
          <div v-else class="result-placeholder">视频生成完毕</div>

          <!-- 反馈 -->
          <div class="feedback-box">
            <template v-if="!feedbackDone">
              <p class="fb-title">效果满意吗？</p>
              <template v-if="!showReasons">
                <div class="fb-row">
                  <button class="fb-btn good" @click="submitFeedback('good')">满意</button>
                  <button class="fb-btn bad"  @click="submitFeedback('bad')">不满意</button>
                </div>
              </template>
              <template v-else>
                <p class="fb-sub">哪里不满意？</p>
                <div class="fb-reasons">
                  <button v-for="r in REASONS" :key="r.id"
                    class="reason-btn" @click="submitFeedback('bad', r.id)">
                    {{ r.label }}
                  </button>
                </div>
              </template>
            </template>
            <div v-else class="fb-done">
              {{ feedbackRating === 'good' ? '感谢好评！' : '已记录，我们会持续优化' }}
            </div>
          </div>

          <div class="done-actions">
            <button class="btn-secondary" @click="resetAndClose">返回浏览</button>
            <a v-if="resultVideoUrl" :href="resultVideoUrl" download class="btn-primary">
              下载视频
            </a>
            <button class="btn-primary qianchuan">投千川</button>
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
  background: rgba(0,0,0,.65);
  z-index: 100;
  display: flex; align-items: flex-end; justify-content: center;
}
.sheet {
  width: 100%; max-width: 480px; max-height: 92vh;
  background: #18181f;
  border-radius: 20px 20px 0 0;
  padding: 14px 18px 44px;
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

/* 参考视频卡片 */
.source-card {
  display: flex; gap: 12px;
  background: rgba(255,255,255,.06); border-radius: 12px; padding: 10px;
}
.source-thumb {
  width: 52px; height: 68px; border-radius: 8px; flex-shrink: 0;
  position: relative; overflow: hidden; background: #222;
}
.thumb-video { width: 100%; height: 100%; object-fit: cover; }
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
.img-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
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

/* 风格选择横滚 */
.style-scroll {
  display: flex; gap: 8px; overflow-x: auto;
  padding-bottom: 4px; -webkit-overflow-scrolling: touch;
}
.style-scroll::-webkit-scrollbar { display: none; }
.style-chip {
  flex-shrink: 0;
  padding: 7px 14px;
  border-radius: 20px;
  font-size: 13px; font-weight: 600;
  color: rgba(255,255,255,.5);
  background: rgba(255,255,255,.07);
  border: 1.5px solid transparent;
  cursor: pointer; transition: all .15s;
  white-space: nowrap;
}
.style-chip.active {
  color: #FE2C55;
  background: rgba(254,44,85,.1);
  border-color: rgba(254,44,85,.4);
}

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
  align-items: center; gap: 16px; padding: 28px 0;
}
.spinner {
  width: 52px; height: 52px; border-radius: 50%;
  border: 4px solid rgba(255,255,255,.1);
  animation: spin .85s linear infinite;
  transition: border-top-color .4s;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-title { font-size: 16px; font-weight: 700; color: #fff; }

.progress-wrap {
  width: 100%; display: flex; align-items: center; gap: 10px;
}
.progress-track {
  flex: 1; height: 6px; background: rgba(255,255,255,.1);
  border-radius: 3px; overflow: hidden;
}
.progress-fill {
  height: 100%; border-radius: 3px;
  transition: width .4s ease, background .4s;
}
.progress-num {
  font-size: 13px; font-weight: 700; color: #fff; min-width: 36px; text-align: right;
}

/* 步骤指示 */
.step-track {
  display: flex; align-items: center; gap: 0; width: 100%;
}
.step-item {
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  flex-shrink: 0;
}
.step-dot {
  font-size: 18px; width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
}
.step-item.done  .step-dot { color: #4ade80; }
.step-item.active .step-dot { color: #FE2C55; }
.step-item.wait  .step-dot { color: rgba(255,255,255,.2); }
.step-lbl {
  font-size: 11px; white-space: nowrap;
}
.step-item.done  .step-lbl { color: #4ade80; }
.step-item.active .step-lbl { color: #fff; font-weight: 700; }
.step-item.wait  .step-lbl { color: rgba(255,255,255,.3); }
.step-line {
  flex: 1; height: 2px; background: rgba(255,255,255,.1); margin-bottom: 14px;
}
.dot-pulse {
  display: inline-block;
  animation: pulse 1.2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: .5; transform: scale(.7); }
}
.loading-hint {
  font-size: 11px; color: rgba(255,255,255,.3); text-align: center;
}

/* 完成 */
.result-video {
  width: 100%; border-radius: 14px; max-height: 240px; object-fit: cover; background: #000;
}
.result-placeholder {
  width: 100%; height: 140px; background: rgba(255,255,255,.08);
  border-radius: 14px; display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,.4); font-size: 14px;
}

/* 反馈 */
.feedback-box {
  background: rgba(255,255,255,.05);
  border-radius: 12px; padding: 12px 14px;
  display: flex; flex-direction: column; gap: 10px;
}
.fb-title { font-size: 13px; color: rgba(255,255,255,.7); font-weight: 600; }
.fb-sub   { font-size: 12px; color: rgba(255,255,255,.5); }
.fb-row   { display: flex; gap: 10px; }
.fb-btn {
  flex: 1; padding: 9px; border: none; border-radius: 10px;
  font-size: 13px; font-weight: 700; cursor: pointer; transition: opacity .15s;
}
.fb-btn.good {
  background: rgba(34,197,94,.15); color: #4ade80; border: 1px solid rgba(34,197,94,.3);
}
.fb-btn.bad {
  background: rgba(239,68,68,.12); color: #f87171; border: 1px solid rgba(239,68,68,.25);
}
.fb-reasons {
  display: flex; flex-wrap: wrap; gap: 8px;
}
.reason-btn {
  padding: 7px 14px; border: 1px solid rgba(255,255,255,.15);
  background: rgba(255,255,255,.06); color: rgba(255,255,255,.7);
  border-radius: 20px; font-size: 12px; cursor: pointer; transition: all .12s;
}
.reason-btn:hover { background: rgba(254,44,85,.12); border-color: rgba(254,44,85,.4); color: #FE2C55; }
.fb-done { font-size: 13px; color: rgba(255,255,255,.5); text-align: center; padding: 6px 0; }

.done-actions { display: flex; gap: 10px; flex-wrap: wrap; }

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
.error-msg  { font-size: 14px; color: rgba(255,255,255,.7); text-align: center; line-height: 1.5; }

/* Transition */
.sheet-enter-active, .sheet-leave-active { transition: transform .3s ease, opacity .3s; }
.sheet-enter-from { transform: translateY(100%); opacity: 0; }
.sheet-leave-to   { transform: translateY(100%); opacity: 0; }
</style>
