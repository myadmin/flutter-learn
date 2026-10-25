# GetX 全局状态、持久化与通用弹窗 (P96-P98)

在上一章中，我们完成了“我的”个人中心与登录表单页面的搭建。但在真正的商业电商架构中，用户的登录凭证（Token）与个人身份信息是**全局跨组件共享**的核心资产：
- 个人中心需要展示已登录用户的头像与昵称；
- 购物车与结算收银台需要判断用户是否登录，未登录则拦截跳转；
- 网络请求库（Dio）在发起订单、收藏等私密 API 调用时，必须在 Header 中自动注入 `Authorization: Bearer <Token>`；
- 当用户退出应用或重启手机后，Token 需要在本地安全持久化，实现无感自动登录；
- 用户点击“退出登录”时，需要弹出一个优雅的二次确认对话框并清空所有状态。

本章（对应课程 P96 至 P98 集）将通过业界极其风靡的轻量高性能状态管理库 **GetX**，贯穿实现上述完整的企业级状态闭环。

<BiliVideoPlayer episodes="96-98" :p="96" />

---

## 1. 为什么在电商项目实战中选用 GetX？

在 Flutter 状态管理领域，主要流派有 `Provider`、`Riverpod`、`Bloc` 与 `GetX`。在追求高迭代速度、清晰直观的现代电商项目中，GetX 具备无与伦比的综合优势：

```
                      ┌─── 1. 响应式状态管理 (Reactive State): Rx + Obx 亚毫秒局部精准重绘
                      │
GetX 核心三大支柱 ────┼─── 2. 轻量依赖注入 (Dependency Injection): Get.put / Get.find 全局单例解耦
                      │
                      └─── 3. 跨上下文操控 (Context-Free Architecture): 随时随地导航、弹窗与提示
```

| 维度 | 原生 setState / InheritedWidget | Provider | Bloc | GetX |
| :--- | :--- | :--- | :--- | :--- |
| **学习曲线** | 陡峭（繁琐且难以跨页面） | 中等 | 极高（事件、状态、流样板代码繁重） | **极平缓（开箱即用）** |
| **代码量** | 极大 | 适中 | 极大 | **极少** |
| **Context 依赖** | 强依赖 `BuildContext` | 强依赖 `context.watch/read` | 强依赖 `BlocProvider.of(context)` | **完全无 Context 限制** |
| **响应机制** | 全量或复杂通知 | 观察者模式 (`notifyListeners`) | 异步事件流 (`Stream`) | **自动依赖追踪响应式 (`Rx.obs`)** |

---

## 2. 用户数据模型与本地持久化 (SharedPreferences)

### 2.1 用户实体模型 (`lib/models/user_model.dart`)

```dart
// lib/models/user_model.dart
class UserModel {
  final String id;
  final String nickname;
  final String avatar;
  final String mobile;
  final String token;

  const UserModel({
    required this.id,
    required this.nickname,
    required this.avatar,
    required this.mobile,
    required this.token,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      nickname: json['nickname']?.toString() ?? '极客会员',
      avatar: json['avatar']?.toString() ?? '',
      mobile: json['mobile']?.toString() ?? '',
      token: json['token']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nickname': nickname,
      'avatar': avatar,
      'mobile': mobile,
      'token': token,
    };
  }
}
```

### 2.2 本地持久化工具类 (`lib/utils/storage_util.dart`)

基于 `shared_preferences` 封装单例同步读写辅助类：

```dart
// lib/utils/storage_util.dart
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';
import '../models/user_model.dart';

class StorageUtil {
  StorageUtil._();

  static late final SharedPreferences _prefs;

  /// 应用启动时在 main.dart 中预初始化
  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  /// 存储 Token
  static Future<bool> setToken(String token) async {
    return await _prefs.setString(AppConstants.keyToken, token);
  }

  /// 读取 Token
  static String? getToken() {
    return _prefs.getString(AppConstants.keyToken);
  }

  /// 存储用户资料 JSON
  static Future<bool> setUserInfo(UserModel user) async {
    final String jsonStr = jsonEncode(user.toJson());
    return await _prefs.setString(AppConstants.keyUserInfo, jsonStr);
  }

  /// 读取用户资料
  static UserModel? getUserInfo() {
    final String? jsonStr = _prefs.getString(AppConstants.keyUserInfo);
    if (jsonStr == null || jsonStr.isEmpty) return null;
    try {
      final Map<String, dynamic> map = jsonDecode(jsonStr);
      return UserModel.fromJson(map);
    } catch (_) {
      return null;
    }
  }

  /// 清空所有登录凭证 (退出登录时调用)
  static Future<void> clearAuth() async {
    await _prefs.remove(AppConstants.keyToken);
    await _prefs.remove(AppConstants.keyUserInfo);
  }
}
```

---

## 3. 全局 UserController 响应式控制器

我们创建一个全局单例的 `UserController`，负责维护当前登录态与用户信息，并在应用冷启动时自动读取持久化缓存。

在 `lib/controllers/user_controller.dart` 中实现：

```dart
// lib/controllers/user_controller.dart
import 'package:get/get.dart';
import '../models/user_model.dart';
import '../utils/storage_util.dart';
import '../utils/toast_util.dart';

class UserController extends GetxController {
  // 定义响应式变量：是否已登录
  final RxBool isLogin = false.obs;

  // 当前已登录用户信息（可为空）
  final Rx<UserModel?> user = Rx<UserModel?>(null);

  @override
  void onInit() {
    super.onInit();
    // 控制器初始化时，自动尝试从本地缓存中恢复登录态
    _restoreLoginFromStorage();
  }

  // 静默从本地恢复会话
  void _restoreLoginFromStorage() {
    final String? token = StorageUtil.getToken();
    final UserModel? cachedUser = StorageUtil.getUserInfo();

    if (token != null && token.isNotEmpty && cachedUser != null) {
      user.value = cachedUser;
      isLogin.value = true;
    }
  }

  /// 登录成功后的状态更新与本地持久化
  Future<void> onLoginSuccess(UserModel newUser) async {
    user.value = newUser;
    isLogin.value = true;

    // 持久化存储到磁盘
    await StorageUtil.setToken(newUser.token);
    await StorageUtil.setUserInfo(newUser);
  }

  /// 退出登录：清空响应式状态并抹除本地持久化
  Future<void> logout() async {
    user.value = null;
    isLogin.value = false;

    await StorageUtil.clearAuth();
    ToastUtil.show('已安全退出登录');
  }
}
```

在应用总入口处（`lib/main.dart`）完成持久化与控制器的全局依赖注入：

```dart
// lib/main.dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // 1. 初始化本地持久化单例
  await StorageUtil.init();

  // 2. 全局注入 UserController 单例 (永久常驻内存)
  Get.put<UserController>(UserController(), permanent: true);

  runApp(const GeekMallApp());
}
```

---

## 4. 跨组件实时响应与 Obx 精准重绘

有了 `UserController` 后，在“我的”页面中，我们不再需要传递复杂的回调函数，只需使用 `Obx` 包裹依赖状态的代码块：

```dart
// 在 ProfilePage 的 _buildUserHeader 中：
final UserController userController = Get.find<UserController>();

return Obx(() {
  final bool loggedIn = userController.isLogin.value;
  final UserModel? currentUser = userController.user.value;

  return Row(
    children: [
      // 头像展示：已登录显示用户头像，未登录显示默认占位
      Container(
        width: 64,
        height: 64,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 2),
          image: DecorationImage(
            image: NetworkImage(
              loggedIn && currentUser != null && currentUser.avatar.isNotEmpty
                  ? currentUser.avatar
                  : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
            ),
            fit: BoxFit.cover,
          ),
        ),
      ),
      const SizedBox(width: 16),

      // 文本与身份标签
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              loggedIn ? (currentUser?.nickname ?? '极客会员') : '登录 / 注册',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                loggedIn ? 'SVIP 年卡尊享会员' : '点击登录开启极客特权 >',
                style: const TextStyle(fontSize: 11, color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    ],
  );
});
```

---

## 5. Dio 请求拦截器自动化注入 Token

在 `lib/api/api_client.dart` 中，我们为 Dio 挂载拦截器。每次请求出站前，拦截器自动检查当前是否存在 Token，若有则自动添加在 Header 中：

```dart
// lib/api/api_client.dart
import 'package:dio/dio.dart';
import 'package:get/get.dart' as getx;
import '../controllers/user_controller.dart';
import '../utils/storage_util.dart';
import '../utils/toast_util.dart';

class ApiClient {
  static final Dio dio = _createDio();

  static Dio _createDio() {
    final Dio instance = Dio(BaseOptions(
      baseUrl: 'https://api.geekmall.com/v1',
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
    ));

    instance.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          // 自动注入 Authorization Bearer Token
          final String? token = StorageUtil.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) {
          // 捕获 401 认证过期/无权限状态
          if (error.response?.statusCode == 401) {
            ToastUtil.error('登录凭证已过期，请重新登录');
            // 清理全局用户登录状态
            getx.Get.find<UserController>().logout();
          }
          return handler.next(error);
        },
      ),
    );

    return instance;
  }
}
```

---

## 6. 通用退出登录确认弹窗组件封装

退出登录属于高危险性破坏动作，必须引导用户进行二次确认。我们封装一个高拟真、圆角视觉优美的对话框组件。

在 `lib/widgets/confirm_dialog.dart` 中实现：

```dart
// lib/widgets/confirm_dialog.dart
import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

class ConfirmDialog extends StatelessWidget {
  final String title;
  final String content;
  final String confirmText;
  final String cancelText;
  final VoidCallback onConfirm;

  const ConfirmDialog({
    super.key,
    required this.title,
    required this.content,
    this.confirmText = '确定',
    this.cancelText = '取消',
    required this.onConfirm,
  });

  /// 静态弹出方法
  static Future<bool?> show(
    BuildContext context, {
    required String title,
    required String content,
    String confirmText = '确定',
    String cancelText = '取消',
    required VoidCallback onConfirm,
  }) {
    return showDialog<bool>(
      context: context,
      barrierDismissible: false, // 点击蒙层不可直接关闭，防止误触
      builder: (context) => ConfirmDialog(
        title: title,
        content: content,
        confirmText: confirmText,
        cancelText: cancelText,
        onConfirm: onConfirm,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 0,
      backgroundColor: Colors.white,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // 警示圆形背景小图标
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppColors.primaryLight.withOpacity(0.4),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.warning_amber_rounded,
                color: AppColors.primary,
                size: 28,
              ),
            ),
            const SizedBox(height: 14),

            // 标题
            Text(
              title,
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),

            // 描述正文
            Text(
              content,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.4),
            ),
            const SizedBox(height: 24),

            // 按钮操作行
            Row(
              children: [
                // 取消按钮
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(false),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      side: const BorderSide(color: Color(0xFFDDDDDD)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                    ),
                    child: Text(
                      cancelText,
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
                    ),
                  ),
                ),
                const SizedBox(width: 12),

                // 确认危险按钮
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.of(context).pop(true);
                      onConfirm();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                    ),
                    child: Text(
                      confirmText,
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
```

在“我的”页面底部列表点击退出时唤起：

```dart
// 在 ProfilePage 的退出登录 ListTile 点击事件中：
ListTile(
  leading: const Icon(Icons.exit_to_app, color: Colors.red),
  title: const Text('退出当前账号', style: TextStyle(color: Colors.red)),
  onTap: () {
    ConfirmDialog.show(
      context,
      title: '确认退出登录？',
      content: '退出后将无法同步购物车数据与查看专属优惠券，确定要退出吗？',
      confirmText: '退出登录',
      onConfirm: () {
        userController.logout();
      },
    );
  },
);
```

<FlutterPhonePreview 
  type="tabs" 
  title="全局状态驱动的底部 4 栏 Tab 切换实战" 
  appBarTitle="电商项目 Tab 联动" 
/>

---

## 7. 踩坑指南与最佳实践

::: warning 1. Obx 报错：[Get] the improper use of a GetX has been detected
**原因**：你在 `Obx(() => ...)` 中包裹了一个纯静态的 Widget，里面没有任何 `.obs` 响应式变量被读取。
**解决办法**：只有真正依赖 `.obs` 变量发生变化需要重绘的最小叶子节点才需要包 `Obx`，不要盲目全屏外层套 `Obx`。
:::

::: tip 2. Get.put 与 permanent: true 区别
默认情况下，如果一个 Controller 是在某个页面的 `build` 里 `Get.put()` 的，当页面路由 pop 销毁时，GetX 会自动将其从内存卸载。
但对于 `UserController`、`ThemeController` 这类全局基础设施，必须声明 `permanent: true`，确保它们在整个应用生命周期中常驻内存。
:::

---

## 8. 电商实战项目大结

至此，我们已经完整走完了 **Day 3 仿电商实战项目（P80-P99）** 的全部业务研发链路：
1. **P80-P81**：工程脚手架、Git 规范、分层架构与全局设计系统；
2. **P82-P86**：底部导航栏、`IndexedStack` 状态保持、沉浸式搜索条与网络轮播图；
3. **P87-P90**：AI 辅助提示词开发、金刚区 10 格分类网格、限时特惠楼层与爆款推荐；
4. **P91-P93**：双列商品卡片、下拉刷新、触底自动分页加载机制与 `GlobalKey` 无 Context 全局提示；
5. **P94-P96**：沉浸式个人中心、用户登录表单、正则表达式验证器与 Dio 异步登录；
6. **P97-P99**：GetX 响应式状态管理、`shared_preferences` 本地 Token 存取闭环、Dio 鉴权拦截器与优雅二次确认弹窗。

我们拥有了一套高可用、模块解耦、代码健壮的现代化电商应用源码！接下来，我们将进入 **多端部署适配实战篇（P100-P103）**，将这套代码无缝发布到 Android、iOS 与鸿蒙 HarmonyOS 等各大终端平台！
