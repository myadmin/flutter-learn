# 2. 项目目录规范、屏幕适配与明暗主题系统

> 💡 **本篇导读**：在构建现代化 Flutter 商业级应用时，清晰稳健的工程目录分层、精准的屏幕像素级适配、舒适的明暗双主题自适应系统，以及轻量优雅的全局交互反馈（Toast），是决定项目长期可维护性与用户体验的基础设施。本篇将立足 `SX-Code/ebook` 源码标准，系统剖析电子书城四大核心底层模块的落地与实践细节。

---

## 1. 模块 1：项目目录规范与架构分层 (http, model, pages, utils)

在真实业务开发中，混乱的代码结构会导致状态流、爬虫逻辑与 UI 组件相互耦合。电子书城 APP 严格采用 **高内聚、低耦合的 4 大核心目录分层规范**：

```
lib/
├── http/                             # 🌐 网络通信与爬虫逆向工程层
│   ├── dio_instance.dart             # Dio 现代单例客户端（基础参数与拦截器编排）
│   ├── http_methods.dart             # HTTP 请求方式常量 (GET, POST 等)
│   ├── print_log_interceptor.dart    # 结构化网络日志拦截器
│   ├── response_interceptor.dart     # 响应统一校验与 DioException 自动捕获
│   └── spider/                       # 🕷️ 网页逆向爬虫核心包
│       ├── api_string.dart           # 豆瓣全站路由、JSON接口与正则解析常量
│       └── spider_api.dart           # DOM 树解析引擎与结构化数据抽取器
│
├── model/                            # 📦 领域实体与数据契约层
│   ├── activity.dart                 # 读书沙龙与官方活动实体
│   ├── author.dart                   # 图书创作者与角色实体
│   ├── book.dart                     # 核心图书实体（封面/定价/评分/页数/购买渠道）
│   ├── ebook_category.dart           # 电子书分类标签实体
│   ├── review.dart                   # 读者长评/短评实体与星级映射
│   └── types.dart                    # 枚举类型定义（EBookType, BookExpressTag）
│
├── pages/                            # 📱 视图展示与 MVVM 状态响应层
│   ├── root/                         # 应用底座框架
│   │   └── root_page.dart            # SalomonBottomBar + LazyLoadIndexedStack 骨架
│   ├── home/                         # 首页探索模块
│   │   ├── home_page.dart            # 首页视图
│   │   ├── home_vm.dart              # HomeViewModel 状态机
│   │   └── components/               # 首页专属子组件与对应 Skeleton 骨架屏
│   ├── douban_store/                 # 豆瓣读书商城模块 (新书速递/热门榜/Top250)
│   │   ├── douban_store_page.dart    # 榜单视图
│   │   └── douban_store_vm.dart      # DoubanStoreViewModel
│   ├── ebook_store/                  # 电子书城分类模块 (分类流/立减优惠)
│   │   ├── ebook_store_page.dart     # 书城视图
│   │   └── ebook_store_vm.dart       # EbookStoreViewModel
│   ├── book_detail/                  # 图书详情复杂大页
│   │   ├── book_detail_page.dart     # 沉浸式详情页 UI
│   │   └── book_detail_vm.dart       # BookDetailViewModel 多流异步聚合
│   ├── my_ebbok/                     # 个人中心与已读图书书架
│   │   └── my_book_page.dart         # 我的书架视图
│   ├── theme/                        # 明暗主题管理模块
│   │   ├── light_theme.dart          # 浅色日间主题规范 (ThemeData)
│   │   ├── dart_theme.dart           # 深色夜间暗黑主题规范 (ThemeData)
│   │   └── theme_provider.dart       # 全局主题切换状态机 (ChangeNotifier)
│   └── components/                   # 全局可复用业务组件族（均 1:1 成对实现骨架屏）
│       ├── author_tile/              # 作者信息展示项 & Skeleton
│       ├── book_content_tile/        # 图书长文简介折叠项 & Skeleton
│       ├── book_detail_tile/         # 定价/页码/评分三维卡片 & Skeleton
│       ├── book_review_tile/         # 读者书评项 & Skeleton
│       ├── book_tile/                # 横向横滚图书卡片 & Skeleton
│       ├── ebook_category_tile/      # 书城分类流式标签 & Skeleton
│       ├── my_book_detail_appbar.dart# 动态渐变高斯模糊沉浸式 AppBar
│       └── my_search_tile.dart       # 首页搜索栏交互卡片
│
├── utils/                            # 🛠️ 纯工具包与无 Context 辅助单例
│   ├── header_util.dart              # 反爬随机 User-Agent 请求头轮询池
│   ├── log_utils.dart                # 统一控制台彩色日志输出
│   ├── navigator_utils.dart          # 原生路由跳转与参数打包工具
│   └── toast_utils.dart              # DelightfulToast 轻量级悬浮吐司单例封装
│
├── app.dart                          # 全局应用 MaterialApp 入口与 ScreenUtil 挂载
└── main.dart                         # 工程启动入口与 MultiProvider 根注入
```

---

## 2. 模块 2：flutter_screenutil 屏幕适配全解析

### 2.1 移动端屏幕碎片化与适配数学模型

不同机型的物理分辨率、逻辑分辨率（Logical Pixels）、设备像素比（Device Pixel Ratio, DPR）千差万别。若直接在代码中硬编码固定像素值（如 `width: 200`），在小屏手机上可能占据近全宽，而在平板或大屏手机上则显得局促空旷。

`flutter_screenutil` 采用 **设计稿等比缩放模型**。官方通常以 iPhone X 标准的 **375 × 812 pt** 为基准设计尺寸：
- **宽度等比计算公式**：$\text{实际逻辑像素} = \text{设计稿尺寸} \times \left(\frac{\text{当前设备物理短边宽度}}{\text{设计稿宽度 (375)}}\right)$
- **高度等比计算公式**：$\text{实际逻辑像素} = \text{设计稿尺寸} \times \left(\frac{\text{当前设备物理长边高度}}{\text{设计稿高度 (812)}}\right)$
- **圆角与最小缩放比**：取宽度与高度缩放因子的极小值，避免矩形形变成非等比椭圆。

### 2.2 扩展属性精讲：`.w`、`.h`、`.sp`、`.r`

通过 Dart 的扩展语法糖，`flutter_screenutil` 为 `num` 类型注入了极具表现力的链式调用后缀：

```dart
// 1. 宽高等比缩放
double cardWidth = 120.w;      // 对应设计稿 120pt 宽度
double cardHeight = 160.h;     // 对应设计稿 160pt 高度

// 2. 字体等比自适应 (sp = scalable pixels)
// 随着系统辅助功能或屏幕大小自适应，防止大屏文字过小或小屏溢出换行
TextStyle titleStyle = TextStyle(
  fontSize: 16.sp,
  fontWeight: FontWeight.w600,
);

// 3. 规整圆角与正方形尺寸 (r = radius)
// 取 min(w, h)，确保在非常规屏幕比率下，头像依然是正圆形，圆角依然对称
BorderRadius cardRadius = BorderRadius.circular(12.r);
double avatarSize = 40.r;

// 4. 空白间距语法糖 (verticalSpace / horizontalSpace)
// 彻底替代冗余的 SizedBox(height: 15.h)
15.verticalSpace;
10.horizontalSpace;
```

### 2.3 动态逻辑边设计稿提取与避坑指南

在 `SX-Code/ebook` 项目中，作者采用了一种更加动态、精准获取逻辑边长的方式（定义于 `lib/app.dart`），避免系统状态栏与软键盘弹出时的偶发计算偏差：

```dart
// lib/app.dart
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

Size get designSize {
  // 从平台底层分发器获取主屏幕真实视图参数
  final firstView = WidgetsBinding.instance.platformDispatcher.views.first;
  // 计算逻辑短边 (宽度)
  final logicalShortestSize =
      firstView.physicalSize.shortestSide / firstView.devicePixelRatio;
  // 计算逻辑长边 (高度)
  final logicalLongestSize =
      firstView.physicalSize.longestSide / firstView.devicePixelRatio;
  // 缩放修正比例（预留 5% 留白缓冲区）
  const scaleFactor = 0.95;
  return Size(
    logicalShortestSize * scaleFactor, 
    logicalLongestSize * scaleFactor
  );
}
```

::: danger 避坑指南 1：在 ScreenUtilInit 初始化前调用 `.w` / `.h`
在全局常量定义、单例类静态字段初始化，或者在 `MaterialApp` 外层直接写 `static double width = 120.w;`，会触发致命异常：  
`ScreenUtil hasn't been initialized, please call ScreenUtil.init(...)`  
**正确规范**：只能在 Widget 的 `build(BuildContext context)` 内部，或在 `ScreenUtilInit` 挂载后的子组件树中使用扩展属性。
:::

::: warning 避坑指南 2：系统大字号无情折行（文字缩放坑）
老年机用户或在系统“显示与亮度”中开启了“文字放大（Font Scaling）”时，如果不加约束，`Text` 会自动按系统全局系数二次放大，导致原本一行的图书标题直接折行破坏布局。  
**解决方案**：在 `ScreenUtilInit` 中开启 `minTextAdapt: true`，并在根 `MaterialApp` 的 `builder` 中限制 `TextScaler`：
```dart
MaterialApp(
  builder: (context, child) {
    final mediaQuery = MediaQuery.of(context);
    return MediaQuery(
      data: mediaQuery.copyWith(
        // 限制最大字体缩放倍率不超过 1.0，锁住设计稿版心
        textScaler: const TextScaler.linear(1.0),
      ),
      child: child!,
    );
  },
)
```
:::

---

## 3. 模块 3：明暗双主题系统设计与 ThemeProvider

阅读类应用对**夜间护眼模式**有极高要求。项目基于 Material 3 色彩规范，精心调配了浅色 `lightMode` 与深色 `darkMode` 两种配色体系，并通过 Provider 广播驱动全局无缝换肤。

### 3.1 浅色日间主题规范 (`lib/pages/theme/light_theme.dart`)

```dart
// lib/pages/theme/light_theme.dart
import 'package:flutter/material.dart';

ThemeData lightMode = ThemeData(
  useMaterial3: true,
  appBarTheme: const AppBarTheme(
    scrolledUnderElevation: 0.0, // 禁用页面滚动时 AppBar 阴影突变
  ),
  colorScheme: ColorScheme.light(
    primary: const Color(0xFF3CA9FC),             // 标志性豆瓣科技蓝
    onPrimary: Colors.white,                     // 亮色表面文字
    secondary: const Color(0xFFA8C1D2).withOpacity(0.25), // 浅灰蓝辅助色
    tertiary: const Color(0xFFEE4667),            // 鲜活珊瑚红（用于评分高亮）
    inversePrimary: Colors.grey.shade600,         // 次要引导文案灰色
    inverseSurface: Colors.grey.shade200,         // 骨架屏基础微光阴影 (基色)
    onInverseSurface: Colors.grey.shade100,       // 骨架屏高亮流动掠影 (高光色)
    surfaceContainer: Colors.grey.shade300,       // 容器边框灰
  ),
);
```

### 3.2 深色夜间暗黑主题规范 (`lib/pages/theme/dart_theme.dart`)

深色模式绝非简单的 `Colors.black`，过于纯黑的高反差会导致用户视力疲劳。深色模式采用深邃暗夜灰阶并对骨架屏色彩矩阵做反向适配：

```dart
// lib/pages/theme/dart_theme.dart
import 'package:flutter/material.dart';

ThemeData darkMode = ThemeData(
  useMaterial3: true,
  appBarTheme: const AppBarTheme(
    scrolledUnderElevation: 0.0,
  ),
  colorScheme: ColorScheme.dark(
    primary: const Color(0xFF3CA9FC),
    onPrimary: Colors.white,
    secondary: const Color(0xFFA8C1D2).withOpacity(0.25),
    tertiary: const Color(0xFFEE4667),
    inversePrimary: Colors.grey.shade600,
    inverseSurface: Colors.black87,               // 深色骨架屏暗色底色
    onInverseSurface: Colors.black26,             // 深色骨架屏微弱亮光流
    surfaceContainer: Colors.grey.shade300,
  ),
);
```

> **设计细节亮点**：  
> 注意 `inverseSurface` 和 `onInverseSurface` 的设定！后续我们的 `Shimmer` 骨架屏将直接读取这两个语义化颜色。这样，无论是日间模式还是夜间模式，骨架屏都无需书写 `if (isDarkMode)` 的冗余判断，自动完成明暗自适应！

### 3.3 响应式主题状态机 (`lib/pages/theme/theme_provider.dart`)

```dart
// lib/pages/theme/theme_provider.dart
import 'package:e_book_demo/pages/theme/dart_theme.dart';
import 'package:e_book_demo/pages/theme/light_theme.dart';
import 'package:flutter/material.dart';

class ThemeProvider with ChangeNotifier {
  ThemeData _themeData = lightMode;

  ThemeData get themeData => _themeData;
  ThemeData get ligthTheme => lightMode;
  ThemeData get dartTheme => darkMode;

  // 判断当前是否处于暗黑深色模式
  bool get isDarkMode => _themeData == darkMode;

  set themeData(ThemeData themeData) {
    _themeData = themeData;
    notifyListeners(); // 广播刷新所有消费主题的 Widget
  }

  /// 一键平滑切换主题
  void toggleTheme() {
    if (_themeData == lightMode) {
      themeData = darkMode;
    } else {
      themeData = lightMode;
    }
  }
}
```

---

## 4. 模块 4：轻量级美观吐司与辅助工具封装 (delightful_toast)

原生 Flutter 的 `ScaffoldMessenger.of(context).showSnackBar` 存在两大痛点：
1. **强依赖 `BuildContext`**：在非 UI 层（如网络拦截器、工具类中）捕获到异常时，若无 Context 便寸步难行；
2. **样式陈旧生硬**：底部突兀升起的 SnackBar 易遮挡底部导航栏与关键浮动按钮。

项目选用 `delightful_toast`（1.1.0），并在 `lib/utils/toast_utils.dart` 中结合全局 `navigatorKey` 封装为纯静态调用的无阻断顶部卡片吐司。

```dart
// lib/utils/toast_utils.dart
import 'package:delightful_toast/delight_toast.dart';
import 'package:delightful_toast/toast/components/toast_card.dart';
import 'package:delightful_toast/toast/utils/enums.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:line_icons/line_icons.dart';

class ToastUtils {
  // 全局无 Context 导航键，用于在任意底层服务中弹出吐司
  static final navigatorKey = GlobalKey<NavigatorState>();
  static BuildContext get context => navigatorKey.currentContext!;

  // 状态色彩语义
  static const Color successColor = Color(0xFF75FB4C);
  static const Color errorColor = Color(0xFFEA3323);

  // 状态图标语义 (采用高识别度 LineIcons)
  static const IconData successIcon = LineIcons.checkCircle;
  static const IconData errorIcon = LineIcons.ban;
  static const IconData infoIcon = LineIcons.infoCircle;

  /// 显示操作成功吐司
  static void showSuccessMsg(String msg, {IconData? icon}) {
    DelightToastBar(
      autoDismiss: true,
      position: DelightSnackbarPosition.top, // 顶部下滑，视觉更轻盈
      builder: (context) => ToastCard(
        title: Text(
          msg,
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14.sp),
        ),
        leading: Icon(
          icon ?? successIcon,
          color: successColor,
          size: 20.r,
        ),
      ),
    ).show(context);
  }

  /// 显示失败/错误吐司（网络层统一异常捕获回调）
  static void showErrorMsg(String msg, {IconData? icon}) {
    DelightToastBar(
      autoDismiss: true,
      position: DelightSnackbarPosition.top,
      builder: (context) => ToastCard(
        title: Text(
          msg,
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14.sp),
        ),
        leading: Icon(
          icon ?? errorIcon,
          color: errorColor,
          size: 20.r,
        ),
      ),
    ).show(context);
  }

  /// 显示一般提示吐司
  static void showInfoMsg(String msg, {IconData? icon}) {
    DelightToastBar(
      autoDismiss: true,
      position: DelightSnackbarPosition.top,
      builder: (context) => ToastCard(
        title: Text(
          msg,
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14.sp),
        ),
        leading: Icon(
          icon ?? infoIcon,
          size: 20.r,
        ),
      ),
    ).show(context);
  }
}
```

---

## 5. 入口组装：main.dart 与 app.dart 完整闭环

至此，我们将全局状态机 `ThemeProvider`、屏幕自适应 `ScreenUtilInit` 与静态吐司挂载键 `ToastUtils.navigatorKey` 在入口处彻底串联。

### 5.1 根入口 (`lib/main.dart`)

```dart
// lib/main.dart
import 'package:e_book_demo/app.dart';
import 'package:e_book_demo/pages/theme/theme_provider.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        // 挂载全局主题状态机，供整个组件树响应
        ChangeNotifierProvider(create: (context) => ThemeProvider()),
      ],
      child: const MyApp(),
    ),
  );
}
```

### 5.2 应用入口 (`lib/app.dart`)

```dart
// lib/app.dart
import 'package:e_book_demo/http/dio_instance.dart';
import 'package:e_book_demo/pages/root/root_page.dart';
import 'package:e_book_demo/pages/theme/dart_theme.dart';
import 'package:e_book_demo/pages/theme/theme_provider.dart';
import 'package:e_book_demo/utils/toast_utils.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:provider/provider.dart';

Size get designSize {
  final firstView = WidgetsBinding.instance.platformDispatcher.views.first;
  final logicalShortestSize =
      firstView.physicalSize.shortestSide / firstView.devicePixelRatio;
  final logicalLongestSize =
      firstView.physicalSize.longestSide / firstView.devicePixelRatio;
  const scaleFactor = 0.95;
  return Size(
    logicalShortestSize * scaleFactor, 
    logicalLongestSize * scaleFactor,
  );
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  @override
  void initState() {
    super.initState();
    // 初始化 Dio 基础配置与拦截器管道
    DioInstance.instance().initDio();
  }

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      designSize: designSize,
      builder: (context, child) {
        return MaterialApp(
          // 注入全局 NavigatorKey，实现无 Context 弹窗
          navigatorKey: ToastUtils.navigatorKey,
          debugShowCheckedModeBanner: false,
          // 监听 ThemeProvider 状态变化
          theme: Provider.of<ThemeProvider>(context, listen: true).themeData,
          darkTheme: darkMode,
          home: const RootPage(),
        );
      },
    );
  }
}
```

---

## 6. 本篇小结

在本篇中，我们完成了电子书城项目四大核心基础设施的奠基：
1. 规范了 **`http`、`model`、`pages`、`utils`** 架构分层；
2. 拆解了 **`flutter_screenutil`** 适配原理，掌握了 `.w`、`.h`、`.sp`、`.r` 扩展属性用法及文字防折行方案；
3. 设计了基于 Material 3 的 **明暗双主题色彩规范**，通过 `ThemeProvider` 实现了全局平滑切换；
4. 封装了基于 `delightful_toast` 与 `GlobalKey<NavigatorState>` 的 **无 Context 顶部吐司**。

在下一篇中，我们将进入应用的核心骨架搭建 —— 深度剖析原生 `IndexedStack` 的性能缺陷，并使用 `SalomonBottomBar` 现代流光气泡底部导航与 `LazyLoadIndexedStack` 打造丝滑流畅的页面切换体系！
