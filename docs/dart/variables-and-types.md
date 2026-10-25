# 变量常量与基本数据类型 (P3-P12)

Dart 是一门**强类型静态类型语言**，这意味着在编译阶段，编译器就已经完全推导或确定了所有变量的类型，从而提供了极佳的代码补全、编译期语法检查以及高效的原生代码优化。

本篇系统梳理 Dart 中变量、常量声明的核心机制（`var`、`Object`、`dynamic`、`final`、`const`），并深度剖析 6 大核心基础数据类型（`String`、`int`/`double`、`bool`、`List`、`Map`、`Set`）的高频实战用法。

<BiliVideoPlayer episodes="3-12" :p="3" />

---

## 1. 变量声明深度辨析 (P3-P5)

在 Dart 中，声明变量有多种方式。初学者常常混淆 `var`、`Object`、`dynamic` 与显式类型之间的区别与边界。

### 1.1 显式类型声明 (Explicit Typing)

最直接的方式是显式指定具体的类型名称：

```dart
String username = 'FlutterDeveloper';
int age = 25;
double score = 98.5;
bool isActive = true;
```

**适用场景**：公共 API、函数形参列表、类属性定义中推荐使用显式类型，增强代码的可读性和自解释性。

### 1.2 `var` 自动类型推断 (Type Inference)

使用 `var` 关键字时，编译器会根据右侧的初始赋值**自动推断**出具体类型。**类型一旦推断确定，之后不可改变！**

```dart
var title = 'Hello Dart'; // 编译器自动推断 title 为 String 类型
// title = 123; // ❌ 编译报错：A value of type 'int' can't be assigned to a variable of type 'String'.

// 特殊情况：若声明时未赋初值，则其类型会被推断为 dynamic
var temp;
temp = 'abc';
temp = 123; // ✅ 此时合法，但不推荐这样写
```

### 1.3 `dynamic` 动态类型

`dynamic` 是 Dart 中的“逃生舱门”（Escape Hatch）。它告诉编译器：**“关闭对此变量的所有静态类型检查，一切交由运行时决定”**。

```dart
dynamic value = 'Antigravity';
print(value.length); // 正常输出: 11

value = 100; // ✅ 合法，运行时动态变为 int
// value = value + 5; // 合法

// 危险陷阱：调用一个不存在的方法，编译时不会报错，但运行时崩溃！
// value.someNonExistentMethod(); // ❌ 运行时抛出 NoSuchMethodError
```

> **注意**：过度使用 `dynamic` 会丧失 Dart 静态类型系统的一切优势（无编译检查、无代码自动补全、性能变慢），仅在处理未知结构的外部 JSON、反射或跨语言边界时谨慎使用。

### 1.4 `Object` / `Object?` 万能基类

在 Dart 的类型体系中，所有非可空类型都是 `Object` 的子类（而 `Object?` 是包括 `null` 在内的顶层超类）。

```dart
Object obj = 'Dart is awesome';
print(obj.toString()); // ✅ 合法：只能调用 Object 类自带的方法 (toString, hashCode, runtimeType 等)

// print(obj.length); // ❌ 编译报错：The getter 'length' isn't defined for the class 'Object'.

// 如果要使用子类的方法，必须显式向下转型 (Type Cast) 或使用 is 判定类型提升：
if (obj is String) {
  print(obj.length); // ✅ 类型提升 (Type Promotion)，安全访问 String 属性
}
```

<DartConsole 
  preset="variables"
  title="变量类型推断与动态类型控制台输出" 
/>

### 1.5 四种声明方式核心对比表

| 声明方式 | 编译期类型检查 | 运行期间可否更换类型 | 能否调用特定子类方法 | 推荐场景 |
| :--- | :--- | :--- | :--- | :--- |
| **显式类型** (`String a`) | 严格检查 | 否 | 能直接调用该类型方法 | 共有 API、类成员变量、复杂接口 |
| **`var`** | 严格检查（推断后定型）| 否 | 能直接调用推断出的类型方法 | 局部变量，一眼能看出右侧类型时 |
| **`dynamic`** | **关闭检查**（跳过） | **是**（随意切换） | 任意调用（编译通过，运行时检查）| 外部动态 JSON 解析、特殊动态调用 |
| **`Object`** | 严格检查 | 否（仅能赋值为 Object）| 仅限 `Object` 基础方法，需 `is` 转换 | 确信其非空但暂不关心具体子类时 |

---

## 2. 常量声明：`final` 与 `const` 深度辨析 (P6)

在 Dart 中，如果一个变量赋值后不可修改，可以使用 `final` 或 `const` 修饰。二者均表示“不可重新赋值”，但在内存分配和编译时机上有根本性的差别。

### 2.1 `final`：运行时常量 (Runtime Constant)

- **赋值时机**：代码在**运行时**第一次执行到该语句时才计算并赋值。
- **只能被赋值一次**，之后不可再变。
- 其值可以是任何运行时的计算结果（例如网络请求返回、当前系统时间、数据库查询结果等）。

```dart
final DateTime now = DateTime.now(); // ✅ 合法：运行时获取当前时间
// now = DateTime.now(); // ❌ 编译报错：The final variable 'now' can only be set once.
```

### 2.2 `const`：编译期常量 (Compile-time Constant)

- **赋值时机**：在**编译期**就必须完全确定其具体值。
- **深层不可变性（Deep Immutability）**：用 `const` 修饰的集合或对象，其内部元素与所有引用层级都是只读的。
- **规范化内存（Canonicalization）**：相同内容的 `const` 常量在内存中**只会存储一份，全局共享同一内存地址**！

```dart
const double pi = 3.1415926; // ✅ 合法：编译期已确定字面量
// const DateTime errorNow = DateTime.now(); // ❌ 编译报错：DateTime.now() 只能在运行时产生，不能作为 const

// const 集合深度冻结
const List<int> constList = [1, 2, 3];
// constList.add(4); // ❌ 运行时抛出 Unsupported operation: Cannot add to an unmodifiable list
```

### 2.3 `const` 与 `final` 在 Flutter 中的性能杀手锏

在 Flutter 源码中，几乎随处可见 `const Text('标题')`、`const SizedBox(height: 16)`：

```dart
// 内存共享验证：
final listA = const [1, 2, 3];
final listB = const [1, 2, 3];
print(identical(listA, listB)); // 输出: true！两者指向完全相同的底层内存指针！
```

> **Flutter 性能启示**：当 Widget 带有 `const` 构造函数时，Flutter 框架在重新渲染（Rebuild）页面时会直接复用该 Widget 实例，完全跳过构建流程和 Diff 对比，从而实现极端丝滑的渲染性能！

### 2.4 对比总结

| 特性维度 | `final` | `const` |
| :--- | :--- | :--- |
| **初始化时机** | 运行时计算（惰性求值） | 编译期确定（提前计算） |
| **是否要求字面量** | 否，可接收任意运行时表达式 | 是，右侧表达式必须可在编译期求值 |
| **内存分配** | 每次调用均开辟新空间 | 规范化去重，相同实例仅一份内存 |
| **集合元素修改** | 若引用本身 final，内部元素默认仍可修改 | 整个集合深层冻结，完全不可修改 |
| **修饰类字段** | 直接声明为类字段 | 必须加上 `static const` 成为类静态常量 |

---

## 3. 数值类型：`num`, `int`, `double` (P7)

Dart 中的数值体系由抽象类 `num` 及其实际子类 `int` 和 `double` 构成。

```
        num (抽象数值类型)
       /   \
  int (整数)  double (64位双精度浮点数)
```

### 3.1 基本使用与常用方法

```dart
int age = 18;
double price = 99.95;

// num 既可以接收整数，也可以接收浮点数
num flexibleNumber = 10;
flexibleNumber = 12.34; // ✅ 合法

// 常用数学运算与转换方法：
print((-15).abs());             // 绝对值: 15
print(3.14159.toStringAsFixed(2)); // 保留两位小数 (四舍五入): "3.14"
print(3.8.floor());             // 向下取整: 3
print(3.2.ceil());              // 向上取整: 4
print(3.5.round());             // 四舍五入: 4
print(42.toDouble());           // 转浮点: 42.0
```

### 3.2 字符串与数值的高效转换与防崩溃解析

```dart
// 1. int.parse：直接解析，如果格式错误会抛出 FormatException 异常
int count = int.parse('120');

// 2. tryParse：安全解析，解析失败时返回 null（配合空安全极其好用）
int? safeCount = int.tryParse('abc'); // 返回 null，不崩溃！
int finalCount = safeCount ?? 0;      // 兜底值设定为 0
print(finalCount);                    // 输出: 0
```

---

## 4. 字符串类型：`String` (P8-P9)

Dart 的 `String` 是由 UTF-16 编码单元构成的不可变序列。

### 4.1 字符串定义形式

```dart
// 1. 单引号与双引号等价
String s1 = '单引号文本';
String s2 = "双引号文本（方便内部包含单引号：It's cool）";

// 2. 三引号：支持多行格式排版与原生换行
String multiLine = '''
<h1>标题</h1>
<p>第一段文本</p>
<p>第二段文本</p>
''';

// 3. 原始字符串 (Raw String)：以 'r' 开头，不转义特殊符号
String normalPath = 'C:\\Windows\\system32';
String rawPath = r'C:\Windows\system32'; // \ 不被当成转义符
```

### 4.2 字符串插值 (String Interpolation)

Dart 抛弃了传统繁琐的 `+` 拼接，直接在字符串中使用 `$` 占位符进行插值：

```dart
String product = 'MacBook Pro';
double price = 12999.0;
int discount = 9; // 9折

// 单变量直接用 $变量名；复杂表达式用 ${表达式}
String description = '商品: $product, 原价: ￥$price, 折后价: ￥${(price * (discount / 10)).toStringAsFixed(2)}';
print(description);
// 输出: 商品: MacBook Pro, 原价: ￥12999.0, 折后价: ￥11699.10
```

### 4.3 字符串高频实用 API 实战

```dart
String str = '  Flutter, Dart, Mobile  ';

print(str.trim());                       // 去除首尾空格: "Flutter, Dart, Mobile"
print(str.contains('Dart'));             // 是否包含子串: true
print(str.startsWith('  Flu'));          // 前缀判断: true
print(str.replaceAll('Mobile', 'Web'));  // 全局替换: "  Flutter, Dart, Web  "
print(str.split(', '));                  // 字符串分割为 List: ["  Flutter", "Dart", "Mobile  "]
print('7'.padLeft(2, '0'));              // 补齐两位数 (用于日期时间格式化): "07"
```

---

## 5. 布尔类型：`bool` (P10)

Dart 的 `bool` 类型只有两个字面量对象：`true` 和 `false`。

> ⚠️ **与 JavaScript / Python 的重大区别**：
> Dart 是严格的静态强类型，**不具备隐式类型转换（Truthiness）**！
> 在 Dart 中，数值 `0`、空字符串 `""`、空列表 `[]`、`null` 均**不能**被当作 `false` 处理！

```dart
var name = '';
// ❌ 错误做法（编译报错）：
// if (name) { ... } // Conditions must have a static type of 'bool'.

// ✅ 正确做法：必须显式比较
if (name.isNotEmpty) {
  print('名字不为空');
}

int count = 0;
if (count == 0) {
  print('计数归零');
}
```

---

## 6. 集合类型：`List` 数组与列表 (P11)

`List` 是 Dart 中最核心的有序数据结构（等同于其他语言的 Array/数组）。

### 6.1 List 创建与初始化

```dart
// 1. 字面量创建推断类型
var fruits = ['Apple', 'Banana', 'Orange']; // 推断为 List<String>

// 2. 空列表与显式泛型
List<int> numbers = [];

// 3. List.filled：创建固定长度并填充默认值
var filledList = List<int>.filled(3, 0); // [0, 0, 0]

// 4. List.generate：根据生成器函数动态创建
var generatedList = List<int>.generate(5, (index) => index * 2); // [0, 2, 4, 6, 8]

// 5. 不可变列表 List.unmodifiable
var readonlyList = List.unmodifiable(['A', 'B', 'C']);
// readonlyList.add('D'); // ❌ 运行时抛出 Unsupported operation
```

### 6.2 常用增删改查方法

```dart
List<String> list = ['Java', 'Kotlin'];

// 增
list.add('Dart');                   // 尾部追加: ['Java', 'Kotlin', 'Dart']
list.addAll(['Swift', 'TypeScript']);// 批量追加
list.insert(0, 'C++');              // 指定位置插入

// 查与访问
print(list.first);                  // 第一个元素: 'C++'
print(list.last);                   // 最后一个元素: 'TypeScript'
print(list.length);                 // 长度: 6
print(list.isEmpty);                // 是否为空: false
print(list[2]);                     // 下标索引: 'Kotlin'

// 删
list.remove('Java');                // 按值移除
list.removeAt(0);                   // 按索引移除第一个
list.removeWhere((item) => item.startsWith('T')); // 按条件批量删除
list.clear();                       // 清空
```

### 6.3 现代集合操作符：扩展操作符与集合 if / for

这是 Dart 编写 Flutter UI 树的灵魂特性：

```dart
bool isVip = true;
var promoTags = ['满100减20', '免运费'];

var cartUI = [
  '首页',
  // 1. 集合 if (Collection if)
  if (isVip) '尊享 8.5 折',
  
  // 2. 扩展操作符 (Spread Operator) ... 展开列表
  ...promoTags,
  
  // 3. 空感知扩展操作符 ...?（若列表为 null 则跳过展开，不报错）
  ...?null,
  
  // 4. 集合 for (Collection for)
  for (var i = 1; i <= 3; i++) '推荐商品 #$i'
];

print(cartUI);
// 输出: [首页, 尊享 8.5 折, 满100减20, 免运费, 推荐商品 #1, 推荐商品 #2, 推荐商品 #3]
```

### 6.4 List 高阶函数与函数式编程

```dart
var nums = [1, 2, 3, 4, 5, 6];

// 1. map：映射转换
var squares = nums.map((e) => e * e).toList(); // [1, 4, 9, 16, 25, 36]

// 2. where：条件过滤 (等同于 filter)
var evens = nums.where((e) => e % 2 == 0).toList(); // [2, 4, 6]

// 3. any / every：条件断言
bool hasGreaterThan5 = nums.any((e) => e > 5);   // true
bool allPositive = nums.every((e) => e > 0);       // true

// 4. fold / reduce：累加规约
int sum = nums.reduce((acc, curr) => acc + curr); // 21
int sumWithInitial = nums.fold(100, (acc, curr) => acc + curr); // 121
```

---

## 7. 集合类型：`Map` 与 `Set`

### 7.1 `Map` 字典（键值对集合）

`Map` 是无序的键值关联集合。键必须唯一，值可以重复。

```dart
// 1. 初始化 Map
Map<String, dynamic> user = {
  'id': 'u10001',
  'name': '李四',
  'score': 95.0,
  'tags': ['Flutter', 'Dart']
};

// 2. 取值与设值
print(user['name']); // 李四
user['age'] = 28;     // 新增或更新键值

// 3. 常见实用方法
print(user.containsKey('id')); // 是否包含 key: true
print(user.keys.toList());     // 获取所有键
print(user.values.toList());   // 获取所有值

// 4. putIfAbsent：不存在时才插入
user.putIfAbsent('role', () => 'Developer');

// 5. 遍历 Map
user.forEach((key, value) {
  // print('$key: $value');
});
```

### 7.2 `Set` 集合（元素唯一）

`Set` 是无序且**元素唯一**的集合，主要用于数据去重和集合交并差集运算。

```dart
// 1. 创建与自动去重
Set<String> tagSet = {'Flutter', 'Dart', 'Flutter', 'Vue'};
print(tagSet); // 输出: {'Flutter', 'Dart', 'Vue'}

// 2. 常用操作
tagSet.add('React');
print(tagSet.contains('Dart')); // true

// 3. 数学集合运算
var setA = {1, 2, 3, 4};
var setB = {3, 4, 5, 6};

print(setA.intersection(setB)); // 交集: {3, 4}
print(setA.union(setB));        // 并集: {1, 2, 3, 4, 5, 6}
print(setA.difference(setB));   // 差集 (A - B): {1, 2}
```

---

## 8. 本章综合实战：电商购物车数据计算

综合运用所学的数据类型与集合高阶函数，实现一个真实的电商结算数据管道：

```dart
void main() {
  // 模拟购物车商品列表
  final List<Map<String, dynamic>> cartItems = [
    {'name': 'AirPods Pro', 'price': 1899.0, 'count': 1, 'selected': true},
    {'name': '4K 显示器', 'price': 2499.0, 'count': 2, 'selected': true},
    {'name': '机械键盘', 'price': 499.0, 'count': 1, 'selected': false}, // 未勾选
    {'name': '人体工学椅', 'price': 1299.0, 'count': 1, 'selected': true},
  ];

  // 1. 过滤出被选中的商品
  final selectedItems = cartItems.where((item) => item['selected'] == true);

  // 2. 计算已选商品总件数与总原价
  int totalCount = selectedItems.fold(0, (sum, item) => sum + (item['count'] as int));
  double rawTotalAmount = selectedItems.fold(
    0.0,
    (sum, item) => sum + ((item['price'] as double) * (item['count'] as int)),
  );

  // 3. 优惠券规则：满 5000 减 400，VIP 会员折上 9.5 折
  bool hasCoupon = rawTotalAmount >= 5000.0;
  double couponDeduction = hasCoupon ? 400.0 : 0.0;
  bool isVipMember = true;
  double vipDiscountRate = isVipMember ? 0.95 : 1.0;

  double finalPay = (rawTotalAmount - couponDeduction) * vipDiscountRate;

  // 4. 格式化输出结算报单
  print('================ 购物车结算清单 ================');
  for (var item in selectedItems) {
    print('- ${item['name']} × ${item['count']} = ￥${(item['price'] as double) * (item['count'] as int)}');
  }
  print('------------------------------------------------');
  print('已选商品总件数: $totalCount');
  print('商品原总价:   ￥${rawTotalAmount.toStringAsFixed(2)}');
  print('满减优惠抵扣: -￥${couponDeduction.toStringAsFixed(2)}');
  print('VIP 会员折扣:  ${isVipMember ? "95折" : "无折扣"}');
  print('最终应付金额: ￥${finalPay.toStringAsFixed(2)}');
  print('================================================');
}
```

运行输出结果：
```text
================ 购物车结算清单 ================
- AirPods Pro × 1 = ￥1899.0
- 4K 显示器 × 2 = ￥4998.0
- 人体工学椅 × 1 = ￥1299.0
------------------------------------------------
已选商品总件数: 4
商品原总价:   ￥8196.00
满减优惠抵扣: -￥400.00
VIP 会员折扣:  95折
最终应付金额: ￥7406.20
================================================
```

---

## 9. 知识速查总结与下节预告

- `var`：局部推断，类型不可变。
- `final`：运行期常量，单次赋值。
- `const`：编译期常量，规范化内存，是 Flutter Widget 性能优化的核心。
- `List` / `Map` / `Set`：现代集合，善用 `...`、`if`、`for` 语法糖能极大地精简代码。

在下一节中，我们将攻克 Dart 最关键的里程碑特性 —— **健全空安全机制与全套运算符体系 (P12-P15)**，告别臭名昭著的空指针异常！
