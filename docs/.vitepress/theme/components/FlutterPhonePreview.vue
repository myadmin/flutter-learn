<template>
  <div class="flutter-preview-card">
    <!-- 顶部工具栏 -->
    <div class="preview-toolbar">
      <div class="toolbar-left">
        <span class="preview-badge">
          <svg class="flutter-mini-icon" viewBox="0 0 128 128" width="14" height="14">
            <path fill="#3FB6D3" d="M12.3 64.2L76.3 0h39.4L32.1 83.6zM76.3 128h39.4L81.6 93.9l34.1-34.8H76.3L42.2 93.5z"/>
            <path fill="#27AACD" d="M81.6 93.9l-20-20-19.4 19.6 19.4 19.6z"/>
            <path fill="#19599A" d="M115.7 128L81.6 93.9l-20 19.2L76.3 128z"/>
          </svg>
          Flutter UI 实时渲染预览
        </span>
        <span class="preview-title">{{ title || '组件效果' }}</span>
      </div>

      <div class="toolbar-right">
        <button class="tool-btn" :class="{ active: viewMode === 'preview' }" @click="viewMode = 'preview'">
          📱 模拟器效果
        </button>
        <button v-if="$slots.code" class="tool-btn" :class="{ active: viewMode === 'code' }" @click="viewMode = 'code'">
          💻 查看代码
        </button>
        <button class="tool-btn reset-btn" title="重置交互状态" @click="resetState">
          ↺ 重置
        </button>
      </div>
    </div>

    <!-- 容器内容 -->
    <div class="preview-container">
      <!-- 模式一：手机模拟器 -->
      <div v-show="viewMode === 'preview'" class="phone-mockup-wrapper">
        <div class="phone-device" :class="{ 'device-dark': isDark }">
          <!-- 手机听筒/灵动岛 -->
          <div class="phone-top-bar">
            <span class="status-time">09:41</span>
            <div class="dynamic-island">
              <span class="camera-lens"></span>
            </div>
            <div class="status-icons">
              <span class="icon-signal">📶</span>
              <span class="icon-wifi">🛜</span>
              <span class="icon-battery">🔋</span>
            </div>
          </div>

          <!-- Flutter AppBar -->
          <div class="flutter-app-bar" :style="{ background: appBarColor || '#02569B' }">
            <div class="appbar-left">
              <span v-if="hasBack" class="back-btn" @click="handleBack">←</span>
              <span class="appbar-title">{{ appBarTitle || title || 'Flutter App' }}</span>
            </div>
            <div class="appbar-actions">
              <span class="appbar-icon" @click="triggerAction">🔍</span>
              <span class="appbar-icon" @click="toggleDark">⋮</span>
            </div>
          </div>

          <!-- Flutter Widget 渲染主体区域 -->
          <div class="flutter-screen-body">
            <!-- 预置类型 1: 计数器应用 (StatefulWidget / setState) -->
            <div v-if="type === 'counter'" class="demo-counter-screen">
              <p class="counter-label">你已点击浮动按钮的次数：</p>
              <h1 class="counter-number">{{ counter }}</h1>
              <p class="counter-tip">💡 点击右下角「+」体验 setState 驱动局部刷新</p>
              <button class="fab-btn" @click="counter++">+</button>
            </div>

            <!-- 预置类型 2: Container 容器样式 -->
            <div v-else-if="type === 'container'" class="demo-container-screen">
              <div class="control-panel">
                <label>圆角: {{ containerRadius }}px</label>
                <input type="range" min="0" max="40" v-model.number="containerRadius" />
                <label>内边距: {{ containerPadding }}px</label>
                <input type="range" min="8" max="32" v-model.number="containerPadding" />
              </div>
              <div 
                class="flutter-box"
                :style="{
                  borderRadius: containerRadius + 'px',
                  padding: containerPadding + 'px',
                  boxShadow: '0 8px 20px rgba(2,86,155,0.25)'
                }"
              >
                <span class="box-tag">Container</span>
                <p class="box-text">线性渐变背景与动态装饰</p>
              </div>
            </div>

            <!-- 预置类型 3: Flex 弹性布局 (Row / Column / Expanded) -->
            <div v-else-if="type === 'flex'" class="demo-flex-screen">
              <div class="flex-controls">
                <span class="ctrl-title">对齐方式:</span>
                <div class="btn-group">
                  <button 
                    v-for="align in ['center', 'space-between', 'space-around']" 
                    :key="align"
                    :class="{ active: flexAlign === align }"
                    @click="flexAlign = align"
                  >
                    {{ align }}
                  </button>
                </div>
              </div>

              <div class="layout-showcase">
                <span class="layout-label">Row (水平横向排列)</span>
                <div class="row-box" :style="{ justifyContent: flexAlign }">
                  <div class="color-item c1">Expanded 1</div>
                  <div class="color-item c2">Expanded 2</div>
                  <div class="color-item c3">Expanded 1</div>
                </div>

                <span class="layout-label mt-12">Column (垂直纵向排列)</span>
                <div class="column-box">
                  <div class="col-item">顶部组件 (Item 1)</div>
                  <div class="col-item">中间组件 (Item 2)</div>
                  <div class="col-item">底部组件 (Item 3)</div>
                </div>
              </div>
            </div>

            <!-- 预置类型 4: Wrap 流式标签与 Stack 层叠 -->
            <div v-else-if="type === 'wrap-stack'" class="demo-wrap-screen">
              <span class="layout-label">Wrap 自动换行流式标签</span>
              <div class="wrap-tags">
                <span 
                  v-for="(tag, i) in tags" 
                  :key="i" 
                  class="flutter-chip"
                  :class="{ selected: selectedTag === i }"
                  @click="selectedTag = i"
                >
                  {{ tag }}
                </span>
              </div>

              <span class="layout-label mt-16">Stack & Positioned 绝对层叠</span>
              <div class="stack-box">
                <div class="card-bg">
                  <span class="card-title">📱 仿电商活动专区</span>
                  <span class="card-desc">层叠角标与绝对定位示例</span>
                </div>
                <div class="positioned-badge">爆款 5 折</div>
              </div>
            </div>

            <!-- 预置类型 5: 父子组件通信 (Parent <-> Child) -->
            <div v-else-if="type === 'communication'" class="demo-comm-screen">
              <div class="parent-card">
                <div class="component-tag">父组件 (ParentState)</div>
                <div class="comm-data">当前选中商品: <strong>{{ selectedFruit }}</strong></div>
                <div class="comm-data">总计购买数量: <span class="badge">{{ totalBuyCount }}</span></div>
              </div>

              <div class="child-card">
                <div class="component-tag child-tag">子组件 (ChildItemWidget)</div>
                <p class="child-hint">通过 ValueChanged 回调向父组件传值</p>
                <div class="fruit-buttons">
                  <button 
                    v-for="fruit in ['🍎 苹果', '🍌 香蕉', '🍇 葡萄']" 
                    :key="fruit"
                    class="fruit-btn"
                    :class="{ active: selectedFruit === fruit }"
                    @click="handleSelectFruit(fruit)"
                  >
                    {{ fruit }}
                  </button>
                </div>
                <button class="add-count-btn" @click="totalBuyCount++">
                  🛒 子组件触发「加购 +1」
                </button>
              </div>
            </div>

            <!-- 预置类型 6: Dio 网络请求与加载状态 -->
            <div v-else-if="type === 'dio'" class="demo-dio-screen">
              <div class="dio-header">
                <button class="dio-btn" :disabled="dioLoading" @click="fetchDioData">
                  <span v-if="dioLoading" class="mini-spinner"></span>
                  {{ dioLoading ? 'Dio GET 请求中...' : '⚡ 发起 Dio 请求' }}
                </button>
              </div>

              <div v-if="dioLoading" class="dio-loading-view">
                <div class="flutter-circular-progress"></div>
                <p>CircularProgressIndicator()</p>
              </div>

              <div v-else class="dio-result-list">
                <div v-for="item in dioData" :key="item.id" class="dio-item">
                  <span class="item-id">#{{ item.id }}</span>
                  <div class="item-info">
                    <span class="item-name">{{ item.name }}</span>
                    <span class="item-price">¥{{ item.price }}</span>
                  </div>
                  <span class="tag-status">已获取</span>
                </div>
              </div>
            </div>

            <!-- 预置类型 7: 路由导航 (Navigator 1.0 / 命名路由) -->
            <div v-else-if="type === 'routing'" class="demo-routing-screen">
              <div v-if="currentRoute === 'home'" class="route-page">
                <h3>🏠 首页 (HomePage)</h3>
                <p>当前处于路由栈底: <code>/</code></p>
                <button class="nav-push-btn" @click="pushRoute('detail')">
                  Navigator.pushNamed('/detail') ➔
                </button>
              </div>

              <div v-else class="route-page detail-page">
                <h3>📄 详情页 (DetailPage)</h3>
                <p>接收上级路由传参: <code>id: 10086</code></p>
                <button class="nav-pop-btn" @click="popRoute">
                  ⬅ Navigator.pop() 返回上一页
                </button>
              </div>
            </div>

            <!-- 预置类型 8: 电商实战综合预览 (Banner, 10格分类, 特惠推荐) -->
            <div v-else-if="type === 'ecommerce'" class="demo-ecom-screen">
              <!-- 顶部搜索栏 -->
              <div class="ecom-search-bar">
                <span class="search-icon">🔍</span>
                <span class="search-placeholder">搜一搜：华为 Mate 70 / 热门爆款</span>
              </div>

              <!-- 轮播图模拟 -->
              <div class="ecom-banner">
                <div class="banner-slide">
                  <span class="banner-title">🎉 严选好物年中大促</span>
                  <span class="banner-sub">爆款低至 9.9 元包邮</span>
                </div>
                <div class="banner-dots">
                  <span class="dot active"></span>
                  <span class="dot"></span>
                  <span class="dot"></span>
                </div>
              </div>

              <!-- 金刚区 10 格分类 -->
              <div class="ecom-grid">
                <div v-for="cat in categories" :key="cat.name" class="grid-cell">
                  <span class="grid-icon">{{ cat.icon }}</span>
                  <span class="grid-name">{{ cat.name }}</span>
                </div>
              </div>

              <!-- 特惠专区 -->
              <div class="ecom-recommend">
                <div class="rec-card hot-card">
                  <span class="badge-red">爆款热卖</span>
                  <h4>轻薄羽绒服</h4>
                  <p class="price">¥299 <del>¥599</del></p>
                </div>
                <div class="rec-card discount-card">
                  <span class="badge-orange">限时特惠</span>
                  <h4>智能降噪耳机</h4>
                  <p class="price">¥199 <del>¥399</del></p>
                </div>
              </div>
            </div>

            <!-- 预置类型 9: 登录表单与正则校验 (Day 3-15) -->
            <div v-else-if="type === 'login'" class="demo-login-screen">
              <div class="login-header">
                <h3>用户密码登录</h3>
                <p>Flutter Form 表单校验示例</p>
              </div>

              <div class="form-group">
                <label>手机号 / 账号</label>
                <input 
                  type="text" 
                  v-model="loginPhone" 
                  placeholder="请输入11位手机号"
                  class="flutter-input"
                  :class="{ 'has-error': loginError && !isPhoneValid }"
                />
              </div>

              <div class="form-group">
                <label>密码</label>
                <div class="password-wrapper">
                  <input 
                    :type="showPassword ? 'text' : 'password'" 
                    v-model="loginPassword" 
                    placeholder="请输入密码(不少于6位)"
                    class="flutter-input"
                    :class="{ 'has-error': loginError && loginPassword.length < 6 }"
                  />
                  <span class="eye-toggle" @click="showPassword = !showPassword">
                    {{ showPassword ? '👁️' : '🔒' }}
                  </span>
                </div>
              </div>

              <div v-if="loginError" class="error-msg">⚠️ {{ loginError }}</div>
              <div v-if="loginSuccess" class="success-toast">✓ 登录成功，Token 已持久化！</div>

              <button class="login-submit-btn" @click="handleLogin">
                立即登录
              </button>
            </div>

            <!-- 预置类型 10: 底部4栏导航切换 (IndexedStack) -->
            <div v-else-if="type === 'tabs'" class="demo-tabs-screen">
              <div class="tabs-body">
                <div v-if="activeTab === 0" class="tab-view">
                  <h4>🏠 首页 (HomeView)</h4>
                  <p>包含轮播图、金刚区网格与特惠推荐</p>
                </div>
                <div v-else-if="activeTab === 1" class="tab-view">
                  <h4>📂 分类 (CategoryView)</h4>
                  <p>左右联动的多级侧边栏商品分类</p>
                </div>
                <div v-else-if="activeTab === 2" class="tab-view">
                  <h4>🛒 购物车 (CartView)</h4>
                  <p>支持全选、批量编辑与优惠券满减计算</p>
                </div>
                <div v-else-if="activeTab === 3" class="tab-view">
                  <h4>👤 我的 (ProfileView)</h4>
                  <p>用户资产、待付款/待收货订单与设置</p>
                </div>
              </div>

              <!-- 底部导航栏 -->
              <div class="flutter-bottom-nav">
                <div 
                  v-for="(t, idx) in ['首页', '分类', '购物车', '我的']" 
                  :key="t"
                  class="nav-tab"
                  :class="{ active: activeTab === idx }"
                  @click="activeTab = idx"
                >
                  <span class="nav-icon">{{ ['🏠', '📂', '🛒', '👤'][idx] }}</span>
                  <span class="nav-text">{{ t }}</span>
                </div>
              </div>
            </div>

            <!-- 默认/自定义 Slot -->
            <div v-else class="demo-custom-screen">
              <slot></slot>
            </div>
          </div>

          <!-- 手机底部小黑条 -->
          <div class="phone-bottom-bar">
            <div class="home-indicator"></div>
          </div>
        </div>
      </div>

      <!-- 模式二：代码高亮展示 -->
      <div v-if="$slots.code && viewMode === 'code'" class="code-view-wrapper">
        <slot name="code"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
    appBarTitle?: string
    appBarColor?: string
    type?: 'counter' | 'container' | 'flex' | 'wrap-stack' | 'communication' | 'dio' | 'routing' | 'ecommerce' | 'login' | 'tabs' | 'custom'
    hasBack?: boolean
  }>(),
  {
    type: 'counter',
    hasBack: false
  }
)

const viewMode = ref<'preview' | 'code'>('preview')
const isDark = ref(false)

// 1. Counter 状态
const counter = ref(0)

// 2. Container 状态
const containerRadius = ref(16)
const containerPadding = ref(16)

// 3. Flex 状态
const flexAlign = ref('space-between')

// 4. Wrap & Stack 状态
const tags = ref(['Flutter 3.x', 'Dart 3', '跨端开发', 'Android', 'iOS', 'HarmonyOS', 'GetX', 'Dio'])
const selectedTag = ref(0)

// 5. 组件通信状态
const selectedFruit = ref('🍎 苹果')
const totalBuyCount = ref(1)
const handleSelectFruit = (name: string) => {
  selectedFruit.value = name
}

// 6. Dio 状态
const dioLoading = ref(false)
const dioData = ref([
  { id: 101, name: '极简纯棉男士 T 恤', price: '99' },
  { id: 102, name: '人体工学减压办公椅', price: '799' },
  { id: 103, name: '全自动静音降噪破壁机', price: '369' }
])
const fetchDioData = () => {
  dioLoading.value = true
  setTimeout(() => {
    dioLoading.value = false
    dioData.value = [
      { id: 101, name: '极简纯棉男士 T 恤', price: '99' },
      { id: 102, name: '人体工学减压办公椅', price: '799' },
      { id: 103, name: '全自动静音降噪破壁机', price: '369' },
      { id: 104, name: '【上新】真皮商务多功能双肩包', price: '259' }
    ]
  }, 600)
}

// 7. 路由状态
const currentRoute = ref('home')
const pushRoute = (route: string) => { currentRoute.value = route }
const popRoute = () => { currentRoute.value = 'home' }
const handleBack = () => {
  if (currentRoute.value !== 'home') {
    currentRoute.value = 'home'
  }
}

// 8. 电商分类
const categories = [
  { name: '数码', icon: '💻' },
  { name: '服饰', icon: '👔' },
  { name: '生鲜', icon: '🥑' },
  { name: '美妆', icon: '💄' },
  { name: '家居', icon: '🛋️' }
]

// 9. 登录状态
const loginPhone = ref('13800138000')
const loginPassword = ref('')
const showPassword = ref(false)
const loginError = ref('')
const loginSuccess = ref(false)
const isPhoneValid = computed(() => /^1[3-9]\d{9}$/.test(loginPhone.value))

const handleLogin = () => {
  loginSuccess.value = false
  if (!isPhoneValid.value) {
    loginError.value = '手机号码格式不正确'
    return
  }
  if (loginPassword.value.length < 6) {
    loginError.value = '密码长度不能少于 6 位'
    return
  }
  loginError.value = ''
  loginSuccess.value = true
}

// 10. Tabs 状态
const activeTab = ref(0)

// 公用重置
const resetState = () => {
  counter.value = 0
  containerRadius.value = 16
  containerPadding.value = 16
  flexAlign.value = 'space-between'
  selectedFruit.value = '🍎 苹果'
  totalBuyCount.value = 1
  currentRoute.value = 'home'
  activeTab.value = 0
  loginPassword.value = ''
  loginError.value = ''
  loginSuccess.value = false
}

const toggleDark = () => { isDark.value = !isDark.value }
const triggerAction = () => { alert('触发 AppBar 顶部操作') }
</script>

<style scoped>
.flutter-preview-card {
  margin: 20px 0 28px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: var(--vp-c-bg-mute);
  border-bottom: 1px solid var(--vp-c-divider);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.preview-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(2, 86, 155, 0.1);
  color: #02569B;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
}

.preview-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.tool-btn {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 6px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.tool-btn.active, .tool-btn:hover {
  background: #02569B;
  color: #ffffff;
  border-color: #02569B;
}

.reset-btn {
  background: transparent;
}

.preview-container {
  padding: 20px 0;
  display: flex;
  justify-content: center;
  background: repeating-linear-gradient(
    45deg,
    rgba(128, 128, 128, 0.03),
    rgba(128, 128, 128, 0.03) 10px,
    transparent 10px,
    transparent 20px
  );
}

/* 手机机身外壳 */
.phone-device {
  width: 320px;
  min-height: 520px;
  background: #ffffff;
  border: 10px solid #1e222a;
  border-radius: 36px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.18), 0 0 0 2px rgba(255, 255, 255, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", sans-serif;
  color: #2c3e50;
}

.phone-device.device-dark {
  background: #121212;
  color: #e0e0e0;
}

/* 手机顶部状态栏 */
.phone-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 14px 2px;
  background: transparent;
  font-size: 11px;
  font-weight: 600;
  z-index: 10;
}

.dynamic-island {
  width: 70px;
  height: 16px;
  background: #000000;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 6px;
}

.camera-lens {
  width: 6px;
  height: 6px;
  background: #111e38;
  border-radius: 50%;
  display: inline-block;
}

.status-icons {
  display: flex;
  gap: 4px;
  font-size: 10px;
}

/* Flutter AppBar */
.flutter-app-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.appbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-btn {
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
}

.appbar-title {
  font-size: 15px;
  font-weight: bold;
  letter-spacing: 0.3px;
}

.appbar-actions {
  display: flex;
  gap: 10px;
  cursor: pointer;
}

/* 屏幕主体 */
.flutter-screen-body {
  flex: 1;
  padding: 14px;
  overflow-y: auto;
  position: relative;
  font-size: 13px;
  display: flex;
  flex-direction: column;
}

/* 底部 Home 键指示条 */
.phone-bottom-bar {
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-indicator {
  width: 100px;
  height: 4px;
  background: #4a4a4a;
  border-radius: 2px;
}

/* ================= 各种 Demo 样式 ================= */

/* 1. Counter */
.demo-counter-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  position: relative;
}

.counter-number {
  font-size: 52px;
  color: #02569B;
  margin: 8px 0;
  font-weight: 700;
}

.counter-tip {
  font-size: 11px;
  color: #7f8c8d;
}

.fab-btn {
  position: absolute;
  right: 6px;
  bottom: 10px;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: #02569B;
  color: #fff;
  border: none;
  font-size: 26px;
  box-shadow: 0 6px 14px rgba(2, 86, 155, 0.4);
  cursor: pointer;
  transition: transform 0.1s;
}

.fab-btn:active {
  transform: scale(0.92);
}

/* 2. Container */
.control-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
  font-size: 12px;
}

.flutter-box {
  background: linear-gradient(135deg, #02569B, #0175c2);
  color: white;
  text-align: center;
  transition: all 0.2s;
}

.box-tag {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
}

.box-text {
  margin-top: 8px;
  font-size: 12px;
}

/* 3. Flex */
.flex-controls {
  margin-bottom: 12px;
}

.ctrl-title {
  font-size: 11px;
  font-weight: 600;
}

.btn-group {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.btn-group button {
  font-size: 10px;
  padding: 3px 6px;
  border-radius: 4px;
  border: 1px solid #ccc;
  background: #fff;
  cursor: pointer;
}

.btn-group button.active {
  background: #02569B;
  color: white;
  border-color: #02569B;
}

.layout-label {
  font-size: 11px;
  font-weight: bold;
  color: #555;
  margin-bottom: 4px;
  display: block;
}

.mt-12 { margin-top: 12px; }
.mt-16 { margin-top: 16px; }

.row-box {
  display: flex;
  background: #eef2f7;
  padding: 8px;
  border-radius: 8px;
}

.color-item {
  padding: 6px 10px;
  color: white;
  border-radius: 6px;
  font-size: 11px;
}

.c1 { background: #42a5f5; }
.c2 { background: #02569b; }
.c3 { background: #26c6da; }

.column-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #eef2f7;
  padding: 8px;
  border-radius: 8px;
}

.col-item {
  background: #02569b;
  color: white;
  padding: 6px;
  border-radius: 4px;
  text-align: center;
  font-size: 11px;
}

/* 4. Wrap & Stack */
.wrap-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.flutter-chip {
  padding: 4px 10px;
  background: #f0f4f8;
  border: 1px solid #d0dbe5;
  border-radius: 14px;
  font-size: 11px;
  cursor: pointer;
}

.flutter-chip.selected {
  background: #02569B;
  color: white;
  border-color: #02569B;
}

.stack-box {
  position: relative;
  margin-top: 6px;
}

.card-bg {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%);
  padding: 16px;
  border-radius: 12px;
  color: #333;
}

.card-title {
  display: block;
  font-weight: bold;
}

.card-desc {
  font-size: 11px;
  opacity: 0.8;
}

.positioned-badge {
  position: absolute;
  top: -6px;
  right: -4px;
  background: #ff4757;
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(255, 71, 87, 0.4);
}

/* 5. Communication */
.parent-card {
  background: #f0f7ff;
  border: 1px solid #bcd7f5;
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 12px;
}

.component-tag {
  display: inline-block;
  font-size: 10px;
  font-weight: bold;
  color: #02569B;
  background: #e1effe;
  padding: 2px 6px;
  border-radius: 4px;
  margin-bottom: 6px;
}

.comm-data {
  font-size: 12px;
  margin-bottom: 4px;
}

.badge {
  background: #02569B;
  color: white;
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 11px;
}

.child-card {
  background: #fff8e6;
  border: 1px solid #ffe199;
  border-radius: 10px;
  padding: 10px;
}

.child-tag {
  color: #d97706;
  background: #fef3c7;
}

.child-hint {
  font-size: 11px;
  color: #888;
  margin-bottom: 8px;
}

.fruit-buttons {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}

.fruit-btn {
  flex: 1;
  padding: 6px 2px;
  font-size: 11px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}

.fruit-btn.active {
  background: #d97706;
  color: white;
  border-color: #d97706;
}

.add-count-btn {
  width: 100%;
  padding: 8px;
  background: #02569B;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

/* 6. Dio */
.dio-header {
  margin-bottom: 12px;
}

.dio-btn {
  width: 100%;
  padding: 8px;
  background: #02569B;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.mini-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.dio-loading-view {
  text-align: center;
  padding: 30px 0;
  color: #02569B;
  font-size: 11px;
}

.flutter-circular-progress {
  width: 28px;
  height: 28px;
  border: 3px solid #02569B;
  border-top-color: transparent;
  border-radius: 50%;
  margin: 0 auto 10px;
  animation: spin 0.8s linear infinite;
}

.dio-result-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dio-item {
  display: flex;
  align-items: center;
  background: #f8fafc;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.item-id {
  font-size: 10px;
  color: #94a3b8;
  font-weight: bold;
  margin-right: 8px;
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 11px;
  font-weight: 600;
  display: block;
}

.item-price {
  font-size: 11px;
  color: #e11d48;
  font-weight: bold;
}

.tag-status {
  font-size: 9px;
  background: #ecfdf5;
  color: #059669;
  padding: 2px 6px;
  border-radius: 4px;
}

/* 7. Routing */
.route-page {
  padding: 20px 10px;
  text-align: center;
}

.detail-page {
  background: #f0fdf4;
  border-radius: 12px;
}

.nav-push-btn, .nav-pop-btn {
  margin-top: 20px;
  padding: 8px 16px;
  background: #02569B;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
}

.nav-pop-btn {
  background: #16a34a;
}

/* 8. Ecommerce */
.ecom-search-bar {
  background: #f1f5f9;
  padding: 6px 10px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #64748b;
  margin-bottom: 10px;
}

.ecom-banner {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  border-radius: 12px;
  padding: 14px 12px;
  margin-bottom: 12px;
  position: relative;
}

.banner-title {
  display: block;
  font-size: 13px;
  font-weight: bold;
  color: #0369a1;
}

.banner-sub {
  font-size: 10px;
  color: #0284c7;
}

.banner-dots {
  position: absolute;
  right: 10px;
  bottom: 8px;
  display: flex;
  gap: 3px;
}

.banner-dots .dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.2);
}

.banner-dots .dot.active {
  background: #0284c7;
  width: 10px;
  border-radius: 3px;
}

.ecom-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  text-align: center;
  margin-bottom: 12px;
}

.grid-icon {
  font-size: 18px;
  display: block;
}

.grid-name {
  font-size: 10px;
  color: #475569;
}

.ecom-recommend {
  display: flex;
  gap: 8px;
}

.rec-card {
  flex: 1;
  background: #faf5ff;
  border: 1px solid #f3e8ff;
  border-radius: 8px;
  padding: 8px;
  font-size: 11px;
}

.rec-card h4 {
  margin: 4px 0;
  font-size: 11px;
}

.badge-red, .badge-orange {
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 3px;
  color: white;
}

.badge-red { background: #ef4444; }
.badge-orange { background: #f97316; }

.price {
  color: #e11d48;
  font-weight: bold;
  font-size: 11px;
}

.price del {
  color: #94a3b8;
  font-size: 9px;
  font-weight: normal;
}

/* 9. Login */
.login-header {
  text-align: center;
  margin-bottom: 16px;
}

.login-header h3 {
  margin: 0 0 4px;
  font-size: 15px;
}

.login-header p {
  margin: 0;
  font-size: 11px;
  color: #64748b;
}

.form-group {
  margin-bottom: 10px;
}

.form-group label {
  display: block;
  font-size: 11px;
  color: #475569;
  margin-bottom: 4px;
}

.flutter-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 12px;
  box-sizing: border-box;
}

.flutter-input.has-error {
  border-color: #ef4444;
  background: #fef2f2;
}

.password-wrapper {
  position: relative;
}

.eye-toggle {
  position: absolute;
  right: 10px;
  top: 8px;
  cursor: pointer;
  font-size: 12px;
}

.error-msg {
  color: #ef4444;
  font-size: 10px;
  margin-bottom: 8px;
}

.success-toast {
  background: #ecfdf5;
  color: #059669;
  font-size: 11px;
  padding: 6px;
  border-radius: 4px;
  margin-bottom: 8px;
  text-align: center;
}

.login-submit-btn {
  width: 100%;
  padding: 9px;
  background: #02569B;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 6px;
}

/* 10. Tabs */
.demo-tabs-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.tabs-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.tab-view h4 {
  margin: 0 0 6px;
  color: #02569B;
}

.tab-view p {
  font-size: 11px;
  color: #64748b;
  margin: 0;
}

.flutter-bottom-nav {
  display: flex;
  border-top: 1px solid #e2e8f0;
  padding: 6px 0 2px;
  background: #ffffff;
}

.nav-tab {
  flex: 1;
  text-align: center;
  cursor: pointer;
  color: #64748b;
}

.nav-tab.active {
  color: #02569B;
  font-weight: bold;
}

.nav-icon {
  font-size: 14px;
  display: block;
}

.nav-text {
  font-size: 10px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
