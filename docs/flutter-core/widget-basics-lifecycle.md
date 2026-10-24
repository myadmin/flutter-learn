# 核心脚手架与组件生命周期 (P42-P50)

在上一章中，我们建立了“一切皆 Widget”的核心心智模型。本章我们将聚焦 Flutter 界面开发最重要的骨架组件 —— **MaterialApp 与 Scaffold**，深入探究 **StatelessWidget（无状态组件）** 与 **StatefulWidget（有状态组件）** 的本质区别，完整剖析 **State 对象的八大生命周期流程**，掌握手势点击交互（GestureDetector vs InkWell），并学习 setState 的底层渲染机制与局部刷新性能优化技巧。

---

## 1. MaterialApp 核心属性与全局配置 (P42)

`MaterialApp` 是基于 Google Material Design 设计语言的顶层根组件，它封装了应用运行所需的顶层设施，包括路由栈导航（Navigator）、全局主题（ThemeData）、国际化（Localizations）以及屏幕适配媒体查询（MediaQuery）。

### 1.1 常用核心属性汇总

| 属性名称 | 类型 | 说明与典型取值 |
| :--- | :--- | :--- |
| `title` | `String` | 任务管理器/多任务切换界面展示的应用名称 |
| `theme` | `ThemeData` | 浅色模式下的全局主题配置（字体、主色调、组件默认样式） |
| `darkTheme` | `ThemeData` | 深色/夜间模式下的全局主题配置 |
| `themeMode` | `ThemeMode` | 主题切换模式：`ThemeMode.system`（随系统）、`light`、`dark` |
| `home` | `Widget` | 应用首屏显示的默认根页面组件 |
| `routes` | `Map<String, WidgetBuilder>` | 静态命名路由映射表 |
| `initialRoute` | `String` | 应用启动时的初始路由名称，如 `'/'` |
| `onGenerateRoute` | `RouteFactory` | 动态路由拦截与参数提取钩子 |
| `onUnknownRoute` | `RouteFactory` | 404 兜底路由生成器 |
| `debugShowCheckedModeBanner` | `bool` | 是否在右上角显示 "DEBUG" 水印角标（通常设为 `false`） |
| `locale` | `Locale?` | 当前强制生效的语言地区，如 `const Locale('zh', 'CN')` |

### 1.2 企业级 MaterialApp 配置示例

```dart
import 'package:flutter/material.dart';

void main() => runApp(const AppRoot());

class AppRoot extends StatelessWidget {
  const AppRoot({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '商城移动端',
      debugShowCheckedModeBanner: false, // 关闭 Debug 标志条
      themeMode: ThemeMode.system, // 跟随系统自动切换深/浅色
      // 1. 浅色主题
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.blueAccent,
          brightness: Brightness.light,
        ),
        appBarTheme: const AppBarTheme(
          elevation: 0,
          centerTitle: true,
        ),
      ),
      // 2. 深色主题
      darkTheme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.blueAccent,
          brightness: Brightness.dark,
        ),
      ),
      home: const MainPage(),
    );
  }
}
```

---

## 2. Scaffold 页面脚手架详解 (P43)

如果说 `MaterialApp` 是整栋大厦的地基与供电网络，那么 `Scaffold` 就是每一个具体楼层/页面的“标准毛坯脚手架”。它为移动端页面提供了符合人体工程学的标准布局槽位（Slot）。

```
┌─────────────────────────────────────────────────────────────┐
│ Scaffold                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ appBar: AppBar (顶部导航栏、标题、返回键、操作菜单)       │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │                                                         │ │
│ │                                                         │ │
│ │ body: Widget (页面主体业务内容区)                         │ │
│ │                                                         │ │
│ │                                   ┌───────────────────┐ │ │
│ │                                   │floatingActionButton│ │
│ ├───────────────────────────────────┴───────────────────┘ │ │
│ │ bottomNavigationBar: (底部导航栏 TabBar)                │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.1 Scaffold 核心槽位属性

| 槽位属性 | 类型 | 职责说明 |
| :--- | :--- | :--- |
| `appBar` | `PreferredSizeWidget` | 顶部应用导航栏，通常直接挂载 `AppBar` |
| `body` | `Widget` | 页面主体内容区，绝大多数业务 UI 代码写在这里 |
| `floatingActionButton` | `Widget` | 浮动操作按钮（FAB），通常用于高频核心操作（如新建、发布） |
| `floatingActionButtonLocation` | `FloatingActionButtonLocation` | 浮动按钮的摆放位置，如 `centerDocked`（凹嵌居中） |
| `bottomNavigationBar` | `Widget` | 底部导航切换栏，如 `BottomNavigationBar` 或 `NavigationBar` |
| `drawer` | `Widget` | 左侧滑出的侧边抽屉菜单 |
| `endDrawer` | `Widget` | 右侧滑出的侧边抽屉菜单 |
| `bottomSheet` | `Widget` | 底部常驻面板/上拉抽屉 |
| `backgroundColor` | `Color` | 页面背景色 |
| `resizeToAvoidBottomInset` | `bool` | 软键盘弹出时是否自动缩小 body 高度以防止输入框被遮挡（默认 `true`） |

### 2.2 经典 Scaffold 实战代码

```dart
class MainPage extends StatefulWidget {
  const MainPage({super.key});

  @override
  State<MainPage> createState() => _MainPageState();
}

class _MainPageState extends State<MainPage> {
  int _currentIndex = 0;

  final List<Widget> _pages = const [
    Center(child: Text('首页内容区', style: TextStyle(fontSize: 20))),
    Center(child: Text('分类内容区', style: TextStyle(fontSize: 20))),
    Center(child: Text('购物车区', style: TextStyle(fontSize: 20))),
    Center(child: Text('个人中心', style: TextStyle(fontSize: 20))),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // 1. 顶部导航栏
      appBar: AppBar(
        title: const Text('移动商城'),
        leading: Builder(
          builder: (ctx) => IconButton(
            icon: const Icon(Icons.menu),
            onPressed: () => Scaffold.of(ctx).openDrawer(), // 打开左抽屉
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.notifications_none),
            onPressed: () {},
          ),
        ],
      ),
      // 2. 左侧侧边栏
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: const [
            UserAccountsDrawerHeader(
              accountName: Text('张三'),
              accountEmail: Text('zhangsan@example.com'),
              currentAccountPicture: CircleAvatar(
                backgroundColor: Colors.white,
                child: Icon(Icons.person, size: 40, color: Colors.blueAccent),
              ),
            ),
            ListTile(leading: Icon(Icons.settings), title: Text('系统设置')),
            ListTile(leading: Icon(Icons.help_outline), title: Text('帮助与反馈')),
          ],
        ),
      ),
      // 3. 页面主体
      body: _pages[_currentIndex],
      // 4. 浮动动作按钮
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('点击了快速发布！')),
          );
        },
        child: const Icon(Icons.add),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      // 5. 底部导航栏
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        type: BottomNavigationBarType.fixed,
        selectedItemColor: Theme.of(context).colorScheme.primary,
        unselectedItemColor: Colors.grey,
        onTap: (index) => setState(() => _currentIndex = index),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: '首页'),
          BottomNavigationBarItem(icon: Icon(Icons.category), label: '分类'),
          BottomNavigationBarItem(icon: Icon(Icons.shopping_cart), label: '购物车'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: '我的'),
        ],
      ),
    );
  }
}
```

---

## 3. StatelessWidget vs StatefulWidget 深度剖析 (P44-P45)

在 Flutter 中，自定义组件几乎 100% 继承自 `StatelessWidget` 或 `StatefulWidget`。

### 3.1 核心对比表

| 对比维度 | StatelessWidget (无状态组件) | StatefulWidget (有状态组件) |
| :--- | :--- | :--- |
| **可变性** | 完全不可变（Immutable），所有成员变量均为 `final` | 包含可变状态（Mutable），状态托管于独立的 `State` 类 |
| **重新渲染** | 只能由外部传入新的父级参数被动触发 `build` | 内部可通过调用 `setState()` 自主主动触发重新构建 |
| **生命周期** | 极简：只有构造函数和单个 `build(context)` | 丰富完整：`initState`, `didChangeDependencies`, `build`, `dispose` 等 |
| **性能开销** | 极低，纯配置对象，随销毁随创建 | 略高，需维护持久的 State 实例与 Element 节点挂载 |
| **经典场景** | 纯展示性文本、固定图标、静态卡片、无内部状态的列表项 | 计数器、倒计时、表单输入、动画驱动、网络请求分页、Tab 切换 |

### 3.2 为什么 StatefulWidget 要拆分成两个类？

观察 StatefulWidget 的定义：
```dart
class MyPage extends StatefulWidget { ... } // 1. Widget 类
class _MyPageState extends State<MyPage> { ... } // 2. State 类
```

**底层设计原理**：
1. **轻量与持久的分离**：`Widget` 类本身依然是不可变的（`@immutable`），当父组件更新时，`MyPage` 会被迅速销毁并重新创建新的实例。
2. **状态的保活与复用**：`State` 对象是**长生命周期对象**，它保存在 Element 树的节点上。即使外部的 `MyPage` 重新实例化多次，内部的 `_MyPageState` 实例依然保持不变，其中的局部变量（如输入框内容、滚动位移、选中状态）绝不会丢失！

### 3.3 IDE 快捷代码片段 (Snippets)
在 VS Code 或 Android Studio 中无需手敲样板代码：
- 输入 **`stless`** 回车：自动展开生成完整的 `StatelessWidget` 模板代码。
- 输入 **`stful`** 回车：自动生成包含 `StatefulWidget` 与 `State` 的成套代码骨架。

---

## 4. State 对象完整生命周期钩子流程 (P46-P47)

StatefulWidget 的核心生命周期指的是其关联的 `State` 实例从“挂载到组件树”到“从组件树彻底销毁”的全过程。

### 4.1 生命周期流转图

```
                ┌───────────────────────────────────┐
                │ 1. StatefulWidget.createState()    │
                └─────────────────┬─────────────────┘
                                  ▼
                ┌───────────────────────────────────┐
                │ 2. initState() (仅执行 1 次)       │
                └─────────────────┬─────────────────┘
                                  ▼
                ┌───────────────────────────────────┐
                │ 3. didChangeDependencies()        │ ◄──────────┐
                └─────────────────┬─────────────────┘            │
                                  ▼                              │ InheritedWidget
┌────────────────────────────────────────────────────────┐       │ 发生变更
│               4. build(BuildContext context)           │       │
└──────────────────────────┬─────────────────────────────┘       │
                           │                                     │
           ┌───────────────┴───────────────┐                     │
           ▼                               ▼                     │
 外部父级 Widget 重构             内部调用 setState()             │
           ▼                               ▼                     │
┌────────────────────────┐      ┌────────────────────────┐       │
│5. didUpdateWidget()    │      │  标记 Element 为 dirty │       │
└──────────┬─────────────┘      └──────────┬─────────────┘       │
           │                               │                     │
           └───────────────┬───────────────┘                     │
                           ▼                                     │
                 重新执行 build() 刷新界面 ───────────────────────┘
                           │
                           ▼ 当 Widget 被移出树
                ┌───────────────────────────────────┐
                │ 6. deactivate()                   │
                └─────────────────┬─────────────────┘
                                  ▼
                ┌───────────────────────────────────┐
                │ 7. dispose() (彻底永久销毁)        │
                └───────────────────────────────────┘
```

### 4.2 各生命周期钩子职责与规范

#### 1. `createState()`
- 框架创建 StatefulWidget 时调用，返回与之绑定的 State 实例。

#### 2. `initState()`
- **调用时机**：State 对象被插入组件树时**仅被调用一次**。
- **职责**：
  - 初始化控制器（如 `TextEditingController`、`AnimationController`、`ScrollController`）。
  - 启动定时器（`Timer`）或订阅事件广播（`StreamSubscription`）。
  - 发起网络请求的初次触发。
- **特别禁忌**：此时组件树尚未完全稳固，**不能在 `initState` 中直接调用依赖 InheritedWidget 的上下文**（如 `Theme.of(context)` 或 `MediaQuery.of(context)` 会直接抛异常）。

#### 3. `didChangeDependencies()`
- **调用时机**：紧跟在 `initState()` 之后立即被调用一次；此外，**当该 State 依赖的 `InheritedWidget`（例如主题、国际化语言、屏幕方向 MediaQuery）发生变化时会被再次触发**。
- **职责**：适合在此安全地获取 `ModalRoute.of(context)` 路由参数、`Theme.of(context)` 主题色或 `MediaQuery.of(context)` 屏幕尺寸。

#### 4. `build(BuildContext context)`
- **调用时机**：极高频！当 `initState()`、`didChangeDependencies()`、`didUpdateWidget()` 或调用 `setState()` 之后均会触发。
- **规范**：必须保持**纯函数构建（Pure Function）**，**严禁在 build 中发起网络请求或修改状态**，否则会导致死循环刷新！

#### 5. `didUpdateWidget(covariant T oldWidget)`
- **调用时机**：当父级组件发生重建（rebuild），传入了新的一组参数，但新旧 Widget 的 `runtimeType` 与 `key` 保持一致时触发。
- **职责**：对比 `widget.xxx`（新参数）与 `oldWidget.xxx`（旧参数）。例如父组件传入了新的商品 ID 时，在此重置内部轮播图控制器或重新拉取接口。

#### 6. `deactivate()`
- **调用时机**：当 State 对象被暂时从树中移除时调用（例如配合 `GlobalKey` 跨容器移动组件）。

#### 7. `dispose()`
- **调用时机**：组件被彻底、永久地从组件树中销毁时调用（如页面 `Navigator.pop()` 关闭）。
- **必须执行的重要操作**：**释放一切资源，防范内存泄露！**
  - `controller.dispose()`（关闭所有控制器）
  - `timer.cancel()`（取消定时器）
  - `subscription.cancel()`（取消 Stream/广播监听）

### 4.3 生命周期完整监控实战代码

```dart
class LifecycleDemoPage extends StatefulWidget {
  final int count;
  const LifecycleDemoPage({super.key, required this.count});

  @override
  State<LifecycleDemoPage> createState() {
    debugPrint('--> 1. createState() 实例化 State 对象');
    return _LifecycleDemoPageState();
  }
}

class _LifecycleDemoPageState extends State<LifecycleDemoPage> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState(); // 必须首行调用 super.initState()
    debugPrint('--> 2. initState() 初始化控制器与资源');
    _controller = TextEditingController(text: '初始文案');
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    debugPrint('--> 3. didChangeDependencies() 此时可安全获取主题或媒体查询');
  }

  @override
  void didUpdateWidget(covariant LifecycleDemoPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    debugPrint('--> 5. didUpdateWidget() 父级传参变化: 旧值=${oldWidget.count}, 新值=${widget.count}');
  }

  @override
  Widget build(BuildContext context) {
    debugPrint('--> 4. build() 执行界面绘制构建');
    return Scaffold(
      appBar: AppBar(title: const Text('生命周期监控')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('外部传入计数: ${widget.count}', style: const TextStyle(fontSize: 18)),
            TextField(controller: _controller),
          ],
        ),
      ),
    );
  }

  @override
  void deactivate() {
    super.deactivate();
    debugPrint('--> 6. deactivate() 临时移出组件树');
  }

  @override
  void dispose() {
    debugPrint('--> 7. dispose() 彻底销毁，释放控制器');
    _controller.dispose(); // 销毁控制器，避免内存泄露
    super.dispose();
  }
}
```

---

## 5. 点击手势与水波纹交互：GestureDetector vs InkWell (P48-P49)

在移动开发中，让无原生点击特性的组件（如 Container、Text、Image）响应点击交互，最常用的两大手势组件是 `GestureDetector` 和 `InkWell`。

### 5.1 核心对比

| 特性 | GestureDetector | InkWell |
| :--- | :--- | :--- |
| **视觉反馈** | **无任何视觉反馈**（静止状态） | **拥有 Material 墨水水波纹扩散与高亮动画** |
| **手势丰富度** | 极其丰富：点击、双击、长按、垂直水平滑动手势、多点缩放 | 基础交互为主：`onTap`, `onDoubleTap`, `onLongPress` |
| **依赖环境** | 任意容器内均可直接使用 | **父级节点链上必须存在 `Material` 组件**（否则水波纹无载体） |
| **典型用途** | 自定义复杂手势、画板拖拽、无需动效的隐式热区 | 按钮、设置列表项、商品卡片、带反馈的点击区域 |

### 5.2 GestureDetector 常用回调

```dart
GestureDetector(
  onTap: () => debugPrint('单击事件触发'),
  onDoubleTap: () => debugPrint('双击事件触发'),
  onLongPress: () => debugPrint('长按事件触发'),
  onPanUpdate: (DragUpdateDetails details) {
    // 拖拽手势，获得当前滑动位移增量
    debugPrint('滑动偏移: dx=${details.delta.dx}, dy=${details.delta.dy}');
  },
  child: Container(
    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
    color: Colors.blue,
    child: const Text('支持复杂手势', style: TextStyle(color: Colors.white)),
  ),
)
```

### 5.3 InkWell 水波纹实战与“水波纹被遮挡”避坑指南

> **高频踩坑点**：许多新手给 `Container` 设置了 `decoration: BoxDecoration(color: Colors.white)` 后，外层包裹 `InkWell` 发现**水波纹消失了**！  
> **原因**：`Container` 的背景色绘制在后，将 `InkWell` 投射在底层 Material 上的水波纹直接遮盖住了。  
> **解决策略**：使用 `Ink` 组件替代 `Container`，或者把颜色声明在 `Material` 内部。

```dart
// 正确写法：水波纹完美呈现且带圆角
Material(
  color: Colors.transparent, // 保持透明载体
  child: Ink(
    decoration: BoxDecoration(
      color: Colors.amber.shade100,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: Colors.amber.shade600, width: 1.5),
    ),
    child: InkWell(
      borderRadius: BorderRadius.circular(12), // 水波纹扩散边界裁切为圆角
      splashColor: Colors.amber.withOpacity(0.4), // 水波纹扩散色
      highlightColor: Colors.amber.withOpacity(0.2), // 按下高亮色
      onTap: () {
        debugPrint('带有漂亮水波纹的卡片被点击');
      },
      child: const Padding(
        padding: EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Text(
          '水波纹圆角卡片',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
      ),
    ),
  ),
)
```

---

## 6. setState 原理与局部刷新优化实践 (P50)

### 6.1 `setState()` 的本质机制

`setState()` 并不是立即同步执行界面的重绘，其内部流程为：
1. 校验当前的 State 是否处于活跃挂载状态（`mounted == true`）。
2. 执行传入的闭包更新变量，例如 `_counter++`。
3. 调用内部 `_element!.markNeedsBuild()`，将当前 State 对应的 Element 标记为 **Dirty（脏节点）**。
4. 向系统渲染管线注册一个下一帧刷新请求（`scheduleFrame()`）。
5. 在下一个 VSync 垂直同步信号到来时，Flutter 引擎遍历脏节点并调用其 `build()` 方法计算差异并提交绘制。

### 6.2 性能隐患：“一处更新，全屏重构”

如果在一个大页面的根 State 中调用 `setState()`，**该页面 build() 方法下的所有子 Widget 都会无差别地被重新构造一遍**！

```dart
// ❌ 糟糕的反模式：点击按钮，导致整个页面的复杂布局全量 rebuild
class BadPage extends StatefulWidget { ... }
class _BadPageState extends State<BadPage> {
  int count = 0;
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          const SuperHeavyWidget(), // 每次 count 增加都会跟着被无辜重建！
          Text('$count'),
          ElevatedButton(
            onPressed: () => setState(() => count++), 
            child: const Text('+1'),
          ),
        ],
      ),
    );
  }
}
```

### 6.3 局部刷新的三大核心优化法则

#### 法则 1：善用 `const` 构造函数
对于不依赖动态变量的静态子组件，务必加上 `const` 修饰符（如 `const SuperHeavyWidget()`）。在重新执行 `build` 时，Flutter 遇到 `const` 实例会直接跳过重构与 Diff，开销降为 0。

#### 法则 2：状态下沉，拆分子组件 (Sub-Widget Extraction)
将发生频繁变动的区域抽离为一个独立的 `StatefulWidget`。当该局部组件调用 `setState` 时，其作用域被严格限制在子树内部，父级和其他同级兄弟组件完全不受任何影响！

#### 法则 3：使用 `ValueNotifier` 与 `ValueListenableBuilder` (官方原生轻量局部刷新)
无需引入 GetX 或 Provider 等第三方重量级框架，利用 Flutter 原生提供的 `ValueListenableBuilder` 即可精准实现按需局部刷新：

```dart
class PartialRefreshPage extends StatefulWidget {
  const PartialRefreshPage({super.key});

  @override
  State<PartialRefreshPage> createState() => _PartialRefreshPageState();
}

class _PartialRefreshPageState extends State<PartialRefreshPage> {
  // 1. 定义轻量级的值监听响应对象
  final ValueNotifier<int> _counter = ValueNotifier<int>(0);

  @override
  void dispose() {
    _counter.dispose(); // 必须在 dispose 中释放
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    debugPrint('【整页 build 被调用】仅在首屏执行一次！');

    return Scaffold(
      appBar: AppBar(title: const Text('ValueListenableBuilder 局部刷新')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('这是一段纯静态文本，绝对不会被重刷', style: TextStyle(color: Colors.grey)),
            const SizedBox(height: 20),
            
            // 2. 只有包裹在 ValueListenableBuilder 内的组件才会局部 rebuild
            ValueListenableBuilder<int>(
              valueListenable: _counter,
              builder: (context, value, child) {
                debugPrint('--> 【局部刷新】仅 Text 重新执行 build, value = $value');
                return Text(
                  '当前计数值: $value',
                  style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
                );
              },
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // 3. 改变值，自动通知局部监听器重绘，完全无需调用 setState()
          _counter.value++;
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}
```

---

## 7. 总结

本章深入掌握了 Flutter 界面开发的生命周期与状态控制核心：
1. **MaterialApp 与 Scaffold** 构建了从应用级到页面级的完整脚手架生态。
2. **StatelessWidget 与 StatefulWidget** 明确了不可变轻量配置与长生命周期可变状态的分离架构。
3. **State 生命周期的 8 个关键节点**：牢记在 `initState` 初始化控制器、在 `dispose` 彻底释放资源以防泄漏。
4. **GestureDetector 与 InkWell** 区分了纯手势监听与 Material 水波纹反馈的应用场景。
5. **setState 原理与局部刷新**：善用 `const`、抽离局部子组件、使用 `ValueListenableBuilder` 打造高性能高帧率界面。

下一章我们将全面进入 UI 排版的世界 —— **界面排版与基础布局组件（Container、Row/Column、Flex/Expanded、Wrap、Stack/Positioned）**。
