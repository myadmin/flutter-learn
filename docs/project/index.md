# 电商项目架构与 Git 版本管理 (P80-P81)

从本章开始，我们将正式进入 **Flutter 仿电商商业级项目实战**（对应课程 P80 至 P98 集）。我们将以主流现代化电商应用（如网易严选、极客商城等）为业务原型，从零搭建一个具备商业级工程架构的 Flutter 跨端电商 App。

本篇作为项目实战的奠基篇，将系统性剖析项目技术选型、脚手架工程创建、Git 企业级版本控制规范、高内聚低耦合的项目分层目录架构以及全局设计系统（Design System）的搭建。

---

## 1. 电商项目背景与技术选型

### 1.1 业务需求与功能全景图

在真实电商业务场景中，客户端通常由“首页”、“分类”、“购物车”与“我的”四大核心模块构成。我们的仿电商项目将围绕以下业务闭环展开：

```
                              ┌── 首页 (Home): Banner轮播 / 金刚区分类 / 特惠专区 / 爆款推荐 / 瀑布流下拉刷新上拉加载
                              ├── 分类 (Category): 二级联动网格分类列表 (AI辅助生成)
电商实战 App (E-Commerce) ────┼── 购物车 (Cart): 商品选择、数量增减、总计核算与结算流程
                              └── 我的 (Profile): 个人中心、订单入口、登录/注册验证、Token持久化、退出弹窗
```

### 1.2 核心技术栈选型

为保证项目的高性能、可扩展性以及多端一致性，我们选用经过工业界实战检验的成熟库与架构方案：

| 维度 | 选用技术方案 | 选型理由与核心优势 |
| :--- | :--- | :--- |
| **基础框架** | **Flutter 3.x + Dart 3.x** | 全面启用健全空安全，Impeller 新渲染引擎加持，跨端运行流畅 |
| **状态管理** | **GetX (v4.6.x)** | 高性能响应式编程，无 `BuildContext` 限制，集成依赖注入与路由管理 |
| **网络通信** | **Dio (v5.x)** | 支持请求拦截器、FormData 上传、统一异常捕获与自动化 Token 注入 |
| **本地持久化** | **shared_preferences** | 轻量级 Key-Value 异步键值对存储，管理 Token、用户登录凭证与本地配置 |
| **图片缓存** | **cached_network_image** | 支持三级缓存（内存/磁盘）、淡入淡出动效及加载失败占位图 |
| **屏幕自适应** | **flutter_screenutil** | 统一基于设计稿尺寸（750×1334 或 375×812）自动等比例缩放 |
| **下拉刷新** | **RefreshIndicator / 自定义组件** | 官方机制与物理回弹动效，搭配 `ScrollController` 触底自动分页 |

---

## 2. Flutter 电商项目初始化

### 2.1 创建项目工程

我们推荐使用官方命令行工具快速初始化项目，并在初始化时显式指定组织包名与多平台支持：

```bash
# 进入你的工作区目录
cd /e/start-learn/flutter-learn

# 创建电商项目，指定组织包名和支持平台
flutter create --org com.geekmall --platforms=android,ios,web geek_mall
```

> **参数说明**：
> - `--org com.geekmall`：指定项目的组织唯一标识，生成 Android 的 `applicationId`（`com.geekmall.geek_mall`）和 iOS 的 `Bundle Identifier`。
> - `--platforms=android,ios,web`：提前注入多平台宿主工程支撑代码。

### 2.2 清理脚手架模板代码

官方脚手架默认生成的 `main.dart` 包含计数器（Counter）示例代码，我们在实战开始前应将其彻底精简，建立纯粹的入口文件。

打开 `lib/main.dart`，重构为以下极简结构：

```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

void main() {
  // 保证 Flutter Engine 与原生插件通道初始化完毕
  WidgetsFlutterBinding.ensureInitialized();

  // 强制设置手机端竖屏显示，避免旋转屏幕导致布局形变
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]).then((_) {
    runApp(const GeekMallApp());
  });
}

class GeekMallApp extends StatelessWidget {
  const GeekMallApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '极客商城',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFD32F2F)),
        scaffoldBackgroundColor: const Color(0xFFF5F5F5),
      ),
      home: const Scaffold(
        body: Center(
          child: Text(
            '极客商城初始化中...',
            style: TextStyle(fontSize: 18, color: Colors.grey),
          ),
        ),
      ),
    );
  }
}
```

---

## 3. Git 版本管理规范与工程化实践

在团队协作或开源项目中，规范的 Git 工作流是保障代码质量与追溯变更的生命线。

### 3.1 完善 `.gitignore` 规则

Flutter 项目在构建过程中会生成庞大的中间产物（如 `build/` 目录、`.dart_tool/`、本地 SDK 路径配置等），这些文件严禁提交到远程仓库。

检查项目根目录的 `.gitignore`，确保包含以下关键过滤规则：

```gitignore
# Miscellaneous
*.class
*.log
*.pyc
*.swp
.DS_Store
.atom/
.buildlog/
.history
.svn/
migrate_working_dir/

# IntelliJ IDEA / Android Studio
*.iml
.idea/
.idea_modules/

# Visual Studio Code
.vscode/

# Flutter / Dart 核心构建产物
.dart_tool/
.flutter-plugins
.flutter-plugins-dependencies
.packages
.pub-cache/
.pub/
/build/

# Android 相关本地敏感配置文件
android/local.properties
android/key.properties
android/*.keystore
android/*.jks

# iOS 相关临时缓存与 Pods 产物
ios/.generated/
ios/Flutter/App.framework
ios/Flutter/Flutter.framework
ios/Flutter/Generated.xcconfig
ios/Pods/
ios/Podfile.lock

# Web 临时产物
web/out/
```

### 3.2 分支模型规范 (Git Branching Model)

推荐采用 **Git Flow** 简化版规范：

```
[main] ──────────────────────────────────────────● (v1.0.0 正式发布)
   │                                             ▲
   └── [develop] ───●──────────────●─────────────┤ (日常集成测试)
          │         ▲              ▲
          └── [feature/home] ──────┘ (业务特性分支，如首页Banner开发)
```

1. **`main` 分支**：生产主分支，代码必须处于随时可发布（Production-Ready）的稳定状态，每次发布打上 `Tag`（如 `v1.0.0`）。
2. **`develop` 分支**：日常开发集成分支，所有已完成测试的业务特性均合入该分支。
3. **`feature/*` 分支**：业务特性分支（如 `feature/p82-tabbar`、`feature/p94-auth`），从 `develop` 迁出，开发完成并通过评审后合回 `develop`。
4. **`hotfix/*` 分支**：生产紧急修复分支，直接从 `main` 迁出，修复完成后双向合入 `main` 与 `develop`。

### 3.3 Conventional Commits 提交信息规范

规范的提交信息能够自动生成 Changelog 并提升排查效率。提交格式遵循：

```text
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

| Type 类别 | 含义解释 | 示例 |
| :--- | :--- | :--- |
| **`feat`** | 增加新功能/新特性 | `feat(home): 增加首页轮播图Banner网络数据绑定 (P86)` |
| **`fix`** | 修复缺陷与 Bug | `fix(auth): 修复手机号正则验证边界空指针异常 (P95)` |
| **`docs`** | 文档更新与补充 | `docs(readme): 更新运行环境要求与多端启动指南` |
| **`style`** | 代码格式调整（不影响逻辑） | `style(common): 统一全局商品卡片圆角与内边距样式` |
| **`refactor`** | 代码重构（既不加新功能也不修Bug） | `refactor(network): 重构Dio拦截器支持自动注入Bearer Token (P98)` |
| **`chore`** | 构建系统、依赖更新等琐碎修改 | `chore(deps): 升级 getx 至 4.6.6` |

---

## 4. 企业级项目分层目录架构设计

良好的目录架构是项目长期可维护的关键。我们采用高内聚、低耦合的**清晰分层架构（Clean Layered Architecture）**：

```
geek_mall/
├── android/                   # Android 原生宿主工程
├── ios/                       # iOS 原生宿主工程
├── web/                       # Web 原生宿主工程
├── assets/                    # 静态资源目录
│   ├── images/                # 本地图片资源 (png / webp)
│   ├── icons/                 # 本地 SVG 或矢量图标
│   └── mock/                  # 本地 Mock JSON 测试数据
├── lib/                       # Flutter 核心 Dart 源码
│   ├── api/                   # 网络请求层：API 路由定义与接口封装
│   │   ├── api_client.dart    # Dio 单例与全局拦截器
│   │   └── home_api.dart      # 首页模块接口调用
│   ├── constants/             # 全局常量：颜色、字体、API 域名、本地存储 Key
│   │   ├── app_colors.dart    # 颜色常数字典
│   │   ├── app_constants.dart # 业务固定常数 (如默认分页条数)
│   │   └── api_urls.dart      # 后端服务端点配置
│   ├── controllers/           # 状态管理层 (GetX Controllers)
│   │   ├── home_controller.dart
│   │   └── user_controller.dart
│   ├── models/                # 数据模型实体类 (JSON 反序列化实体)
│   │   ├── banner_model.dart  # 轮播图数据模型
│   │   ├── category_model.dart# 分类网格模型
│   │   ├── goods_model.dart   # 商品明细模型
│   │   └── user_model.dart    # 用户身份信息模型
│   ├── pages/                 # 业务视图页面 (View / Screens)
│   │   ├── main_tabs_page.dart# 底部四标签承载页
│   │   ├── home/              # 首页模块视图
│   │   ├── category/          # 分类模块视图
│   │   ├── cart/              # 购物车模块视图
│   │   └── profile/           # 个人中心与登录模块视图
│   ├── routes/                # 路由配置中心
│   │   └── app_routes.dart    # 命名路由映射表
│   ├── utils/                 # 通用工具函数库
│   │   ├── storage_util.dart  # SharedPreferences 异步轻量封装
│   │   └── toast_util.dart    # 全局轻提示 Toast / SnackBar
│   ├── widgets/               # 公共通用 UI 组件库
│   │   ├── app_nav_bar.dart   # 自定义顶部导航栏
│   │   ├── custom_button.dart # 通用胶囊按钮
│   │   ├── goods_card.dart    # 商品列表卡片组件
│   │   └── loading_dialog.dart# 全局加载中模态遮罩
│   └── main.dart              # 应用总入口
└── pubspec.yaml               # 依赖包与资源配置清单
```

---

## 5. 核心常量与设计系统基建

在正式动手写具体页面之前，必须先将全局**调色板（Palette）**与**尺寸规范**沉淀为常量，避免在代码中到处硬编码 `Color(0xFF...)`。

### 5.1 颜色规范字典 (`lib/constants/app_colors.dart`)

```dart
// lib/constants/app_colors.dart
import 'package:flutter/material.dart';

/// 电商应用全局调色板定义
class AppColors {
  AppColors._(); // 私有构造函数，防止外部实例化

  // 主题核心品牌色 (电商红色系)
  static const Color primary = Color(0xFFE53935);
  static const Color primaryLight = Color(0xFFFFCDD2);
  static const Color primaryDark = Color(0xFFC62828);

  // 辅助与状态色
  static const Color secondary = Color(0xFFFF9800); // 促销金橙色
  static const Color success = Color(0xFF4CAF50);
  static const Color warning = Color(0xFFFF9800);
  static const Color error = Color(0xFFF44336);

  // 背景与填充色
  static const Color background = Color(0xFFF7F8FA); // 页面底色
  static const Color surface = Color(0xFFFFFFFF);    // 卡片背景白
  static const Color divider = Color(0xFFEEEEEE);    // 细分割线

  // 文本阶梯色系
  static const Color textPrimary = Color(0xFF212121);   // 一级标题/重点正文
  static const Color textSecondary = Color(0xFF666666); // 二级副标题
  static const Color textMuted = Color(0xFF999999);     // 说明弱文字/占位提示
  static const Color price = Color(0xFFFF4D4F);         // 商品醒目价格红
}
```

### 5.2 业务固定常数 (`lib/constants/app_constants.dart`)

```dart
// lib/constants/app_constants.dart
class AppConstants {
  AppConstants._();

  // 基础网络超时设定 (毫秒)
  static const int connectTimeoutMs = 15000;
  static const int receiveTimeoutMs = 15000;

  // 业务分页默认参数
  static const int defaultPageSize = 10;

  // SharedPreferences 存储 Key 统一定义
  static const String keyToken = 'auth_user_token';
  static const String keyUserInfo = 'auth_user_info_json';
  static const String keySearchHistory = 'app_search_history';
}
```

---

## 6. 统一依赖声明 (`pubspec.yaml`)

编辑根目录下的 `pubspec.yaml`，引入项目所需的全部核心依赖与静态资源路径声明：

```yaml
name: geek_mall
description: "A commercial e-commerce Flutter cross-platform project."
publish_to: 'none'

version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter

  # 状态管理与路由全家桶
  get: ^4.6.6

  # 网络请求核心库
  dio: ^5.4.0

  # 本地轻量键值对持久化
  shared_preferences: ^2.2.2

  # 网络图片三级缓存与渐进加载
  cached_network_image: ^3.3.1

  # 现代化轮播图组件
  carousel_slider: ^4.2.1

  # 屏幕分辨率动态缩放适配
  flutter_screenutil: ^5.9.0

  # 图标库扩展 (可选)
  cupertino_icons: ^1.0.6

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true

  # 静态资源目录声明
  assets:
    - assets/images/
    - assets/icons/
```

执行以下命令拉取并校验依赖：

```bash
flutter pub get
```

---

## 7. 项目起步运行与基线验证

在项目搭建完分层目录与依赖项后，我们可以在浏览器或移动端设备上运行验证脚手架工程是否健康：

```bash
# 列出当前可用的运行设备
flutter devices

# 在 Chrome 浏览器上快速启动调试 (Web 模式)
flutter run -d chrome

# 或者在已连接的 Android 模拟器/真机上启动
flutter run -d android
```

当你看到浏览器或手机屏幕上成功渲染出浅灰色背景与 `极客商城初始化中...` 的文字时，说明整个底层工程骨架与运行环境搭建完毕！

---

## 8. 本章小结与后续模块路线图

本篇完成了电商实战项目的起步工作：
1. 明确了仿电商应用的技术栈（Flutter 3 + GetX + Dio + SharedPreferences）。
2. 初始化了规范的 Flutter 项目，并配置了详尽的 `.gitignore` 规则与 Conventional Commits 提交规范。
3. 规划并落地了企业级项目分层目录架构（`api/`, `constants/`, `controllers/`, `models/`, `pages/`, `widgets/`）。
4. 抽象出了全局设计系统基建（`AppColors`、`AppConstants`）并完成了核心依赖声明。

在接下来的 **[主页Tab切换与轮播图展示 (P82-P86)](./home-and-tabs.md)** 中，我们将正式动手搭建主界面的 `BottomNavigationBar`、使用 `IndexedStack` 实现多页面状态无损切换，并集成首页 Banner 轮播图与网络数据绑定！
