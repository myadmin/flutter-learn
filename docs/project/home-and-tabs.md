# 主页Tab切换与轮播图展示 (P82-P86)

在上一章完成项目脚手架与基础分层后，本章我们将正式进入电商 App 的核心交互开发（对应课程 P82 至 P86 集）。

本章核心涵盖两大板块：
1. **底部导航栏与主标签页框架搭建**：使用 `BottomNavigationBar` 结合 `IndexedStack` 实现四个主页面的无损切换与滚动状态保持；
2. **首页视口架构与 Banner 轮播图**：构建沉浸式顶部搜索栏、封装支持自动轮播与圆点指示器的 Banner 组件，并通过 Dio 进行网络 API 异步数据绑定与三级缓存优化。

---

## 1. 底部导航栏与主页面框架设计

主流电商 App 的底部一般固定承载 4 个核心入口：**首页（Home）**、**分类（Category）**、**购物车（Cart）**、**我的（Profile）**。

### 1.1 常见多页面切换方案对比

在 Flutter 中实现多 Tab 切换，开发者常面临三种技术方案：

| 方案 | 实现机制 | 优点 | 缺点 | 适用场景 |
| :--- | :--- | :--- | :--- | :--- |
| **条件渲染 (三目运算)** | `body: _currentIndex == 0 ? HomePage() : ...` | 内存占用低，未选中页面立即销毁 | 每次切换页面完全重绘，滚动位置丢失，网络重复请求 | 页面极少、无滚动状态的简单工具类 App |
| **`PageView` + 混入** | `PageView` + `AutomaticKeepAliveClientMixin` | 支持横向滑动手势，按需懒加载并保持状态 | 代码侵入性较强，每个子页面必须混入 Mixin 并实现 `wantKeepAlive` | 资讯类新闻客户端、顶部多分类 Tab 场景 |
| **`IndexedStack`** | `IndexedStack(index: _currentIndex, children: [...])` | **状态完美保留**，无任何侵入代码，切换性能极致流畅 | 初次进入时子组件树会被全部构建（非完全懒加载） | **电商 App 底部核心四大金刚页（官方强烈推荐）** |

在电商应用中，用户在首页、分类、购物车与个人中心之间频繁跳动，**必须保障用户在各个页面的滚动偏好、表单输入、商品勾选状态不因切换而重置**。因此，`IndexedStack` 是业界公认的最佳实践方案。

---

## 2. MainTabsPage 承载骨架开发

我们在 `lib/pages/main_tabs_page.dart` 中实现主框架：

```dart
// lib/pages/main_tabs_page.dart
import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import 'home/home_page.dart';
import 'category/category_page.dart';
import 'cart/cart_page.dart';
import 'profile/profile_page.dart';

class MainTabsPage extends StatefulWidget {
  const MainTabsPage({super.key});

  @override
  State<MainTabsPage> createState() => _MainTabsPageState();
}

class _MainTabsPageState extends State<MainTabsPage> {
  // 当前激活的标签索引
  int _currentIndex = 0;

  // 页面实例列表（配合 IndexedStack 保持状态）
  final List<Widget> _pages = const [
    HomePage(),
    CategoryPage(),
    CartPage(),
    ProfilePage(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // 使用 IndexedStack 保证各子页面在切换时不会被 dispose，保留各自的 ScrollPosition
      body: IndexedStack(
        index: _currentIndex,
        children: _pages,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (int index) {
          setState(() {
            _currentIndex = index;
          });
        },
        type: BottomNavigationBarType.fixed, // 4个及以上Tab必须显式声明为 fixed
        backgroundColor: Colors.white,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: const Color(0xFF757575),
        selectedFontSize: 12,
        unselectedFontSize: 12,
        elevation: 8,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: '首页',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.category_outlined),
            activeIcon: Icon(Icons.category),
            label: '分类',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.shopping_cart_outlined),
            activeIcon: Icon(Icons.shopping_cart),
            label: '购物车',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: '我的',
          ),
        ],
      ),
    );
  }
}
```

> **注意事项**：
> 当 `BottomNavigationBarItem` 超过 3 个时，Flutter 默认会将 `type` 变为 `shifting` 模式，导致未选中项文字隐藏且背景变白。务必显式传入 `type: BottomNavigationBarType.fixed`。

---

## 3. 首页视口架构与自定义搜索导航栏

电商首页通常由自定义顶部搜索栏与滚动内容区组成。由于后续需要集成轮播图、分类金刚区、特惠卡片及下拉刷新，推荐使用 `CustomScrollView` + `Sliver` 系列组件，或者标准 `SingleChildScrollView`。

我们先在 `lib/widgets/home_search_bar.dart` 中封装高拟真的顶部搜索条：

```dart
// lib/widgets/home_search_bar.dart
import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

class HomeSearchBar extends StatelessWidget {
  final VoidCallback? onSearchTap;
  final VoidCallback? onMessageTap;

  const HomeSearchBar({
    super.key,
    this.onSearchTap,
    this.onMessageTap,
  });

  @override
  Widget build(BuildContext context) {
    // 适配状态栏安全高度
    final double statusBarHeight = MediaQuery.of(context).padding.top;

    return Container(
      color: Colors.white,
      padding: EdgeInsets.only(
        top: statusBarHeight + 6,
        left: 16,
        right: 16,
        bottom: 8,
      ),
      child: Row(
        children: [
          // 极客商城品牌 Logo / 文字
          const Text(
            '极客严选',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.primary,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(width: 12),
          // 仿搜索输入框 (点击跳转搜索页)
          Expanded(
            child: GestureDetector(
              onTap: onSearchTap,
              child: Container(
                height: 36,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF2F3F5),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.search, size: 18, color: Colors.grey),
                    SizedBox(width: 8),
                    Text(
                      '搜索商品、品牌、心仪好物',
                      style: TextStyle(fontSize: 13, color: Colors.grey),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          // 消息通知铃铛
          IconButton(
            icon: const Icon(Icons.notifications_none, color: Color(0xFF333333)),
            onPressed: onMessageTap ?? () {},
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
        ],
      ),
    );
  }
}
```

---

## 4. Banner 轮播图数据模型与网络 API 封装

在接入 UI 前，遵循数据驱动 UI 的思想，先定义数据契约与网络请求层。

### 4.1 轮播图实体模型 (`lib/models/banner_model.dart`)

```dart
// lib/models/banner_model.dart
class BannerModel {
  final String id;
  final String imgUrl;
  final String? jumpUrl;
  final String title;

  const BannerModel({
    required this.id,
    required this.imgUrl,
    this.jumpUrl,
    required this.title,
  });

  // 从后端 JSON 字典反序列化
  factory BannerModel.fromJson(Map<String, dynamic> json) {
    return BannerModel(
      id: json['id']?.toString() ?? '',
      imgUrl: json['imgUrl']?.toString() ?? '',
      jumpUrl: json['jumpUrl']?.toString(),
      title: json['title']?.toString() ?? '',
    );
  }

  // 序列化回 JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'imgUrl': imgUrl,
      'jumpUrl': jumpUrl,
      'title': title,
    };
  }
}
```

### 4.2 首页 API 接口服务 (`lib/api/home_api.dart`)

基于 Dio 发起网络请求，并提供兜底 Mock 数据以确保无网络环境下仍可流畅调试：

```dart
// lib/api/home_api.dart
import 'package:dio/dio.dart';
import '../models/banner_model.dart';

class HomeApi {
  static final Dio _dio = Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));

  /// 获取首页顶部轮播图列表
  static Future<List<BannerModel>> fetchBanners() async {
    try {
      // 演示真实 API 请求地址（在黑马课程接口或极客商城Mock接口）
      final response = await _dio.get('https://mock.apifox.cn/m1/geekmall/banners');
      if (response.statusCode == 200 && response.data['code'] == 200) {
        final List list = response.data['data'] as List;
        return list.map((item) => BannerModel.fromJson(item)).toList();
      }
      throw Exception('网络请求业务错误: ${response.data['message']}');
    } catch (e) {
      // 网络异常时返回高质量高清兜底测试数据，保证页面不挂
      return _getMockBanners();
    }
  }

  static List<BannerModel> _getMockBanners() {
    return const [
      BannerModel(
        id: '1',
        title: '新人狂欢季・爆款5折起',
        imgUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80',
        jumpUrl: '/activity/new-user',
      ),
      BannerModel(
        id: '2',
        title: '极客数码专场・最高立减1000',
        imgUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
        jumpUrl: '/activity/digital',
      ),
      BannerModel(
        id: '3',
        title: '居家优选・舒适美学生活',
        imgUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
        jumpUrl: '/activity/home',
      ),
    ];
  }
}
```

---

## 5. Banner 轮播图组件开发与圆点指示器

我们可以直接使用基于 Flutter `PageView` 的定制实现，或者工业级成熟组件 `carousel_slider`。这里我们构建一个高度可定制且支持圆点动画联动（Indicator）的独立组件。

在 `lib/widgets/home_banner.dart` 中实现：

```dart
// lib/widgets/home_banner.dart
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/banner_model.dart';
import '../constants/app_colors.dart';

class HomeBanner extends StatefulWidget {
  final List<BannerModel> banners;
  final double height;
  final ValueChanged<BannerModel>? onBannerTap;

  const HomeBanner({
    super.key,
    required this.banners,
    this.height = 180.0,
    this.onBannerTap,
  });

  @override
  State<HomeBanner> createState() => _HomeBannerState();
}

class _HomeBannerState extends State<HomeBanner> {
  late final PageController _pageController;
  int _currentIndex = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(initialPage: 0);
    _startAutoPlay();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  // 启动 3 秒自动轮播定时器
  void _startAutoPlay() {
    if (widget.banners.length <= 1) return;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 3), (timer) {
      if (_pageController.hasClients) {
        final int nextPage = (_currentIndex + 1) % widget.banners.length;
        _pageController.animateToPage(
          nextPage,
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (widget.banners.isEmpty) {
      return SizedBox(
        height: widget.height,
        child: const Center(child: CircularProgressIndicator()),
      );
    }

    return Container(
      height: widget.height,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Stack(
        alignment: Alignment.bottomCenter,
        children: [
          // 轮播图片视口
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: PageView.builder(
              controller: _pageController,
              itemCount: widget.banners.length,
              onPageChanged: (index) {
                setState(() {
                  _currentIndex = index;
                });
              },
              itemBuilder: (context, index) {
                final banner = widget.banners[index];
                return GestureDetector(
                  onTap: () => widget.onBannerTap?.call(banner),
                  child: CachedNetworkImage(
                    imageUrl: banner.imgUrl,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(
                      color: const Color(0xFFEEEEEE),
                      child: const Center(
                        child: Icon(Icons.image, color: Colors.grey, size: 40),
                      ),
                    ),
                    errorWidget: (context, url, error) => Container(
                      color: const Color(0xFFEEEEEE),
                      child: const Center(
                        child: Icon(Icons.broken_image, color: Colors.grey, size: 40),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          // 底部浮动圆点指示器
          Positioned(
            bottom: 8,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                widget.banners.length,
                (index) => AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  width: _currentIndex == index ? 16 : 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: _currentIndex == index
                        ? AppColors.primary
                        : Colors.white.withOpacity(0.6),
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
```

---

## 6. 首页总体装配与网络状态联动

现在我们将搜索条与轮播图整合成完整的 `HomePage`，并通过 `FutureBuilder` 优雅处理初始异步加载中、加载失败与渲染成功状态：

```dart
// lib/pages/home/home_page.dart
import 'package:flutter/material.dart';
import '../../api/home_api.dart';
import '../../models/banner_model.dart';
import '../../widgets/home_search_bar.dart';
import '../../widgets/home_banner.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  late Future<List<BannerModel>> _bannersFuture;

  @override
  void initState() {
    super.initState();
    _bannersFuture = HomeApi.fetchBanners();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F8FA),
      body: Column(
        children: [
          // 顶部固定搜索导航栏
          HomeSearchBar(
            onSearchTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('跳转搜索商品页面...')),
              );
            },
          ),

          // 首页可滚动区域
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                // 轮播图异步绑定
                FutureBuilder<List<BannerModel>>(
                  future: _bannersFuture,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return Container(
                        height: 180,
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE0E0E0),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Center(
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      );
                    }
                    if (snapshot.hasError || !snapshot.hasData || snapshot.data!.isEmpty) {
                      return Container(
                        height: 180,
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFAFAFA),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey.shade300),
                        ),
                        child: Center(
                          child: TextButton.icon(
                            icon: const Icon(Icons.refresh),
                            label: const Text('数据加载失败，点击重试'),
                            onPressed: () {
                              setState(() {
                                _bannersFuture = HomeApi.fetchBanners();
                              });
                            },
                          ),
                        ),
                      );
                    }

                    // 正常渲染数据
                    return HomeBanner(
                      banners: snapshot.data!,
                      onBannerTap: (banner) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('点击了广告：${banner.title}')),
                        );
                      },
                    );
                  },
                ),

                // 预留给下一篇的分类金刚区与推荐商品占位
                const Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Center(
                    child: Text(
                      '更多精彩楼层开发中...',
                      style: TextStyle(color: Colors.grey, fontSize: 13),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
```

<FlutterPhonePreview 
  type="ecommerce" 
  title="仿电商首页搜索栏、轮播图与分类综合效果" 
  appBarTitle="仿网易严选好物" 
/>

---

## 7. 高频避坑指南

::: tip 1. IndexedStack 初次加载的性能权衡
`IndexedStack` 虽然能够在切换 Tab 时保留所有状态，但它在初始化时会**同时调用所有 children 的 `build` 方法**。
如果某个 Tab（如“我的”页面）包含极为繁重的首次计算或大量高清图，建议在该子页面内部加入懒加载标记，只有当页面被激活一次后才真正发起网络请求。
:::

::: warning 2. Timer 内存泄漏陷阱
在轮播图中创建的 `Timer.periodic` 必须在组件被销毁时的 `dispose()` 生命周期内调用 `_timer?.cancel()`。如果不调用，即便组件已离开屏幕，定时器仍将持续在后台触发动画回调并造成严重内存泄漏！
:::

::: info 3. 为什么必须用 CachedNetworkImage？
直接使用原生 `Image.network` 会导致每次滚动滑出屏幕后图片缓存被丢弃，重新滑入时出现刺眼的白屏闪烁。
`CachedNetworkImage` 基于本地磁盘与内存两级缓存，即使在弱网甚至断网状态下也能秒级加载历史图片。
:::

---

## 8. 本章小结

在这一章中，我们：
1. 对比并落地了主流电商 App 底部 Tab 架构方案，利用 `IndexedStack` 实现了无损状态保持；
2. 封装了符合现代电商视觉规范的自定义顶部搜索栏；
3. 设计了标准 JSON 模型解析契约，结合 Dio 实现了网络请求与兜底 Mock；
4. 亲手封装了带有丝滑动画圆点指示器与定时自动播放的 `HomeBanner` 轮播图组件，并使用 `CachedNetworkImage` 优化了网络图像体验。

在下一篇 **[分类网格与特惠爆款推荐(AI辅助) (P87-P90)](./category-and-recommend.md)** 中，我们将揭秘如何巧妙运用 Trae / AI 辅助编程高效生成金刚区分类网格与特惠专区复合布局！
