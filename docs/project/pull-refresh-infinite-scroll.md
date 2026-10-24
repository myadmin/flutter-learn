# 推荐商品流下拉刷新与上拉加载 (P90-P92)

在现代电商应用中，“猜你喜欢”与“推荐商品瀑布流”是留存用户、促成转化的核心阵地。这类列表具备两个决定性的交互特性：
1. **下拉刷新（Pull-to-Refresh）**：用户在列表顶部下拉，重新获取第一页最新鲜的商品数据；
2. **上拉无限分页加载（Infinite Scroll）**：当用户向下滚动接近列表底部时，静默自动触发下一页加载，实现无缝滑动的“刷不完”体验。

本篇（对应课程 P90 至 P92 集）将系统实现双列推荐商品卡片、基于 `ScrollController` 的触底加载状态机、下拉刷新机制，并完成基于 `GlobalKey` 的全局无 Context 轻提示（Toast/SnackBar）架构封装。

---

## 1. 推荐商品卡片组件 (GoodsCard)

在电商设计体系中，商品卡片承载着主图、营销标签、两行截断标题、价格符号、现价、划线原价以及购买转化操作。

### 1.1 商品数据模型 (`lib/models/goods_model.dart`)

```dart
// lib/models/goods_model.dart
class GoodsModel {
  final String id;
  final String title;
  final String imageUrl;
  final double price;
  final double? originalPrice;
  final String? tag;
  final int salesCount;

  const GoodsModel({
    required this.id,
    required this.title,
    required this.imageUrl,
    required this.price,
    this.originalPrice,
    this.tag,
    this.salesCount = 0,
  });

  factory GoodsModel.fromJson(Map<String, dynamic> json) {
    return GoodsModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      imageUrl: json['imageUrl']?.toString() ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      originalPrice: (json['originalPrice'] as num?)?.toDouble(),
      tag: json['tag']?.toString(),
      salesCount: (json['salesCount'] as num?)?.toInt() ?? 0,
    );
  }
}
```

### 1.2 独立商品双列卡片 UI (`lib/widgets/goods_card.dart`)

```dart
// lib/widgets/goods_card.dart
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/goods_model.dart';
import '../constants/app_colors.dart';

class GoodsCard extends StatelessWidget {
  final GoodsModel goods;
  final VoidCallback? onTap;

  const GoodsCard({
    super.key,
    required this.goods,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 商品主图 (1:1 正方形等比裁剪)
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
              child: AspectRatio(
                aspectRatio: 1.0,
                child: CachedNetworkImage(
                  imageUrl: goods.imageUrl,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Container(
                    color: const Color(0xFFF2F3F5),
                    child: const Center(
                      child: CircularProgressIndicator(strokeWidth: 1.5),
                    ),
                  ),
                  errorWidget: (_, __, ___) => Container(
                    color: const Color(0xFFF2F3F5),
                    child: const Icon(Icons.broken_image, color: Colors.grey),
                  ),
                ),
              ),
            ),

            // 下方信息排版区域
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 标题 + 可选促销标签
                  Text.rich(
                    TextSpan(
                      children: [
                        if (goods.tag != null && goods.tag!.isNotEmpty)
                          WidgetSpan(
                            alignment: PlaceholderAlignment.middle,
                            child: Container(
                              margin: const EdgeInsets.only(right: 4),
                              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                              decoration: BoxDecoration(
                                color: AppColors.primaryLight.withOpacity(0.4),
                                borderRadius: BorderRadius.circular(2),
                              ),
                              child: Text(
                                goods.tag!,
                                style: const TextStyle(
                                  color: AppColors.primary,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                        TextSpan(
                          text: goods.title,
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppColors.textPrimary,
                            height: 1.3,
                          ),
                        ),
                      ],
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),

                  // 价格与销量
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      const Text(
                        '¥',
                        style: TextStyle(
                          color: AppColors.price,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        goods.price.toStringAsFixed(1),
                        style: const TextStyle(
                          color: AppColors.price,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(width: 4),
                      if (goods.originalPrice != null)
                        Text(
                          '¥${goods.originalPrice!.toStringAsFixed(1)}',
                          style: const TextStyle(
                            color: AppColors.textMuted,
                            fontSize: 10,
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                      const Spacer(),
                      Text(
                        '已售 ${goods.salesCount}',
                        style: const TextStyle(
                          color: AppColors.textMuted,
                          fontSize: 10,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

## 2. 官方 RefreshIndicator 下拉刷新实战

Flutter 原生提供了符合 Material 规范的 `RefreshIndicator`。它的使用原则非常明确：
- 子组件必须是**可滚动组件**（如 `ListView`、`GridView` 或包含垂直滚动的 `CustomScrollView`）；
- 其 `onRefresh` 回调必须返回一个 `Future<void>`。当 `Future` 执行完成（resolve）后，顶部的旋转刷新圈才会收起。

```dart
RefreshIndicator(
  color: AppColors.primary,       // 旋转圈主题色
  backgroundColor: Colors.white,  // 圆形背景底色
  displacement: 40.0,             // 刷新指示器下滑出现的位移距离
  onRefresh: () async {
    // 触发重新加载第 1 页
    await _onRefreshData();
  },
  child: ListView(...),
)
```

---

## 3. 触底自动分页加载机制 (ScrollController 监听)

### 3.1 触底计算原理与提前预加载

用户滑到真正的“物理最底端”才开始转圈会让用户产生明显的卡顿等待感。因此，业界通用标准是设置一个 **预加载阈值（Preload Threshold）**，例如 200 像素：

```
当前滚动位移 (pixels) + 预加载阈值 (200px) >= 最大滚动范围 (maxScrollExtent)
```

```
┌──────────────────────────────────────┐
│          可滚动视口内容              │
│                                      │
│                                      │
├──────────────────────────────────────┤ <── 用户当前看到的底部 (pixels)
│       预加载缓冲带 (200px)           │
├──────────────────────────────────────┤ <── 物理总最底端 (maxScrollExtent) 触发请求！
```

### 3.2 分页状态机与防止重复请求锁

分页加载必须严密维护一个状态机，避免弱网时用户反复快速滑动触发数十次并发请求：
- `_page`：当前已拉取成功的页码；
- `_isLoading`：网络请求进行中的并发锁（如果为 `true`，拒绝任何后续触底触发）；
- `_hasMore`：是否还有更多数据（若为 `false`，停止触发并展示“已经到底啦”）。

---

## 4. 全局无 Context 轻提示 (Toast / SnackBar) 封装

在异步网络请求中，经常遇到由于网络延时，用户已经关掉了当前页面或弹窗，此时若继续使用原有 `BuildContext` 弹出 `ScaffoldMessenger.of(context).showSnackBar()`，会导致报错：`Looking up a deactivated widget's ancestor is unsafe`。

通过在全局入口注册 `GlobalKey<ScaffoldMessengerState>`，我们可以实现**随时随地一行代码调用提示**：

### 4.1 注册全局脚手架 Key (`lib/utils/toast_util.dart`)

```dart
// lib/utils/toast_util.dart
import 'package:flutter/material.dart';

class ToastUtil {
  ToastUtil._();

  // 全局持有的 ScaffoldMessengerState 导航键
  static final GlobalKey<ScaffoldMessengerState> messengerKey =
      GlobalKey<ScaffoldMessengerState>();

  /// 弹出统一风格轻提示
  static void show(
    String message, {
    bool isError = false,
    Duration duration = const Duration(seconds: 2),
  }) {
    final state = messengerKey.currentState;
    if (state == null) return;

    // 清除上一次积压的 SnackBar，保障即时弹出
    state.removeCurrentSnackBar();

    state.showSnackBar(
      SnackBar(
        content: Text(
          message,
          style: const TextStyle(color: Colors.white, fontSize: 13),
        ),
        backgroundColor: isError ? const Color(0xFFE53935) : const Color(0xFF333333),
        behavior: SnackBarBehavior.floating, // 悬浮悬挂式
        duration: duration,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      ),
    );
  }

  /// 成功轻提示
  static void success(String message) => show(message, isError: false);

  /// 失败错误轻提示
  static void error(String message) => show(message, isError: true);
}
```

在 `lib/main.dart` 中挂载 `scaffoldMessengerKey`：

```dart
// 在 MaterialApp 配置中挂载：
MaterialApp(
  scaffoldMessengerKey: ToastUtil.messengerKey,
  // ... 其他配置
)
```

从此，在任何 Model、Controller、甚至没有 Widget 树的纯 Dart 函数中，只需写：
```dart
ToastUtil.show('商品已加入购物车');
ToastUtil.error('网络连接超时，请重试');
```

---

## 5. 整合下拉刷新与分页加载的商品列表视图

在 `lib/pages/home/widgets/recommend_goods_list.dart` 中实现综合状态机管理：

```dart
// lib/pages/home/widgets/recommend_goods_list.dart
import 'package:flutter/material.dart';
import '../../../models/goods_model.dart';
import '../../../widgets/goods_card.dart';
import '../../../constants/app_colors.dart';
import '../../../utils/toast_util.dart';

class RecommendGoodsList extends StatefulWidget {
  const RecommendGoodsList({super.key});

  @override
  State<RecommendGoodsList> createState() => _RecommendGoodsListState();
}

class _RecommendGoodsListState extends State<RecommendGoodsList> {
  final ScrollController _scrollController = ScrollController();
  final List<GoodsModel> _goodsList = [];

  int _page = 1;
  static const int _pageSize = 10;
  bool _isLoading = false;
  bool _hasMore = true;

  @override
  void initState() {
    super.initState();
    _loadData(isRefresh: true);

    // 绑定触底监听器
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    // 距离底部 200px 时且当前未在加载、仍有数据时，触发加载下一页
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      if (!_isLoading && _hasMore) {
        _loadData(isRefresh: false);
      }
    }
  }

  // 模拟分页网络请求
  Future<void> _loadData({required bool isRefresh}) async {
    if (_isLoading) return;

    setState(() {
      _isLoading = true;
    });

    final targetPage = isRefresh ? 1 : _page + 1;

    try {
      // 模拟网络延时 800ms
      await Future.delayed(const Duration(milliseconds: 800));

      final List<GoodsModel> newItems = _generateMockGoods(targetPage, _pageSize);

      if (!mounted) return;

      setState(() {
        if (isRefresh) {
          _goodsList.clear();
          _goodsList.addAll(newItems);
          _page = 1;
          _hasMore = true;
          ToastUtil.success('推荐商品已更新');
        } else {
          _goodsList.addAll(newItems);
          _page = targetPage;
          // 假设第 4 页后没有更多数据
          if (_page >= 4) {
            _hasMore = false;
          }
        }
      });
    } catch (e) {
      ToastUtil.error('商品加载失败，请重试');
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  List<GoodsModel> _generateMockGoods(int page, int size) {
    return List.generate(size, (index) {
      final id = (page - 1) * size + index + 1;
      return GoodsModel(
        id: '$id',
        title: '极客严选·高品质第 $id 号品质智能科技单品 极简工业美学设计',
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
        price: 99.0 + (id * 15.5 % 300),
        originalPrice: 199.0 + (id * 15.5 % 300),
        tag: id % 3 == 0 ? '热销爆款' : (id % 2 == 0 ? '新品' : null),
        salesCount: 100 + id * 23,
      );
    });
  }

  // 底部状态条渲染
  Widget _buildFooterIndicator() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      alignment: Alignment.center,
      child: _isLoading
          ? const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                ),
                SizedBox(width: 8),
                Text('正在加急加载中...', style: TextStyle(color: Colors.grey, fontSize: 12)),
              ],
            )
          : (!_hasMore
              ? const Text(
                  '—— 没有更多推荐商品了，去别处看看吧 ——',
                  style: TextStyle(color: Colors.grey, fontSize: 12),
                )
              : const SizedBox.shrink()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () => _loadData(isRefresh: true),
      child: ListView(
        controller: _scrollController,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        children: [
          // 双列商品网格
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _goodsList.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 0.68, // 卡片宽高比，容纳图片与信息
            ),
            itemBuilder: (context, index) {
              final goods = _goodsList[index];
              return GoodsCard(
                goods: goods,
                onTap: () {
                  ToastUtil.show('点击了商品: ${goods.title}');
                },
              );
            },
          ),

          // 列表最底部的状态指示器
          _buildFooterIndicator(),
        ],
      ),
    );
  }
}
```

---

## 6. 高频避坑指南与最佳实践

::: tip 1. 为什么必须检查 if (!mounted) return;？
在任何 `await` 异步调用结束之后，组件可能已经被父级路由 Pop 弹出销毁。如果直接调用 `setState()`，Flutter 引擎会抛出异常：`setState() called after dispose()`。在所有异步回调后执行 UI 刷新前，必须检查 `if (!mounted) return;`。
:::

::: warning 2. 避免 ScrollController 重复绑定
一个 `ScrollController` 实例在同一时刻只能赋给一个可滚动的视图（除非是特殊的同步滚动场景）。如果在两个不同的 Tab 页面共用同一个 Controller 实例，会在运行时触发异常。
:::

::: info 3. Sliver 体系下的优雅解法
在超大型电商项目中，如果首页既有 Banner，又有分类金刚区，底层还有长流瀑布流，更极致的做法是使用单一 `CustomScrollView`，将顶部楼层放进 `SliverToBoxAdapter`，推荐流放进 `SliverGrid`。这样整个页面共用同一个滚动物理通道，完全杜绝了嵌套滑动的微小损耗。
:::

---

## 7. 本章小结

在这一章中，我们：
1. 封装了电商级别的 `GoodsCard` 双列瀑布流卡片组件，精细还原了主图、角标、富文本价格与销量信息；
2. 掌握了 `RefreshIndicator` 的刷新生命周期；
3. 基于 `ScrollController` 监听和阈值计算实现了触底静默加载更多，并设计了防并发、防溢出的严谨状态机；
4. 创新性使用 `GlobalKey<ScaffoldMessengerState>` 封装了全局无 Context 轻提示工具 `ToastUtil`。

在接下来的 **[个人中心与用户登录表单验证 (P94-P96)](./profile-and-auth.md)** 中，我们将转向电商的另一大核心业务板块：搭建沉浸式“我的”页面，开发完整的用户登录与 Form 表单验证系统！
