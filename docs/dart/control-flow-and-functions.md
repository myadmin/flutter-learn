# 流程控制与函数详解 (P16-P23)

在任何现代编程语言中，控制流语句赋予了程序逻辑决策的能力，而函数则是封装与复用逻辑的基本单元。

在 Dart 中，函数是拥有最高地位的**“一等公民”（First-Class Citizen）**。此外，Dart 的**命名参数（Named Parameters）**与**可选参数**体系是整个 Flutter 声明式 UI 控件树搭建的语法根基。本篇将深入剖析流程控制结构与函数的方方面面。

<BiliVideoPlayer episodes="16-23" :p="16" />

---

## 1. 条件分支语句 (P16-P17)

### 1.1 `if - else if - else` 条件判断

Dart 的 `if` 语句要求条件表达式必须是**严格的 `bool` 类型**（不可使用数值 0 或非空对象充当条件）。

```dart
void evaluateScore(double score) {
  if (score >= 90) {
    print('等级: 优秀 (A)');
  } else if (score >= 80) {
    print('等级: 良好 (B)');
  } else if (score >= 60) {
    print('等级: 及格 (C)');
  } else {
    print('等级: 不及格 (D)');
  }
}
```

### 1.2 三元条件表达式 (Ternary Operator)

对于简短的二选一赋值或逻辑分支，三元表达式 `condition ? expr1 : expr2` 能够显著精简代码：

```dart
bool isLoggedIn = true;
String statusText = isLoggedIn ? '欢迎回来，VIP 用户' : '请先登录';

// 在 Flutter UI 中极高频用于动态条件渲染
// child: isLoaded ? HomeView() : LoadingIndicator()
```

### 1.3 `switch - case` 语句与 Dart 3 模式匹配

#### 传统 switch-case
在传统的 switch 语句中，支持 `int`、`String`、`enum` 等常量匹配。在非空 case 分支中通常需要显式 `break` 或 `return`：

```dart
enum OrderStatus { pending, paid, shipped, completed, cancelled }

void handleOrderStatus(OrderStatus status) {
  switch (status) {
    case OrderStatus.pending:
      print('订单待支付');
      break;
    case OrderStatus.paid:
      print('订单已付款，等待发货');
      break;
    case OrderStatus.shipped:
      print('包裹运输中');
      break;
    case OrderStatus.completed:
    case OrderStatus.cancelled:
      print('订单生命周期结束');
      break;
  }
}
```

#### Dart 3 现代模式匹配 Switch 表达式 (Pattern Matching Expression)
在 Dart 3 中，`switch` 可以作为**表达式直接返回值**，语法极度优雅：

```dart
String getStatusDescription(OrderStatus status) => switch (status) {
  OrderStatus.pending   => '等待买家付款',
  OrderStatus.paid      => '商家正在打包',
  OrderStatus.shipped   => '快递正在派送',
  OrderStatus.completed => '交易已完成',
  OrderStatus.cancelled => '交易已取消',
};
```

---

## 2. 循环控制语句 (P18)

### 2.1 传统 `for` 循环与 `for-in` 迭代

```dart
// 1. 传统计数器 for 循环 (适用于需要控制步长或索引的场景)
for (int i = 0; i < 5; i++) {
  // print('当前步长: $i');
}

// 2. 现代 for-in 循环 (遍历 Iterable / List / Set 最推荐写法)
List<String> frameworks = ['Flutter', 'React Native', 'Kotlin Multiplatform'];
for (final item in frameworks) {
  print('跨端方案: $item');
}
```

### 2.2 `while` 与 `do-while`

```dart
// 1. while: 先判断条件，再执行循环体
int retry = 0;
while (retry < 3) {
  print('第 ${retry + 1} 次尝试请求数据...');
  retry++;
}

// 2. do-while: 先执行一次循环体，再判断条件 (至少执行一次)
int attempt = 0;
do {
  print('执行安全初始化检测');
  attempt++;
} while (attempt < 1);
```

### 2.3 `break`、`continue` 与带标签跳转 (Labels)

当遇到多层嵌套循环时，Dart 支持使用 `label:` 标签精确跳出或继续指定层级的循环：

```dart
outerLoop:
for (int i = 1; i <= 3; i++) {
  for (int j = 1; j <= 3; j++) {
    if (i == 2 && j == 2) {
      print('触发命中条件，直接跳出最外层循环 outerLoop');
      break outerLoop; // 直接终止外层循环
    }
    print('i=$i, j=$j');
  }
}
```

---

## 3. 函数的定义与一等公民地位 (P19)

### 3.1 函数基本定义语法

标准的 Dart 函数由**返回值类型**、**函数名**、**形参列表**和**函数体**组成：

```dart
// 标准函数定义
int calculateArea(int width, int height) {
  return width * height;
}

// 若无返回值，显式指定 void
void logMessage(String message) {
  print('[LOG ${DateTime.now()}]: $message');
}
```

> **类型推断说明**：虽然 Dart 允许省略返回值类型（如 `calculateArea(w, h)`），但官方强烈建议为所有公共函数显式声明返回值类型，提升团队可读性。

### 3.2 函数作为一等公民 (First-Class Objects)

在 Dart 中，函数本身就是一个对象，其类型是 `Function`。这意味着函数可以：
1. **赋值给变量**；
2. **作为参数传递给其他函数**；
3. **从其他函数作为返回值返回**（高阶函数）。

```dart
// 1. 函数赋值给变量
void sayHello() => print('你好，Dart！');
Function greetFn = sayHello;
greetFn(); // 执行

// 2. 函数作为参数传递 (回调机制)
void executeOperation(int a, int b, int Function(int, int) operation) {
  int result = operation(a, b);
  print('高阶函数运算结果: $result');
}

executeOperation(10, 20, (x, y) => x + y); // 传递匿名函数相加，输出: 30
executeOperation(10, 20, (x, y) => x * y); // 传递乘法运算，输出: 200
```

---

## 4. 函数参数全解：位置参数与命名参数 (P20-P21)

参数传递是 Dart 区别于很多传统面向对象语言（如 Java）的核心亮点，也是**理解 Flutter Widget 配置机制的关键所在**。

Dart 的参数分为两大类别：**位置参数 (Positional Parameters)** 和 **命名参数 (Named Parameters)**。

### 4.1 必选位置参数 (Required Positional Parameters)

最常见的参数形式，实参与形参在位置上一一对应：

```dart
void setCoordinates(double x, double y) {
  print('坐标: ($x, $y)');
}

setCoordinates(10.5, 20.8); // 必须按顺序依次传入
```

### 4.2 可选位置参数 (Optional Positional Parameters)：用 `[]` 包裹

- 使用中括号 `[]` 将参数包裹起来，放在形参列表的末尾。
- 调用方可以不传；如果不传且未指定默认值，则其值为 `null`（需声明为可空类型 `?`）。
- 可以为可选位置参数指定默认值 `=`。

```dart
// [String? country, String city = '北京'] 为可选位置参数
String formatAddress(String street, [String? country, String city = '北京']) {
  String res = '街道: $street, 城市: $city';
  if (country != null) {
    res += ', 国家: $country';
  }
  return res;
}

void main() {
  print(formatAddress('中关村南大街')); // 省略后两个可选参数
  print(formatAddress('南京西路', '中国', '上海')); // 按顺序依次传入可选参数
}
```

### 4.3 命名参数 (Named Parameters)：用 `{}` 包裹 —— Flutter 的基石

命名参数使用花括号 `{}` 包裹。调用时必须显式指明参数名 `paramName: value`，**与参数的传递顺序完全无关**！

在命名参数中：
- 默认情况下是**可选的**（需标记为可空 `?` 或赋予默认值 `=`）。
- 如果某个命名参数是调用方必须传递的，使用 **`required`** 关键字修饰。

```dart
void createButton({
  required String label,       // 必传参数 (必须提供)
  required void Function() onTap, // 必传回调
  String color = 'blue',       // 具有默认值的命名参数
  double width = 100.0,        // 默认宽度
  double? height,              // 可为空的可选命名参数 (默认 null)
}) {
  print('构建按钮 -> 文案: $label, 颜色: $color, 尺寸: ${width}x${height ?? "自适应"}');
}

void main() {
  // 调用时可按任意顺序传参，代码自解释性极强！
  createButton(
    onTap: () => print('点击了保存'),
    label: '保存提交',
    color: 'emeraldGreen',
  );
}
```

### 4.4 为什么 Flutter 99% 的 Widget 构造函数都采用命名参数？

对比一下在 Java / Android 与 Flutter 中构建一个复杂界面的差别：

```java
// Java / Android 传统多重重载，容易传错顺序，可读性极差
new CustomDialog(context, "标题", "内容", true, false, 300, 200, 0, null, true);
```

```dart
// Flutter 采用命名参数构建 Widget，层次清晰，改动任意参数完全不受顺序制约
Container(
  width: 200.0,
  height: 80.0,
  margin: const EdgeInsets.all(8.0),
  color: Colors.blue,
  child: const Text('立即抢购'),
);
```

> **核心参数规则总结**：
> 1. 一个函数不能同时拥有可选位置参数 `[]` 和命名参数 `{}`。
> 2. 位置参数必须放在命名参数的前面。

---

## 5. 匿名函数、箭头函数与闭包 (P22-P23)

### 5.1 匿名函数 (Anonymous Functions / Lambda)

没有函数名称的函数定义，通常作为参数传递给集合操作符或事件监听器：

```dart
var fruits = ['苹果', '香蕉', '西瓜'];

// 匿名函数体: (item) { ... }
fruits.forEach((item) {
  print('水果盘点: $item');
});
```

### 5.2 箭头函数语法糖 (Arrow Syntax: `=>`)

当函数体**仅包含一行表达式**时，可以使用 `=> expr` 替换 `{ return expr; }`。

```dart
// 传统写法：
// int doubleValue(int n) {
//   return n * 2;
// }

// 优雅的箭头函数：
int doubleValue(int n) => n * 2;

// 集合操作中极具表现力：
var lengths = fruits.map((f) => f.length).toList();
```

> ⚠️ **注意**：`=>` 后面只能跟**单个表达式（Expression）**，不能跟控制流语句（如 `if-else` 块、`while` 块等语句 Statement）。

### 5.3 闭包 (Closures) 与作用域捕获

**闭包**是指一个函数对象有权访问其词法作用域（Lexical Scope）之内的变量，即使该函数在它原本所在的作用域之外被调用！

```dart
/// 创建一个计数器生成器函数 (返回一个闭包)
int Function() makeCounter([int start = 0]) {
  int count = start; // count 局部变量被内部函数持久捕获

  return () {
    count++;
    return count;
  };
}

void main() {
  final counterA = makeCounter(0);
  final counterB = makeCounter(100);

  print('Counter A: ${counterA()}'); // 1
  print('Counter A: ${counterA()}'); // 2
  print('Counter A: ${counterA()}'); // 3

  // counterB 拥有自己独立的捕获闭包作用域
  print('Counter B: ${counterB()}'); // 101
  print('Counter B: ${counterB()}'); // 102
}
```

### 5.4 经典实战：防抖函数 (Debounce) 原理

利用闭包捕获定时器，防止用户高频连点提交按钮：

```dart
import 'dart:async';

/// 防抖函数封装
void Function() debounce(void Function() action, {int milliseconds = 500}) {
  Timer? timer;

  return () {
    // 如果之前的计时器仍在排队，则直接取消上一次
    if (timer?.isActive ?? false) {
      timer?.cancel();
    }
    // 重新开启计时
    timer = Timer(Duration(milliseconds: milliseconds), () {
      action();
    });
  };
}

void main() {
  final onSearchInput = debounce(() {
    print('向服务端发送搜索关键词联想请求...');
  }, milliseconds: 300);

  // 用户快速输入 3 次
  onSearchInput();
  onSearchInput();
  onSearchInput(); // 只有最后一次触发会在 300ms 后执行！
}
```

<DartConsole 
  preset="control-flow" 
  title="流程控制与高阶函数闭包执行演示" 
/>

---

## 6. 函数知识点对比速查表

| 函数语法特征 | 关键字/符号 | 典型调用方式 | 核心应用场景 |
| :--- | :--- | :--- | :--- |
| **必选位置参数** | 无 | `fn(10, "abc")` | 数量固定且逻辑明确的基础入参 |
| **可选位置参数** | `[Type param = val]` | `fn(10)` 或 `fn(10, "abc")` | 仅在末尾有少数可选拓展项 |
| **可选命名参数** | `{Type? param = val}` | `fn(param: "val")` | 提高传参可读性，任意顺序 |
| **必填命名参数** | `{required Type param}` | `fn(param: "val")` | **Flutter 组件构造函数标准写法** |
| **箭头函数** | `=>` | `(x) => x * 2` | 简短单行返回值计算、回调函数 |
| **闭包** | 作用域变量捕获 | `fn()` 保持内部环境 | 状态驻留、防抖节流、私有数据封装 |

---

## 7. 结语与下节预告

通过掌握分支循环与参数特性，我们已经能够写出地道优美的 Dart 函数代码。

在下一篇中，我们将进入面向对象世界的最核心板块 —— **面向对象编程：类、构造函数语法糖、继承、抽象类与 Mixin 混入 (P24-P31)**，这是吃透 Flutter 框架源码架构的关键一步！
