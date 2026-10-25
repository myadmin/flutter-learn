# Dio 网络请求与工具封装 (P70-P73)

在现代移动开发中，几乎所有 App 都需要与后端云端 API 交互以拉取和提交数据。Flutter 原生提供了 `dart:io` 的 `HttpClient` 以及官方基础 `http` 包，但它们在拦截器支持、超时控制、取消请求、文件上传下载及统一错误处理方面较为原始。

在 Flutter 开发者生态中，**`Dio`** 是事实上的行业标准网络请求库。本章将从基础引入出发，逐步带你构建一套**企业级、高扩展、带有单例模式与全套拦截器的网络请求工具类**，并深入解决数据 Model 序列化及 Flutter Web 端的 CORS 跨域痛点。

<BiliVideoPlayer episodes="70-73" :p="70" />

---

## 1. 为什么选择 Dio？依赖引入与环境配置 (P70)

### 1.1 Dio 核心优势对比

| 能力项 | 官方基础 `http` 包 | 企业级 `Dio` 网络库 |
| :--- | :--- | :--- |
| **基础请求 (GET/POST)** | 支持 | 支持 |
| **拦截器体系 (Interceptors)** | 不支持（需手动二次包装） | **原生强大支持：请求拦截、响应解包、错误捕获** |
| **超时精准控制** | 需结合 Future.timeout | **原生内置连接、发送、接收超时配置** |
| **请求取消 (CancelToken)** | 复杂且不直观 | **支持单个或批量 CancelToken 一键取消** |
| **文件流上传与下载进度** | 编写繁琐 | **原生支持 FormData、分块上传、进度监听回调** |
| **全平台适配** | 移动端良好 | **全面兼容 Android, iOS, Web, Desktop 及鸿蒙** |

### 1.2 引入依赖
在项目根目录的 `pubspec.yaml` 中添加：

```yaml
dependencies:
  flutter:
    sdk: flutter
  dio: ^5.7.0 # 建议锁定 5.x 稳定版本
```
保存后，在终端执行命令拉取依赖：
```bash
flutter pub get
```

---

## 2. Dio 基础请求与响应剖析 (P70-P71)

### 2.1 基础 GET 与 POST 请求示例

```dart
import 'package:dio/dio.dart';

void fetchBasicHttp() async {
  final dio = Dio();

  try {
    // 1. GET 请求：支持 queryParameters 自动 url 编码拼接
    final response = await dio.get(
      'https://api.example.com/products',
      queryParameters: {'page': 1, 'pageSize': 10, 'keyword': 'Flutter'},
    );
    print('状态码: ${response.statusCode}');
    print('返回数据: ${response.data}');

    // 2. POST 请求：直接传入 Map，Dio 自动序列化为 JSON
    final postResponse = await dio.post(
      'https://api.example.com/auth/login',
      data: {
        'mobile': '13800138000',
        'code': '8888',
      },
      options: Options(
        headers: {'X-Client-Platform': 'Flutter'},
      ),
    );
    print('登录结果: ${postResponse.data}');
  } on DioException catch (e) {
    print('捕获 Dio 异常: ${e.message}, 类型: ${e.type}');
  }
}
```

### 2.2 Response 对象核心字段
- **`response.data`**：响应体。Dio 极其智能：如果响应头是 `application/json`，Dio 会自动将其反序列化为 Dart 的 `Map<String, dynamic>` 或 `List<dynamic>`，无需手动 `jsonDecode()`！
- **`response.statusCode`**：HTTP 状态码（如 200, 401, 404, 500）。
- **`response.headers`**：服务器返回的全部响应头。

---

## 3. 企业级通用 Dio 单例工具类封装 (P71-P72)

在真实大型商业项目中，绝不能在每个页面随手 `Dio()` 实例化。我们必须封装一个**单例（Singleton）工具类**，统一管理全局 BaseUrl、统一超时时长、自动携带 Auth Token、统一对业务响应码解包以及网络错误异常拦截。

### 3.1 完整架构封装：`HttpUtil.dart`

在 `lib/services/http_util.dart` 中编写如下标准实现：

```dart
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

/// 企业级 HTTP 请求单例服务类
class HttpUtil {
  // 1. 单例模式核心实现
  static final HttpUtil _instance = HttpUtil._internal();
  factory HttpUtil() => _instance;
  late final Dio _dio;

  // 私有命名构造函数
  HttpUtil._internal() {
    // 2. BaseOptions 全局基础配置
    final options = BaseOptions(
      baseUrl: 'https://api.shop.example.com/v1', // 统一服务端基准路径
      connectTimeout: const Duration(seconds: 10), // 连接超时时间
      receiveTimeout: const Duration(seconds: 8),  // 响应接收超时时间
      sendTimeout: const Duration(seconds: 8),     // 请求发送超时时间
      contentType: Headers.jsonContentType,        // 默认 application/json
      responseType: ResponseType.json,
    );

    _dio = Dio(options);

    // 3. 挂载三大拦截器 (Interceptors)
    _dio.interceptors.add(
      InterceptorsWrapper(
        // A. 请求拦截器：自动注入鉴权 Token 与公共 Header
        onRequest: (RequestOptions options, RequestInterceptorHandler handler) {
          // 模拟从本地持久化中提取用户登录凭证
          const String? userToken = 'mock_jwt_token_abc123';
          if (userToken != null) {
            options.headers['Authorization'] = 'Bearer $userToken';
          }
          options.headers['client-platform'] = defaultTargetPlatform.name;

          if (kDebugMode) {
            debugPrint('🌐 [HTTP Request] --> ${options.method} ${options.uri}');
            debugPrint('📦 [Headers] ${options.headers}');
            debugPrint('📝 [Body] ${options.data}');
          }
          return handler.next(options); // 放行请求
        },

        // B. 响应拦截器：业务通用状态码初步判定
        onResponse: (Response response, ResponseInterceptorHandler handler) {
          if (kDebugMode) {
            debugPrint('✅ [HTTP Response] <-- ${response.statusCode} ${response.requestOptions.uri}');
          }

          // 假定服务端协议约定格式：{ "code": 200, "message": "success", "data": ... }
          if (response.data is Map<String, dynamic>) {
            final resData = response.data as Map<String, dynamic>;
            final int code = resData['code'] ?? 200;

            if (code == 401) {
              // Token 失效，可在此派发全局登出事件或清除本地缓存
              debugPrint('⚠️ Token 已过期，需要重定向至登录页');
            } else if (code != 200) {
              // 业务报错，转换为自定义异常向上抛出
              final String errMsg = resData['message'] ?? '未知业务错误';
              return handler.reject(
                DioException(
                  requestOptions: response.requestOptions,
                  response: response,
                  error: errMsg,
                  type: DioExceptionType.badResponse,
                ),
              );
            }
          }
          return handler.next(response); // 校验通过放行
        },

        // C. 错误拦截器：统一网络异常本地化翻译
        onError: (DioException err, ErrorInterceptorHandler handler) {
          final friendlyMessage = _formatDioError(err);
          if (kDebugMode) {
            debugPrint('❌ [HTTP Error] <-- ${err.requestOptions.uri} | 原因: $friendlyMessage');
          }
          // 将友好提示包装为修改后的错误对象继续派发
          return handler.next(
            DioException(
              requestOptions: err.requestOptions,
              response: err.response,
              type: err.type,
              error: friendlyMessage,
            ),
          );
        },
      ),
    );
  }

  /// 将底层网络异常转换为人类可读的友好提示
  static String _formatDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
        return '网络连接超时，请检查网络配置';
      case DioExceptionType.sendTimeout:
        return '请求发送超时，请重试';
      case DioExceptionType.receiveTimeout:
        return '服务器响应超时，请稍后再试';
      case DioExceptionType.badCertificate:
        return 'SSL 证书无效，访问受限';
      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        switch (statusCode) {
          case 400: return '客户端请求参数错误 (400)';
          case 401: return '登录已过期，请重新登录 (401)';
          case 403: return '无访问权限，拒绝执行 (403)';
          case 404: return '请求的网络接口不存在 (404)';
          case 500: return '服务端发生内部异常 (500)';
          case 502: return '网关网关异常 (502)';
          default: return '网络服务异常 ($statusCode)';
        }
      case DioExceptionType.cancel:
        return '请求已被主动取消';
      case DioExceptionType.connectionError:
        return '无法连接到服务器，请检查设备蜂窝或 Wi-Fi 连接';
      default:
        return error.error?.toString() ?? '未知网络异常，请联系客服';
    }
  }

  // 4. 封装统一便捷请求方法
  Future<dynamic> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    final response = await _dio.get(
      path,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
    return response.data;
  }

  Future<dynamic> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    final response = await _dio.post(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
    return response.data;
  }
}
```

<FlutterPhonePreview 
  type="dio" 
  title="Dio 异步网络请求与加载状态联动演示" 
  appBarTitle="Dio 网络请求实战" 
/>

---

## 4. 数据 Model 实体序列化与反序列化 (P72)

### 4.1 为什么要将 Map 转为强类型 Model？
在 Dart 3 中，直接操作 `Map<String, dynamic>`（如 `data['goods_title']`）存在巨大缺陷：
1. **没有任何 IDE 语法联想提示**，必须人肉核对拼写。
2. 一旦后端改名字段或打错字母，在编译期完全无法察觉，**直到运行至该代码时才会崩溃**。
3. 强类型 Model 配合空安全，在编译期即可拦截 99% 的字段缺失错误。

### 4.2 商品数据模型规范定义：`ProductModel`

```dart
class ProductModel {
  final int id;
  final String title;
  final double price;
  final String coverUrl;
  final int salesCount;

  const ProductModel({
    required this.id,
    required this.title,
    required this.price,
    required this.coverUrl,
    this.salesCount = 0,
  });

  // 1. 反序列化工厂构造函数：Map -> Model
  factory ProductModel.fromJson(Map<String, dynamic> json) {
    return ProductModel(
      id: json['id'] as int? ?? 0,
      title: json['title'] as String? ?? '默认商品名称',
      // 安全转换可能为 int 或 double 的浮点字段
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      coverUrl: json['cover_url'] as String? ?? '',
      salesCount: json['sales_count'] as int? ?? 0,
    );
  }

  // 2. 序列化方法：Model -> Map (用于向服务端提交)
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'price': price,
      'cover_url': coverUrl,
      'sales_count': salesCount,
    };
  }
}
```

### 4.3 结合 Dio 发起请求并解析为 Model 列表

```dart
Future<List<ProductModel>> fetchProductList() async {
  try {
    // 调用封装的 Dio 单例
    final responseData = await HttpUtil().get('/products/recommend');
    
    // 取出服务端的 data 列表
    final List<dynamic> listJson = responseData['data'] as List<dynamic>;

    // 将 List<dynamic> 映射转为 List<ProductModel>
    final List<ProductModel> products = listJson
        .map((item) => ProductModel.fromJson(item as Map<String, dynamic>))
        .toList();

    return products;
  } catch (e) {
    debugPrint('拉取商品列表失败: $e');
    rethrow; // 抛给 UI 层展示错误 Toast
  }
}
```

---

## 5. Web 端跨域 CORS 原理与解决策略 (P73)

### 5.1 为什么会发生 CORS 跨域错误？

许多同学在将代码从 Android / iOS 模拟器切换到 **Chrome 浏览器 (Web 端)** 运行时，突然发现网络请求全部报错：

```text
Access to XMLHttpRequest at 'https://api.shop.example.com/v1/products' 
from origin 'http://localhost:52134' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

- **移动端（Android / iOS）**：采用的是操作系统底层的 TCP Socket 直接与服务器握手通信，完全不受浏览器同源策略限制，因此**永远不会出现跨域问题**。
- **Web 端（Chrome）**：Flutter Web 编译为 HTML/JS/Canvas/Wasm，跑在真实的现代浏览器沙箱中。浏览器出于安全考虑强制执行**同源策略（Same-Origin Policy）**：若协议、域名、端口中任意一项与服务端不一致，且服务端未配置授权跨域头，浏览器会直接在网络层拦截并掐断响应数据！

### 5.2 解决方案 1：本地开发调试时禁用 Chrome 跨域安全策略

如果你只是在本地开发测试，想要快速跑通前后端通信，可以在启动 Chrome 时传入禁用跨域检查的参数：

#### 命令行启动方式：
```bash
flutter run -d chrome --web-browser-flag "--disable-web-security"
```

#### VS Code `launch.json` 自动化配置：
在项目根目录 `.vscode/launch.json` 中配置：
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Flutter Web (No CORS)",
      "request": "launch",
      "type": "dart",
      "args": [
        "-d",
        "chrome",
        "--web-browser-flag",
        "--disable-web-security"
      ]
    }
  ]
}
```

### 5.3 解决方案 2：生产环境标准工程方案

在正式上线部署阶段，不能依赖关闭浏览器安全设置，必须采用规范的工程方案：

1. **后端服务器开启 CORS 授权头**：
   在 Spring Boot、Node.js (Express/Koa) 或 Go 后端中配置响应头：
   ```http
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
   Access-Control-Allow-Headers: Content-Type, Authorization
   ```
2. **Nginx 反向代理（推荐）**：
   将 Web 前端打包产物与接口通过统一 Nginx 域名对外暴露，通过 location 转发彻底消灭跨域：
   ```nginx
   server {
       listen 80;
       server_name shop.example.com;

       # 托管 Flutter Web 打包静态资源 (build/web)
       location / {
           root /usr/share/nginx/html/web;
           index index.html;
           try_files $uri $uri/ /index.html;
       }

       # 反向代理后端 API 接口，彻底避免浏览器跨域
       location /v1/ {
           proxy_pass http://api-server-internal:8080/v1/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

---

## 6. 总结

本章我们建立起移动端商业项目不可或缺的网络交互体系：
1. **Dio 框架选型**：明确了其在拦截器、超时控制、取消请求等维度的压倒性优势。
2. **企业级单例封装**：通过 `BaseOptions` 规范域名与超时，利用三大拦截器（`onRequest`、`onResponse`、`onError`）实现鉴权注入与异常统一收敛。
3. **数据模型实体化**：手写 `fromJson` 与 `toJson`，以强类型和空安全彻底终结 `Map<String, dynamic>` 潜在运行时崩溃。
4. **跨域 CORS 本质**：深入理解了 Web 浏览器沙箱同源策略与原生客户端底层 Socket 的差异，掌握了本地 `--disable-web-security` 调试法与线上 Nginx 代理方案。

下一章我们将攻克页面流转的大脑枢纽 —— **路由导航管理与传参系统（Navigator、命名路由、onGenerateRoute 动态拦截与 404 兜底）**。
