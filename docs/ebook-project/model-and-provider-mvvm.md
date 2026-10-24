# 5. 领域模型建模与 Provider MVVM 状态流转

> 💡 **本篇导读**：一个优秀的架构应当让 UI 纯粹负责呈现，让业务逻辑与数据流动在 ViewModel 中闭环。本篇将详细剖析电子书城的领域模型设计，以及如何使用 Google 官方推荐的 `Provider` 打造标准化 MVVM 状态流转机制，实现高内聚、低耦合、精细化局部重绘的架构典范。

---

## 1. 领域模型建模 (Domain Models)

在爬虫服务抓取并清洗数据后，必须将其封装为强类型的 Dart 实体类。

### 1.1 图书条目实体 (`lib/models/book_item_model.dart`)

```dart
class BookItemModel {
  final String id;
  final String title;
  final String coverUrl;
  final String authorAndPub;
  final double rating;
  final String reviewCount;
  final String quote;
  final String detailUrl;
  final double price; // 电子书价格

  const BookItemModel({
    required this.id,
    required this.title,
    required this.coverUrl,
    required this.authorAndPub,
    required this.rating,
    required this.reviewCount,
    required this.quote,
    required this.detailUrl,
    this.price = 9.9,
  });

  // 提供浅拷贝方法，方便在状态更新时修改特定属性 (如加入书架状态)
  BookItemModel copyWith({
    String? id,
    String? title,
    String? coverUrl,
    String? authorAndPub,
    double? rating,
    String? reviewCount,
    String? quote,
    String? detailUrl,
    double? price,
  }) {
    return BookItemModel(
      id: id ?? this.id,
      title: title ?? this.title,
      coverUrl: coverUrl ?? this.coverUrl,
      authorAndPub: authorAndPub ?? this.authorAndPub,
      rating: rating ?? this.rating,
      reviewCount: reviewCount ?? this.reviewCount,
      quote: quote ?? this.quote,
      detailUrl: detailUrl ?? this.detailUrl,
      price: price ?? this.price,
    );
  }
}
```

---

## 2. 状态机枚举与通用 ViewModel 基类

为了规范所有页面的加载、成功、空数据与异常状态，定义清晰的状态枚举：

```dart
enum ViewStatus {
  initial, // 初始待命
  loading, // 正在加载 (触发微光骨架屏)
  success, // 成功加载 (展示真实数据)
  empty,   // 空数据状态
  error,   // 异常错误状态
}
```

---

## 3. 豆瓣榜单 ViewModel 实现 (`lib/view_models/douban_provider.dart`)

`DoubanProvider` 负责与 `CrawlerService` 对接，调度数据拉取、支持分页增量拼接与下拉刷新：

```dart
import 'package:flutter/material.dart';
import '../models/book_item_model.dart';
import '../services/crawler_service.dart';

class DoubanProvider extends ChangeNotifier {
  final CrawlerService _crawlerService = CrawlerService();

  ViewStatus _status = ViewStatus.initial;
  List<BookItemModel> _books = [];
  int _currentPage = 0;
  bool _hasMore = true;
  String _errorMessage = '';

  // 对外暴露的只读 Getter
  ViewStatus get status => _status;
  List<BookItemModel> get books => _books;
  bool get hasMore => _hasMore;
  String get errorMessage => _errorMessage;
  bool get isLoading => _status == ViewStatus.loading;

  DoubanProvider() {
    // 实例化时自动触发首屏加载
    fetchInitialBooks();
  }

  /// 首屏加载或下拉刷新
  Future<void> fetchInitialBooks() async {
    _status = ViewStatus.loading;
    _currentPage = 0;
    _hasMore = true;
    notifyListeners(); // 通知视图进入 Shimmer 微光骨架状态

    try {
      final result = await _crawlerService.fetchDoubanTopBooks(page: _currentPage);
      _books = result;
      _status = _books.isEmpty ? ViewStatus.empty : ViewStatus.success;
    } catch (e) {
      _status = ViewStatus.error;
      _errorMessage = '网络不佳，解析失败: $e';
    } finally {
      notifyListeners(); // 刷新真实 UI
    }
  }

  /// 滚动触底加载下一页 (增量追加)
  Future<void> loadMoreBooks() async {
    if (!_hasMore || _status == ViewStatus.loading) return;

    _currentPage++;
    try {
      final moreBooks = await _crawlerService.fetchDoubanTopBooks(page: _currentPage);
      if (moreBooks.isEmpty) {
        _hasMore = false;
      } else {
        _books.addAll(moreBooks);
      }
    } catch (e) {
      _currentPage--; // 回滚页码
    } finally {
      notifyListeners();
    }
  }
}
```

---

## 4. UI 消费 Provider 的三大姿势与性能红线

在 UI 层中获取和消费 Provider 的数据有三种核心方式，其适用场景与性能影响有着天壤之别：

| 消费方式 | 语法示例 | 重绘粒度 | 适用核心场景 |
| :--- | :--- | :--- | :--- |
| **`Consumer<T>`** | `Consumer<DoubanProvider>(builder: ...)` | **局部精准重绘** | **最推荐！** 仅包裹需要随数据变动的具体组件，父级页面不重复 build |
| **`context.watch<T>()`** | `final vm = context.watch<DoubanProvider>()` | **整页全量重绘** | 适合整个页面的核心背景或顶级 Scaffold 需要依赖该数据时 |
| **`context.read<T>()`** | `context.read<DoubanProvider>().loadMore()` | **不监听重绘** | **必须在事件回调中使用**（如 `onPressed`、`onRefresh`），只取实例不触发监听 |

### 4.1 错误反面教材 ❌
```dart
// 致命错误：在 ElevatedButton 回调中使用了 watch()
ElevatedButton(
  onPressed: () {
    // 错误！在回调中调用 watch 会导致监听异常，且引起页面死循环重新 build
    context.watch<DoubanProvider>().fetchInitialBooks(); 
  },
  child: const Text('刷新'),
)
```

### 4.2 工业级规范推荐写法 ✅
```dart
// 正确！回调中只读取方法调用，不建立重绘依赖
ElevatedButton(
  onPressed: () {
    context.read<DoubanProvider>().fetchInitialBooks();
  },
  child: const Text('刷新'),
)
```

---

## 5. 视图层与 Consumer 的实战装配

通过 `Consumer`，我们可以在 `ViewStatus` 处于 `loading` 时精准渲染 **微光骨架屏**，加载完毕后瞬间平滑淡入 **真实书籍卡片**：

```dart
class DoubanStoreView extends StatelessWidget {
  const DoubanStoreView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('豆瓣读书 Top 250')),
      body: Consumer<DoubanProvider>(
        builder: (context, provider, child) {
          // 1. 加载中状态 -> 展示微光流动骨架屏
          if (provider.status == ViewStatus.loading) {
            return const DoubanListSkeleton();
          }

          // 2. 异常失败状态 -> 展示重试缺省页
          if (provider.status == ViewStatus.error) {
            return Center(
              child: ElevatedButton(
                onPressed: () => provider.fetchInitialBooks(),
                child: const Text('重新加载'),
              ),
            );
          }

          // 3. 成功状态 -> 渲染高性能 ListView.builder
          return RefreshIndicator(
            onRefresh: () => provider.fetchInitialBooks(),
            child: ListView.builder(
              itemCount: provider.books.length + 1,
              itemBuilder: (context, index) {
                if (index == provider.books.length) {
                  return provider.hasMore 
                      ? const Center(child: CircularProgressIndicator()) 
                      : const Center(child: Text('已加载全部图书'));
                }
                return BookListCard(book: provider.books[index]);
              },
            ),
          );
        },
      ),
    );
  }
}
```

通过这种标准的 MVVM 实践，所有爬虫业务与复杂的状态分支都在 Provider 中完成了严谨的逻辑闭环，视图层代码纯粹、干净、直观且具备极致的渲染性能！
