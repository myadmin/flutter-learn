# Flutter 全栈自学教程网 🚀

<p align="center">
  <img src="./docs/public/logo.svg" width="120" alt="Flutter Logo" />
</p>

<p align="center">
  <strong>基于黑马程序员《Flutter从入门到实战全套视频教程》（BV1wR4Xz6EqG，共103集）全量制作的现代化 VitePress 在线学习网站</strong>
</p>

<p align="center">
  <a href="https://github.com/myadmin/flutter-learn/actions/workflows/deploy.yml"><img src="https://github.com/myadmin/flutter-learn/actions/workflows/deploy.yml/badge.svg" alt="Deploy to GitHub Pages"></a>
  <a href="https://vitepress.dev/"><img src="https://img.shields.io/badge/VitePress-v1.6-02569B?logo=vite" alt="VitePress"></a>
  <a href="https://flutter.dev/"><img src="https://img.shields.io/badge/Flutter-3.x-02569B?logo=flutter" alt="Flutter"></a>
  <a href="https://dart.dev/"><img src="https://img.shields.io/badge/Dart-3.x-0175C2?logo=dart" alt="Dart"></a>
</p>

---

## 🌐 在线访问

- **GitHub Pages 在线教程地址**：[https://myadmin.github.io/flutter-learn/](https://myadmin.github.io/flutter-learn/)
- **B站官方原版视频课程**：[黑马程序员 Flutter 从入门到实战 (BV1wR4Xz6EqG)](https://www.bilibili.com/video/BV1wR4Xz6EqG/)

---

## 📚 教程大纲与 103 集分 P 精准映射

本套教程覆盖原版视频课程 103 集全部内容，分为四大核心模块：

### 1. 导学与准备环境 (P1 - P2)
- [P1. Flutter 课程导学与技术全览](docs/guide/index.md)
- [P2. Dart 基础开发环境与编辑器配置](docs/dart/index.md)

### 2. Day 1: Dart 3 核心语法与进阶 (P3 - P37)
- **P3-P12**: [变量常量与基本数据类型 (int, double, String, bool, List, Map, dynamic)](docs/dart/variables-and-types.md)
- **P13-P15**: [空安全机制与各类运算符 (Sound Null Safety, `?`, `!`, `??`, `late`)](docs/dart/null-safety-and-operators.md)
- **P16-P23**: [流程控制与函数详解 (switch 模式匹配、可选命名参数、闭包高阶函数)](docs/dart/control-flow-and-functions.md)
- **P24-P32**: [面向对象编程 (类定义、构造函数、私有属性、抽象类、接口与 Mixin 混入)](docs/dart/oop-classes-and-inheritance.md)
- **P33-P37**: [泛型与异步编程 (泛型类、Event Loop、Future 与 async/await 状态机)](docs/dart/generics-and-async.md)

### 3. Day 2: Flutter 核心组件与框架架构 (P38 - P79)
- **P38-P41**: [Flutter 引擎原理与目录剖析 (Impeller/Skia、pubspec.yaml、runApp)](docs/flutter-core/index.md)
- **P42-P50**: [基础 Widget 与状态生命周期 (Stateless/Stateful、setState 局部重绘)](docs/flutter-core/widget-basics-lifecycle.md)
- **P51-P59**: [盒约束与弹性流式布局 (Container, Flex, Row, Column, Wrap, Stack/Positioned)](docs/flutter-core/layout-widgets.md)
- **P60-P67**: [常用展示与滚动容器 (Text, Image, TextField, ListView.builder, CustomScrollView)](docs/flutter-core/basic-and-scroll-widgets.md)
- **P68-P69**: [组件通信机制 (父传子构造参数、子传父 ValueChanged 回调函数提升)](docs/flutter-core/component-communication.md)
- **P70-P73**: [网络请求与 Dio 封装 (单例 DioClient、请求拦截器、Chrome 跨域联调)](docs/flutter-core/network-dio.md)
- **P74-P79**: [路由与导航体系 (Navigator 1.0、命名路由、动态拦截器 onGenerateRoute、404兜底)](docs/flutter-core/routing-navigation.md)

### 4. Day 3: 仿网易严选电商项目与多端部署 (P80 - P103)
- **P80-P81**: [Web 架构搭建与 Git 规范 (分层设计：models/views/controllers/services)](docs/project/index.md)
- **P82-P86**: [主页架构与轮播 Banner (IndexedStack 状态持久化、PageView 自动轮播、渐变搜索栏)](docs/project/home-and-tabs.md)
- **P87-P89**: [AI 辅助分类与爆款推荐 (Trae / AI 辅助开发 Prompt 公式、金刚区网格、不对称特惠)](docs/project/category-and-recommend.md)
- **P90-P92**: [下拉刷新与无限滚动加载 (RefreshIndicator、ScrollController 触底监听、GlobalKey)](docs/project/pull-refresh-infinite-scroll.md)
- **P93-P95**: [个人中心与登录表单验证 (沉浸式 Header、Form 正则验证、密码安全切换)](docs/project/profile-and-auth.md)
- **P96-P98**: [GetX 响应式状态与 Token 自动持久化 (shared_preferences、无感知鉴权注入)](docs/project/getx-state-and-token.md)
- **P99-P100**: [Android 环境配置与 Release APK 打包真机调试](docs/multiplatform/android.md)
- **P101**: [iOS 平台部署与 Xcode 模拟器/真机签名运行](docs/multiplatform/ios.md)
- **P102**: [HarmonyOS NEXT 鸿蒙侧跨端开发与真机调试避坑](docs/multiplatform/harmonyos.md)
- **P103**: [课程完结回顾与多端部署总结](docs/multiplatform/index.md)

---

## 🛠 本地开发与构建

本项目基于 Node.js 18+ 与 pnpm 9+ 构建：

```bash
# 1. 克隆代码仓库
git clone https://github.com/myadmin/flutter-learn.git
cd flutter-learn

# 2. 安装依赖
pnpm install

# 3. 启动本地热重载开发服务器
pnpm docs:dev

# 4. 构建生产静态包
pnpm docs:build

# 5. 本地预览构建产物
pnpm docs:preview
```

---

## 🚀 GitHub Actions 自动部署说明

本项目已内置 `.github/workflows/deploy.yml` 自动化部署流程：
1. 每次向 `main` 分支执行 `git push` 时，GitHub Actions 会自动触发构建。
2. 构建产物会自动上传并发布至 **GitHub Pages**。
3. **重要设置**：首次在 GitHub 仓库使用时，请前往仓库页面：
   - 点击 **Settings** -> **Pages**
   - 在 **Build and deployment** 下的 **Source** 选择 **GitHub Actions**
   - 部署完成后即可通过 `https://myadmin.github.io/flutter-learn/` 在线访问。
