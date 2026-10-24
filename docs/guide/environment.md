# 开发环境搭建与工具链准备

本章节汇总了进行 Flutter 与 Dart 开发所需的必备软硬件环境要求、SDK 下载安装、环境变量配置以及主流编辑器的配置方法。

---

## 1. 硬件与系统要求

| 目标平台 | 最低操作系统要求 | 推荐配置 |
| :--- | :--- | :--- |
| **Windows** | Windows 10 / 11 64 位 | 16GB 内存，SSD 固态硬盘，开启 CPU 虚拟化 (VT-x / AMD-V) |
| **macOS** | macOS 13+ (Ventura 或更新) | Apple Silicon 芯片 (M1/M2/M3)，16GB 内存（开发 iOS 必备） |
| **Linux** | Ubuntu 20.04 LTS 或类似发行版 | 16GB 内存 |

---

## 2. 安装 Dart SDK (独立学习 Dart 语法时)

Flutter SDK 自身已经内嵌了完整的 Dart SDK。如果你当前只想独立学习第一阶段的 Dart 语法（P2-P37），你可以直接使用 Flutter 自带的 Dart，或者单独安装 Dart SDK：

::: tip 验证 Dart 是否可用
在终端中输入：
```bash
dart --version
```
如果输出 `Dart SDK version: 3.x.x ...`，则说明 Dart 环境已经准备就绪。
:::

---

## 3. 安装与配置 Flutter SDK

### Windows 步骤
1. 前往 Flutter 官方网站或国内镜像下载最新稳定版 SDK zip 包（例如 `flutter_windows_3.x.x-stable.zip`）。
2. 将压缩包解压至无中文字符、无空格的英文路径，例如：`C:\src\flutter` 或 `D:\flutter`。
3. **配置环境变量 PATH**：
   - 将 `D:\flutter\bin` 添加至系统环境变量 `Path` 中。
4. **配置国内镜像源（推荐中国大陆开发者配置）**：
   ```bash
   # 用户环境变量或系统环境变量中增加：
   PUB_HOSTED_URL=https://pub.flutter-io.cn
   FLUTTER_STORAGE_BASE_URL=https://storage.flutter-io.cn
   ```

### 验证安装：`flutter doctor`
打开全新 PowerShell 或终端窗口，运行诊断指令：
```bash
flutter doctor
```
该命令会自动检查本地开发环境，并列出缺失的依赖项（如 Android 工具链、Chrome 浏览器、VS Code 插件等）。

---

## 4. 推荐编辑器与插件配置

### 方案 A：VS Code（轻量、流行）
安装官方扩展插件：
1. **Flutter**（包含 Flutter 运行、调试与热重载支持）
2. **Dart**（语法高亮、代码补全、格式化）
3. **Awesome Flutter Snippets**（快速生成 StatelessWidget、StatefulWidget 等代码片段）
4. **Error Lens**（将代码错误高亮在代码行尾，极大提升排错体验）

### 方案 B：Trae / AI 辅助编辑器（课程推荐）
课程中讲解了使用 AI 编辑器（Trae 等）进行结对编程：
- 支持 Chat、Builder 模式生成 Flutter 页面代码；
- 具备自动化终端执行与代码 Diff 确认机制；
- 适合初学者快速克服手写繁琐 Widget 树的畏难心理。

### 方案 C：Android Studio / IntelliJ IDEA
Google 官方原生支持的重量级 IDE：
- 内置 Android 模拟器管理、性能 Profiler 工具与内存分析仪；
- 插件市场搜索并安装 `Flutter` 与 `Dart` 插件即可。

---

## 5. 第一个 Dart 测试脚本

在学习 Day 1 语法前，可以新建一个 `test.dart` 测试文件：

```dart
void main() {
  print("Hello, Flutter & Dart! 🚀");
}
```

在终端中执行：
```bash
dart run test.dart
```
控制台正常输出 `Hello, Flutter & Dart! 🚀`，说明环境一切正常，可以正式启航！
