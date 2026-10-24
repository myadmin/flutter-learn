# 4. Dio 网络客户端封装与 HTML DOM 爬虫逆向工程

> 💡 **本篇导读**：在实际开发中，很多高质量内容平台（如豆瓣读书、豆瓣阅读、学术文库等）并未对个人开发者开放完全开放的 RESTful JSON 接口。本篇将详细讲解如何使用 `Dio` 打造高可用网络请求层，并结合 `package:html` 解析引擎进行 HTML DOM 逆向抓取，完成从网页内容到结构化 Dart 实体数据的华丽转换。

---

## 1. 爬虫逆向工程的核心原理与防反爬策略

### 1.1 传统 JSON API vs HTML DOM 逆向解析
- **传统 API**：服务端返回 `application/json` 规范数据，客户端通过 `jsonDecode` 直接反序列化为 Map/Model。
- **爬虫解析**：客户端向 Web 目标服务器发起 GET 请求获取原始 `text/html` 文档，利用 **CSS 选择器（CSS Selector）**定位特定 HTML 标签（如 `<div class="item">`），提取其内部的文本节点或属性节点（如 `img` 的 `src`）。

### 1.2 豆瓣反爬虫机制与客户端伪装三要素
豆瓣等主流网站具备较严格的反爬安全策略，若直接用未经修饰的请求可能返回 `403 Forbidden`。我们需要进行客户端伪装：
1. **真实浏览器 User-Agent 伪装**：模拟标准桌面/移动 Chrome 浏览器标识；
2. **Accept & Accept-Language 标头**：声明合法的文本解析头与 `zh-CN` 语言偏好；
3. **合理的重试与兜底缓存**：遇到网络阻塞或封禁时，自动优雅降级为本地预置的高清 Mock 离线数据，保障 App 绝对不闪退白屏。

---

## 2. Dio 网络层单例封装 (`lib/services/api_client.dart`)

我们封装支持伪装头、超时控制与请求日志追踪的单例 `ApiClient`：

```dart
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

class ApiClient {
  // 单例模式构建
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late final Dio dio;

  ApiClient._internal() {
    dio = Dio(
      BaseOptions(
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          // 伪装为标准的现代浏览器 UA
          'User-Agent':
              'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
      ),
    );

    // 仅在 Debug 模式下打印网络请求日志
    if (kDebugMode) {
      dio.interceptors.add(
        LogInterceptor(
          requestHeader: false,
          responseHeader: false,
          requestBody: false,
          responseBody: false,
        ),
      );
    }
  }

  // 统一的 GET 请求通用包装
  Future<String> getHtml(String url, {Map<String, dynamic>? queryParameters}) async {
    try {
      final response = await dio.get<String>(
        url,
        queryParameters: queryParameters,
        options: Options(responseType: ResponseType.plain),
      );
      return response.data ?? '';
    } catch (e) {
      debugPrint('网络请求异常 [$url]: $e');
      rethrow;
    }
  }
}
```

---

## 3. HTML DOM 树解析神器：package:html

在 `pubspec.yaml` 中引入官方支持的 HTML 解析库：
```yaml
dependencies:
  html: ^0.15.4
```

核心 API 简析：
- `parse(htmlString)`：将长 HTML 文本编译为整棵 DOM `Document` 树；
- `document.querySelector('selector')`：查找匹配 CSS 选择器的**第一个**元素；
- `document.querySelectorAll('selector')`：查找所有匹配的元素列表；
- `element.text`：提取元素内部的纯文本（支持 `.trim()` 去除首尾空白）；
- `element.attributes['attributeName']`：提取 HTML 标签的属性值（如 `href`、`src`）。

---

## 4. 爬虫实战：豆瓣读书 Top 250 列表解析 (`lib/services/crawler_service.dart`)

分析豆瓣读书的 HTML 结构，每一本书对应一个表格 `<tr class="item">`：

```html
<!-- 豆瓣读书 HTML 典型片段结构 -->
<tr class="item">
  <td width="100" valign="top">
    <a class="nbg" href="https://book.douban.com/subject/1084336/">
      <img src="https://img1.doubanio.com/view/subject/s/public/s1070222.jpg" />
    </a>
  </td>
  <td valign="top">
    <div class="pl2">
      <a href="https://book.douban.com/subject/1084336/" title="追风筝的人">追风筝的人</a>
    </div>
    <p class="pl">[美] 卡勒德·胡赛尼 / 李继宏 / 上海人民出版社 / 2006-5 / 29.00元</p>
    <div class="star clearfix">
      <span class="rating_nums">8.9</span>
      <span class="pl">(901243人评价)</span>
    </div>
    <p class="quote"><span class="inq">为您，千千万万遍。</span></p>
  </td>
</tr>
```

基于此结构编写爬虫提取逻辑：

```dart
import 'package:html/parser.dart' as html_parser;
import 'package:html/dom.dart';
import '../models/book_item_model.dart';
import 'api_client.dart';

class CrawlerService {
  final ApiClient _client = ApiClient();

  /// 抓取豆瓣读书排行榜
  Future<List<BookItemModel>> fetchDoubanTopBooks({int page = 0}) async {
    // 豆瓣分页公式：start = page * 25
    final url = 'https://book.douban.com/top250?start=${page * 25}';

    try {
      final htmlStr = await _client.getHtml(url);
      final document = html_parser.parse(htmlStr);

      // 1. 定位所有包含书籍条目的 tr.item 节点
      final List<Element> itemElements = document.querySelectorAll('tr.item');

      final List<BookItemModel> books = [];

      for (final item in itemElements) {
        // 2. 提取书名与跳转 URL
        final titleElement = item.querySelector('div.pl2 a');
        final title = titleElement?.text.replaceAll(RegExp(r'\s+'), ' ').trim() ?? '未知书名';
        final detailUrl = titleElement?.attributes['href'] ?? '';

        // 3. 提取高清图书封面
        final coverElement = item.querySelector('a.nbg img');
        final coverUrl = coverElement?.attributes['src'] ?? '';

        // 4. 提取作者与出版信息
        final pubElement = item.querySelector('p.pl');
        final pubInfo = pubElement?.text.trim() ?? '';

        // 5. 提取评分与评分人数
        final scoreElement = item.querySelector('span.rating_nums');
        final score = double.tryParse(scoreElement?.text.trim() ?? '0.0') ?? 0.0;

        final reviewCountElement = item.querySelector('span.pl');
        final reviewCount = reviewCountElement?.text.trim() ?? '';

        // 6. 提取金句一句话书评
        final quoteElement = item.querySelector('p.quote span.inq');
        final quote = quoteElement?.text.trim() ?? '';

        books.add(BookItemModel(
          id: _extractIdFromUrl(detailUrl),
          title: title,
          coverUrl: coverUrl,
          authorAndPub: pubInfo,
          rating: score,
          reviewCount: reviewCount,
          quote: quote,
          detailUrl: detailUrl,
        ));
      }

      return books;
    } catch (e) {
      // 网络被拦截或离线时，优雅返回兜底精选数据，保障 App 健壮性
      return _getMockFallbackBooks();
    }
  }

  String _extractIdFromUrl(String url) {
    final reg = RegExp(r'subject/(\d+)');
    return reg.firstMatch(url)?.group(1) ?? DateTime.now().millisecondsSinceEpoch.toString();
  }

  // 兜底离线精选数据
  List<BookItemModel> _getMockFallbackBooks() {
    return [
      BookItemModel(
        id: '1084336',
        title: '追风筝的人',
        coverUrl: 'https://img1.doubanio.com/view/subject/s/public/s1070222.jpg',
        authorAndPub: '[美] 卡勒德·胡赛尼 / 上海人民出版社',
        rating: 8.9,
        reviewCount: '(90万人评价)',
        quote: '为您，千千万万遍。',
        detailUrl: '',
      ),
      BookItemModel(
        id: '1007305',
        title: '解忧杂货店',
        coverUrl: 'https://img1.doubanio.com/view/subject/s/public/s27264181.jpg',
        authorAndPub: '[日] 东野圭吾 / 南海出版公司',
        rating: 8.5,
        reviewCount: '(85万人评价)',
        quote: '现代人内心流失的东西，这家杂货店能帮你找回。',
        detailUrl: '',
      ),
    ];
  }
}
```

---

## 5. 图书详情与书评深度解析

图书详情页包含了多段富文本介绍与读者评论列表，解析逻辑同样基于层级选择器：

```dart
/// 解析图书详情大页
Future<BookDetailModel> fetchBookDetail(String detailUrl) async {
  final htmlStr = await _client.getHtml(detailUrl);
  final doc = html_parser.parse(htmlStr);

  // 提取多行简介正文
  final introElements = doc.querySelectorAll('#link-report .intro p');
  final intro = introElements.map((e) => e.text.trim()).join('\n\n');

  // 提取短评列表
  final commentElements = doc.querySelectorAll('#comments-section .comment-item');
  final reviews = commentElements.map((el) {
    final author = el.querySelector('.comment-info a')?.text.trim() ?? '书友';
    final content = el.querySelector('.comment-content .short')?.text.trim() ?? '';
    final ratingClass = el.querySelector('.comment-info .rating')?.attributes['class'] ?? '';
    // 解析 class="allstar50 rating" 中的评分
    final star = _parseStarFromClass(ratingClass);
    return ReviewModel(author: author, content: content, star: star);
  }).toList();

  return BookDetailModel(intro: intro, reviews: reviews);
}
```

---

## 6. 核心总结

通过本篇的实现，我们建立了一套**高容错、防反爬、易扩展的移动端爬虫管道**：
1. **网络层**负责处理 Cookie、代理以及浏览器指纹伪装；
2. **解析层**利用 CSS 选择器精准下刀，抽丝剥茧抽取纯净的文本与多媒体资源；
3. **容错层**在遇到反爬拦截或断网时无缝降级，构建工业级高可用的现代 App。
