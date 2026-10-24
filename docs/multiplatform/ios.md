# iOS 环境配置与编译运行 (P101)

作为移动开发领域的另一大支柱，苹果 iOS 生态以其封闭严格的安全机制、统一的硬件标准以及对流畅度（120Hz ProMotion）的极致追求而著称。在将 Flutter 应用部署到 iPhone 与 iPad 之前，我们必须掌握苹果生态的专属工具链：**macOS 系统环境、Xcode 开发者配置、CocoaPods 依赖管理、免费个人证书签名与真机调试授权**。

本篇（对应课程第 101 集）将为你完整打通 iOS 端从零到真机流畅运行的全部节点。

---

## 1. iOS 开发前置依赖与环境要求

与 Android 可以在 Windows/Linux/macOS 上交叉编译不同，**苹果官方强制规定：编译、签名与调试 iOS 应用必须在搭载 macOS 的设备上进行**。

### 1.1 硬件与系统基线

- **硬件设备**：MacBook Pro / Air、Mac mini、Mac Studio（推荐 Apple Silicon M 系列芯片）；
- **操作系统**：macOS Sonoma (14.x) 或更新版本；
- **核心开发工具**：**Xcode 15.x / 16.x**（可直接在 Mac App Store 免安装搜索下载）。

### 1.2 安装 Xcode Command Line Tools

安装完 Xcode 后，必须安装终端命令行工具并指派激活路径：

```bash
# 1. 安装 Xcode 命令行套件
xcode-select --install

# 2. 授权命令行工具使用当前安装的 Xcode
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

# 3. 首次启动授权并同意许可协议
sudo xcodebuild -runFirstLaunch
sudo xcodebuild -license accept
```

---

## 2. CocoaPods 依赖管理器安装与镜像加速

在 Flutter 项目中，很多涉及到原生底层能力的第三方插件（如 `shared_preferences`、`camera`、`image_picker` 等）在 iOS 端都需要通过 **CocoaPods** 拉取 iOS 原生 Framework。

### 2.1 安装 CocoaPods

推荐使用 macOS 下的包管理神器 Homebrew 快速安装：

```bash
# 使用 Homebrew 安装（最推荐，无 Ruby 权限困扰）
brew install cocoapods

# 验证版本（建议 1.14.0 以上）
pod --version
```

### 2.2 CocoaPods 国内源加速配置

在国内网络环境下，`pod install` 从 GitHub 拉取 Specs 仓库极易超时。我们可以将其替换为清华大学开源镜像源或国内 CDN：

```bash
# 进入工程的 ios 目录
cd ios

# 检查当前 pod 源
pod repo list

# 使用官方高速 CDN (CocoaPods 1.8+ 默认已原生支持 CDN)
# 打开 Podfile，确保第一行声明为：
# source 'https://cdn.cocoapods.org/'
```

---

## 3. iOS Simulator 模拟器选择与运行

Xcode 内置了覆盖 iPhone 各个型号的官方高拟真模拟器。

### 3.1 启动与管理模拟器

```bash
# 打开 iOS 模拟器窗口
open -a Simulator

# 查询当前本机所有可用的模拟器与设备列表
flutter devices
```

终端将打印类似如下信息：
```text
Found 2 connected devices:
iPhone 15 Pro (mobile) • 92B6015B-25BA-4A3C-9F1B • ios • com.apple.CoreSimulator.SimDeviceType.iPhone-15-Pro
Chrome (web)           • chrome               • web-javascript • Google Chrome
```

### 3.2 运行应用至指定模拟器

```bash
# 在项目根目录下执行，指定目标设备
flutter run -d "iPhone 15 Pro"
```
Flutter 会自动触发 `pod install`、调用 `xcodebuild` 并在数秒后将应用部署至模拟器视窗中，支持丝滑的 `r` 热重载与 `R` 热重启！

---

## 4. 免费个人 Apple ID 证书真机调试全流程

许多开发者误以为必须支付每年 99 美元购买 Apple 开发者账号才能真机调试。事实上，**使用普通的免费个人 Apple ID 即可完全免费进行真机安装与调试运行！**

### 4.1 第一步：使用 Xcode 打开工程

> **至关重要的避坑准则**：
> 永远使用 Xcode 打开 **`ios/Runner.xcworkspace`**，**绝对不要**打开 `ios/Runner.xcodeproj`！因为只有 `.xcworkspace` 才包含了 CocoaPods 编译出的依赖工作空间。

在 Mac 终端中运行：
```bash
open ios/Runner.xcworkspace
```

### 4.2 第二步：登录 Apple ID 并配置签名 (Signing)

1. 在 Xcode 顶部菜单栏选择 **Xcode -> Settings (Preferences) -> Accounts**；
2. 点击左下角的 **`+`** 按钮，选择 **Apple ID**，输入你常用的 Apple 账号与密码登录；
3. 回到项目导航器，点击左上角的根节点 **`Runner`**；
4. 在右侧面板选择 **`Signing & Capabilities`** 选项卡；
5. 勾选 **`Automatically manage signing`**（自动管理签名）；
6. 在 **`Team`** 下拉菜单中，选择你刚刚登录的个人账号（会标记为 `Your Name (Personal Team)`）；
7. 在 **`Bundle Identifier`** 文本框中，将默认的组织标识修改为全局唯一的专属 ID（例如 `com.geekmall.app.yourname`）。

```
┌────────────────────────────────────────────────────────┐
│  Runner > Signing & Capabilities                       │
├────────────────────────────────────────────────────────┤
│  ☑ Automatically manage signing                        │
│                                                        │
│  Team:             [ Zhang San (Personal Team)    ▼ ]  │
│  Bundle Identifier:[ com.geekmall.app.zhangsan      ]  │
│  Provisioning Profile: Xcode Managed Profile           │
│  Signing Certificate:  Apple Development: zhang...     │
└────────────────────────────────────────────────────────┘
```

此时，Xcode 会自动向 Apple 服务器申请免费的开发证书，状态栏显示无任何红色报错即代表签名配置成功！

### 4.3 第三步：iPhone 真机连接与信任授权

1. 使用原装数据线将 iPhone 连接至 Mac，手机屏幕弹出“信任此电脑？”，点击 **信任** 并输入手机锁屏密码；
2. **【iOS 16+ 必做步骤】开启开发者模式**：
   在 iPhone 系统设置中进入 **“设置” -> “隐私与安全性” -> 滑到最底部找到“开发者模式”**，打开开关并按照提示重启手机；
3. 在 Xcode 顶部设备运行目标中，将目标从模拟器切换为你连接的真机名称（如 `Zhang San's iPhone`）；
4. 回到终端执行：
   ```bash
   flutter run -d <你的iPhone设备ID或名称>
   ```
5. **【首次安装信任证书】**：
   应用被安装到 iPhone 后，初次点击图标会弹出提示“不受信任的开发者”。此时在手机中进入：
   **“设置” -> “通用” -> “VPN 与设备管理”**，在“开发者 App”分类下找到你的 Apple ID 邮箱，点击并选择 **“信任此证书”**。

返回手机桌面，再次点击 App 图标，你的 Flutter 电商应用便已在 iPhone 真机上完美启动！

---

## 5. iOS 隐私权限与安全配置 (`Info.plist`)

苹果对用户隐私审查极为严苛，如果应用中调用了相册选择图片（例如修改用户头像）、拍照或定位，必须在 `ios/Runner/Info.plist` 中配置明确的人性化权限申请理由，否则一经调用就会发生崩溃或在上架 App Store 时被拒审。

打开 `ios/Runner/Info.plist`，在 `<dict>` 标签内添加对应配置：

```xml
<!-- ios/Runner/Info.plist -->
<plist version="1.0">
<dict>
    <!-- ... 其他基础配置保持不变 ... -->

    <!-- 1. 本地相册读取权限 (头像上传/扫码选择图片) -->
    <key>NSPhotoLibraryUsageDescription</key>
    <string>极客商城需要访问您的相册以供更换个人头像及晒单评价</string>

    <!-- 2. 相机拍照权限 -->
    <key>NSCameraUsageDescription</key>
    <string>极客商城需要使用您的相机以拍摄商品实物图进行售后评价</string>

    <!-- 3. ATS 网络配置：允许在局域网内发起纯 HTTP 请求进行本地测试 -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
    </dict>

    <!-- 4. 全屏刘海与灵动岛展示支持 -->
    <key>UIViewControllerBasedStatusBarAppearance</key>
    <false/>
</dict>
</plist>
```

---

## 6. iOS 专属交互与视觉规范适配

### 6.1 灵动岛 (Dynamic Island) 与底部安全条 (Home Indicator)

现代 iPhone 取消了物理 Home 键，并在顶部增加了灵动岛。为防止内容贴边发生尴尬的遮盖，页面骨架中必须遵循 `SafeArea` 规则：

```dart
Scaffold(
  // 底部如果有固定按钮（如“立即购买”条），必须包裹 SafeArea 以防被底部黑色横条遮挡
  bottomNavigationBar: SafeArea(
    child: Container(
      height: 56,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: ElevatedButton(...),
    ),
  ),
  body: SafeArea(
    top: true,    // 避开灵动岛和状态栏
    bottom: false,// 底部已由 bottomNavigationBar 处理
    child: YourContentWidget(),
  ),
)
```

### 6.2 苹果侧滑返回手势 (Interactive Pop Gesture)

iOS 用户高度习惯“从屏幕左边缘向右侧滑返回上一页”的手势交互。
- Flutter 的 `MaterialPageRoute` 在 iOS 平台上默认会自动转换物理滑动动效并支持边缘侧滑返回；
- 若使用了 `CupertinoPageRoute`，则能在全平台上强制启用 iOS 经典的毛玻璃层级侧滑返回与视差动效。

---

## 7. 高频排错清单与避坑经验

::: warning 1. 报错：Error output from CocoaPods -- `pod install` failed
**排查步骤**：
1. 先删除锁定文件和缓存：`cd ios && rm -rf Pods Podfile.lock`；
2. 更新本地 Specs：`pod repo update`；
3. 重新安装：`pod install`。
:::

::: tip 2. Apple Silicon (M1/M2/M3) 架构冲突 (x86_64 vs arm64)
在早期 CocoaPods 或特定旧插件中，可能会出现 `Building for iOS Simulator, but linking in dylib built for iOS, file for architecture arm64`。
**解决办法**：在 `ios/Podfile` 最底部追加以下钩子代码：
```ruby
post_install do |installer|
  installer.pods_project.targets.each do |target|
    flutter_additional_ios_build_settings(target)
    target.build_configurations.each do |config|
      config.build_settings['EXCLUDED_ARCHS[sdk=iphonesimulator*]'] = 'arm64'
    end
  end
end
```
:::

---

## 8. 本章小结

在这一章中，我们：
1. 掌握了 iOS 开发环境基线（macOS + Xcode 15+ + Command Line Tools）；
2. 搞定了 CocoaPods 依赖管理机制与 Podfile 调优；
3. 使用 Xcode 完成了免费个人 Apple ID 证书的生成与免付费真机签名；
4. 跑通了 iPhone 开发者模式开启、证书信任与真机流畅运行；
5. 配置了标准的 `Info.plist` 权限文案与全面屏安全区域适配。

至此，我们的应用已经征服了 Android 与 iOS 两大传统移动霸主！在最后一篇 **[HarmonyOS 鸿蒙侧跨端开发与运行 (P103)](./harmonyos.md)** 中，我们将拥抱华为开源鸿蒙生态，探索 Flutter 在 HarmonyOS 上的全新落地路径！
