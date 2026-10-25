<script setup lang="ts">
import { ref, computed } from 'vue'
import biliEpisodes from '../data/bili-episodes.json'

interface EpisodeItem {
  p: number
  title: string
  rawTitle?: string
}

const props = withDefaults(
  defineProps<{
    bvid?: string
    p?: number | string
    episodes?: string | number[] | EpisodeItem[]
    title?: string
    autoplay?: boolean
  }>(),
  {
    bvid: 'BV1wR4Xz6EqG',
    p: 1,
    episodes: '',
    title: '',
    autoplay: false
  }
)

// 创建 episode 映射表方便极速根据 p 查标题
const episodeMap = new Map<number, EpisodeItem>()
for (const item of (biliEpisodes as EpisodeItem[])) {
  episodeMap.set(item.p, item)
}

// 解析 episodes 参数
const parsedEpisodes = computed<EpisodeItem[]>(() => {
  if (!props.episodes) return []

  // 1. 如果直接传入了对象数组
  if (Array.isArray(props.episodes) && props.episodes.length > 0 && typeof props.episodes[0] === 'object') {
    return props.episodes as EpisodeItem[]
  }

  // 2. 如果传入了数字数组 [60, 61, 62]
  if (Array.isArray(props.episodes)) {
    return (props.episodes as number[]).map((num) => {
      const found = episodeMap.get(Number(num))
      return {
        p: Number(num),
        title: found ? found.title : `第 ${num} 集`
      }
    })
  }

  // 3. 如果传入了字符串，例如 "60-67" 或 "P60-P67"
  if (typeof props.episodes === 'string') {
    const str = props.episodes.trim()
    // 匹配范围 "60-67" 或 "P60-P67"
    const rangeMatch = str.match(/^[pP]?(\d+)\s*[-~至到]\s*[pP]?(\d+)$/)
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10)
      const end = parseInt(rangeMatch[2], 10)
      const list: EpisodeItem[] = []
      const min = Math.min(start, end)
      const max = Math.max(start, end)
      for (let i = min; i <= max; i++) {
        const found = episodeMap.get(i)
        list.push({
          p: i,
          title: found ? found.title : `第 ${i} 集`
        })
      }
      return list
    }

    // 匹配逗号分隔 "60,61,62"
    if (str.includes(',')) {
      return str.split(',').map((s) => {
        const num = parseInt(s.replace(/\D/g, ''), 10)
        const found = episodeMap.get(num)
        return {
          p: num,
          title: found ? found.title : `第 ${num} 集`
        }
      }).filter((item) => !isNaN(item.p))
    }

    // 单集字符串 "60"
    const singleNum = parseInt(str.replace(/\D/g, ''), 10)
    if (!isNaN(singleNum)) {
      const found = episodeMap.get(singleNum)
      return [{
        p: singleNum,
        title: found ? found.title : `第 ${singleNum} 集`
      }]
    }
  }

  return []
})

// 当前播放的集数
const initialP = computed(() => {
  const pNum = Number(props.p)
  if (!isNaN(pNum) && pNum > 0) return pNum
  if (parsedEpisodes.value.length > 0) return parsedEpisodes.value[0].p
  return 1
})

const currentP = ref(initialP.value)

// 当前集信息
const currentEpisode = computed(() => {
  const found = episodeMap.get(currentP.value)
  if (found) return found
  return { p: currentP.value, title: `第 ${currentP.value} 集` }
})

// 切换选集
const selectEpisode = (p: number) => {
  currentP.value = p
}

// B站播放器 URL
const iframeSrc = computed(() => {
  const autoplayVal = props.autoplay ? '1' : '0'
  return `https://player.bilibili.com/player.html?isOutside=true&bvid=${props.bvid}&p=${currentP.value}&autoplay=${autoplayVal}&danmaku=0`
})

// B站外部链接 URL
const bilibiliOuterLink = computed(() => {
  return `https://www.bilibili.com/video/${props.bvid}?p=${currentP.value}`
})
</script>

<template>
  <div class="bili-video-container">
    <!-- 顶部状态栏 -->
    <div class="bili-video-header">
      <div class="bili-title-wrap">
        <span class="bili-tag">
          <svg class="bili-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.813 4.653h.854c1.51 0 2.733 1.224 2.733 2.733v10.134c0 1.51-1.224 2.733-2.733 2.733H5.333c-1.51 0-2.733-1.224-2.733-2.733V7.386c0-1.51 1.224-2.733 2.733-2.733h.854l-1.39-1.39a.75.75 0 0 1 1.06-1.06l2.122 2.122h7.982l2.122-2.122a.75.75 0 0 1 1.06 1.06l-1.39 1.39h.059zM5.333 6.153a1.233 1.233 0 0 0-1.233 1.233v10.134a1.233 1.233 0 0 0 1.233 1.233h13.334a1.233 1.233 0 0 0 1.233-1.233V7.386a1.233 1.233 0 0 0-1.233-1.233H5.333zm3.167 4.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zm7 0a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5z"/>
          </svg>
          B站原版视频
        </span>
        <span class="bili-current-title">
          <strong>P{{ currentP }}</strong> · {{ currentEpisode.title }}
        </span>
      </div>

      <a :href="bilibiliOuterLink" target="_blank" rel="noopener noreferrer" class="bili-external-btn" title="跳转到B站网页端/客户端全屏观看">
        <span>在 B 站全屏观看</span>
        <svg class="external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </a>
    </div>

    <!-- 选集切换标签栏（仅在多集时展示） -->
    <div v-if="parsedEpisodes.length > 1" class="bili-episodes-bar">
      <div class="episodes-label">选集 (共 {{ parsedEpisodes.length }} 集)：</div>
      <div class="episodes-scroll">
        <button
          v-for="ep in parsedEpisodes"
          :key="ep.p"
          :class="['episode-chip', { active: ep.p === currentP }]"
          @click="selectEpisode(ep.p)"
        >
          <span v-if="ep.p === currentP" class="play-indicator">▶</span>
          <span class="p-num">P{{ ep.p }}</span>
          <span class="p-title">{{ ep.title }}</span>
        </button>
      </div>
    </div>

    <!-- 播放器视频区域 (16:9 响应式) -->
    <div class="bili-iframe-wrapper">
      <iframe
        :src="iframeSrc"
        scrolling="no"
        border="0"
        frameborder="no"
        framespacing="0"
        allowfullscreen="true"
        loading="lazy"
        class="bili-iframe"
      ></iframe>
    </div>

    <!-- 底部小贴士 -->
    <div class="bili-footer-tip">
      <span class="tip-icon">💡</span>
      <span class="tip-text">支持倍速播放与全屏；如需 1080P/4K 高清画质与发送弹幕，可点击右上角跳转至 B 站客户端观看。</span>
    </div>
  </div>
</template>

<style scoped>
.bili-video-container {
  margin: 20px 0 32px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  transition: border-color 0.25s, box-shadow 0.25s;
}

.bili-video-container:hover {
  border-color: rgba(2, 86, 155, 0.35);
  box-shadow: 0 6px 20px rgba(2, 86, 155, 0.08);
}

.bili-video-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: var(--vp-c-bg-mute);
  border-bottom: 1px solid var(--vp-c-divider);
  flex-wrap: wrap;
  gap: 8px;
}

.bili-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 200px;
}

.bili-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(251, 114, 153, 0.12);
  color: #FB7299;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 12px;
  border: 1px solid rgba(251, 114, 153, 0.25);
  flex-shrink: 0;
}

.bili-icon {
  width: 14px;
  height: 14px;
}

.bili-current-title {
  font-size: 13.5px;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bili-external-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12.5px;
  color: #02569B;
  text-decoration: none !important;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(2, 86, 155, 0.08);
  font-weight: 500;
  transition: all 0.2s;
}

.bili-external-btn:hover {
  background: #02569B;
  color: #ffffff !important;
}

.external-icon {
  width: 13px;
  height: 13px;
}

/* 选集标签栏 */
.bili-episodes-bar {
  padding: 8px 14px;
  background: var(--vp-c-bg-alt);
  border-bottom: 1px solid var(--vp-c-divider);
  display: flex;
  align-items: center;
  gap: 10px;
}

.episodes-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  flex-shrink: 0;
}

.episodes-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}

.episode-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 11px;
  border-radius: 16px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  font-size: 12px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  flex-shrink: 0;
}

.episode-chip:hover {
  border-color: #02569B;
  color: #02569B;
  background: rgba(2, 86, 155, 0.05);
}

.episode-chip.active {
  background: #02569B;
  color: #ffffff;
  border-color: #02569B;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(2, 86, 155, 0.25);
}

.play-indicator {
  font-size: 9px;
  animation: pulse 1.5s infinite;
}

.p-num {
  font-weight: 700;
}

.p-title {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 16:9 响应式外框 */
.bili-iframe-wrapper {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 标准比例 */
  background: #000000;
}

.bili-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

/* 底部提示 */
.bili-footer-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 12px;
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg-mute);
  border-top: 1px solid var(--vp-c-divider);
}

.tip-icon {
  font-size: 13px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.9); }
}

@media (max-width: 640px) {
  .bili-video-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .bili-external-btn {
    align-self: flex-end;
  }
}
</style>
