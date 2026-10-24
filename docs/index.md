---
layout: home

hero:
  name: "Flutter 全栈开发教程"
  text: "从 Dart 核心语法到电商与电子书城双实战，再到多端适配部署"
  tagline: "配套黑马程序员103集全套视频课程 · 双大厂级实战项目 · AI 辅助编程 · Android / iOS / 鸿蒙HarmonyOS / Web 全覆盖"
  image:
    src: /logo.svg
    alt: Flutter Logo
  actions:
    - theme: brand
      text: 🚀 开始学习课程
      link: /guide/
    - theme: alt
      text: 🛍️ 电商实战项目
      link: /project/
    - theme: alt
      text: 📺 B站课程直达 (103P)
      link: https://www.bilibili.com/video/BV1wR4Xz6EqG/

features:
  - icon: 🎯
    title: 扎实的 Dart 核心功底 (Day 1)
    details: 从基础变量、空安全、数据结构，到面向对象、类继承、接口、Mixin 混入，再到异步 Future 与事件循环，全方位打通 Dart 语言脉络。
  - icon: 🧩
    title: 体系化 Flutter 核心组件 (Day 2)
    details: 深入解析 StatelessWidget 与 StatefulWidget 生命周期、各种排版布局、滚动视图、组件通信、Dio 网络请求封装与高级路由系统。
  - icon: 🛍️
    title: 实战一：仿电商商城项目 (GetX)
    details: 包含底部导航栏、轮播图、分类推荐、上拉加载、下拉刷新、用户登录验证、GetX 响应式状态管理、Token 本地持久化与通用弹窗封装。
  - icon: 📚
    title: 实战二：豆瓣电子书城 APP (Provider)
    details: 基于豆瓣阅读/读书真实生态，涵盖 HTML DOM 爬虫逆向提取、Provider MVVM 状态流转、微光骨架屏动效、明暗主题与懒加载导航。
  - icon: 📱
    title: 全平台多端部署与适配
    details: 不仅包含常规的 Web 与 Android 原生打包，还涵盖 Mac/iOS 运行调试以及华为鸿蒙 HarmonyOS 侧 Flutter 跨端实战。
  - icon: 💻
    title: 内置交互式代码与真机模拟器
    details: 网页内嵌手机模拟器与 Dart 交互式控制台，支持代码实时效果预览、状态变更查看与核心逻辑验证。
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, #02569B 30%, #0175C2);
}
</style>

## 课程体系大纲路线

```
Flutter 全栈开发与实战 (共 103 集)
│
├── 🚀 导学与基础准备篇 (P1 - 环境概览)
│   ├── Flutter 跨平台愿景与核心架构
│   └── Dart & Flutter SDK 安装与 VSCode/Trae 插件配置
│
├── 📘 第一阶段：Dart 编程语言基础与进阶 (P2 - P37)
│   ├── 变量、常量、String / num / bool / List / Map / dynamic
│   ├── 空安全机制 (Null Safety)、各类运算符与分支循环
│   ├── 函数定义、可选命名参数、箭头函数与闭包
│   ├── 面向对象：类、构造函数语法糖、继承、多态、接口与 Mixin
│   └── 泛型、异步编程、Future 链式调用与 async/await
│
├── 📱 第二阶段：Flutter 核心框架与组件实战 (P38 - P79)
│   ├── 项目创建、目录结构剖析、runApp 与 Widget 本质
│   ├── MaterialApp、Scaffold 脚手架与无状态/有状态生命周期
│   ├── 布局体系：Container、Padding、Row、Column、Flex、Wrap、Stack
│   ├── UI与滚动：Text、Image、TextField、ListView、GridView、CustomScrollView
│   ├── 组件通信：父传子、子传父与状态提升
│   ├── 网络请求：Dio 基础与拦截器封装、Web 端跨域处理
│   └── 路由管理：基本路由、命名路由传参、404 与路由守卫拦截
│
├── 🛍️ 第三阶段：仿电商实战项目与多端适配 (P80 - P103)
│   ├── 项目搭建、Git 管理与 TabBar 底部导航
│   ├── 首页布局、Banner 轮播图与分类推荐网格 (结合 AI 辅助)
│   ├── 下拉刷新、上拉加载更多、GlobalKey 与轻提示
│   ├── 我的页面布局、登录表单校验与身份验证
│   ├── GetX 响应式状态管理、Token 本地持久化与通用弹窗封装
│   └── 多端适配：Android 打包运行、iOS 编译调试、HarmonyOS 鸿蒙适配
│
└── 📚 拓展阶段：豆瓣电子书城 APP 实战 (进阶实战二)
    ├── 项目概述、架构分层与 flutter_screenutil 屏幕自适应 (375x812)
    ├── ThemeProvider 明暗双主题系统与高颜值 SalomonBottomBar 导航栏
    ├── 懒加载堆栈 LazyLoadIndexedStack 解决多Tab性能开销
    ├── Dio + package:html 豆瓣阅读 & 豆瓣读书 HTML DOM 爬虫逆向工程
    ├── 领域实体建模与 Provider (6.1.2) MVVM 响应式状态驱动
    ├── 7套业务组件与微光流动骨架屏 (Shimmer Skeletons) 体系封装
    └── 沉浸式图书详情页、星级评分条、书架收藏与轻量级阅读器
```
