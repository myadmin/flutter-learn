# 实战二：【Flutter】电子书城 APP 实战指南 (豆瓣阅读与读书爬虫)

> 📺 **B站视频课程**：[【Flutter】电子书城APP - 你的豆瓣阅读也可能是电子书城 (BV1dpg5eSETx)](https://www.bilibili.com/video/BV1dpg5eSETx/)  
> 🔗 **官方开源源码**：[SX-Code/ebook (GitHub)](https://github.com/SX-Code/ebook)  
> 💡 **核心定位**：从传统的 RESTful JSON 接口跨越到 **HTML DOM 逆向爬虫、Provider 响应式 MVVM 架构、微光流动骨架屏 (Shimmer) 与明暗双主题自适应** 的进阶企业级实战。

---

## 1. 为什么选择“电子书城”作为进阶实战？

在完成了“实战一：仿网易严选电商商城”后，我们已经掌握了常规移动端 App 的标准工业流（GetX、RESTful API 契约、Token 鉴权、瀑布流与分页）。然而，在真实企业级跨平台开发中，开发者往往还会遇到以下**进阶场景与核心痛点**：

1. **没有标准的 RESTful JSON 接口怎么办？**
   真实业务或个人作品常常需要聚合第三方开放数据（如豆瓣读书排行榜、书籍详情、用户书评、电子书试读）。此时必须利用网络请求结合 **HTML DOM 树解析与 CSS 选择器抽取**，构建高可用、防反爬、容错降级的爬虫服务。
2. **状态管理选型权衡：GetX vs 官方推荐 Provider**
   虽然 GetX 开发迅速，但在大型工程或团队协作中，Google 官方主推的 `Provider`（基于 InheritedWidget 深度优化）依然是面试和架构考核的核心标准。
3. **首屏渲染与转圈加载体验落差**
   传统居中菊花加载（CircularProgressIndicator）会给用户强烈的等待感和割裂感。现代化顶级应用（如知乎、豆瓣、小红书）均全面拥抱 **微光流动骨架屏 (Shimmer Skeleton)**，在数据尚未到达前呈现高度贴合页面结构的微光占位。
4. **多设备屏幕自适应与明暗夜间模式 (Dark Mode)**
   不同机型的物理分辨率、DPI、文字缩放倍率各不相同；同时阅读类应用对夜间模式（深色护眼背景、降低文本对比度）有着刚性诉求。

本项目正是针对以上所有痛点精心打磨的进阶案例！

---

## 2. 真实效果在线交互演示

你可以在下方内置的手机模拟器中直接体验本项目打造的高保真交互效果（支持切换 Salomon 流光底部栏、切换明亮/夜间暗黑模式、切换微光骨架屏动效与加入书架）：

<FlutterPhonePreview 
  type="ebook" 
  title="电子书城首页与 SalomonBottomBar 效果模拟" 
  appBarTitle="豆瓣电子书城" 
/>

---

## 3. 项目核心功能全景

```
【Flutter】电子书城 APP 核心功能图景
│
├── 🏠 首页 (HomePage)
│   ├── 顶部防抖搜索栏与明暗双主题动态切换
│   ├── 豆瓣编辑精选重磅推荐横幅 (Banner 轮播)
│   ├── 今日精选书籍卡片流与星级评分展示
│   └── 页面加载时微光流动骨架屏 (Shimmer Skeletons)
│
├── 📚 豆瓣读书商城 (DoubanStorePage)
│   ├── 豆瓣读书 Top 250 榜单数据实时爬取解析
│   ├── 热门新书速递与不同分类标签联动筛选
│   └── 触底自动分页增量流式抓取
│
├── 🏷️ 电子书城分类 (EBookStorePage)
│   ├── 豆瓣阅读热门分类金刚区 (科幻、文学、悬疑、经济等)
│   └── 分类图书网格瀑布流展示与单价信息
│
├── 📖 图书详情全景 (BookDetailPage)
│   ├── 渐变透明沉浸式 AppBar 与封面背景高斯模糊 (BlurryContainer)
│   ├── 星级评分条 (FlutterRatingBar) 与精准评分比率
│   ├── 长文本内容简介自适应展开/收起 (ReadMoreText)
│   ├── 作者生平卡片与图书章节目录手风琴
│   └── 真实读者精彩书评瀑布流展示
│
└── 👤 个人书架与阅读器 (MyBookPage)
    ├── 本地已加书架电子书管理
    └── 轻量级沉浸式阅读器与翻页交互
```

---

## 4. 核心技术栈与依赖版本矩阵

| 技术分类 | 核心依赖库 | 引入版本 | 技术作用与选型理由 |
| :--- | :--- | :--- | :--- |
| **基础语言与框架** | `Flutter SDK` / `Dart SDK` | `3.x / >=3.4.1` | 全新 Material 3 规范与 Dart 3 强类型空安全支持 |
| **屏幕自适应** | `flutter_screenutil` | `^5.9.3` | 基于 375×812 移动端设计稿的百分比与安全区适配 |
| **状态管理** | `provider` | `^6.1.2` | Google 官方推荐 MVVM 响应式框架，精准颗粒度重绘 |
| **底部流光导航** | `salomon_bottom_bar` | `^3.3.2` | 现代高颜值灵动胶囊气泡 BottomNavigationBar |
| **堆栈性能优化** | `lazy_load_indexed_stack` | `^1.1.0` | 突破传统 IndexedStack 启动全量加载瓶颈，按需懒加载 Tab |
| **网络请求** | `dio` | `^5.4.3+1` | 单例网络客户端、拦截器管道、请求日志追踪 |
| **HTML 爬虫** | `html` | `^0.15.4` | DOM 树解析引擎、CSS 选择器抓取豆瓣读书网页数据 |
| **微光流动骨架屏** | `shimmer` | `^3.0.0` | 高质感微光占位动画，全面替代传统菊花转圈 |
| **星级评分控件** | `flutter_rating_bar` | `^4.0.1` | 支持半星精准打分与定制化 Icon 颜色 |
| **高斯模糊容器** | `blurrycontainer` | `^2.1.0` | 详情页背景高质感毛玻璃半透明模糊效果 |
| **文本动态折叠** | `readmore` | `^3.0.0` | 优雅实现多行长文图书简介的“展开 / 收起”动效 |
| **轻量级吐司** | `delightful_toast` | `^1.1.0` | 顶部浮动高质感通知提醒与操作反馈 |

---

## 5. 两大实战项目技术架构深度对比

为了让大家建立全面的 Flutter 架构视野，我们将本教程中的两大实战项目进行横向对比：

| 评估维度 | 实战一：仿网易严选电商商城 | 实战二：豆瓣阅读电子书城 APP |
| :--- | :--- | :--- |
| **主要定位** | 大厂商用 B2C 电商平台标准交付体系 | 现代高颜值内容消费与资讯聚合类应用 |
| **状态管理方案** | **GetX**（响应式 `.obs` + Controller + `Obx`） | **Provider**（ChangeNotifier + ViewModel + Consumer） |
| **路由导航机制** | GetX 命名路由 / 动态路由管理 | Flutter 原生 Navigator 路由封装与参数透传 |
| **数据源契约** | 标准 RESTful JSON 格式接口 + Swagger 契约 | **HTML 网页 DOM 逆向爬虫** (`package:html` 解析) |
| **底部导航架构** | 原生 `BottomNavigationBar` + `IndexedStack` | **`SalomonBottomBar`** + **`LazyLoadIndexedStack` 懒加载** |
| **加载过渡视觉** | 传统局部 CircularProgressIndicator | **Shimmer 流动微光骨架屏体系**（成对封装 7 套 Skeleton） |
| **主题适配支持** | 浅色 Material 主题为主 | **深色 / 浅色明暗主题一键切换**（护眼模式） |
| **屏幕多端适配** | 基础 MediaQuery 查询 | **`flutter_screenutil` 设计稿像素级映射** |

---

## 6. 进阶学习路线图

学习本系列文档建议按照以下顺序循序渐进：

1. **[工程规范、屏幕适配与明暗主题系统](./architecture-and-screenutil.md)**：搭建规范目录，接入 ScreenUtil 与 ThemeProvider；
2. **[高颜值流光底部导航与懒加载堆栈](./bottom-nav-and-lazystack.md)**：实现 Salomon 流光气泡栏与懒加载导航栈优化；
3. **[Dio 网络封装与 HTML DOM 爬虫逆向工程](./dio-and-spider-crawler.md)**：掌握防反爬 Header 伪装与豆瓣 DOM 树解析实战；
4. **[领域模型设计与 Provider MVVM 状态流转](./model-and-provider-mvvm.md)**：编写清晰健壮的 Model 与 ViewModel 分层；
5. **[微光流动骨架屏体系与高质感组件库](./shimmer-skeleton-and-ui.md)**：设计优雅的 Shimmer 骨架屏组件对；
6. **[图书详情页全景与阅读器沉浸式体验](./book-detail-and-reader.md)**：打造高斯模糊、星级评分与阅读器翻页综合大招！