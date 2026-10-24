import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Flutter 全栈自学教程',
  description: '基于黑马程序员Flutter从入门到实战全套教程，涵盖Dart语法、Flutter核心组件、AI辅助开发、仿电商项目实战与多端部署',
  lang: 'zh-CN',
  base: process.env.BASE_PATH || (process.env.GITHUB_ACTIONS ? '/flutter-learn/' : '/'),
  head: [
    ['link', { rel: 'icon', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#02569B' }],
    ['meta', { name: 'author', content: 'Antigravity Team' }],
    ['meta', { name: 'keywords', content: 'Flutter, Dart, VitePress, Android, iOS, HarmonyOS, Web, 黑马程序员' }]
  ],
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Flutter 教程网',
    nav: [
      { text: '首页', link: '/' },
      { text: '导学指南', link: '/guide/', activeMatch: '^/guide/' },
      { text: 'Dart核心语法', link: '/dart/', activeMatch: '^/dart/' },
      { text: 'Flutter核心组件', link: '/flutter-core/', activeMatch: '^/flutter-core/' },
      { text: '电商实战项目', link: '/project/', activeMatch: '^/project/' },
      { text: '多端部署适配', link: '/multiplatform/', activeMatch: '^/multiplatform/' },
      {
        text: '课程原版视频',
        items: [
          { text: 'B站教程视频 (103集全)', link: 'https://www.bilibili.com/video/BV1wR4Xz6EqG/' }
        ]
      }
    ],
    sidebar: {
      '/guide/': [
        {
          text: '导学与准备',
          items: [
            { text: '课程整体介绍与导学 (P1)', link: '/guide/' },
            { text: '开发环境搭建与工具链准备', link: '/guide/environment' }
          ]
        }
      ],
      '/dart/': [
        {
          text: 'Day 1: Dart 语言基础与进阶',
          items: [
            { text: 'Dart 语言简介与环境搭建 (P2)', link: '/dart/' },
            { text: '变量常量与基本数据类型 (P3-P12)', link: '/dart/variables-and-types' },
            { text: '空安全机制与运算符 (P13-P15)', link: '/dart/null-safety-and-operators' },
            { text: '流程控制与函数详解 (P16-P23)', link: '/dart/control-flow-and-functions' },
            { text: '面向对象：类、继承、多态与Mixin (P24-P32)', link: '/dart/oop-classes-and-inheritance' },
            { text: '泛型编程与异步Future (P33-P37)', link: '/dart/generics-and-async' }
          ]
        }
      ],
      '/flutter-core/': [
        {
          text: 'Day 2: Flutter 核心框架与组件',
          items: [
            { text: 'Flutter 项目架构与目录结构 (P38-P41)', link: '/flutter-core/' },
            { text: '核心脚手架与组件生命周期 (P42-P50)', link: '/flutter-core/widget-basics-lifecycle' },
            { text: '界面排版与基础布局组件 (P51-P59)', link: '/flutter-core/layout-widgets' },
            { text: '常用UI控件与滚动视图组件 (P60-P67)', link: '/flutter-core/basic-and-scroll-widgets' },
            { text: '组件通信与状态提升 (P68-P69)', link: '/flutter-core/component-communication' },
            { text: 'Dio 网络请求与工具封装 (P70-P73)', link: '/flutter-core/network-dio' },
            { text: '路由导航管理与传参系统 (P74-P79)', link: '/flutter-core/routing-navigation' }
          ]
        }
      ],
      '/project/': [
        {
          text: 'Day 3: 仿电商实战项目',
          items: [
            { text: '电商项目架构与Git版本管理 (P80-P81)', link: '/project/' },
            { text: '主页Tab切换与轮播图展示 (P82-P86)', link: '/project/home-and-tabs' },
            { text: '分类网格与特惠爆款推荐(AI辅助) (P87-P89)', link: '/project/category-and-recommend' },
            { text: '推荐商品流下拉刷新与上拉加载 (P90-P92)', link: '/project/pull-refresh-infinite-scroll' },
            { text: '个人中心与用户登录表单验证 (P93-P95)', link: '/project/profile-and-auth' },
            { text: 'GetX 全局状态、持久化与通用弹窗 (P96-P98)', link: '/project/getx-state-and-token' }
          ]
        }
      ],
      '/multiplatform/': [
        {
          text: 'Day 3: 多端适配与打包部署',
          items: [
            { text: 'Flutter 多端适配全景与完结概述 (P103)', link: '/multiplatform/' },
            { text: 'Android 环境搭建与真机打包运行 (P99-P100)', link: '/multiplatform/android' },
            { text: 'iOS 环境配置与编译运行 (P101)', link: '/multiplatform/ios' },
            { text: 'HarmonyOS 鸿蒙侧跨端开发与运行 (P102)', link: '/multiplatform/harmonyos' }
          ]
        }
      ]
    },
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档'
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭'
            }
          }
        }
      }
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/myadmin/flutter-learn' }
    ],
    footer: {
      message: '基于黑马程序员Flutter从入门到实战全套教程制作 | 包含Dart基础、Flutter核心、AI开发与多端部署',
      copyright: 'Copyright © 2026 Flutter 学习教程网'
    },
    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },
    outline: {
      level: [2, 3],
      label: '本页目录'
    }
  }
})
