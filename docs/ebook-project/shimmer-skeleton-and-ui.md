# 6. 微光流动骨架屏体系与高质感组件库

> 💡 **本篇导读**：一个专业商业级 App 与粗糙初级 Demo 的最大区别，往往体现在**数据尚未到达时的过渡体验**。本篇将详细剖析如何使用 `shimmer` 打造一套高度贴合真实业务界面的流动微光骨架屏体系，并引入毛玻璃高斯模糊、星级评分条与智能文本折叠等高质感组件库，让界面的工业级质感直线飙升。

---

## 1. 为什么顶级应用全量采用微光骨架屏？

### 1.1 认知心理学与“感知性能” (Perceived Performance)
当用户点击页面并在白屏中看到一个孤立的转圈菊花（`CircularProgressIndicator`）时，用户的注意力被聚焦在“我在等待”这件事情上，心理等待时间会被放大 1.5 到 2 倍。

而**微光流动骨架屏（Shimmer Skeletons）**利用与真实界面排版 1:1 等宽等高的微光色块进行占位：
1. **提前建立视觉预期**：用户在第一瞬间就能看清页面由“顶部横幅 + 左图右文书籍卡片 + 底部操作栏”组成；
2. **微光流动平抚等待情绪**：流动的光效让界面呈现出“系统正在极速充填数据”的生命感，显著提升感知流畅度。

---

## 2. 微光骨架屏基础封装 (`lib/widgets/skeleton/base_skeleton.dart`)

在 `pubspec.yaml` 中引入核心依赖：
```yaml
dependencies:
  shimmer: ^3.0.0
```

为了让微光骨架屏在**浅色模式与深色夜间模式**下均能呈现自然的微光，我们需要根据 `Theme.of(context).brightness` 进行自适应底色配置：

```dart
import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

class BaseSkeleton extends StatelessWidget {
  final Widget child;

  const BaseSkeleton({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // 自适应明暗主题的底色与流动高亮色
    final baseColor = isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0);
    final highlightColor = isDark ? const Color(0xFF334155) : const Color(0xFFF8FAFC);

    return Shimmer.fromColors(
      baseColor: baseColor,
      highlightColor: highlightColor,
      period: const Duration(milliseconds: 1500), // 流动呼吸周期
      child: child,
    );
  }
}
```

---

## 3. 图书卡片微光骨架屏实战 (`lib/widgets/skeleton/book_card_skeleton.dart`)

我们针对图文排版的卡片，构建 1:1 的骨架占位：

```dart
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'base_skeleton.dart';

class BookCardSkeleton extends StatelessWidget {
  const BookCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return BaseSkeleton(
      child: Container(
        margin: EdgeInsets.symmetric(horizontal: 16.w, vertical: 8.h),
        padding: EdgeInsets.all(12.r),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12.r),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 封面占位方块
            Container(
              width: 76.w,
              height: 104.h,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8.r),
              ),
            ),
            SizedBox(width: 14.w),
            // 右侧文本排版占位
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(height: 4.h),
                  // 书名骨架条
                  Container(
                    width: 160.w,
                    height: 18.h,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(4.r),
                    ),
                  ),
                  SizedBox(height: 10.h),
                  // 作者信息骨架条
                  Container(
                    width: 110.w,
                    height: 14.h,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(4.r),
                    ),
                  ),
                  SizedBox(height: 12.h),
                  // 评分与标签骨架条
                  Row(
                    children: [
                      Container(
                        width: 70.w,
                        height: 14.h,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(4.r),
                        ),
                      ),
                      const Spacer(),
                      // 价格/按钮占位
                      Container(
                        width: 50.w,
                        height: 22.h,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12.r),
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

## 4. 高质感 UI 组件库全套集成

除了骨架屏，电子书城还引入了提升界面高级感的三大神器：

### 4.1 毛玻璃高斯模糊容器：`blurrycontainer`
在图书详情页中，将图书封面放大作为底层背景，并叠加毛玻璃模糊，能产生极具文艺气息的沉浸感：

```yaml
dependencies:
  blurrycontainer: ^2.1.0
```

```dart
import 'package:blurrycontainer/blurrycontainer.dart';

Stack(
  children: [
    // 1. 底层大图
    Image.network(book.coverUrl, fit: BoxFit.cover, width: double.infinity, height: 260.h),
    // 2. 毛玻璃高斯模糊遮罩
    BlurryContainer(
      blur: 25,
      elevation: 0,
      color: Colors.black.withOpacity(0.35),
      padding: EdgeInsets.all(16.r),
      child: BookHeaderInfoWidget(book: book),
    ),
  ],
)
```

### 4.2 精准星级评分条：`flutter_rating_bar`
在展示豆瓣 8.9、9.2 分数时，精准显示 4 星半、半星点缀：

```yaml
dependencies:
  flutter_rating_bar: ^4.0.1
```

```dart
import 'package:flutter_rating_bar/flutter_rating_bar.dart';

RatingBarIndicator(
  rating: book.rating / 2, // 豆瓣 10 分制转换为 5 星制
  itemBuilder: (context, index) => const Icon(
    Icons.star_rounded,
    color: Color(0xFFFFB800),
  ),
  itemCount: 5,
  itemSize: 16.r,
  direction: Axis.horizontal,
)
```

### 4.3 智能图书简介展开收起：`readmore`
图书简介通常长达数百字，硬展示会霸占整屏，`readmore` 提供了极致平滑的展开动效：

```yaml
dependencies:
  readmore: ^3.0.0
```

```dart
import 'package:readmore/readmore.dart';

ReadMoreText(
  book.intro,
  trimMode: TrimMode.Line,
  trimLines: 4, // 默认收起至 4 行
  colorClickableText: const Color(0xFF02569B),
  trimCollapsedText: ' 展开全文 ▼',
  trimExpandedText: ' 收起 ▲',
  style: TextStyle(fontSize: 14.sp, height: 1.6, color: Colors.grey[800]),
)
```

---

## 5. 在线微光骨架屏交互演示

在下方模拟器中，你可以点击切换【微光骨架屏】动效开关，亲身体验骨架屏与真实界面的无缝切换效果：

<FlutterPhonePreview 
  type="ebook" 
  title="微光流动骨架屏与组件库效果模拟" 
  appBarTitle="骨架屏过渡演示" 
/>
