# 3. 高颜值流光底部导航与懒加载堆栈

> 💡 **本篇导读**：移动端应用的首屏加载性能与底部导航体验息息相关。原生的 `BottomNavigationBar` 样式呆板且扩展性差，而默认的 `IndexedStack` 在应用启动时会立即初始化所有 Tab 页面，造成严重的启动网络并发风暴与内存浪费。本篇将通过 `SalomonBottomBar` 与 `LazyLoadIndexedStack` 彻底破解这两个核心难题。

---

## 1. 传统导航栏设计与性能瓶颈剖析

### 1.1 视觉审美疲劳：原生 BottomNavigationBar 的局限
原生 Material 风格的 BottomNavigationBar 仅支持图标和文字简单的颜色染色，缺乏动效呼吸感和选中态气泡背景。现代优秀产品更倾向于采用具有**流光灵动胶囊背景（Pill Selection Indicator）**的导航栏风格。

### 1.2 性能隐患：原生 IndexedStack 的启动全量加载
在 Flutter 中，为了在切换底部 Tab 时保留各个页面的滚动位置（Scroll Position）与输入状态，大家通常会使用 `IndexedStack`。但其内部原理是：
> **`IndexedStack` 在初次 build 时，会将其 `children` 数组中的所有 Widget 全部一次性挂载到 Widget Tree 上进行渲染！**

这意味着：
- 用户刚打开 App 停留在“首页”，但“豆瓣榜单”、“电子书城”、“个人书架”这 3 个页面的 `initState` 已经全部被执行；
- 4 个页面的网络请求（爬虫 HTML 解析、列表拉取、用户信息）瞬间**并发轰炸**服务器；
- 内存占用在启动初级就达到峰值，极易引发中低端手机掉帧甚至白屏崩溃。

---

## 2. 解决方案：SalomonBottomBar + LazyLoadIndexedStack

| 对比维度 | 传统组合 (BottomNavBar + IndexedStack) | 进阶现代化组合 (SalomonBottomBar + LazyLoadIndexedStack) |
| :--- | :--- | :--- |
| **视觉呈现** | 扁平单色染色，无动效 | **流光胶囊气泡选中动效**，各 Tab 独立专属色系 |
| **Tab 初始化时机** | 启动时 4 个页面**一次性全量构建** | **按需触发**：用户点击进入该 Tab 时才开始初次构建 |
| **Tab 状态保持** | 页面状态可保持 | **既保持懒加载，又保持已访问页面的浏览进度** |
| **启动网络消耗** | 4 份初始请求同时并发抢占带宽 | **仅首屏 Tab 产生网络消耗**，提速 60% 以上 |

---

## 3. SalomonBottomBar 核心集成

`SalomonBottomBar` 每一个子项都可以定义独立的 `selectedColor`，让不同的功能板块拥有鲜明的视觉语义：

```dart
import 'package:flutter/material.dart';
import 'package:salomon_bottom_bar/salomon_bottom_bar.dart';

SalomonBottomBar(
  currentIndex: _currentIndex,
  onTap: (index) {
    setState(() => _currentIndex = index);
  },
  items: [
    // 首页：深邃科技蓝
    SalomonBottomBarItem(
      icon: const Icon(Icons.home_outlined),
      activeIcon: const Icon(Icons.home),
      title: const Text('首页'),
      selectedColor: const Color(0xFF02569B),
    ),
    // 豆瓣商城：豆瓣经典清新绿
    SalomonBottomBarItem(
      icon: const Icon(Icons.menu_book_outlined),
      activeIcon: const Icon(Icons.menu_book),
      title: const Text('豆瓣榜单'),
      selectedColor: const Color(0xFF00B51D),
    ),
    // 电子书城：活力珊瑚橙
    SalomonBottomBarItem(
      icon: const Icon(Icons.auto_stories_outlined),
      activeIcon: const Icon(Icons.auto_stories),
      title: const Text('电子书城'),
      selectedColor: const Color(0xFFFF6F00),
    ),
    // 个人书架：典雅紫罗兰
    SalomonBottomBarItem(
      icon: const Icon(Icons.bookmark_border),
      activeIcon: const Icon(Icons.bookmark),
      title: const Text('我的书架'),
      selectedColor: const Color(0xFF7C3AED),
    ),
  ],
)
```

---

## 4. LazyLoadIndexedStack 懒加载机制深度实现

如果你不想引入第三方包，也可以自己轻松手写一个只有 30 行代码的高性能 `LazyLoadIndexedStack`。其核心思想是维护一个已激活索引的集合 `_activatedIndices`：

```dart
import 'package:flutter/material.dart';

/// 高性能懒加载 IndexedStack
class LazyLoadIndexedStack extends StatefulWidget {
  final int index;
  final List<Widget> children;
  final AlignmentGeometry alignment;
  final TextDirection? textDirection;
  final StackFit sizing;

  const LazyLoadIndexedStack({
    super.key,
    required this.index,
    required this.children,
    this.alignment = AlignmentDirectional.topStart,
    this.textDirection,
    this.sizing = StackFit.loose,
  });

  @override
  State<LazyLoadIndexedStack> createState() => _LazyLoadIndexedStackState();
}

class _LazyLoadIndexedStackState extends State<LazyLoadIndexedStack> {
  // 记录已经由用户主动切入激活过的 Tab 索引
  late final Set<int> _activatedIndices;

  @override
  void initState() {
    super.initState();
    // 初始状态下只激活当前显示的 Tab (通常是 index 0 首页)
    _activatedIndices = {widget.index};
  }

  @override
  void didUpdateWidget(LazyLoadIndexedStack oldWidget) {
    super.didUpdateWidget(oldWidget);
    // 当切换到新 Tab 时，加入激活集合
    _activatedIndices.add(widget.index);
  }

  @override
  Widget build(BuildContext context) {
    return IndexedStack(
      index: widget.index,
      alignment: widget.alignment,
      textDirection: widget.textDirection,
      sizing: widget.sizing,
      children: List.generate(widget.children.length, (i) {
        // 关键逻辑：如果从未激活过，仅放置占位空盒子；一旦激活过，挂载真实 Widget 并持久保持
        return _activatedIndices.contains(i)
            ? widget.children[i]
            : const SizedBox.shrink();
      }),
    );
  }
}
```

---

## 5. 主屏总控架构实战 (`lib/views/home/main_screen.dart`)

我们将 `SalomonBottomBar` 与 `LazyLoadIndexedStack` 进行组装：

```dart
import 'package:flutter/material.dart';
import 'package:salomon_bottom_bar/salomon_bottom_bar.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'home_page.dart';
import '../douban_store/douban_store_page.dart';
import '../ebook_store/ebook_store_page.dart';
import '../my_book/my_book_page.dart';
import '../../widgets/lazy_load_indexed_stack.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  // 四大核心业务模块列表
  final List<Widget> _pages = const [
    HomePage(),
    DoubanStorePage(),
    EBookStorePage(),
    MyBookPage(),
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      // 使用懒加载堆栈承载四大子页面
      body: LazyLoadIndexedStack(
        index: _currentIndex,
        children: _pages,
      ),
      // 底部灵动气泡流光导航栏
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: theme.cardColor,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10.r,
              offset: const Offset(0, -3),
            ),
          ],
        ),
        padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 6.h),
        child: SalomonBottomBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          items: [
            SalomonBottomBarItem(
              icon: const Icon(Icons.home_outlined),
              activeIcon: const Icon(Icons.home),
              title: const Text('精选推荐'),
              selectedColor: const Color(0xFF02569B),
            ),
            SalomonBottomBarItem(
              icon: const Icon(Icons.menu_book_outlined),
              activeIcon: const Icon(Icons.menu_book),
              title: const Text('豆瓣榜单'),
              selectedColor: const Color(0xFF00B51D),
            ),
            SalomonBottomBarItem(
              icon: const Icon(Icons.auto_stories_outlined),
              activeIcon: const Icon(Icons.auto_stories),
              title: const Text('电子书城'),
              selectedColor: const Color(0xFFFF6F00),
            ),
            SalomonBottomBarItem(
              icon: const Icon(Icons.bookmark_border),
              activeIcon: const Icon(Icons.bookmark),
              title: const Text('我的书架'),
              selectedColor: const Color(0xFF7C3AED),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

## 6. 在线交互预览

在下方模拟器中，你可以直观感受底部流光导航栏的切换动效：

<FlutterPhonePreview 
  type="ebook" 
  title="SalomonBottomBar 流光导航交互模拟" 
  appBarTitle="电子书城导航" 
/>
