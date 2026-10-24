<template>
  <div class="dart-console-wrapper">
    <div class="console-header">
      <div class="window-controls">
        <span class="control-dot dot-red"></span>
        <span class="control-dot dot-yellow"></span>
        <span class="control-dot dot-green"></span>
      </div>
      <div class="console-title">
        <span class="terminal-icon">⚡</span>
        {{ title || 'Dart Console - dart run' }}
      </div>
      <div class="console-actions">
        <button v-if="!isRunning && !hasRun" class="action-btn run-btn" @click="handleRun">
          <span class="btn-icon">▶</span> 运行代码
        </button>
        <button v-else-if="isRunning" class="action-btn running-btn" disabled>
          <span class="spinner"></span> 运行中...
        </button>
        <button v-else class="action-btn rerun-btn" @click="handleRun">
          <span class="btn-icon">↺</span> 重新运行
        </button>
      </div>
    </div>

    <div class="console-body">
      <div class="code-command">
        <span class="prompt">$</span> dart run bin/main.dart
      </div>

      <div v-if="!hasRun && !isRunning" class="initial-hint">
        <span class="hint-icon">💡</span> 点击右上角「运行代码」查看 Dart 运行输出结果
      </div>

      <div v-if="isRunning" class="running-indicator">
        <span class="cursor-blink">▋</span> 正在编译并执行 Dart JIT 运行时...
      </div>

      <div v-if="hasRun" class="output-content">
        <div 
          v-for="(line, idx) in formattedLines" 
          :key="idx" 
          class="output-line"
          :class="line.type"
        >
          <span class="line-text">{{ line.text }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
    output?: string | string[]
    preset?: 'variables' | 'null-safety' | 'control-flow' | 'oop' | 'event-loop' | string
    autoRun?: boolean
  }>(),
  {
    title: 'Dart Console - dart run',
    autoRun: true
  }
)

const PRESETS: Record<string, string[]> = {
  variables: [
    '> var title = "Hello Dart";',
    'title.runtimeType: String',
    '> dynamic value = "Antigravity";',
    'value.length: 11',
    '> value = 100;',
    'value.runtimeType: int',
    '> Object obj = "Dart is awesome";',
    'obj.toString(): Dart is awesome',
    '✓ 类型检查与提升执行完毕'
  ],
  'null-safety': [
    '> String? nickname = null;',
    '> String displayName = nickname ?? "匿名游客";',
    'displayName: 匿名游客',
    '> int? retryCount;',
    '> retryCount ??= 3;',
    'retryCount: 3',
    '> retryCount ??= 5;',
    'retryCount: 3 (已有非空值，跳过覆写)',
    '✓ 健壮性空安全执行完毕'
  ],
  'control-flow': [
    '> dart run bin/control_flow.dart',
    'switch (statusCode) => "200: 请求成功 OK"',
    'for-in item: [Flutter, Dart, Vue, React]',
    '高阶闭包 filter & map: [2, 4, 6, 8, 10]',
    '✓ 流程控制与函数式编程执行完毕'
  ],
  oop: [
    '> dart run bin/oop_demo.dart',
    'Person(name: "张三", age: 24)',
    'Student(id: 10086, school: "清华大学")',
    'with Logger, JsonSerializable -> 混入扩展能力就绪',
    '✓ 类继承、多态与 Mixin 混入正常'
  ],
  'event-loop': [
    '> dart run bin/event_loop.dart',
    '1. main 启动 (同步主线程)',
    '5. main 结束 (同步主线程)',
    '3. 微任务执行 (Microtask Queue: 优先执行排空)',
    '2. 普通 Future 执行 (Event Queue: 普通事件)',
    '4. 延时 Future 执行 (Timer 就绪回调)',
    '✓ 单线程非阻塞事件循环调度完毕'
  ]
}

const isRunning = ref(false)
const hasRun = ref(props.autoRun)

const formattedLines = computed(() => {
  const raw = props.preset && PRESETS[props.preset]
    ? PRESETS[props.preset]
    : (Array.isArray(props.output) 
        ? props.output 
        : (props.output ? props.output.split('\n') : []))
  
  return raw.map(line => {
    let type = 'normal'
    if (line.startsWith('>') || line.startsWith('$')) type = 'command'
    else if (line.includes('Error') || line.includes('Exception') || line.startsWith('✗')) type = 'error'
    else if (line.includes('Warning') || line.startsWith('!')) type = 'warning'
    else if (line.includes('Success') || line.startsWith('✓')) type = 'success'
    else if (line.includes(': ') || line.includes(' = ')) type = 'variable'
    return { text: line, type }
  })
})

const handleRun = () => {
  isRunning.value = true
  hasRun.value = false
  setTimeout(() => {
    isRunning.value = false
    hasRun.value = true
  }, 400)
}
</script>

<style scoped>
.dart-console-wrapper {
  margin: 16px 0 24px;
  background: #1e1e2e;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.console-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #181825;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.window-controls {
  display: flex;
  gap: 8px;
}

.control-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.dot-red { background: #ff5f56; }
.dot-yellow { background: #ffbd2e; }
.dot-green { background: #27c93f; }

.console-title {
  color: #a6adc8;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.terminal-icon {
  color: #02569B;
}

.console-actions {
  display: flex;
  align-items: center;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.run-btn {
  background: #02569B;
  color: #ffffff;
}

.run-btn:hover {
  background: #0175c2;
  transform: translateY(-1px);
}

.rerun-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #cdd6f4;
}

.rerun-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.running-btn {
  background: rgba(255, 255, 255, 0.05);
  color: #89b4fa;
  cursor: wait;
}

.btn-icon {
  font-size: 11px;
}

.console-body {
  padding: 16px;
  min-height: 90px;
  font-size: 13px;
  line-height: 1.6;
  color: #cdd6f4;
}

.code-command {
  color: #89b4fa;
  margin-bottom: 12px;
}

.prompt {
  color: #a6e3a1;
  font-weight: bold;
  margin-right: 6px;
}

.initial-hint {
  color: #6c7086;
  font-style: italic;
  padding: 12px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.running-indicator {
  color: #f9e2af;
  padding: 8px 0;
}

.cursor-blink {
  animation: blink 1s infinite;
  color: #89b4fa;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.output-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.output-line.normal {
  color: #cdd6f4;
}

.output-line.variable {
  color: #a6e3a1;
}

.output-line.success {
  color: #94e2d5;
}

.output-line.warning {
  color: #f9e2af;
}

.output-line.error {
  color: #f38ba8;
}

.spinner {
  width: 10px;
  height: 10px;
  border: 2px solid #89b4fa;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
