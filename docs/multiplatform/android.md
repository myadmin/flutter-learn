# Android 环境搭建与真机打包运行 (P99-P100)

Android 是 Flutter 跨端开发最核心的阵地。在实际商业交付中，如何将开发环境从纯 Flutter 扩展到能够驾驭 Android 原生工具链、如何解决国内网络下 Gradle 构建缓慢、如何连接真机进行丝滑调试，以及如何完成规范的企业级 **Release 正式包生成、数字签名与体积极致瘦身**，是每一位 Flutter 工程师的必修功课。

本篇（对应课程 P99 至 P100 集）将带你打通 Android 平台从环境准备到正式上架打包的全流程。

<BiliVideoPlayer episodes="99-100" :p="99" />

---

## 1. Android 开发环境完整搭建

### 1.1 JDK 17 安装与环境变量

现代 Flutter 3.x 及 Android Gradle Plugin 8.x 强烈推荐使用 **JDK 17**。

1. **下载与安装**：推荐从 [Oracle 官网](https://www.oracle.com/java/technologies/downloads/#java17) 或开源的 [Adoptium (Temurin 17)](https://adoptium.net/) 下载安装包。
2. **配置环境变量**：
   - 新建系统环境变量 `JAVA_HOME`，值为 JDK 安装路径（如 `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot`）；
   - 在系统 `Path` 中追加 `%JAVA_HOME%\bin`。
3. **验证安装**：
   ```bash
   java -version
   ```
   输出中包含 `openjdk version "17.0.x"` 即代表就绪。

### 1.2 Android Studio 与必备 SDK 组件

1. 下载并安装官方最新版 **Android Studio**；
2. 打开 Android Studio，进入 **Settings (Preferences) -> Languages & Frameworks -> Android SDK**；
3. 在 **SDK Platforms** 标签页中勾选最新的稳定版（如 Android 14.0 "UpsideDownCake" / API 34）；
4. **【关键步骤】** 切换到 **SDK Tools** 标签页，确保以下核心组件被勾选并安装：
   - `Android SDK Build-Tools`
   - `Android SDK Command-line Tools (latest)` **（必须安装，否则 flutter doctor 会报警）**
   - `Android SDK Platform-Tools`
   - `Android Emulator`

### 1.3 接受 Android 证书许可协议

打开终端，运行 Flutter 诊断工具：

```bash
flutter doctor --android-licenses
```

终端会连续列出多个 Android SDK 授权协议条款，输入 `y` 并按回车全部接受。随后再次执行 `flutter doctor`，确保 Android 工具链一栏全部打勾（绿色 `[✓]`）。

---

## 2. Gradle 构建系统详解与国内网络加速

Flutter 项目的 Android 宿主代码位于项目根目录的 `android/` 下，采用 Gradle 进行依赖管理与编译构建。

在初次构建时，Gradle 会自动从海外 Google Maven 和 Maven Central 下载数十个依赖包，极易因网络超时报错。我们必须将其配置为国内高速镜像。

### 2.1 配置阿里云国内 Maven 镜像

编辑 `android/build.gradle`（或在新版 Gradle 中的 `settings.gradle`），配置阿里云镜像仓库：

```groovy
// android/build.gradle
allprojects {
    repositories {
        // 1. 优先使用阿里云 Google 与 Central 镜像
        maven { url 'https://maven.aliyun.com/repository/google' }
        maven { url 'https://maven.aliyun.com/repository/public' }
        maven { url 'https://maven.aliyun.com/repository/gradle-plugin' }

        google()
        mavenCentral()
    }
}
```

### 2.2 解决 Gradle Wrapper 下载卡死

如果首次编译时卡在 `Downloading https://services.gradle.org/distributions/gradle-x.x-all.zip`：

打开 `android/gradle/wrapper/gradle-wrapper.properties`，将下载地址替换为国内腾讯镜像或腾讯云镜像：

```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
# 将 services.gradle.org 替换为国内镜像
distributionUrl=https\://mirrors.cloud.tencent.com/gradle/gradle-8.3-all.zip
```

---

## 3. 模拟器与真机调试技巧

### 3.1 Android AVD 模拟器启动

在 Android Studio 中打开 **Device Manager**，点击 **Create Virtual Device**：
- 推荐硬件：Pixel 6 / 7 Pro；
- 系统镜像：推荐下载带 `Google Play` 标签的 x86_64 架构镜像；
- 启动模拟器后，在 VS Code 或终端中运行：
  ```bash
  flutter run
  ```

### 3.2 Android 真实手机 USB 调试

真机运行能够最真实地反映硬件性能、触摸反馈与手势流畅度。

1. **开启手机开发者模式**：
   进入手机系统“设置” -> “关于手机”，连续快速点击“版本号（Build Number）”7次，直到提示“您已处于开发者模式”。
2. **启用 USB 调试**：
   进入“系统和更新” -> “开发人员选项”，打开 **USB 调试（USB Debugging）** 开关。
3. **建立连接与授权**：
   使用数据线将手机连接到电脑，手机屏幕会弹出“允许 USB 调试吗？”，勾选“始终允许这台计算机”并点击“确定”。
4. **验证连接**：
   在电脑终端输入：
   ```bash
   adb devices
   ```
   若输出中显示设备序列号及 `device` 字样，说明连接成功：
   ```text
   List of devices attached
   872X0ABCD921    device
   ```

### 3.3 WiFi 无线 ADB 调试 (免数据线)

如果不想一直插着数据线调试，在手机与电脑处于**同一局域网 WiFi** 下时，可开启无线 ADB：

```bash
# 1. 确保手机已通过 USB 数据线连接，运行以下命令开启 5555 监听端口
adb tcpip 5555

# 2. 拔掉 USB 数据线！查看手机 WiFi 设置中的局域网 IP（例如 192.168.1.108）
adb connect 192.168.1.108:5555

# 3. 检查连接状态
adb devices
# 输出：192.168.1.108:5555 device
```
随后即可像连接数据线一样，享受自由无线热重载！

---

## 4. Release 正式生产包签名全流程

### 4.1 为什么必须配置正式签名？

- **Debug 模式下的 APK**：使用默认的 `debug.keystore` 进行临时签名，仅供本地测试，严禁用于商业分发。Debug 包包含 JIT 编译运行时，体积庞大且运行卡顿；
- **Release 模式下的 APK**：代码经由 AOT 提前编译为高能原生指令，开启混淆与无用资源剔除，并且必须由开发者专属的私钥签名，方可在各大 Android 应用市场（华为、小米、OPPO、vivo、应用宝等）发布或更新。

### 4.2 第一步：使用 keytool 生成密钥库 (Keystore)

打开终端，运行 Java 提供的 `keytool` 工具生成密钥库文件（推荐存储在 `android/app/` 目录下）：

```bash
# 进入 android/app 目录
cd android/app

# 生成一个有效期 25 年的 release 签名密钥库
keytool -genkey -v -keystore geekmall-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias geekmall_key
```

终端会依次提示你输入：
1. **密钥库密码**（请务必牢记，如 `GeekMall2026Pass`）；
2. 您的名字与姓氏、组织单位、城市、省份、国家代码（CN）；
3. 确认所有信息后输入 `y`。

执行完成后，`android/app/` 目录下将生成 `geekmall-release-key.jks` 文件。

### 4.3 第二步：创建敏感信息配置文件 (`key.properties`)

为了防止将签名密码硬编码在源码中提交到 GitHub，我们建立一个外部属性文件 `android/key.properties`：

```properties
# android/key.properties
storePassword=GeekMall2026Pass
keyPassword=GeekMall2026Pass
keyAlias=geekmall_key
storeFile=geekmall-release-key.jks
```

> **安全红线**：
> 确保 `android/key.properties` 和 `*.jks`、`*.keystore` 已经写入了根目录的 `.gitignore` 中！

### 4.4 第三步：在 Gradle 中配置 Release 签名规则

打开 `android/app/build.gradle`，在 `android { ... }` 闭包中读取 `key.properties` 并配置签名：

```groovy
// android/app/build.gradle
plugins {
    id "com.android.application"
    id "kotlin-android"
    id "dev.flutter.flutter-gradle-plugin"
}

// 1. 读取本地 key.properties
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    namespace "com.geekmall.geek_mall"
    compileSdk flutter.compileSdkVersion
    ndkVersion flutter.ndkVersion

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = '17'
    }

    defaultConfig {
        applicationId "com.geekmall.geek_mall"
        minSdkVersion 21        // 推荐支持最低 Android 5.0
        targetSdkVersion 34     // 适配最新 Android 14
        versionCode flutterVersionCode.toInteger()
        versionName flutterVersionName
    }

    // 2. 配置签名信息
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }

    buildTypes {
        release {
            // 3. 将 Release 构建类型绑定到上述签名配置
            signingConfig signingConfigs.release

            // 启用代码压缩混淆与无用资源剥离
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## 5. 正式包编译构建与体积极致瘦身

配置好签名后，回到 Flutter 项目根目录，执行构建命令。

### 5.1 通用全架构发布包构建

```bash
flutter build apk --release
```

- **生成产物路径**：`build/app/outputs/flutter-apk/app-release.apk`
- **特点**：集成了 `arm64-v8a`、`armeabi-v7a` 和 `x86_64` 所有架构动态库，兼容性最好，但包体积通常在 30MB ~ 50MB 之间。

### 5.2 极致瘦身：按 CPU 架构拆包 (Split Per ABI)

在实际商业分发中，超过 95% 的现代 Android 手机均为 64 位架构（`arm64-v8a`）。通过分包构建，可以使单个 APK 体积暴降 60% 以上：

```bash
flutter build apk --split-per-abi --release
```

构建完成后，会在 `build/app/outputs/flutter-apk/` 下生成三个独立的 APK：
1. `app-arm64-v8a-release.apk`：面向主流 64 位旗舰手机，**体积仅约 15MB**！
2. `app-armeabi-v7a-release.apk`：面向老旧 32 位设备；
3. `app-x86_64-release.apk`：面向模拟器与特定平板。

上传国内应用商店时，直接上传 `app-arm64-v8a-release.apk` 即可大幅提升用户在应用市场的下载转化率。

### 5.3 国际市场：Google Play App Bundle (AAB)

如果要发布到 Google Play 国际市场，Google 官方强制要求使用 AAB 格式：

```bash
flutter build appbundle --release
```
生成产物为：`build/app/outputs/bundle/release/app-release.aab`。Google Play 商店会根据每位用户的机型硬件，动态组装出体积最小的定制 APK 推送给用户。

---

## 6. 常见编译报错与高频排坑清单

::: warning 1. 报错：A problem occurred evaluating project ':app'. > Namespace not specified.
**原因**：Android Gradle Plugin 8.0+ 强制要求每个模块显式声明 `namespace`。
**修复**：在 `android/app/build.gradle` 的 `android { ... }` 内部显式加上：
```groovy
android {
    namespace "com.geekmall.geek_mall"
    // ...
}
```
:::

::: tip 2. 报错：uses-sdk:minSdkVersion 16 cannot be smaller than version 21
**原因**：某些第三方插件（如相机、Webview 或加密库）要求的最低 Android API 等级为 21。
**修复**：在 `android/app/build.gradle` 中将 `minSdkVersion` 改为 `21` 或以上。
:::

::: info 3. 开启混淆后特定 Model 反序列化闪退
**原因**：R8 代码混淆在 Release 打包时把实体类字段名重命名为 `a`, `b`, `c`，导致 `fromJson` 匹配不到字段。
**修复**：在 `android/app/proguard-rules.pro` 中加入防混淆保留规则：
```proguard
# 保持所有数据实体模型不被混淆
-keep class com.geekmall.geek_mall.models.** { *; }
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
```
:::

---

## 7. 本章小结

在这一章中，我们：
1. 完整梳理了 Android JDK 17、Android Studio SDK 命令行工具链的搭建与证书协议接收；
2. 彻底攻克了 Gradle 编译慢、国内网络超时的难题，配置了阿里云与镜像加速源；
3. 掌握了 AVD 模拟器、真机 USB 调试以及高效无线的 WiFi ADB 调试手法；
4. 规范落地了生产环境 `keytool` 密钥生成、`key.properties` 隔离、Gradle 签名配置闭环；
5. 掌握了 `--split-per-abi` 架构拆包技术，将发布物体积压缩至极致。

下一篇 **[iOS 环境配置与编译运行 (P102)](./ios.md)**，我们将移师苹果开发生态，攻克 Xcode 签名证书、CocoaPods 依赖调优与 iOS 规范适配！
