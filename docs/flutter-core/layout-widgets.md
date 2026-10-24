# 界面排版与基础布局组件 (P51-P59)

在 Flutter 中，构建一个美观、自适应不同屏幕尺寸的 App，核心在于熟练掌握布局体系。Flutter 没有 HTML/CSS 中复杂的浮动与定位盒模型，而是通过一套直观、声明式的**布局 Widget 组合**来实现从微观内边距到宏观网格层叠的排版。

本章将系统剖析 Flutter 布局体系的六大核心支柱：
1. **Container 万能容器**（边框、圆角、渐变、阴影、尺寸限制）
2. **Center、Align 与 Padding**（对齐基准与内外边距控制）
3. **Column 与 Row 线性布局**（主轴与交叉轴对齐策略、溢出分析）
4. **Flex、Expanded 与 Flexible 弹性布局**（按比例均分、自适应拉伸）
5. **Wrap 与 Chip 流式折行布局**（标签栏、SKU 规格选择）
6. **Stack 与 Positioned 层叠定位**（角标、浮动覆盖图层）

---

## 1. Container 万能容器组件 (P51-P52)

`Container` 是 Flutter 中最常用也最强大的“瑞士军刀”级组件。它组合了大小设置（SizedBox）、内边距（Padding）、外边距（Margin）、对齐方式（Align）以及背景装饰（DecoratedBox）。

### 1.1 Container 核心属性表

| 属性 | 类型 | 功能说明 |
| :--- | :--- | :--- |
| `width`, `height` | `double` | 容器的物理宽与高（逻辑像素点） |
| `margin` | `EdgeInsetsGeometry` | 容器外部与其他组件之间的外边距 |
| `padding` | `EdgeInsetsGeometry` | 容器边框与内部 `child` 之间的内边距 |
| `alignment` | `AlignmentGeometry` | 内部 `child` 在容器内的对齐位置 |
| `decoration` | `Decoration` | 样式装饰器（背景色、边框、圆角、阴影、渐变、背景图） |
| `transform` | `Matrix4` | 几何变换矩阵（旋转、缩放、平移、倾斜） |
| `constraints` | `BoxConstraints` | 附加的额外宽高约束范围（如 minWidth, maxHeight） |

### 1.2 ⚠️ 核心语法陷阱：`color` 与 `decoration` 冲突

```dart
// ❌ 错误反模式：将抛出运行时致命异常！
Container(
  color: Colors.blue,
  decoration: BoxDecoration(borderRadius: BorderRadius.circular(8)),
)
```
> **崩溃原因**：`Container` 源码中明确检查了断言 `assert(color == null || decoration == null)`。如果设置了 `decoration`，背景色必须声明在 `BoxDecoration(color: ...)` 内部，**严禁两者同时声明**！

### 1.3 企业级卡片容器综合示例

```dart
Widget buildVipCard() {
  return Container(
    width: double.infinity, // 宽度撑满父容器
    height: 180,
    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
    padding: const EdgeInsets.all(20),
    alignment: Alignment.topLeft,
    decoration: BoxDecoration(
      // 1. 渐变背景色
      gradient: const LinearGradient(
        colors: [Color(0xFF2C3E50), Color(0xFF000000)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      // 2. 圆角半径
      borderRadius: BorderRadius.circular(16),
      // 3. 多重立体阴影 (BoxShadow)
      boxShadow: [
        BoxShadow(
          color: Colors.black.withOpacity(0.3),
          offset: const Offset(0, 8),
          blurRadius: 16,
          spreadRadius: 1,
        ),
      ],
      // 4. 金色细边框
      border: Border.all(
        color: const Color(0xFFFFD700).withOpacity(0.6),
        width: 1.2,
      ),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: const [
            Text('BLACK VIP CARD', style: TextStyle(color: Color(0xFFFFD700), fontWeight: FontWeight.bold, letterSpacing: 2)),
            Icon(Icons.contactless, color: Colors.white70),
          ],
        ),
        const Text(
          '**** **** **** 8899',
          style: TextStyle(color: Colors.white, fontSize: 22, letterSpacing: 4, fontFamily: 'monospace'),
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: const [
            Text('HOLDER: LI SI', style: TextStyle(color: Colors.white70, fontSize: 12)),
            Text('EXP: 12/28', style: TextStyle(color: Colors.white70, fontSize: 12)),
          ],
        ),
      ],
    ),
  );
}
```

<FlutterPhonePreview 
  type="container" 
  title="Container 动态圆角与内边距修饰效果" 
  appBarTitle="Container 容器样式调试" 
/>

---

## 2. 对齐与内边距：Center, Align 与 Padding (P53)

### 2.1 Center 组件
`Center` 本质上就是预设了居中对齐的 `Align`：
```dart
const Center(child: Text('居中文本'))
// 等价于
const Align(alignment: Alignment.center, child: Text('居中文本'))
```

### 2.2 Align 组件与相对坐标系

`Align` 根据指定的 `alignment` 坐标确定子组件在父容器内的相对摆放位置。

#### Alignment 坐标系示意图：
```
(-1.0, -1.0)           (0.0, -1.0)           (1.0, -1.0)
topLeft ────────────── topCenter ──────────── topRight
   │                        │                     │
   │                        │                     │
(-1.0, 0.0)            (0.0, 0.0)            (1.0, 0.0)
centerLeft ───────────── center ───────────── centerRight
   │                        │                     │
   │                        │                     │
(-1.0, 1.0)            (0.0, 1.0)            (1.0, 1.0)
bottomLeft ─────────── bottomCenter ───────── bottomRight
```

#### 尺寸系数 `widthFactor` 与 `heightFactor`
如果指定了 `widthFactor: 2.0`，则 `Align` 自身的宽度将严格等于子组件宽度的 2 倍，常用于快速按倍数确定外围尺寸。

```dart
Align(
  alignment: const Alignment(0.6, -0.8), // 支持自定义任意精确小数坐标
  child: Container(width: 50, height: 50, color: Colors.red),
)
```

### 2.3 Padding 内边距四大构造函数

```dart
// 1. 四周相同边距
const EdgeInsets.all(16.0)

// 2. 对称边距（常用：水平横向 + 垂直纵向）
const EdgeInsets.symmetric(horizontal: 20.0, vertical: 10.0)

// 3. 仅设置指定的方向（未填的方向为 0）
const EdgeInsets.only(left: 12.0, top: 8.0)

// 4. 显式按 左、上、右、下 顺序传参 (LTRB: Left, Top, Right, Bottom)
const EdgeInsets.fromLTRB(10.0, 20.0, 30.0, 40.0)
```

---

## 3. 线性布局：Column 与 Row 核心详解 (P54-P55)

`Row`（水平横向排列）与 `Column`（垂直纵向排列）是界面中最核心的线性排版工具。

```
          Row (水平线性布局)                         Column (垂直线性布局)
    ┌───────────────────────────┐ 主轴 (X)         ┌───────────┐ 
    │ [Item 1] [Item 2] [Item 3]│ ───────►         │ [Item 1]  │ │ 主轴 (Y)
    └───────────────────────────┘                  ├───────────┤ │
                  │                                │ [Item 2]  │ │
                  ▼ 交叉轴 (Y)                     ├───────────┤ ▼
                                                   │ [Item 3]  │
                                                   └───────────┘
                                                         │
                                                         ▼ 交叉轴 (X)
```

### 3.1 主轴对齐：`MainAxisAlignment` 六大取值

| 对齐枚举 | 布局表现说明 | 图示示意 |
| :--- | :--- | :--- |
| `start` | 子项从主轴起点紧挨排列 | `[A][B][C]                   ` |
| `center` | 子项在主轴居中排列 | `          [A][B][C]         ` |
| `end` | 子项在主轴末尾靠齐排列 | `                   [A][B][C]` |
| `spaceBetween` | **首尾贴边**，剩余空白区域在各子项之间均匀平分 | `[A]         [B]         [C]` |
| `spaceAround` | 各子项两侧留出均等空白（首尾两端的空隙为中间空隙的**一半**） | `  [A]     [B]     [C]  ` |
| `spaceEvenly` | **完全均分**，首尾两端与各子项之间的间距完全相等 | `   [A]   [B]   [C]   ` |

### 3.2 交叉轴对齐：`CrossAxisAlignment` 关键枚举

| 对齐枚举 | 作用效果 |
| :--- | :--- |
| `start` | 交叉轴起点贴齐（如 Row 中子项顶部对齐；Column 中子项左侧对齐） |
| `center` | 交叉轴居中对齐（默认行为） |
| `end` | 交叉轴末尾贴齐 |
| `stretch` | **极其常用**：拉伸子项使其填满交叉轴的最大可用空间 |
| `baseline` | 基于文字排版基线对齐（必须与 `textBaseline: TextBaseline.alphabetic` 配套使用） |

### 3.3 主轴尺寸策略：`MainAxisSize`
- `MainAxisSize.max`（默认）：尽可能占满父容器主轴的所有可用空间。
- `MainAxisSize.min`：包裹内容（Wrap Content），主轴尺寸仅等于所有子项累加的总尺寸。

### 3.4 ⚠️ 布局溢出黄黑斑马线报错分析

在移动端经常会遇到由于文字过长或图片过宽导致的“黄黑相间斑马线”屏幕警报：

```text
A RenderFlex overflowed by 48.0 pixels on the right.
The relevant error-causing widget was: Row ...
```

**根因**：`Row` 或 `Column` 默认对其内部的固定尺寸子项不做裁剪与换行，当子项总宽度超过屏幕可用边界时即发生物理溢出。  
**解法**：使用接下来介绍的 **`Expanded` / `Flexible`** 包裹溢出组件，或者使用 **`Wrap`** 进行自动折行。

---

## 4. 弹性布局：Flex, Expanded 与 Flexible (P56-P57)

### 4.1 核心三者的继承体系与差异

- `Flex` 是 `Row` 和 `Column` 的基类（`Row` 等价于 `Flex(direction: Axis.horizontal)`）。
- `Expanded` 与 `Flexible` 必须且只能作为 `Row`、`Column` 或 `Flex` 的**直接子级**使用！

| 区别项 | Expanded | Flexible |
| :--- | :--- | :--- |
| **约束类型 (fit)** | 强约束：`FlexFit.tight`（强制撑满） | 默认松约束：`FlexFit.loose`（可按需收缩） |
| **尺寸表现** | **必定拉伸**撑满分配给它的全部剩余权重空间 | 子组件多大就占多大，**最大不超过**所分配的权重上限 |
| **底层源码关系** | `class Expanded extends Flexible { const Expanded({ ... }) : super(fit: FlexFit.tight); }` | 基础实现类 |

### 4.2 弹性权重 `flex` 比例分配实战

```dart
Widget buildRatioBar() {
  return Row(
    children: [
      // 占比 1 份 (20%)
      Expanded(
        flex: 1,
        child: Container(
          height: 48,
          color: Colors.redAccent,
          alignment: Alignment.center,
          child: const Text('1份 (20%)', style: TextStyle(color: Colors.white)),
        ),
      ),
      // 占比 2 份 (40%)
      Expanded(
        flex: 2,
        child: Container(
          height: 48,
          color: Colors.blueAccent,
          alignment: Alignment.center,
          child: const Text('2份 (40%)', style: TextStyle(color: Colors.white)),
        ),
      ),
      // 占比 2 份 (40%)
      Expanded(
        flex: 2,
        child: Container(
          height: 48,
          color: Colors.green,
          alignment: Alignment.center,
          child: const Text('2份 (40%)', style: TextStyle(color: Colors.white)),
        ),
      ),
    ],
  );
}
```

### 4.3 经典实战场景：自适应防溢出商品搜索栏

```dart
Widget buildSearchBar() {
  return Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
    child: Row(
      children: [
        const Icon(Icons.arrow_back_ios, size: 20),
        const SizedBox(width: 8),
        // 用 Expanded 吸收屏幕中间所有剩余宽度，防止不同机型屏幕产生溢出
        Expanded(
          child: Container(
            height: 38,
            decoration: BoxDecoration(
              color: Colors.grey.shade200,
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Row(
              children: [
                SizedBox(width: 12),
                Icon(Icons.search, color: Colors.grey),
                SizedBox(width: 6),
                Expanded(
                  child: Text(
                    '搜索你心仪的数码好物...',
                    style: TextStyle(color: Colors.grey, fontSize: 13),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 12),
        ElevatedButton(
          onPressed: () {},
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.blueAccent,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          ),
          child: const Text('搜索'),
        ),
      ],
    ),
  );
}
```

<FlutterPhonePreview 
  type="flex" 
  title="Row / Column / Expanded 弹性对齐可视化预览" 
  appBarTitle="Flex 布局可视化" 
/>

---

## 5. 流式布局：Wrap 与 Chip 标签折行实战 (P58)

在电商搜索历史记录、热门标签、商品尺寸颜色选择场景下，标签长度往往参差不齐。使用 `Row` 会因为固定无法换行而直接抛出溢出错误，此时的最佳选择就是 **`Wrap`**。

### 5.1 Wrap 关键属性解析

| 属性 | 说明 |
| :--- | :--- |
| `direction` | 主轴排布方向，默认为 `Axis.horizontal` 水平流式 |
| `spacing` | **主轴方向上**相邻两个子组件之间的物理间距 |
| `runSpacing` | **交叉轴方向上**相邻两条折行之间的物理行间距 |
| `alignment` | 主轴上的对齐方式（`WrapAlignment.start`, `center`, `spaceBetween` 等） |
| `runAlignment` | 交叉轴各行之间的整体对齐方式 |

### 5.2 热门搜索历史与 Chip 实战案例

```dart
class SearchHistoryDemo extends StatefulWidget {
  const SearchHistoryDemo({super.key});

  @override
  State<SearchHistoryDemo> createState() => _SearchHistoryDemoState();
}

class _SearchHistoryDemoState extends State<SearchHistoryDemo> {
  final List<String> _tags = [
    'iPhone 16 Pro Max',
    '华为 Mate 60',
    '机械键盘',
    '4K 显示器',
    '降噪耳机',
    'Flutter 跨平台开发从入门到实战',
    'iPad mini',
    '运动手环',
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('历史搜索记录', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              IconButton(
                icon: const Icon(Icons.delete_outline, size: 20, color: Colors.grey),
                onPressed: () => setState(() => _tags.clear()),
              ),
            ],
          ),
          const SizedBox(height: 8),
          // Wrap 自动根据屏幕物理宽度进行多行折行
          Wrap(
            spacing: 10.0,    // 标签之间的左右横向间距
            runSpacing: 8.0,   // 折行之后的上下行间距
            alignment: WrapAlignment.start,
            children: _tags.map((tag) {
              return ActionChip(
                label: Text(tag),
                labelStyle: const TextStyle(fontSize: 13, color: Colors.black87),
                backgroundColor: Colors.grey.shade100,
                side: BorderSide.none,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('检索关键词: $tag')));
                },
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}
```

---

## 6. 层叠定位布局：Stack 与 Positioned (P59)

当需要将组件以“图层（Layers）”的形式相互重叠覆盖时（例如：在商品图片右上角贴上“热卖折扣”红旗、头像右上角的未读消息红点角标、悬浮控制按钮），必须使用 **`Stack` 与 `Positioned`**。

### 6.1 渲染层级规则
在 `Stack` 的 `children` 数组中：
- **排在前面的子组件先绘制，位于底层**。
- **排在后面的子组件后绘制，覆盖在顶层**。

### 6.2 Stack 与 Positioned 核心属性

- `Stack.alignment`：对于非绝对定位（未被 Positioned 包裹）的普通子组件，默认采用的整体对齐锚点。
- `Stack.clipBehavior`：当子组件超出 Stack 范围时的裁剪策略：
  - `Clip.hardEdge`：硬边裁剪，隐藏超出部分。
  - `Clip.none`：允许子组件溢出展示（常用于头像外部挂载立体徽章）。
- `Positioned` 绝对定位属性：
  - `top`, `bottom`, `left`, `right`：距离容器对应边缘的绝对距离（逻辑像素）。
  - `width`, `height`：显式指定定位块的宽高。

### 6.3 综合实战：商品卡片立体制品角标与未读头像

```dart
Widget buildBadgedProductCard() {
  return Center(
    child: SizedBox(
      width: 220,
      height: 260,
      child: Stack(
        clipBehavior: Clip.none, // 允许角标适度溢出卡片边缘
        children: [
          // 1. 底层：卡片主体容器
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 10, offset: const Offset(0, 4)),
                ],
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Icon(Icons.laptop_mac, size: 80, color: Colors.blueGrey),
                  SizedBox(height: 12),
                  Text('MacBook Pro M3', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  SizedBox(height: 4),
                  Text('¥12,999', style: TextStyle(color: Colors.deepOrange, fontSize: 18, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ),
          
          // 2. 顶层绝对定位：左上角促销 Badge
          Positioned(
            top: 0,
            left: 0,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: const BoxDecoration(
                color: Colors.redAccent,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(16),
                  bottomRight: Radius.circular(12),
                ),
              ),
              child: const Text('立减 1000', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
            ),
          ),

          // 3. 顶层绝对定位：右上角收藏按钮
          Positioned(
            top: 8,
            right: 8,
            child: CircleAvatar(
              radius: 16,
              backgroundColor: Colors.grey.shade100,
              child: const Icon(Icons.favorite, color: Colors.redAccent, size: 18),
            ),
          ),
        ],
      ),
    ),
  );
}
```

<FlutterPhonePreview 
  type="wrap-stack" 
  title="Wrap 自动折行标签与 Stack 绝对层叠效果" 
  appBarTitle="Wrap & Stack 视图" 
/>

---

## 7. 布局组件选型决策树

在面对实际设计稿时，遵循以下决策心智：

```
需要构建界面元素？
 ├── 属于背景修饰、圆角、阴影、固定内外间距？ ──> 【Container】
 ├── 水平横向排列？ ──> 【Row】 (溢出风险? 搭配 Expanded / Flexible)
 ├── 垂直纵向排列？ ──> 【Column】 (溢出风险? 搭配 Expanded / Flexible)
 ├── 标签/按钮多项流式折行排版？ ──> 【Wrap + Chip】
 ├── 多图层相互叠加、角落绝对挂载小红点/角标？ ──> 【Stack + Positioned】
 └── 仅需设置四周留白间距？ ──> 优先选择轻量的 【Padding】 (避免过度滥用 Container)
```

---

## 8. 总结

本章系统掌握了 Flutter 布局系统的核心组件群：
1. **Container** 提供了极致的样式封装，但需切记 `color` 与 `decoration` 互斥规则。
2. **Column 与 Row** 的核心在于理解主轴与交叉轴的对齐规则，以及使用 `Expanded` 规避屏幕尺寸溢出。
3. **Wrap** 解决了流式折行标签的自适应痛点。
4. **Stack 与 Positioned** 为复杂的多层叠放提供了强大的绝对定位支持。

在下一章中，我们将进入 **常用 UI 控件与滚动视图组件（Text、Image、TextField、ListView、GridView、Slivers、PageView）** 的深入实战。
