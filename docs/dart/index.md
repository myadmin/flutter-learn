# Dart 语言简介与环境搭建 (P2)

欢迎开启 Flutter 开发之旅的第一天！作为 Flutter 框架的唯一官方指定开发语言，**Dart** 是我们构建高性能跨平台应用的基石。本篇将深入剖析 Dart 的诞生背景、设计哲学、革命性的 JIT/AOT 双编译机制，并带你完成环境搭建与第一个 Dart 程序的运行。

<BiliVideoPlayer episodes="2" :p="2" />

---

## 1. 什么是 Dart 语言？

**Dart** 是由 Google 在 2011 年推出、并在 2017 年后随着 Flutter 框架的爆发式增长而全面焕发生机的面向对象、强类型编程语言。

Google 为 Dart 设定的核心愿景是：**为客户端开发优化的快速编程语言**（Client-optimized language for fast apps on any platform）。

### Dart 为什么能成为 Flutter 的基石？

在 Flutter 选型初期，Google 评估了 JavaScript、TypeScript、Java、C# 等十几种语言，最终 Dart 凭借以下独一无二的特性脱颖而出：

1. **JIT 与 AOT 双编译模式完美并存**：开发阶段享受亚秒级“热重载”（Hot Reload），生产阶段享受高性能原生机器码。
2. **优秀的垃圾回收机制（Generational GC）**：针对客户端高频创建和销毁临时 Widget 进行了深度定制，新生代内存分配极其高效，几乎无卡顿（Jank-Free 60/120fps）。
3. **单线程事件循环模型（Event Loop）**：无复杂的多线程死锁和锁竞争开销，通过高效的异步调度（`Future` / `Stream`）实现丝滑的 UI 渲染。
4. **统一声明式 UI 语法**：Dart 不需要单独的 XML 或 JSX，直接用纯 Dart 对象表达组件树，类型安全且易于组件抽象。

---

## 2. Dart 发展历程与版本演进

| 版本时代 | 时间节点 | 核心演进特征 | 关键里程碑 |
| :--- | :--- | :--- | :--- |
| **Dart 1.x** | 2011 ~ 2017 | 类似 JS 的动态弱类型语言，尝试替代浏览器中的 JS | Dart VM 浏览器计划受阻，转向服务端与工具链 |
| **Dart 2.x** | 2018 ~ 2022 | 全面重构为**强类型系统**、面向对象体系升级 | 随着 Flutter 1.0 发布爆发，确立了客户端王道地位 |
| **Dart 2.12** | 2021 | 引入**健全空安全 (Sound Null Safety)** | 彻底在编译期杜绝 NullPointerException，性能大幅提升 |
| **Dart 3.x** | 2023 至今 | **100% 健全空安全**、模式匹配 (Pattern Matching)、Records 记录元组、类修饰符 (sealed/interface) | 现代化语言特性集大成者，开发体验与 Swift/Kotlin 齐平 |

> **提示**：本套教程完全基于最新的 **Dart 3.x 健全空安全体系** 讲解，所有代码在最新的 Flutter 3.x 环境中均可直接运行。

---

## 3. 核心设计哲学：JIT 与 AOT 双编译机制

跨平台框架通常面临一个矛盾：**开发效率**（热更新、快速迭代）与**运行性能**（原生流畅、低内存消耗）难以兼得。Dart 通过独有的**双编译器架构**完美化解了这一难题：

```
                      ┌─── JIT (Just-In-Time 即时编译) ───> 开发阶段: 亚秒级有状态热重载 (Hot Reload)
Dart 源代码 (.dart) ──┤
                      └─── AOT (Ahead-Of-Time 提前编译) ───> 发布阶段: 编译为 ARM/x64 高效机器码 (无解释器)
```

### JIT (Just-In-Time 即时编译) —— 开发阶段的神器
- **运行方式**：代码在运行时由 Dart VM 动态编译为机器指令。
- **核心优势**：
  - 支持 **Stateful Hot Reload（有状态热重载）**：修改 UI 布局或业务逻辑后，无需重新编译整包，0.5 秒内将补丁注入正在运行的虚拟机中，且保持当前页面状态不变！
  - 动态分析与快速调试，断点排查极其方便。

### AOT (Ahead-Of-Time 提前编译) —— 生产环境的高性能保证
- **运行方式**：在打包生成 Release 包时，直接将 Dart 代码连同底层引擎一次性编译为目标平台的原生二进制机器指令（如 ARM64、x86_64）。
- **核心优势**：
  - **秒级冷启动**：没有 JIT 虚拟机的预热编译过程。
  - **丝滑流畅**：无 JavaScript Bridge 通信开销，无运行时解释执行损耗。
  - **包体积优化**：配合摇树优化（Tree Shaking），剔除所有未使用的无用代码。

---

## 4. Dart SDK 安装与环境验证

学习 Dart 并不需要单独下载独立的 Dart SDK，因为 **Flutter SDK 已经完整内置了全套 Dart SDK**。

### 4.1 验证 Dart SDK 环境

打开终端（Terminal / PowerShell），输入以下命令检查 Dart 是否就绪：

```bash
dart --version
```

若配置正确，终端将输出类似如下的信息：

```text
Dart SDK version: 3.x.x (stable) on "windows_x64"
```

你也可以查看当前 Flutter SDK 的版本：

```bash
flutter --version
```

> 如果提示 `dart: command not found`，请检查是否已将 Flutter SDK 的 `bin` 目录（例如 `C:\flutter\bin`）添加到系统的 `PATH` 环境变量中。

### 4.2 推荐的开发工具组合

- **代码编辑器**：
  - **Visual Studio Code**（强烈推荐，安装扩展：`Dart` 与 `Flutter`）
  - **Android Studio**（官方深度集成，安装插件：`Flutter`）
  - **Trae / Cursor**（新一代 AI 辅助编程编辑器，具备自动代码上下文感知能力）
- **轻量在线演练平台**：
  - [DartPad (https://dartpad.dev/)](https://dartpad.dev/)：Google 官方提供的免安装在线 Dart / Flutter 操练沙箱。

---

## 5. 第一个 Dart 程序与 main 入口函数详解

### 5.1 创建第一个 Dart 文件

创建一个名为 `hello.dart` 的文本文件，输入以下代码：

```dart
void main() {
  print('Hello, Dart 3.0!');
}
```

在终端中执行该文件：

```bash
dart run hello.dart
```

终端将打印输出：
```text
Hello, Dart 3.0!
```

### 5.2 main 函数的三种形式与传参

在 Dart 中，`main` 是所有应用程序必须具备的**顶级入口函数（Top-level function）**。根据实际业务需求，`main` 函数有以下几种合法签名：

#### 形式一：标准无参入口（最常用）

```dart
void main() {
  print('这是最标准、最常见的入口函数');
}
```

#### 形式二：接收命令行参数 `List<String> args`

当编写命令行脚本或 CLI 工具时，可以通过形参接收外界传递的参数：

```dart
void main(List<String> args) {
  print('接收到的参数个数: ${args.length}');
  for (int i = 0; i < args.length; i++) {
    print('参数 [$i]: ${args[i]}');
  }
}
```

运行与传参测试：
```bash
dart run hello.dart --mode=production --port=8080
```

输出：
```text
接收到的参数个数: 2
参数 [0]: --mode=production
参数 [1]: --port=8080
```

#### 形式三：异步 main 入口

当程序启动时需要执行异步初始化（例如连接本地 SQLite 数据库、读取本地 SharedPreferences 配置等），可以将 `main` 声明为 `async` 并返回 `Future<void>`：

```dart
Future<void> main() async {
  print('程序正在启动中...');
  
  // 模拟耗时异步初始化
  await Future.delayed(Duration(seconds: 1));
  
  print('核心服务初始化完成，应用正式启动！');
}
```

---

## 6. Dart 代码书写规范与注释习惯

编写高质量的 Dart 代码需要遵循官方的 [Effective Dart](https://dart.cn/effective-dart) 规范：

### 6.1 命名规范 (Naming Conventions)
- **大驼峰（UpperCamelCase）**：类名、枚举名、typedef 类型名、扩展名。
  ```dart
  class ShoppingCartItem {}
  enum UserStatus { active, banned }
  ```
- **小驼峰（lowerCamelCase）**：变量名、函数名、参数名、类成员属性与方法。
  ```dart
  var totalPrice = 99.0;
  void calculateDiscount() {}
  ```
- **下划线小写（lowercase_with_underscores）**：库名、文件名、目录名。
  ```text
  user_profile_page.dart
  http_client_service.dart
  ```

### 6.2 注释规范 (Comments)

Dart 支持三种注释风格：

```dart
// 1. 单行注释：用于普通代码行解释

/*
 * 2. 多行块级注释：
 * 通常用于临时注释大段代码
 */

/// 3. 文档注释 (Doc Comment)：强烈推荐！
/// 用于类、方法、顶层变量的公共 API 文档。
/// 支持 Markdown 格式，编辑器能自动弹出漂亮的代码提示悬浮窗。
///
/// 示例：
/// ```dart
/// var client = HttpClient();
/// client.fetchUser(id: '1001');
/// ```
class HttpClient {
  /// 根据用户唯一标识 [id] 获取用户详细数据
  void fetchUser({required String id}) {
    // 逻辑实现
  }
}
```

---

## 7. 小结与下一阶段预告

在本篇中，我们学习了：
1. **Dart 定位**：为前端与移动端客户端高度定制的高性能强类型语言。
2. **JIT 与 AOT**：JIT 赋能 Hot Reload 亚秒级迭代，AOT 提供媲美原生的机器码执行效率。
3. **环境与运行**：通过 `dart run` 直接执行 Dart 脚本，掌握了 `main` 函数的三种声明形式。

掌握了基础环境后，下一节我们将深入探讨 **Dart 的变量常量机制与丰富的数据类型体系（P3-P11）**，重点解密 `var`、`dynamic`、`Object` 以及 `final` 与 `const` 的核心底层区别！
