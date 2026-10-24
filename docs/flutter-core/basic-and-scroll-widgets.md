# 常用UI控件与滚动视图组件 (P60-P67)

在掌握了排版布局模型后，我们需要使用丰富的 UI 基础控件填充界面骨架，并处理各种长内容与动态滚动场景。本章将系统学习 Flutter 最核心的交互与展示组件：
- **Text & TextStyle 富文本排版**（截断、行高、TextSpan 复合链接）
- **Image 图片展示与资产管理**（本地资产、网络图片缓存与圆形/圆角裁剪）
- **TextField 文本输入与控制器**（表单输入、密码显隐切换、焦点收起）
- **SingleChildScrollView**（轻量级滚动、iOS/Android 滚动物理回弹）
- **ListView 与 ListView.builder**（虚拟化长列表与下拉刷新）
- **GridView 与 GridView.builder**（多列九宫格网格布局）
- **CustomScrollView 与 Slivers**（吸顶 AppBar、折叠视差特效）
- **PageView 与 PageController**（全屏轮播与分页滑动）

---

## 1. Text 与 TextStyle 富文本排版 (P60)

### 1.1 Text 核心排版属性

```dart
Text(
  'Flutter 是 Google 开发的跨平台开源 UI 工具包，助你构建全平台高质量应用。',
  textAlign: TextAlign.start,       // 对齐方式：start, center, end, justify
  maxLines: 2,                     // 最大限制行数
  overflow: TextOverflow.ellipsis, // 超出省略号截断（clip 裁剪, fade 渐隐）
  textScaler: const TextScaler.linear(1.0), // 字体缩放比例（适配系统大字号）
  style: TextStyle(
    fontSize: 16.0,                // 字体大小（逻辑像素）
    fontWeight: FontWeight.w600,   // 字重：w100 ~ w900, bold, normal
    color: const Color(0xFF333333),// 文字色彩
    letterSpacing: 1.2,            // 字符间距
    height: 1.5,                   // 行高倍数（当前字体尺寸的 1.5 倍）
    decoration: TextDecoration.underline, // 下划线（lineThrough 删除线）
    decorationColor: Colors.blueAccent,
  ),
)
```

### 1.2 `Text.rich` 与 `TextSpan` 复合富文本实战

在登录注册页面，经常需要实现同一行内包含不同字号、颜色且带有点击事件的协议文案（如：“我已阅读并同意《用户服务协议》与《隐私政策》”）。使用 `Text.rich` 可以轻松实现这一诉求：

```dart
Widget buildAgreementText(BuildContext context) {
  return Text.rich(
    TextSpan(
      text: '登录即代表您已充分阅读并同意 ',
      style: const TextStyle(color: Colors.grey, fontSize: 13),
      children: [
        TextSpan(
          text: '《用户服务协议》',
          style: const TextStyle(
            color: Colors.blueAccent,
            fontWeight: FontWeight.bold,
            decoration: TextDecoration.underline,
          ),
          recognizer: TapGestureRecognizer()
            ..onTap = () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('跳转打开用户服务协议网页')),
              );
            },
        ),
        const TextSpan(text: ' 以及 '),
        TextSpan(
          text: '《隐私保护政策》',
          style: const TextStyle(
            color: Colors.blueAccent,
            fontWeight: FontWeight.bold,
            decoration: TextDecoration.underline,
          ),
          recognizer: TapGestureRecognizer()
            ..onTap = () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('跳转打开隐私保护政策网页')),
              );
            },
        ),
      ],
    ),
  );
}
```

---

## 2. Image 图片展示与资源管理 (P61-P62)

### 2.1 本地资产图片 `Image.asset` 规范与分辨率目录

#### 步骤 1：在工程根目录建立静态资源文件夹并支持多分辨率比率：
```text
my_shop/
└── assets/
    └── images/
        ├── banner.png       # 1.0x 标准图
        ├── 2.0x/            # 针对 2.0 像素密度屏（Retina / 高清屏）
        │   └── banner.png
        └── 3.0x/            # 针对 3.0 像素密度屏（超高清旗舰机）
            └── banner.png
```

#### 步骤 2：在 `pubspec.yaml` 中显式声明：
```yaml
flutter:
  assets:
    - assets/images/
```

#### 步骤 3：代码中直接按基准文件名加载：
```dart
Image.asset(
  'assets/images/banner.png',
  width: 300,
  height: 150,
  fit: BoxFit.cover,
)
```

### 2.2 网络图片 `Image.network` 缓存与缺省图处理

```dart
Image.network(
  'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600',
  width: 200,
  height: 120,
  fit: BoxFit.cover,
  // 1. 加载过程进度指示器
  loadingBuilder: (context, child, loadingProgress) {
    if (loadingProgress == null) return child; // 加载完成，显示真实图片
    return Container(
      width: 200,
      height: 120,
      color: Colors.grey.shade200,
      child: Center(
        child: CircularProgressIndicator(
          value: loadingProgress.expectedTotalBytes != null
              ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
              : null,
        ),
      ),
    );
  },
  // 2. 网络错误优雅兜底图
  errorBuilder: (context, error, stackTrace) {
    return Container(
      width: 200,
      height: 120,
      color: Colors.grey.shade300,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: const [
          Icon(Icons.broken_image, color: Colors.grey, size: 36),
          SizedBox(height: 4),
          Text('图片加载失败', style: TextStyle(color: Colors.grey, fontSize: 12)),
        ],
      ),
    );
  },
)
```

### 2.3 `BoxFit` 缩放模式核心对比

| 模式枚举 | 缩放裁剪规则 | 适用场景 |
| :--- | :--- | :--- |
| **`BoxFit.cover`** | 保持原比例，居中缩放并**填满目标容器，超出部分被均匀裁剪** | 轮播图、商品大图卡片、背景大图（最常用） |
| **`BoxFit.contain`** | 保持原比例，缩放到**完整显示在容器内，四周可能留白** | 相册大图查看器、合同预览 |
| **`BoxFit.fill`** | 强制拉伸填满宽高，**破坏原有宽高比（会导致画面变形失真）** | 必须精确对齐的特殊平铺纹理 |
| **`BoxFit.fitWidth`** | 保证宽度填满容器，高度按比例等比缩放 | 信息流长图文章列表 |
| **`BoxFit.fitHeight`** | 保证高度填满容器，宽度按比例等比缩放 | 水平横向滑动卡片集 |

### 2.4 圆形头像与圆角卡片实现的三种方案

```dart
// 方案 1：CircleAvatar 极简圆形头像
const CircleAvatar(
  radius: 36,
  backgroundImage: NetworkImage('https://example.com/avatar.jpg'),
)

// 方案 2：ClipRRect 任意矩形圆角裁剪
ClipRRect(
  borderRadius: BorderRadius.circular(16),
  child: Image.network('https://example.com/cover.jpg', width: 120, height: 80, fit: BoxFit.cover),
)

// 方案 3：BoxDecoration.image 配合阴影与边框
Container(
  width: 80,
  height: 80,
  decoration: BoxDecoration(
    shape: BoxShape.circle,
    border: Border.all(color: Colors.amber, width: 2),
    image: const DecorationImage(
      image: AssetImage('assets/images/avatar.png'),
      fit: BoxFit.cover,
    ),
  ),
)
```

---

## 3. TextField 文本输入框与控制器 (P63)

`TextField` 是接收用户文本输入的核心表单组件。

### 3.1 完整登录表单输入实战（含密码明暗文切换与清空功能）

```dart
class LoginFormWidget extends StatefulWidget {
  const LoginFormWidget({super.key});

  @override
  State<LoginFormWidget> createState() => _LoginFormWidgetState();
}

class _LoginFormWidgetState extends State<LoginFormWidget> {
  // 1. 实例化输入控制器
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  // 2. 焦点管理与密码可见性状态
  final FocusNode _pwdFocusNode = FocusNode();
  bool _obscurePassword = true;

  @override
  void dispose() {
    // 3. 必须在页面销毁时释放控制器与焦点，严防内存泄露！
    _usernameController.dispose();
    _passwordController.dispose();
    _pwdFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // 4. 外层包裹 GestureDetector，实现点击页面任意空白处自动收起软键盘
    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            // 账号输入框
            TextField(
              controller: _usernameController,
              keyboardType: TextInputType.phone, // 调起数字电话键盘
              textInputAction: TextInputAction.next, // 软键盘右下角显示“下一步”
              onSubmitted: (_) => FocusScope.of(context).requestFocus(_pwdFocusNode),
              decoration: InputDecoration(
                labelText: '手机号码 / 邮箱',
                hintText: '请输入注册时的手机号',
                prefixIcon: const Icon(Icons.person_outline),
                suffixIcon: _usernameController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () => setState(() => _usernameController.clear()),
                      )
                    : null,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onChanged: (text) => setState(() {}), // 刷新以显示/隐藏清空按钮
            ),
            const SizedBox(height: 16),
            
            // 密码输入框
            TextField(
              controller: _passwordController,
              focusNode: _pwdFocusNode,
              obscureText: _obscurePassword, // 隐藏为圆点密码
              textInputAction: TextInputAction.done,
              decoration: InputDecoration(
                labelText: '登录密码',
                hintText: '请输入 6-16 位密码',
                prefixIcon: const Icon(Icons.lock_outline),
                suffixIcon: IconButton(
                  icon: Icon(_obscurePassword ? Icons.visibility_off : Icons.visibility),
                  onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                ),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 24),

            // 登录提交按钮
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: () {
                  final username = _usernameController.text.trim();
                  final password = _passwordController.text;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('提交登录: 用户名=$username, 密码长度=${password.length}')),
                  );
                },
                style: ElevatedButton.styleFrom(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('立即登录', style: TextStyle(fontSize: 16)),
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

## 4. SingleChildScrollView 简单滚动容器 (P64)

当页面内容数量固定、只是为了防止在小屏手机上或软键盘弹起时出现溢出黄黑条时，使用 `SingleChildScrollView` 是最轻量简便的方案。

### 4.1 滚动物理回弹特性：`physics`
- **`BouncingScrollPhysics`**：iOS 风格的果冻弹性边缘回弹拉伸动画。
- **`ClampingScrollPhysics`**：Android 经典的边缘微光截断水波阻尼效果。
- **`NeverScrollableScrollPhysics`**：禁止用户滑动（常用于嵌套在其他外部滚动视图中，禁用自身滑动）。

```dart
SingleChildScrollView(
  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
  physics: const BouncingScrollPhysics(), // 开启丝滑 iOS 阻尼弹性
  child: Column(
    children: List.generate(
      15,
      (index) => Container(
        height: 60,
        margin: const EdgeInsets.only(bottom: 12),
        color: Colors.blue.shade50,
        alignment: Alignment.center,
        child: Text('表单项 $index'),
      ),
    ),
  ),
)
```

---

## 5. 性能长列表：ListView 与 ListView.builder (P65)

对于长列表甚至数千条商品流，**绝对不能使用 `SingleChildScrollView + Column` 或常规 `ListView(children: [...])`**，因为它们会在进入页面时将**所有列表项一次性全部实例化进内存**，导致严重的内存暴涨与卡顿。

### 5.1 虚拟化懒加载：`ListView.builder`

`ListView.builder` 采用了与原生 Android `RecyclerView` / iOS `UITableView` 完全一致的**虚拟滚动复用机制（Virtual Scrolling）**。它只实例化当前屏幕可视区域内的几个 Item，滑出屏幕的节点会被自动回收与销毁！

### 5.2 下拉刷新与带分割线长列表实战

```dart
class OrderListPage extends StatefulWidget {
  const OrderListPage({super.key});

  @override
  State<OrderListPage> createState() => _OrderListPageState();
}

class _OrderListPageState extends State<OrderListPage> {
  final List<String> _orders = List.generate(30, (i) => '订单编号 #2024102400$i');

  // 下拉刷新异步模拟请求
  Future<void> _handleRefresh() async {
    await Future.delayed(const Duration(seconds: 1)); // 模拟网络延迟
    setState(() {
      _orders.insert(0, '全新插入订单 #${DateTime.now().millisecondsSinceEpoch}');
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('我的订单 (虚拟长列表)')),
      // 1. RefreshIndicator 提供标准的下拉加载圆环动效
      body: RefreshIndicator(
        onRefresh: _handleRefresh,
        child: ListView.separated(
          itemCount: _orders.length,
          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
          // 2. 虚拟构建每一个 Item
          itemBuilder: (context, index) {
            return ListTile(
              leading: CircleAvatar(
                backgroundColor: Colors.blue.shade100,
                child: Text('${index + 1}', style: const TextStyle(color: Colors.blue)),
              ),
              title: Text(_orders[index], style: const TextStyle(fontWeight: FontWeight.w600)),
              subtitle: const Text('下单时间: 2024-10-24 · 已完成'),
              trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
              onTap: () {
                debugPrint('点击了订单: ${_orders[index]}');
              },
            );
          },
          // 3. 列表项之间的细分割线
          separatorBuilder: (context, index) => const Divider(height: 1, indent: 72),
        ),
      ),
    );
  }
}
```

---

## 6. 网格布局：GridView 与 GridView.builder (P66)

在商品商城中，两列瀑布流排版、分类菜单九宫格是不可或缺的设计。

### 6.1 `GridView.builder` 动态网格代理

使用 `SliverGridDelegateWithFixedCrossAxisCount` 代理对象可以精准控制网格列数与宽高比：

```dart
Widget buildProductGrid(List<String> productList) {
  return GridView.builder(
    padding: const EdgeInsets.all(12),
    itemCount: productList.length,
    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
      crossAxisCount: 2,       // 固定每行展示 2 列
      mainAxisSpacing: 12.0,   // 垂直纵向行间距
      crossAxisSpacing: 12.0,  // 水平横向列间距
      childAspectRatio: 0.75,  // 宽高比（宽 / 高 = 0.75，高比宽更长，适合商品卡片）
    ),
    itemBuilder: (context, index) {
      return Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 6, offset: const Offset(0, 2)),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                child: Container(
                  color: Colors.amber.shade50,
                  alignment: Alignment.center,
                  child: const Icon(Icons.shopping_bag_outlined, size: 50, color: Colors.amber),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(productList[index], style: const TextStyle(fontWeight: FontWeight.bold), maxLines: 1),
                  const SizedBox(height: 4),
                  const Text('¥ 199.00', style: TextStyle(color: Colors.redAccent, fontSize: 16, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ],
        ),
      );
    },
  );
}
```

---

## 7. Slivers 高级吸顶视差与 PageView 分页轮播 (P67)

### 7.1 CustomScrollView 与 SliverAppBar 吸顶折叠效果

当我们需要构建如“网易云音乐歌手详情页”、“美团商家主页”这种**顶部大图随手势滑动平滑折叠、标题栏无缝吸顶、下方紧接列表**的顶级视觉动效时，`CustomScrollView` 是唯一终极解法。

```dart
class CollapsibleProfilePage extends StatelessWidget {
  const CollapsibleProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // 1. 折叠视差吸顶导航栏
          SliverAppBar(
            expandedHeight: 220.0, // 展开时的最大高度
            pinned: true,          // 是否在向上滑出屏幕后保持吸顶
            floating: false,       // 向下滑动时是否立即浮现
            flexibleSpace: FlexibleSpaceBar(
              title: const Text('极客数码专营店', style: TextStyle(color: Colors.white)),
              centerTitle: true,
              background: Image.network(
                'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800',
                fit: BoxFit.cover,
              ),
            ),
          ),
          
          // 2. 将普通普通盒子组件接入 Sliver 视窗
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.all(16),
              color: Colors.blue.shade50,
              child: const Text('🔥 店铺公告：今日全场数码配件满 200 减 30！', style: TextStyle(color: Colors.blueAccent)),
            ),
          ),

          // 3. Sliver 版本的长列表
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) => ListTile(
                leading: const Icon(Icons.phone_android),
                title: Text('热销配件型号 #$index'),
                subtitle: const Text('现货速发 · 顺丰包邮'),
                trailing: const Text('¥89', style: TextStyle(color: Colors.deepOrange, fontWeight: FontWeight.bold)),
              ),
              childCount: 20,
            ),
          ),
        ],
      ),
    );
  }
}
```

### 7.2 PageView 与 PageController 分页滑动/轮播实战

`PageView` 支持横向（`Axis.horizontal`）或纵向（`Axis.vertical`）的“整屏滑动吸附”，常用于首页轮播图 Banner、全屏滑动引导页和短视频滑动播放。

```dart
class BannerCarousel extends StatefulWidget {
  const BannerCarousel({super.key});

  @override
  State<BannerCarousel> createState() => _BannerCarouselState();
}

class _BannerCarouselState extends State<BannerCarousel> {
  // 控制器：可设置默认页与每页视窗占比
  late final PageController _pageController;
  int _currentPage = 0;

  final List<Color> _bannerColors = [
    Colors.deepPurpleAccent,
    Colors.teal,
    Colors.indigo,
  ];

  @override
  void initState() {
    super.initState();
    _pageController = PageController(viewportFraction: 0.92); // 露出一侧相邻卡片边缘
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          height: 160,
          child: PageView.builder(
            controller: _pageController,
            itemCount: _bannerColors.length,
            onPageChanged: (index) => setState(() => _currentPage = index),
            itemBuilder: (context, index) {
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
                decoration: BoxDecoration(
                  color: _bannerColors[index],
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(color: _bannerColors[index].withOpacity(0.4), blurRadius: 8, offset: const Offset(0, 4)),
                  ],
                ),
                alignment: Alignment.center,
                child: Text('精选活动 Banner ${index + 1}', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
              );
            },
          ),
        ),
        // 分页指示器小圆点
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            _bannerColors.length,
            (i) => AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              margin: const EdgeInsets.symmetric(horizontal: 4),
              width: _currentPage == i ? 18 : 6,
              height: 6,
              decoration: BoxDecoration(
                color: _currentPage == i ? Colors.blueAccent : Colors.grey.shade300,
                borderRadius: BorderRadius.circular(3),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
```

---

## 8. 总结

本章全面覆盖了移动端核心展示与滚动交互基石：
1. **Text 与 Text.rich**：掌握了多行省略截断与用户协议富文本混合排版。
2. **Image**：遵循 2.0x/3.0x 多分辨率规范，掌握了 `Image.network` 的缓存与优雅异常兜底。
3. **TextField**：熟练运用 `TextEditingController`、密码显隐切换与空白处点击收起软键盘。
4. **滚动容器选型**：小表单用 `SingleChildScrollView`；动态海量数据用 `ListView.builder` / `GridView.builder` 享受虚拟化复用；复杂吸顶与嵌套视差果断采用 `CustomScrollView + Slivers`；全屏分页与轮播图选用 `PageView`。

下一章我们将攻克组件之间的数据流转枢纽 —— **组件间通信与状态提升（父传子、子传父与架构设计模式）**。
