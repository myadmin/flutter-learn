# 分类网格与特惠爆款推荐(AI辅助) (P87-P89)

在现代化软件工程中，AI 辅助编程（如 Trae、Cursor、GitHub Copilot）已经成为提升 Flutter 客户端开发效能的核心利器。在第 87 至 89 集教程中，我们将结合 **Trae / AI 智能辅助工具**，以“人机协作”的高效模式，快速构建电商首页的核心楼层：
1. **金刚区 10 格商品分类网格**（Category Grid）；
2. **特惠推荐专区**（Special Offer Promotion Floor，包含左大右小不对称布局与限时秒杀倒计时）；
3. **爆款推荐与一站买全横向滑块**（Horizontal Hot Goods Stream）。

<BiliVideoPlayer episodes="87-89" :p="87" />

---

## 1. 现代化 AI 辅助开发在 Flutter 中的实战方法论

在开发繁琐的 UI 布局与数据反序列化代码时，编写详尽的 **Prompt（结构化提示词）** 可以将编码效率提升 5 倍以上。

### 1.1 高效 Flutter UI 提示词公式 (Prompt Formula)

```
[角色定义] + [技术栈约束] + [视觉结构与尺寸描述] + [数据契约 (JSON/Model)] + [代码输出规范]
```

#### 实战范例 Prompt：生成金刚区分类组件

> **输入 Trae / Cursor 聊天窗口**：
>
> “你是一名资深 Flutter 架构师。请为我编写一个电商首页的‘金刚区 10 格商品分类’组件 `CategoryGrid`。
> **技术约束**：
> 1. 基于 Flutter 3.x，代码必须完全健全空安全；
> 2. 使用 `GridView.builder`，固定 2 行 5 列展示；
> 3. 每个 Item 包含一个圆角背景的网络图标（44x44）和下方的一行分类名称（12号灰黑色文字，间距 6px）；
> 4. 该组件将作为 `ListView` 的一个子项嵌入，请务必设置 `shrinkWrap: true` 和 `NeverScrollableScrollPhysics` 避免滚动冲突；
> 5. 附带定义包含 `id`, `name`, `iconUrl` 的实体类 `CategoryItemModel` 与静态 Mock 测试数据；
> 6. 请提供完整、无省略的代码实现。”

通过上述结构化 Prompt，AI 生成的代码可以直接无缝复制到工程中，只需做少量微调即可上线。

---

## 2. 金刚区商品分类网格 (Category Grid) 开发

金刚区是电商 App 引导流量分配最重要的入口。通常为两行五列共 10 个圆角图标。

### 2.1 分类模型与 Mock 数据 (`lib/models/category_model.dart`)

```dart
// lib/models/category_model.dart
class CategoryItemModel {
  final String id;
  final String name;
  final String iconUrl;
  final String? jumpRoute;

  const CategoryItemModel({
    required this.id,
    required this.name,
    required this.iconUrl,
    this.jumpRoute,
  });

  factory CategoryItemModel.fromJson(Map<String, dynamic> json) {
    return CategoryItemModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      iconUrl: json['iconUrl']?.toString() ?? '',
      jumpRoute: json['jumpRoute']?.toString(),
    );
  }

  // 10 核心分类静态 Mock 数据
  static List<CategoryItemModel> getMockCategories() {
    return const [
      CategoryItemModel(id: '1', name: '手机数码', iconUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&q=80'),
      CategoryItemModel(id: '2', name: '电脑办公', iconUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=100&q=80'),
      CategoryItemModel(id: '3', name: '家用电器', iconUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=100&q=80'),
      CategoryItemModel(id: '4', name: '服饰鞋包', iconUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&q=80'),
      CategoryItemModel(id: '5', name: '美妆个护', iconUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=100&q=80'),
      CategoryItemModel(id: '6', name: '食品生鲜', iconUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100&q=80'),
      CategoryItemModel(id: '7', name: '运动户外', iconUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=100&q=80'),
      CategoryItemModel(id: '8', name: '母婴玩具', iconUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=100&q=80'),
      CategoryItemModel(id: '9', name: '家居家装', iconUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&q=80'),
      CategoryItemModel(id: '10', name: '充值中心', iconUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=100&q=80'),
    ];
  }
}
```

### 2.2 金刚区网格视图组件 (`lib/widgets/category_grid.dart`)

```dart
// lib/widgets/category_grid.dart
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/category_model.dart';
import '../constants/app_colors.dart';

class CategoryGrid extends StatelessWidget {
  final List<CategoryItemModel> categories;
  final ValueChanged<CategoryItemModel>? onItemTap;

  const CategoryGrid({
    super.key,
    required this.categories,
    this.onItemTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: GridView.builder(
        // 作为垂直列表内嵌子组件时的核心配置：禁止自身滑动，根据子项高度撑满
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        padding: EdgeInsets.zero,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 5,         // 一行 5 列
          mainAxisSpacing: 10,       // 垂直间距
          crossAxisSpacing: 4,        // 水平间距
          childAspectRatio: 0.82,     // 宽高比（高度略大于宽度以容纳文字）
        ),
        itemCount: categories.length,
        itemBuilder: (context, index) {
          final item = categories[index];
          return InkWell(
            onTap: () => onItemTap?.call(item),
            borderRadius: BorderRadius.circular(8),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // 分类圆形图标
                ClipRRect(
                  borderRadius: BorderRadius.circular(22),
                  child: Container(
                    width: 44,
                    height: 44,
                    color: const Color(0xFFF6F7F9),
                    child: CachedNetworkImage(
                      imageUrl: item.iconUrl,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => const Center(
                        child: SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 1.5),
                        ),
                      ),
                      errorWidget: (_, __, ___) => const Icon(
                        Icons.category,
                        color: Colors.grey,
                        size: 24,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                // 分类文本标题
                Text(
                  item.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w400,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
```

---

## 3. 特惠推荐专区：AI + 手工调整的不规则卡片布局

电商的“今日特惠/限时秒杀”区域通常采用视觉冲击力强的**左侧主推大卡片 + 右侧上下两个副推卡片**的不规则排版结构。

### 3.1 倒计时小组件 (`lib/widgets/countdown_timer.dart`)

```dart
// lib/widgets/countdown_timer.dart
import 'dart:async';
import 'package:flutter/material.dart';

class CountdownTimerWidget extends StatefulWidget {
  final Duration initialDuration;

  const CountdownTimerWidget({
    super.key,
    this.initialDuration = const Duration(hours: 2, minutes: 15, seconds: 30),
  });

  @override
  State<CountdownTimerWidget> createState() => _CountdownTimerWidgetState();
}

class _CountdownTimerWidgetState extends State<CountdownTimerWidget> {
  late Duration _remaining;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _remaining = widget.initialDuration;
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_remaining.inSeconds > 0) {
        setState(() {
          _remaining = _remaining - const Duration(seconds: 1);
        });
      } else {
        _timer?.cancel();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Widget _buildTimeBox(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
      decoration: BoxDecoration(
        color: const Color(0xFF333333),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final hours = _remaining.inHours.toString().padLeft(2, '0');
    final minutes = (_remaining.inMinutes % 60).toString().padLeft(2, '0');
    final seconds = (_remaining.inSeconds % 60).toString().padLeft(2, '0');

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _buildTimeBox(hours),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 2),
          child: Text(':', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
        ),
        _buildTimeBox(minutes),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 2),
          child: Text(':', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
        ),
        _buildTimeBox(seconds),
      ],
    );
  }
}
```

### 3.2 特惠专区楼层 (`lib/widgets/special_offer_section.dart`)

```dart
// lib/widgets/special_offer_section.dart
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../constants/app_colors.dart';
import 'countdown_timer.dart';

class SpecialOfferSection extends StatelessWidget {
  const SpecialOfferSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          // 顶部标题栏 + 倒计时
          Row(
            children: [
              const Text(
                '限时特惠',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight.withOpacity(0.4),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Text(
                  '距离结束',
                  style: TextStyle(fontSize: 10, color: AppColors.primaryDark),
                ),
              ),
              const SizedBox(width: 6),
              const CountdownTimerWidget(),
              const Spacer(),
              const Text(
                '更多好物 >',
                style: TextStyle(fontSize: 12, color: AppColors.textMuted),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // 核心不规则卡片：左大 (占1/2) + 右侧上下两个 (占1/2)
          SizedBox(
            height: 180,
            child: Row(
              children: [
                // 左侧大卡片（爆款秒杀）
                Expanded(
                  flex: 1,
                  child: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF7F7),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          '立减 500 元',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                          ),
                        ),
                        const Text(
                          '旗舰降噪无线耳机',
                          style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                        ),
                        const Spacer(),
                        Center(
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(6),
                            child: CachedNetworkImage(
                              imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80',
                              height: 100,
                              fit: BoxFit.contain,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),

                // 右侧上下两个小卡片
                Expanded(
                  flex: 1,
                  child: Column(
                    children: [
                      // 右上卡片
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF9F9FF),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              const Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text('智能运动手表', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                    Text('打卡返现', style: TextStyle(fontSize: 10, color: Colors.blueAccent)),
                                  ],
                                ),
                              ),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(4),
                                child: CachedNetworkImage(
                                  imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80',
                                  width: 50,
                                  height: 50,
                                  fit: BoxFit.cover,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),

                      // 右下卡片
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFFBF0),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              const Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text('真皮复古相机包', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                    Text('限时7折', style: TextStyle(fontSize: 10, color: Colors.deepOrange)),
                                  ],
                                ),
                              ),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(4),
                                child: CachedNetworkImage(
                                  imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=100&q=80',
                                  width: 50,
                                  height: 50,
                                  fit: BoxFit.cover,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
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

---

## 4. 爆款推荐与一站买全：横向滚动商品流

在电商中，“爆款热销”模块常采用横向滚动的轻盈卡片形式，支持用户左右滑动探索。

### 4.1 横向热销卡片 (`lib/widgets/hot_goods_slider.dart`)

```dart
// lib/widgets/hot_goods_slider.dart
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../constants/app_colors.dart';

class HotGoodsItem {
  final String title;
  final String price;
  final String originalPrice;
  final String imageUrl;

  const HotGoodsItem({
    required this.title,
    required this.price,
    required this.originalPrice,
    required this.imageUrl,
  });
}

class HotGoodsSlider extends StatelessWidget {
  final List<HotGoodsItem> items;

  const HotGoodsSlider({
    super.key,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 模块标题
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: [
                Icon(Icons.whatshot, color: Colors.deepOrange, size: 20),
                SizedBox(width: 4),
                Text(
                  '爆款推荐・一站买全',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),

          // 横向滚动列表
          SizedBox(
            height: 150,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              scrollDirection: Axis.horizontal,
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (context, index) {
                final item = items[index];
                return SizedBox(
                  width: 100,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // 商品图片
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          width: 100,
                          height: 95,
                          color: const Color(0xFFF6F7F9),
                          child: CachedNetworkImage(
                            imageUrl: item.imageUrl,
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      // 标题
                      Text(
                        item.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 11, color: AppColors.textPrimary),
                      ),
                      const SizedBox(height: 2),
                      // 现价与原价富文本
                      Row(
                        children: [
                          Text(
                            '¥${item.price}',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: AppColors.price,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '¥${item.originalPrice}',
                            style: const TextStyle(
                              fontSize: 9,
                              color: Colors.grey,
                              decoration: TextDecoration.lineThrough,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
```

---

## 5. 首页楼层化架构集成

在电商架构中，避免单个页面的 `build` 方法臃肿不堪的核心设计原则就是：**楼层化（Floor-based Architecture）**。每个独立的业务区块包装为独立的无状态或有状态组件，首页只需像积木一样拼接：

```dart
// 在 HomePage 的 ListView children 中装配：
ListView(
  padding: EdgeInsets.zero,
  children: [
    // 楼层 1: Banner 轮播图
    HomeBanner(banners: snapshot.data!),

    // 楼层 2: 金刚区 10 格分类导航 (AI辅助生成)
    CategoryGrid(categories: CategoryItemModel.getMockCategories()),

    // 楼层 3: 限时特惠秒杀专区 (左大右小不规则布局)
    const SpecialOfferSection(),

    // 楼层 4: 爆款推荐横向滑块
    HotGoodsSlider(items: mockHotGoodsList),

    // 楼层 5: 瀑布流推荐商品流（下一章详细实现）
  ],
)
```

---

## 6. 本章小结

在这一章中，我们：
1. 掌握了运用 Trae / AI 辅助编写 Flutter 组件的高效提示词工程技巧；
2. 构建了电商必备的“金刚区” 10 格分类网格，并深入理解了内嵌网格的核心配置 `shrinkWrap: true` 与 `NeverScrollableScrollPhysics`；
3. 开发了带动态倒计时的“特惠推荐专区”，掌握了复合 `Row` + `Column` + `Expanded` 的不对称排版；
4. 封装了“爆款推荐”横向商品滑块，并实践了商业级首页的楼层化设计理念。

在接下来的 **[推荐商品流下拉刷新与上拉加载 (P91-P93)](./pull-refresh-infinite-scroll.md)** 中，我们将攻克电商核心难点：商品双列瀑布流、触底自动分页加载更多与全局轻提示组件封装！
