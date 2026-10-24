# 个人中心与用户登录表单验证 (P93-P95)

在电商应用中，“我的”个人中心与“登录认证体系”是用户身份的载体与商业变现的核心触点。在第 93 至 95 集教程中，我们将实现两大核心功能：
1. **“我的”个人中心精美界面搭建**：沉浸式用户卡片、五大订单状态快捷入口、资产面板与分组服务列表；
2. **用户登录认证与 Form 表单验证实战**：高保真登录页面开发、基于 `GlobalKey<FormState>` 的表单正则验证器封装、显隐密码切换与 Dio 登录 API 交互全流程。

---

## 1. “我的”个人中心页面架构与布局 (ProfilePage)

个人中心页面通常分为四个核心区域：
```
┌──────────────────────────────────────────────┐
│  顶部沉浸式个人资产区 (头像/昵称/VIP/设置)      │
├──────────────────────────────────────────────┤
│  我的订单状态栏 (待付款/待发货/待收货/售后)   │
├──────────────────────────────────────────────┤
│  我的资产卡片 (优惠券/红包/金币/礼品卡)        │
├──────────────────────────────────────────────┤
│  常用服务功能列表 (收货地址/客服/关于/退出)   │
└──────────────────────────────────────────────┘
```

### 1.1 个人中心完整 UI 实现 (`lib/pages/profile/profile_page.dart`)

```dart
// lib/pages/profile/profile_page.dart
import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../auth/login_page.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F8FA),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // 1. 顶部渐变沉浸式个人信息卡片
            _buildUserHeader(context),

            // 2. 我的订单状态入口
            _buildOrderCard(context),

            // 3. 核心资产卡片
            _buildAssetCard(),

            // 4. 常用服务列表
            _buildServiceList(context),

            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  // 顶部渐变头部
  Widget _buildUserHeader(BuildContext context) {
    final statusBarHeight = MediaQuery.of(context).padding.top;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.only(
        top: statusBarHeight + 20,
        bottom: 28,
        left: 20,
        right: 20,
      ),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFE53935), Color(0xFFFF7043)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Row(
        children: [
          // 用户圆形头像
          GestureDetector(
            onTap: () => _navigateToLogin(context),
            child: Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
                image: const DecorationImage(
                  image: NetworkImage(
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
                  ),
                  fit: BoxFit.cover,
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),

          // 昵称与登录引导
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                GestureDetector(
                  onTap: () => _navigateToLogin(context),
                  child: const Text(
                    '登录 / 注册',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Text(
                    '点击登录开启极客会员特权 >',
                    style: TextStyle(fontSize: 11, color: Colors.white),
                  ),
                ),
              ],
            ),
          ),

          // 设置图标
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: Colors.white),
            onPressed: () {},
          ),
        ],
      ),
    );
  }

  // 订单状态入口卡片
  Widget _buildOrderCard(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '我的订单',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
              ),
              GestureDetector(
                onTap: () {},
                child: const Text(
                  '全部订单 >',
                  style: TextStyle(fontSize: 12, color: AppColors.textMuted),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildOrderItem(Icons.payment_outlined, '待付款', badge: '2'),
              _buildOrderItem(Icons.inventory_2_outlined, '待发货'),
              _buildOrderItem(Icons.local_shipping_outlined, '待收货', badge: '1'),
              _buildOrderItem(Icons.rate_review_outlined, '待评价'),
              _buildOrderItem(Icons.assignment_return_outlined, '退款/售后'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildOrderItem(IconData icon, String label, {String? badge}) {
    return InkWell(
      onTap: () {},
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Column(
            children: [
              Icon(icon, color: const Color(0xFF424242), size: 26),
              const SizedBox(height: 6),
              Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
            ],
          ),
          if (badge != null)
            Positioned(
              right: -4,
              top: -4,
              child: Container(
                padding: const EdgeInsets.all(3),
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                ),
                child: Text(
                  badge,
                  style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                ),
              ),
            ),
        ],
      ),
    );
  }

  // 资产卡片
  Widget _buildAssetCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildAssetItem('2 张', '优惠券'),
          _buildAssetItem('150', '极客积分'),
          _buildAssetItem('¥0.00', '可用余额'),
          _buildAssetItem('0 张', '礼品卡'),
        ],
      ),
    );
  }

  Widget _buildAssetItem(String value, String label) {
    return Column(
      children: [
        Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
      ],
    );
  }

  // 常用服务列表
  Widget _buildServiceList(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          _buildServiceTile(Icons.location_on_outlined, '收货地址管理'),
          const Divider(height: 1, indent: 50),
          _buildServiceTile(Icons.favorite_border, '我的心愿单与收藏'),
          const Divider(height: 1, indent: 50),
          _buildServiceTile(Icons.headset_mic_outlined, '官方在线客服'),
          const Divider(height: 1, indent: 50),
          _buildServiceTile(Icons.info_outline, '关于极客商城 v1.0.0'),
        ],
      ),
    );
  }

  Widget _buildServiceTile(IconData icon, String title) {
    return ListTile(
      leading: Icon(icon, color: AppColors.primary),
      title: Text(title, style: const TextStyle(fontSize: 14)),
      trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
      onTap: () {},
    );
  }

  void _navigateToLogin(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (context) => const LoginPage()),
    );
  }
}
```

---

## 2. Form 表单验证体系与规则封装

表单输入是用户提交数据的核心关口。Flutter 提供了 `Form` 与 `TextFormField` 组件，结合 `GlobalKey<FormState>` 可以在用户点击提交时集中执行校验。

### 2.1 表单校验规则工具类 (`lib/utils/validators.dart`)

```dart
// lib/utils/validators.dart
class FormValidators {
  FormValidators._();

  // 中国大陆 11 位手机号码正则表达式
  static final RegExp _mobileRegExp = RegExp(r'^1[3-9]\d{9}$');

  /// 手机号校验规则
  static String? validateMobile(String? value) {
    if (value == null || value.trim().isEmpty) {
      return '请输入手机号码';
    }
    if (!_mobileRegExp.hasMatch(value.trim())) {
      return '请输入合法的 11 位手机号码';
    }
    return null; // 返回 null 说明校验通过
  }

  /// 密码强度校验规则
  static String? validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return '请输入登录密码';
    }
    if (value.length < 6) {
      return '密码长度不能少于 6 位';
    }
    if (value.length > 20) {
      return '密码长度不能超过 20 位';
    }
    return null;
  }
}
```

---

## 3. 用户登录界面与交互开发 (LoginPage)

登录页面包含：
- 品牌 Logo 与欢迎标语；
- 手机号输入框（带一键清除按钮）；
- 密码输入框（带小眼睛显隐密码切换）；
- 用户协议勾选（未勾选时点击登录进行高亮震动提示）；
- 加载状态（Loading 旋转圈遮罩）。

### 3.1 登录页面源码 (`lib/pages/auth/login_page.dart`)

```dart
// lib/pages/auth/login_page.dart
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import '../../constants/app_colors.dart';
import '../../utils/validators.dart';
import '../../utils/toast_util.dart';
import '../../api/auth_api.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  // 表单全局控制 Key
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

  final TextEditingController _mobileController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  // 是否隐藏密码明文
  bool _obscurePassword = true;
  // 是否同意用户隐私协议
  bool _agreeProtocol = false;
  // 是否正在登录网络请求中
  bool _isLoading = false;

  @override
  void dispose() {
    _mobileController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  // 提交登录逻辑
  Future<void> _handleLogin() async {
    // 1. 回收键盘
    FocusScope.of(context).unfocus();

    // 2. 检查协议勾选
    if (!_agreeProtocol) {
      ToastUtil.error('请先阅读并勾选用户协议与隐私条款');
      return;
    }

    // 3. 执行 Form 表单校验
    final FormState? form = _formKey.currentState;
    if (form == null || !form.validate()) {
      // 校验未通过，输入框下方会自动飘红提示
      return;
    }

    // 4. 发起 API 请求
    setState(() {
      _isLoading = true;
    });

    try {
      final result = await AuthApi.login(
        mobile: _mobileController.text.trim(),
        password: _passwordController.text,
      );

      if (!mounted) return;

      ToastUtil.success('登录成功，欢迎回来：${result['nickname']}');
      Navigator.of(context).pop(); // 返回上一页
    } catch (e) {
      ToastUtil.error(e.toString().replaceAll('Exception: ', ''));
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.black87),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Form(
            key: _formKey,
            autovalidateMode: AutovalidateMode.onUserInteraction,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 20),
                const Text(
                  '极客商城・欢迎登录',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  '发现全球极客好物，畅享品质生活',
                  style: TextStyle(fontSize: 13, color: AppColors.textMuted),
                ),
                const SizedBox(height: 40),

                // 手机号输入框
                TextFormField(
                  controller: _mobileController,
                  keyboardType: TextInputType.phone,
                  maxLength: 11,
                  decoration: InputDecoration(
                    labelText: '手机号码',
                    hintText: '请输入11位手机号码',
                    prefixIcon: const Icon(Icons.phone_android),
                    counterText: '', // 隐藏默认字数计数器
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    suffixIcon: _mobileController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 18),
                            onPressed: () => setState(() => _mobileController.clear()),
                          )
                        : null,
                  ),
                  validator: FormValidators.validateMobile,
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: 20),

                // 密码输入框
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  decoration: InputDecoration(
                    labelText: '登录密码',
                    hintText: '请输入6-20位密码',
                    prefixIcon: const Icon(Icons.lock_outline),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword ? Icons.visibility_off : Icons.visibility,
                        color: Colors.grey,
                      ),
                      onPressed: () {
                        setState(() {
                          _obscurePassword = !_obscurePassword;
                        });
                      },
                    ),
                  ),
                  validator: FormValidators.validatePassword,
                ),
                const SizedBox(height: 16),

                // 用户协议勾选行
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    SizedBox(
                      width: 24,
                      height: 24,
                      child: Checkbox(
                        value: _agreeProtocol,
                        activeColor: AppColors.primary,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                        onChanged: (val) {
                          setState(() {
                            _agreeProtocol = val ?? false;
                          });
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text.rich(
                        TextSpan(
                          text: '我已阅读并同意',
                          style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                          children: [
                            TextSpan(
                              text: '《用户服务协议》',
                              style: const TextStyle(color: AppColors.primary),
                              recognizer: TapGestureRecognizer()
                                ..onTap = () => ToastUtil.show('打开用户服务协议'),
                            ),
                            const TextSpan(text: '与'),
                            TextSpan(
                              text: '《隐私保护政策》',
                              style: const TextStyle(color: AppColors.primary),
                              recognizer: TapGestureRecognizer()
                                ..onTap = () => ToastUtil.show('打开隐私保护政策'),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 32),

                // 登录提交主按钮
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleLogin,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(24),
                      ),
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text(
                            '立即登录',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
```

<FlutterPhonePreview 
  type="login" 
  title="用户登录与 Form 表单正则校验交互演示" 
  appBarTitle="用户登录" 
/>

---

## 4. 登录 API 服务层与 Mock 契约 (`lib/api/auth_api.dart`)

```dart
// lib/api/auth_api.dart
import 'package:dio/dio.dart';

class AuthApi {
  static final Dio _dio = Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 10),
  ));

  /// 手机号密码登录
  static Future<Map<String, dynamic>> login({
    required String mobile,
    required String password,
  }) async {
    try {
      // 真实后端对接接口
      final response = await _dio.post(
        'https://mock.apifox.cn/m1/geekmall/auth/login',
        data: {'mobile': mobile, 'password': password},
      );

      if (response.statusCode == 200 && response.data['code'] == 200) {
        return response.data['data'] as Map<String, dynamic>;
      }
      throw Exception(response.data['message'] ?? '登录失败，请核对信息');
    } catch (e) {
      // 演示 Mock: 手机号只要符合规则即允许登录并颁发 Token
      await Future.delayed(const Duration(milliseconds: 600));
      return {
        'token': 'GEEK_MALL_JWT_TOKEN_${DateTime.now().millisecondsSinceEpoch}',
        'id': '9527',
        'nickname': '极客先锋_${mobile.substring(7)}',
        'avatar': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
        'mobile': mobile,
      };
    }
  }
}
```

---

## 5. 高频避坑指南

::: tip 1. 软键盘弹起导致像素溢出 (Bottom Overflowed)
在输入框获取焦点时，系统软键盘会占据屏幕下半部分，极易触发 `A RenderFlex overflowed by xxx pixels` 错误。
**最佳解决方案**：外层必须包裹 `SingleChildScrollView`，让内容在键盘弹出时具备向上滑动的弹性空间。
:::

::: warning 2. 软键盘收起时机
点击登录按钮或点击空白处时，应主动调用 `FocusScope.of(context).unfocus()` 退出键盘输入态，提供干净干练的交互体验。
:::

---

## 6. 本章小结

在这一章中，我们：
1. 完整搭建了个人中心页面（头像昵称渐变区、订单状态快捷入口、资产卡片及服务列表）；
2. 实现了标准登录页面，封装了手机号、密码验证规则工具类 `FormValidators`；
3. 掌握了 `GlobalKey<FormState>` 在表单统一验证与提交流程中的核心用法；
4. 跑通了登录 API 异步请求、Loading 状态切换与错误拦截。

不过，此时登录成功拿到的 `token` 和用户资料仅仅停留在当前页面局部变量中，一旦 App 退出重启就会丢失。在下一篇 **[GetX 全局状态、持久化与通用弹窗 (P97-P99)](./getx-state-and-token.md)** 中，我们将引入现代化状态管理库 **GetX**，实现全局跨组件用户状态共享、`shared_preferences` 本地 Token 存取以及通用二次确认退出弹窗！
