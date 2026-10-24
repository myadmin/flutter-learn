# 面向对象：类、继承、多态与 Mixin (P24-P32)

Dart 是一门**纯粹的面向对象语言**：在 Dart 的世界中，万物皆为对象（甚至数字、函数和 `null` 都是对象），所有对象都是某个类的实例，且所有类最终都派生自 `Object`。

Flutter 能够构建出成百上千种功能各异且彼此嵌套的组件树，完全依托于 Dart 极具特色的面向对象设计。本篇将全面梳理 Dart 面向对象的核心精髓（对应视频 P24 至 P32 集），涵盖类的构造体系、隐式接口、多态与抽象类、以及 Flutter 广泛采用的 **Mixin 混入机制**。

---

## 1. 类的定义与成员私有性 (P24)

### 1.1 基础定义与实例化

定义类使用 `class` 关键字。在 Dart 2 之后，**实例化对象可以省略 `new` 关键字**：

```dart
class Point {
  // 成员属性 (Field)
  double x = 0;
  double y = 0;

  // 成员方法 (Method)
  void printPosition() {
    print('当前坐标: ($x, $y)');
  }
}

void main() {
  // 省略 new，直接像调用函数一样创建对象
  var p = Point();
  p.x = 10;
  p.y = 20;
  p.printPosition();
}
```

### 1.2 成员私有性：以 `_` 下划线开头的命名规则

在很多语言（如 Java/C++/C#）中，通过 `private`、`public`、`protected` 访问修饰符控制可见性。

**Dart 没有任何可见性关键字！**
Dart 的私有机制规则非常简单优雅：
- **凡是标识符（类名、属性名、方法名、顶层函数）以 `_` 开头，它就是私有的**。
- **作用域是库级别的（Library-private）**：只要在同一个 `.dart` 文件内部，任何类都可以自由访问私有成员；一旦跨文件（`import` 引入）时，带有 `_` 的成员将被外部完全隐藏！

```dart
// bank_account.dart
class BankAccount {
  String accountHolder;
  // 以 _ 开头的私有属性，防止被外部文件随意篡改
  double _balance = 0.0;

  BankAccount(this.accountHolder, double initialDeposit) {
    if (initialDeposit > 0) {
      _balance = initialDeposit;
    }
  }

  // 私有辅助校验方法
  bool _canWithdraw(double amount) => amount > 0 && amount <= _balance;

  // 公有存取款方法
  void withdraw(double amount) {
    if (_canWithdraw(amount)) {
      _balance -= amount;
      print('取款 ￥$amount 成功，当前余额: ￥$_balance');
    } else {
      print('取款失败: 余额不足或金额不合法');
    }
  }
}
```

### 1.3 Getter 与 Setter 访问器

通过 `get` 和 `set` 关键字，可以对私有字段提供受控的读取与写入通道，或者定义**动态计算属性**：

```dart
class Rectangle {
  double width;
  double height;

  Rectangle(this.width, this.height);

  // 计算属性 Getter：计算面积
  double get area => width * height;

  // Getter：获取周长
  double get perimeter => 2 * (width + height);

  // Setter：设置正方形单边长
  set squareSide(double value) {
    width = value;
    height = value;
  }
}

void main() {
  var rect = Rectangle(4, 5);
  print('面积: ${rect.area}'); // 20.0
  
  rect.squareSide = 6; // 调用 setter
  print('重设为正方形后面积: ${rect.area}'); // 36.0
}
```

---

## 2. 构造函数深度详解 (P25-P27)

Dart 提供了极度精炼且功能强大的构造函数语法糖，能帮我们消灭冗长枯燥的样板代码。

### 2.1 默认构造函数与 `this.field` 参数简写语法糖

在传统面向对象语言中，属性赋值往往需要显式写一行 `this.x = x;`。Dart 提供了直接简写：

```dart
class User {
  final String id;
  final String username;
  final int age;

  // 语法糖：在形参列表中直接使用 this.xxx，自动完成声明与赋值！
  User(this.id, this.username, this.age);
}
```

配合**命名参数**，可以写出工业级优雅的构造函数：

```dart
class Product {
  final String title;
  final double price;
  final int stock;

  Product({
    required this.title,
    required this.price,
    this.stock = 0,
  });
}
```

### 2.2 命名构造函数 (Named Constructors)

Dart **不支持构造函数同名重载**（不能写多个名称相同但参数不同的构造函数）。作为替代方案，Dart 允许定义**命名构造函数** `ClassName.identifier`，让对象的构建语义极度明确：

```dart
class User {
  final String name;
  final int age;
  final String role;

  // 1. 主构造函数
  User(this.name, this.age, {this.role = 'user'});

  // 2. 命名构造函数：创建游客身份
  User.guest()
      : name = '游客',
        age = 0,
        role = 'guest';

  // 3. 命名构造函数：从 JSON 字典逆序列化 (Flutter 网络开发最经典写法)
  User.fromJson(Map<String, dynamic> json)
      : name = json['name'] as String? ?? '默认用户',
        age = json['age'] as int? ?? 18,
        role = json['role'] as String? ?? 'user';
}

void main() {
  var u1 = User('张三', 25);
  var guest = User.guest();
  var u2 = User.fromJson({'name': '李四', 'age': 30});
}
```

### 2.3 初始化列表 (Initializer List)

在构造函数执行体 `{}` 之前、以冒号 `:` 开头的列表被称为**初始化列表**。

初始化列表有三大核心使命：
1. **在构造函数体执行前初始化 `final` 实例字段**；
2. **在进入构造体前执行断言校验（`assert`）**；
3. **调用父类构造函数（`super`）**。

```dart
class Circle {
  final double radius;
  final double area;

  // 冒号后面是初始化列表
  Circle(double r)
      : assert(r > 0, '半径必须大于 0'),
        radius = r,
        area = 3.1415926 * r * r {
    print('圆对象初始化完成，半径: $radius, 面积: $area');
  }
}
```

### 2.4 常量构造函数 (Constant Constructors)

如果一个类的状态在创建后绝不发生变化（所有字段均为 `final`），可以将其构造函数声明为 `const`：

```dart
class AppConfig {
  final String appName;
  final String version;

  // const 构造函数：所有属性必须是 final
  const AppConfig({required this.appName, required this.version});
}

void main() {
  // 使用 const 实例化：相同参数的实例在内存中单例复用！
  const c1 = AppConfig(appName: 'ShopApp', version: '1.0.0');
  const c2 = AppConfig(appName: 'ShopApp', version: '1.0.0');

  print(identical(c1, c2)); // 输出: true！完全指向同一个内存地址
}
```

> **对 Flutter 的意义**：所有的 `Widget`（如 `StatelessWidget`）几乎都使用 `const` 构造函数，从而在页面重绘时避免重复创建对象开销。

### 2.5 工厂构造函数 (Factory Constructors) 与单例模式

使用 `factory` 关键字修饰的构造函数，**不一定会创建新的实例**，它可以从缓存中返回已有实例，或者返回某个子类的实例。

#### 实战：用 factory 实现绝对线程安全的单例模式

```dart
class NetworkManager {
  final String baseUrl;

  // 1. 静态私有内部实例
  static NetworkManager? _instance;

  // 2. 私有命名构造函数，阻止外部随意直接 new
  NetworkManager._internal({required this.baseUrl});

  // 3. factory 工厂构造函数：如果已有实例则直接返回，否则新建
  factory NetworkManager({String baseUrl = 'https://api.example.com'}) {
    _instance ??= NetworkManager._internal(baseUrl: baseUrl);
    return _instance!;
  }
}

void main() {
  var clientA = NetworkManager();
  var clientB = NetworkManager();

  print(identical(clientA, clientB)); // 输出: true (单例验证成功)
}
```

---

## 3. 类的继承与多态 (P28-P29)

### 3.1 继承基础：`extends` 与 `super`

Dart 支持类的**单继承（Single Inheritance）**，使用 `extends` 关键字。子类可以使用 `super` 关键字调用父类的属性、方法或构造函数。

```dart
// 父类
class Animal {
  final String name;
  Animal(this.name);

  void speak() {
    print('$name 发出了某种声音');
  }
}

// 子类
class Dog extends Animal {
  final String breed;

  // 子类构造函数必须将参数传递给父类构造函数 super(...)
  Dog(String name, this.breed) : super(name);

  // 方法重写：使用 @override 注解明确标明重写逻辑
  @override
  void speak() {
    print('$name ($breed) 汪汪叫！');
  }

  void fetchBall() {
    print('$name 兴奋地跑去捡飞盘！');
  }
}
```

### 3.2 面向对象多态思想 (Polymorphism)

多态指**同一父类引用可以指向不同的子类实例，并在运行时动态调用对应子类实现的具体方法**：

```dart
class Cat extends Animal {
  Cat(String name) : super(name);

  @override
  void speak() {
    print('$name 喵喵叫~');
  }
}

void makeAnimalSpeak(Animal animal) {
  // 无论传入的是 Dog 还是 Cat，均动态派发到各自的具体重写方法
  animal.speak();
}

void main() {
  Animal d = Dog('旺财', '金毛');
  Animal c = Cat('咪咪');

  makeAnimalSpeak(d); // 输出: 旺财 (金毛) 汪汪叫！
  makeAnimalSpeak(c); // 输出: 咪咪 喵喵叫~
}
```

---

## 4. 抽象类与接口机制 (P30)

### 4.1 抽象类：`abstract class`

抽象类使用 `abstract class` 声明，通常用于定义通用的行为契约规范。
- 抽象类**不能被直接实例化**；
- 抽象类中可以包含未实现的方法（抽象方法，无方法体直接以分号结尾），也可以包含已经实现好的常规方法。

```dart
abstract class PaymentService {
  // 抽象方法：子类必须实现具体的扣款逻辑
  Future<bool> pay(double amount);

  // 普通具名方法：复用公共日志能力
  void logTransaction(String type, double amount) {
    print('[交易流水] $type 扣款: ￥$amount, 时间: ${DateTime.now()}');
  }
}
```

### 4.2 Dart 特有的“隐式接口”机制 (Implicit Interfaces)

在 Java 或 TypeScript 中，类与接口是两种截然不同的定义声明（`class` vs `interface`）。

**而在 Dart 中：每一个普通的类都隐式定义了一个包含其所有成员的接口！**

- 你不需要专门定义 `interface` 关键字。
- 任何类都可以作为接口被其他类使用 **`implements`** 实现！
- 一旦使用 `implements`，必须**完全重写该接口声明的所有属性与方法**（哪怕被实现的类原本已经写好了具体逻辑代码）。

```dart
class WeChatPayService implements PaymentService {
  @override
  Future<bool> pay(double amount) async {
    print('调起微信支付 SDK，发起支付 ￥$amount');
    return true;
  }

  // 必须把父类中的 logTransaction 也一并实现，因为 implements 继承的是接口协议，而非具体代码实现！
  @override
  void logTransaction(String type, double amount) {
    print('[微信渠道流水] $type: ￥$amount');
  }
}
```

### 4.3 `extends` 与 `implements` 核心辨析

| 对比维度 | `extends` (继承) | `implements` (实现接口) |
| :--- | :--- | :--- |
| **支持数量** | **仅限单继承**（只能 `extends` 一个父类） | **支持多实现**（可 `implements A, B, C`） |
| **代码复用** | 直接继承父类的属性和已有方法实现 | **不继承任何代码**，仅仅继承类型协议，必须全部 `@override` |
| **构造调用** | 需在初始化列表中调用 `super()` | 无需调用任何 `super()` 构造 |
| **设计定位** | 是什么关系 (Is-A)，强调代码共用与特化 | 具有何种能力 (Can-Do)，强调统一契约抽象 |

---

## 5. Mixin 混入机制 (P31) —— 解决多重继承的终极武器

### 5.1 为什么需要 Mixin？

传统的面向对象系统常常面临两难困境：
- 单继承（如 Java）无法在互不相关的类体系中复用一组公共行为。
- 多重继承（如 C++）容易引发致命的“菱形继承冲突问题”（Diamond Problem）。

**Mixin（混入）** 提供了一种在**多个类层次结构中复用类代码的极简方案**。

### 5.2 `mixin` 与 `with` 语法详解

- 定义混入使用 `mixin` 关键字（mixin 不能声明构造函数，不可直接实例化）。
- 使用混入使用 `with` 关键字。

```dart
// 1. 定义飞行能力的 Mixin
mixin Flyable {
  double flightSpeed = 100.0;

  void fly() {
    print('以时速 $flightSpeed km/h 在蓝天翱翔');
  }
}

// 2. 定义游泳能力的 Mixin
mixin Swimmable {
  void swim() {
    print('在水中轻快潜泳');
  }
}

// 基础鸟类
class Bird {
  final String name;
  Bird(this.name);
}

// 鸭子类：既是鸟，又混入了飞行和游泳能力！
class Duck extends Bird with Flyable, Swimmable {
  Duck(String name) : super(name);
}

void main() {
  var donald = Duck('唐老鸭');
  print('名字: ${donald.name}');
  donald.fly();  // 来自 Flyable
  donald.swim(); // 来自 Swimmable
}
```

### 5.3 `on` 关键字：为 Mixin 添加宿主类型约束

如果你希望某个 mixin 只能被特定类型的子类使用，可以使用 `on` 限制其绑定目标：

```dart
// 只有继承自 Widget 的类才能混入 LoggerMixin
mixin LoggerMixin on Object {
  void log(String info) {
    print('[DEBUG ${runtimeType}]: $info');
  }
}
```

### 5.4 混入的线性化查找顺序 (Linearization)

当多个 mixin 拥有同名方法时，**排在后面的 mixin 会覆盖前面的同名方法**（从右到左线性化覆盖）：

```dart
mixin A {
  void action() => print('A 执行');
}

mixin B {
  void action() => print('B 执行');
}

class Test with A, B {}

void main() {
  Test().action(); // 输出: B 执行 (B 排在更后面，覆盖了 A)
}
```

> **Flutter 源码中的 Mixin 典范**：
> 在 Flutter 动画开发中，我们编写动态控制器时必须混入 `SingleTickerProviderStateMixin` 或 `TickerProviderStateMixin`，它就是通过 `mixin` 为我们的页面注入帧信号刷新驱动能力的！

---

## 6. 面向对象综合实战：电商支付策略与优惠系统

设计一个支持多种支付通道与折扣策略的面向对象架构：

```dart
// 1. 支付接口契约
abstract class PaymentStrategy {
  Future<bool> executePay(double amount);
}

// 2. 优惠折扣 Mixin
mixin DiscountPolicy {
  double applyDiscount(double original, double rate) {
    return original * rate;
  }
}

// 3. 基础交易记录器
class TransactionLogger {
  void record(String message) {
    print('[账单中心 ${DateTime.now().toString().substring(11, 19)}] $message');
  }
}

// 4. 支付宝支付实现 (继承自记录器，实现支付策略，混入优惠计算)
class AliPayService extends TransactionLogger with DiscountPolicy implements PaymentStrategy {
  final String alipayId;

  AliPayService(this.alipayId);

  @override
  Future<bool> executePay(double amount) async {
    // 享受支付宝随机立减 9 折
    final finalAmount = applyDiscount(amount, 0.9);
    record('用户账号 $alipayId 调起支付宝收银台，应收: ￥$amount, 实收: ￥${finalAmount.toStringAsFixed(2)}');
    return true;
  }
}

// 5. 结算收银台统一上下文
class CheckoutContext {
  final PaymentStrategy _strategy;

  CheckoutContext(this._strategy);

  Future<void> checkout(double orderTotal) async {
    print('\n发起订单结算...');
    bool success = await _strategy.executePay(orderTotal);
    if (success) {
      print('订单支付成功，开始安排出库！');
    }
  }
}

void main() async {
  // 使用策略模式动态切换支付渠道
  final aliPay = AliPayService('ali_user_888');
  final checkoutSystem = CheckoutContext(aliPay);

  await checkoutSystem.checkout(199.0);
}
```

运行输出：
```text
发起订单结算...
[账单中心 12:00:00] 用户账号 ali_user_888 调起支付宝收银台，应收: ￥199.0, 实收: ￥179.10
订单支付成功，开始安排出库！
```

---

## 7. 本篇知识总结速查

- **私有属性**：依靠 `_` 命名约束，作用域是库文件（library-private）而非类内私有。
- **构造函数语法糖**：`Point(this.x, this.y);` 消灭模板代码；命名构造函数 `Point.origin()` 增强语义。
- **初始化列表**：冒号后赋值 `final` 属性与执行 `assert` 检查。
- **抽象类与隐式接口**：`abstract class` 规范行为；`implements` 支持多接口实现。
- **Mixin 混入**：`mixin ... with` 实现扁平、可预测的无冲突多重代码复用。

下一篇我们将攻克 Dart 的终极进阶内容 —— **泛型编程与基于事件循环的 Future 异步模型与 async/await (P32-P37)**！
