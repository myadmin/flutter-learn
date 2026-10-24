# 7. 图书详情页全景与阅读器沉浸式体验

> 💡 **本篇导读**：图书详情大页与内容阅读器是整个电子书城 APP 的“终极交互战场”。这里高度融合了高斯模糊沉浸式 AppBar、豆瓣多维评分卡片、多行书评瀑布流，以及支持背景调色、字体缩放、加入书架的沉浸式电子书阅读器。本篇将带领大家完成电子书城项目的最后一公里，为整个进阶实战画上圆满句号！

---

## 1. 图书详情页架构设计：Sliver 滚动体系

为了实现**顶部大图封面跟随手指向上滚动时平滑折叠为标准导航条**的效果，我们必须使用 Flutter 强大的 `CustomScrollView` + `SliverAppBar` 体系：

```
CustomScrollView
├── SliverAppBar (expandedHeight: 300, 封面毛玻璃背景 + 折叠导航)
├── SliverToBoxAdapter (图书核心元数据、价格与立即试读/加入书架 CTA 按钮)
├── SliverToBoxAdapter (豆瓣评分统计卡片与评星占比)
├── SliverToBoxAdapter (图书作者生平与长文本作品简介)
├── SliverToBoxAdapter (精彩书评精选标题与筛选器)
└── SliverList (读者短评流式卡片列表)
```

---

## 2. 沉浸式 SliverAppBar 与高斯模糊折叠

```dart
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:blurrycontainer/blurrycontainer.dart';
import '../../models/book_item_model.dart';

class BookDetailSliverHeader extends StatelessWidget {
  final BookItemModel book;

  const BookDetailSliverHeader({super.key, required this.book});

  @override
  Widget build(BuildContext context) {
    return SliverAppBar(
      expandedHeight: 320.h,
      pinned: true, // 折叠后固定在顶部
      elevation: 0,
      leading: IconButton(
        icon: Container(
          padding: EdgeInsets.all(6.r),
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.3),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 18),
        ),
        onPressed: () => Navigator.of(context).pop(),
      ),
      actions: [
        IconButton(
          icon: Container(
            padding: EdgeInsets.all(6.r),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.3),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.share, color: Colors.white, size: 18),
          ),
          onPressed: () {},
        ),
      ],
      flexibleSpace: FlexibleSpaceBar(
        centerTitle: true,
        title: Text(
          book.title,
          style: TextStyle(
            color: Colors.white,
            fontSize: 16.sp,
            fontWeight: FontWeight.bold,
          ),
        ),
        background: Stack(
          fit: StackFit.expand,
          children: [
            // 1. 底层大封面虚化背景
            Image.network(book.coverUrl, fit: BoxFit.cover),
            // 2. 毛玻璃高斯模糊滤镜
            BlurryContainer(
              blur: 30,
              elevation: 0,
              color: Colors.black.withOpacity(0.45),
              child: const SizedBox.expand(),
            ),
            // 3. 居中真实立体的图书封面与评分展示
            Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(height: 30.h),
                  Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(8.r),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.35),
                          blurRadius: 18.r,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(8.r),
                      child: Image.network(book.coverUrl, width: 110.w, height: 160.h, fit: BoxFit.cover),
                    ),
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

## 3. 豆瓣评分卡片与购买 CTA 栏

在图书详情中，设计强烈的行动号召（Call To Action）底部悬浮条：

```dart
Widget _buildBottomActionBar(BuildContext context, BookItemModel book) {
  return Container(
    padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
    decoration: BoxDecoration(
      color: Theme.of(context).cardColor,
      boxShadow: [
        BoxShadow(
          color: Colors.black.withOpacity(0.06),
          blurRadius: 12.r,
          offset: const Offset(0, -4),
        ),
      ],
    ),
    child: SafeArea(
      child: Row(
        children: [
          // 加入书架按钮
          OutlinedButton.icon(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('已成功将《${book.title}》加入书架！')),
              );
            },
            icon: const Icon(Icons.bookmark_add_outlined),
            label: const Text('加入书架'),
            style: OutlinedButton.styleFrom(
              padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
            ),
          ),
          SizedBox(width: 12.w),
          // 立即试读/免费畅读按钮
          Expanded(
            child: ElevatedButton(
              onPressed: () {
                // 打开轻量沉浸式阅读器
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => ReaderScreen(book: book)),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF02569B),
                foregroundColor: Colors.white,
                padding: EdgeInsets.symmetric(vertical: 13.h),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24.r)),
              ),
              child: Text('立即开始阅读', style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    ),
  );
}
```

---

## 4. 沉浸式阅读器设计 (`ReaderScreen`)

阅读器需要为读者提供最舒适的阅读体验，支持**羊皮纸护眼色切换、字体字号无级调节与沉浸式全屏**：

```dart
class ReaderScreen extends StatefulWidget {
  final BookItemModel book;
  const ReaderScreen({super.key, required this.book});

  @override
  State<ReaderScreen> createState() => _ReaderScreenState();
}

class _ReaderScreenState extends State<ReaderScreen> {
  double _fontSize = 17.0;
  // 阅读背景预设：0 羊皮纸纸质护眼, 1 纯白天光, 2 纯黑暗夜
  int _bgThemeIndex = 0;

  final List<Color> _bgColors = const [
    Color(0xFFF6F1E7), // 经典羊皮纸护眼米黄
    Color(0xFFFFFFFF), // 纯白天光
    Color(0xFF181818), // 暗夜墨黑
  ];

  final List<Color> _textColors = const [
    Color(0xFF2C2416),
    Color(0xFF222222),
    Color(0xFFCCCCCC),
  ];

  @override
  Widget build(BuildContext context) {
    final bgColor = _bgColors[_bgThemeIndex];
    final textColor = _textColors[_bgThemeIndex];

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: textColor,
        title: Text(widget.book.title, style: TextStyle(fontSize: 16.sp)),
        actions: [
          // 字体缩放控制
          IconButton(
            icon: const Icon(Icons.format_size),
            onPressed: () {
              setState(() {
                _fontSize = _fontSize >= 22.0 ? 15.0 : _fontSize + 2.0;
              });
            },
          ),
          // 护眼色切换
          IconButton(
            icon: const Icon(Icons.palette_outlined),
            onPressed: () {
              setState(() {
                _bgThemeIndex = (_bgThemeIndex + 1) % _bgColors.length;
              });
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 12.h),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '第一章：起风了',
              style: TextStyle(
                fontSize: (_fontSize + 6).sp,
                fontWeight: FontWeight.bold,
                color: textColor,
              ),
            ),
            SizedBox(height: 16.h),
            Text(
              '“许多年之后，面对行刑队，奥雷良诺·布恩迪亚上校将会回想起父亲带他去见识冰块的那个遥远的下午……”\n\n'
              '日光照在旧书页的纹理上，微风吹拂窗帘。在 Flutter 的多平台渲染流水线中，Skia 与 Impeller 引擎正在以每秒 60 帧至 120 帧的速度平滑绘制着每一个排版字形。'
              '无论是跨端移植到 Android、iOS 还是 HarmonyOS NEXT，文本的抗锯齿与排版换行均保持着惊人的一致性。',
              style: TextStyle(
                fontSize: _fontSize.sp,
                height: 1.8,
                color: textColor,
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

## 5. 项目综合在线交互演示

在下方模拟器中，你可以直接点击【加入书架】或切换主题，查看完整的书城沉浸体验：

<FlutterPhonePreview 
  type="ebook" 
  title="电子书城大合集与阅读器沉浸效果模拟" 
  appBarTitle="电子书城完整体验" 
/>

---

## 6. 全篇完结回顾

恭喜你！到这里，你已经成功解锁了**两大企业级跨平台 Flutter 实战项目**的全部核心知识图谱：

1. **从 0 到 1 的 Dart 强类型语言素养**：掌握空安全、泛型、异步 Future/Stream 与 Mixin 混入架构；
2. **Flutter 核心排版与响应式框架**：熟练运用 Widget 树生命周期、Key 状态复用、动画驱动与网络交互；
3. **实战一：仿网易严选电商项目**：基于 **GetX** 响应式框架打通 RESTful 接口、状态持久化、无限分页与登录鉴权；
4. **实战二：豆瓣电子书城 APP**：基于 **Provider MVVM** 架构攻关 **HTML DOM 逆向爬虫、微光骨架屏体系、明暗双主题自适应与屏幕多端适配**；
5. **多端落地交付**：横跨 Android APK 签名、iOS Xcode 部署与 HarmonyOS NEXT 鸿蒙侧跨端移植！

愿你带着这套完整的技术弹药库，在跨平台移动应用开发的大道上一路向前、行稳致远！
