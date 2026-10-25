# 路由导航管理与传参系统 (P74-P79)

在多页面应用中，页面之间的切换流转、正向传参、反向数据回调以及登录鉴权拦截，构成了客户端架构的核心骨架。Flutter 提供了功能强大的路由导航系统。

本章将系统揭秘：
1. **路由栈模型机制**（LIFO 栈式管理原理）
2. **Navigator 1.0 基础命令式路由**（Push / Pop / 跨平台转场动效与反向回传数据）
3. **命名路由表体系**（`routes` 配置与 `ModalRoute` 传参）
4. **企业级 `onGenerateRoute` 动态拦截与路由守卫**（参数强类型转换、未登录强制拦截重定向）
5. **统一 404 页面兜底处理**（`onUnknownRoute` 容错）

<BiliVideoPlayer episodes="74-79" :p="74" />

---

## 1. 路由核心机制与栈模型 (P74)

在 Flutter 中，所谓的“页面（Page）”在底层都被抽象为一个 **`Route`（路由对象）**，而管理所有页面显示层级的核心调度器就是 **`Navigator`**。

`Navigator` 采用经典的**后进先出栈（LIFO: Last In First Out Stack）**结构来维护页面层级：

```
                    ┌─────────────────────────┐
                    │  Page C (当前栈顶/当前可见)│ ◄─── Navigator.push() 新入栈
                    ├─────────────────────────┤
                    │  Page B (历史中间页)     │
                    ├─────────────────────────┤
                    │  Page A (应用根页面/栈底) │ ◄─── 栈底保持常驻
                    └─────────────────────────┘
                                 │
                                 ▼ Navigator.pop() 出栈并销毁 C，回显 B
```

- **`Navigator.push()`**：将一个新页面压入栈顶，新页面盖住原页面。
- **`Navigator.pop()`**：将当前栈顶页面弹出并彻底销毁，露回先前的页面，并可向原页面携带回传结果。

---

## 2. Navigator 基础命令式路由 (P74-P75)

基础命令式路由直接通过代码构建具体的 `PageRoute` 实例进行跳转，最直观简便。

### 2.1 `MaterialPageRoute` vs `CupertinoPageRoute`

Flutter 针对 Android 与 iOS 提供了两种经典的页面切换转场动画：

```dart
// 1. Android Material 风格：自下而上淡入滑动
Navigator.push(
  context,
  MaterialPageRoute(builder: (context) => const DetailPage(id: 1001)),
);

// 2. iOS Cupertino 风格：自右向左平滑滑入，且自带从屏幕左边缘向右侧滑手势返回能力
Navigator.push(
  context,
  CupertinoPageRoute(builder: (context) => const DetailPage(id: 1001)),
);
```

### 2.2 正向传参与反向数据回传实战

#### 场景：在商品列表点击进入“收货地址选择页”，选择地址后回传数据并在列表页展示：

```dart
// 1. 起始页：发送并异步等待接收返回值
class OrderPage extends StatefulWidget {
  const OrderPage({super.key});

  @override
  State<OrderPage> createState() => _OrderPageState();
}

class _OrderPageState extends State<OrderPage> {
  String _selectedAddress = '请选择收货地址';

  void _chooseAddress() async {
    // 关键点：Navigator.push 返回的是一个 Future 对象，使用 await 等待目标页 pop 的结果
    final result = await Navigator.push<String>(
      context,
      MaterialPageRoute(
        builder: (context) => const AddressSelectPage(currentAddress: '北京市朝阳区'),
      ),
    );

    // 如果用户直接按物理返回键，result 可能为 null
    if (result != null && mounted) {
      setState(() {
        _selectedAddress = result;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('已更新收货地址: $_selectedAddress')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('订单确认')),
      body: Center(
        child: ListTile(
          leading: const Icon(Icons.location_on, color: Colors.redAccent),
          title: Text(_selectedAddress),
          trailing: const Icon(Icons.arrow_forward_ios, size: 14),
          onTap: _chooseAddress,
        ),
      ),
    );
  }
}

// 2. 目标页：选择并回传数据
class AddressSelectPage extends StatelessWidget {
  final String currentAddress;
  const AddressSelectPage({super.key, required this.currentAddress});

  @override
  Widget build(BuildContext context) {
    final List<String> addressList = [
      '北京市海淀区中关村南大街 1 号',
      '上海市浦东新区张江高科园区 88 号',
      '深圳市南山区科技园高新南九道 6 号',
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('选择收货地址')),
      body: ListView.builder(
        itemCount: addressList.length,
        itemBuilder: (context, index) {
          final addr = addressList[index];
          return ListTile(
            title: Text(addr),
            trailing: addr == currentAddress ? const Icon(Icons.check, color: Colors.green) : null,
            onTap: () {
              // 关键点：通过 Navigator.pop 的第二个参数将数据回传！
              Navigator.pop(context, addr);
            },
          );
        },
      ),
    );
  }
}
```

### 2.3 常用路由栈操作方法

- **`Navigator.pushReplacement(context, newRoute)`**：销毁当前栈顶页面，并压入新页面替换它（例如：从“登录页”成功登录后跳转到“首页”，用户按返回键不会再次退回登录页）。
- **`Navigator.pushAndRemoveUntil(context, newRoute, (route) => false)`**：清空整个路由历史栈，并将新页面置为全新的栈底（例如：“退出登录”后，清除所有已打开的历史页面，仅保留登录页）。

<FlutterPhonePreview 
  type="routing" 
  title="Navigator 页面跳转与路由栈动态演示" 
  appBarTitle="路由栈跳转 Demo" 
/>

---

## 3. 命名路由体系声明与传参 (P76-P77)

当项目页面规模扩大到数十个时，代码中到处散落具体的组件类名会导致模块耦合过高。使用**命名路由（Named Routes）**可以像 Web URL 一样通过统一的字符串路径管理跳转。

### 3.1 静态命名路由表声明

在 `MaterialApp` 中配置：

```dart
MaterialApp(
  initialRoute: '/', // 声明初始页面路径
  routes: {
    '/': (context) => const HomePage(),
    '/detail': (context) => const ProductDetailPage(),
    '/setting': (context) => const SettingPage(),
  },
)
```

### 3.2 携带参数跳转与在目标页提取

#### 发起跳转传参：
```dart
Navigator.pushNamed(
  context,
  '/detail',
  arguments: {
    'goodsId': 8802,
    'goodsTitle': '降噪蓝牙耳机',
  },
);
```

#### 目标页面中提取参数：
```dart
class ProductDetailPage extends StatelessWidget {
  const ProductDetailPage({super.key});

  @override
  Widget build(BuildContext context) {
    // 通过 ModalRoute.of 提取传递过来的 arguments
    final args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;

    return Scaffold(
      appBar: AppBar(title: Text(args['goodsTitle'])),
      body: Center(
        child: Text('商品详情编号: ${args['goodsId']}'),
      ),
    );
  }
}
```

### 3.3 静态命名路由表的缺陷
虽然静态 `routes` 表简单直观，但在商业项目中存在三大致命瓶颈：
1. **参数提取滞后**：参数只能在 `build()` 运行时通过 `ModalRoute.of(context)` 动态取出，无法通过构造函数直接赋给 `final` 属性。
2. **缺乏路由守卫（Route Guard）**：无法在跳转前统一做权限校验（如判断是否登录、是否有实名认证）。
3. **缺少统一 404 处理**。

---

## 4. 高级动态路由拦截与参数守卫：`onGenerateRoute` (P78)

为了彻底解决上述痛点，Flutter 官方提供了 **`onGenerateRoute`** 钩子。它是企业级 Flutter 工程中**最标准、最核心的路由架构实践**。

### 4.1 `onGenerateRoute` 运行机制
当调用 `Navigator.pushNamed(context, '/path', arguments: ...)` 时，如果 `routes` 静态表中未找到匹配，Flutter 会自动调用 `onGenerateRoute` 回调函数。该函数接收一个 `RouteSettings` 对象，开发者可以集中解析路径、校验权限，并返回一个配置好的 `PageRoute`。

### 4.2 企业级路由架构：`AppRoutes.dart`

我们来构建一个模块化、包含登录拦截守卫与强类型参数注入的路由管理方案：

```dart
import 'package:flutter/material.dart';

// 页面引入
import '../pages/home_page.dart';
import '../pages/product_detail_page.dart';
import '../pages/login_page.dart';
import '../pages/user_profile_page.dart';
import '../pages/not_found_page.dart';

/// 模拟全局用户登录状态服务
class AuthService {
  static bool isLoggedIn = false; // 模拟当前登录状态
}

/// 集中式路由管理器
class AppRoutes {
  // 1. 统一管理所有路由静态常量名称
  static const String home = '/';
  static const String productDetail = '/detail';
  static const String login = '/login';
  static const String userProfile = '/profile';

  // 2. 需要登录才能访问的受保护白名单列表
  static const List<String> _authRequiredRoutes = [
    userProfile,
  ];

  // 3. 动态路由生成与全局拦截守卫
  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    final String? routeName = settings.name;
    final Object? args = settings.arguments;

    // 【全局路由守卫拦截】：如果该页面需要登录，但用户未登录，则强制重定向至登录页
    if (_authRequiredRoutes.contains(routeName) && !AuthService.isLoggedIn) {
      debugPrint('🛡️ [Route Guard] 未登录拦截，强制重定向至登录页面');
      return MaterialPageRoute(
        builder: (_) => LoginPage(redirectRoute: routeName),
        settings: settings,
      );
    }

    // 【动态路由分发与强类型构造传参】
    switch (routeName) {
      case home:
        return MaterialPageRoute(builder: (_) => const HomePage(), settings: settings);

      case login:
        return MaterialPageRoute(builder: (_) => const LoginPage(), settings: settings);

      case productDetail:
        // 在此集中进行参数强类型转换校验，直接注入构造函数
        final detailArgs = args as Map<String, dynamic>? ?? {};
        final int id = detailArgs['id'] as int? ?? 0;
        final String title = detailArgs['title'] as String? ?? '默认商品';
        return MaterialPageRoute(
          builder: (_) => ProductDetailPage(id: id, title: title),
          settings: settings,
        );

      case userProfile:
        return MaterialPageRoute(builder: (_) => const UserProfilePage(), settings: settings);

      default:
        // 未匹配到的未知路径走 404
        return MaterialPageRoute(
          builder: (_) => NotFoundPage(targetRoute: routeName ?? 'Unknown'),
          settings: settings,
        );
    }
  }
}
```

### 4.3 强类型接收参数的页面组件示例

此时在 `ProductDetailPage` 中，无需再写繁杂的 `ModalRoute.of(context)`，完全以清晰的强类型构造函数接收：

```dart
class ProductDetailPage extends StatelessWidget {
  final int id;
  final String title;

  // 强类型 final 属性与 const 构造函数，安全且优雅！
  const ProductDetailPage({
    super.key,
    required this.id,
    required this.title,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Text('商品 ID: $id (强类型参数注入成功)'),
      ),
    );
  }
}
```

---

## 5. 统一 404 兜底处理：`onUnknownRoute` (P79)

当由于版本迭代废弃了某些旧路径，或者用户点击了深层链接（Deep Link）跳转了一个完全不存在的路径时，直接白屏报错是极其糟糕的用户体验。

我们可以通过 `onUnknownRoute` 配置优雅的 404 兜底页：

### 5.1 优雅 404 页面设计：`NotFoundPage.dart`

```dart
import 'package:flutter/material.dart';

class NotFoundPage extends StatelessWidget {
  final String targetRoute;
  const NotFoundPage({super.key, required this.targetRoute});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('页面走丢了'), centerTitle: true),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // 404 大图标
              Icon(Icons.search_off_rounded, size: 96, color: Colors.grey.shade400),
              const SizedBox(height: 16),
              const Text(
                '404 - 页面不存在',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                '很抱歉，你访问的路径 "$targetRoute" 暂未开放或已被移除。',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey.shade600, fontSize: 14),
              ),
              const SizedBox(height: 28),
              // 返回首页操作按钮
              ElevatedButton.icon(
                onPressed: () {
                  // 清空回退到首页
                  Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false);
                },
                icon: const Icon(Icons.home),
                label: const Text('返回应用首页'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Theme.of(context).colorScheme.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

### 5.2 在 `MaterialApp` 中装配全局路由管线

```dart
class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '商城路由系统',
      debugShowCheckedModeBanner: false,
      initialRoute: AppRoutes.home,
      // 1. 核心分发与鉴权守卫
      onGenerateRoute: AppRoutes.onGenerateRoute,
      // 2. 统一 404 容错兜底
      onUnknownRoute: (settings) => MaterialPageRoute(
        builder: (_) => NotFoundPage(targetRoute: settings.name ?? 'Unknown'),
      ),
    );
  }
}
```

---

## 6. 路由系统选型决策指南

```
路由使用场景与技术选型：
 ├── 极其简单的 2 个页面之间跳转？ ──> 【Navigator.push(context, MaterialPageRoute(...))】
 ├── 中小型项目页面跳转？ ──> 【静态命名路由 routes 表】
 └── 商业化企业级项目？ ──> 【onGenerateRoute 集中式路由表 + 路由守卫拦截 + 统一 404 兜底】
      (跨端深度链接/URL 响应式要求极高时，可进一步进阶为 go_router 或 GetX 路由管理)
```

---

## 7. 总结

本章我们彻底掌握了 Flutter 路由系统的运行机制与工程化实践：
1. **底层机制**：理解了基于 LIFO 的页面栈结构，掌握了 `push`、`pop`、`pushReplacement` 与 `pushAndRemoveUntil` 的操作语义。
2. **双向传参**：掌握了正向传参与通过 `await Navigator.push` 接收 `pop` 回传数据的标准模式。
3. **企业级路由架构**：通过 `onGenerateRoute` 实现了路径与组件解耦、登录拦截守卫与构造函数强类型传参。
4. **404 兜底体验**：通过 `onUnknownRoute` 与友好的兜底 UI，保障了应用的高可用与容错性。

至此，Day 2 的 Flutter 核心框架与基础组件（P38-P79）全套 7 篇深度教程已全部完成！
