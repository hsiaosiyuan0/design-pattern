# 第十八回：边关小卒，名册共用：享元模式

![第十八回：边关小卒，名册共用：享元模式小说场景图](../assets/generated/scenes/18-flyweight-scene.png)

## 开篇引句

真正拖垮系统的，有时不是大东西，而是无数份重复的小东西。

## 楔子

守边最费的，不全是粮草，还有名册。北境数万士卒轮番换防，若每个小卒的籍贯、军种、甲等、饷例都各自单独存一遍，账房抄到来年也抄不完。

沈策翻着册子说：“许多信息明明是共用的，比如同一营的甲种、饷例、军号，为何每人都重复记？”于是他命人把可共享的部分提出来，个体只保留姓名、位置与当值状态，卷宗顿时薄了许多。

他没有删掉任何必要信息，只是把“大家都一样”的部分从每个人身上拿下来，放到同一份军种册里。士卒仍是士卒，但重复的纸墨不再跟着人数一同暴涨。

## 史局拆解

当系统中存在大量细粒度对象，而这些对象的许多内部状态可以共享时，内存和创建成本都会被重复数据拖垮。

享元要先分清两类状态：一种是可共享、相对稳定的内部状态；另一种是随场景变化、必须外部传入的状态。分不清这点，缓存池反而会藏进错误数据。

## 模式之义

享元模式把可共享的内部状态抽离出来复用，把不可共享的外部状态留给调用时传入。

## 如果不这样写，代码通常会长成什么样

最粗暴的写法，是每个小卒都带一整份重复信息：

```java
new Soldier("骑兵", "铁甲", "张三", "北门");
new Soldier("骑兵", "铁甲", "李四", "东门");
```

如果对象成千上万，重复状态会非常浪费。

## 从问题代码到模式代码，应该怎么想

这里需要拆开的，是：

1. 可以共享的内部状态
2. 每个个体都不同的外部状态

所以应该把“兵种、甲胄”之类的共性抽成共享对象，再把姓名、位置放到调用时传入。

抽象移走的是重复保存共性信息的责任。共享对象只代表“这一类兵”，具体是谁、站在哪里，由调用时补足。

## Java 示例

```java
class SoldierType {
    private final String kind;
    private final String armor;

    public SoldierType(String kind, String armor) {
        this.kind = kind;
        this.armor = armor;
    }

    public void report(String name, String position) {
        // 共享对象只保存共性信息，个体信息在调用时传入
        System.out.println(name + " 是 " + kind + "，装备 " + armor + "，驻守 " + position);
    }
}

class SoldierTypeFactory {
    // 缓存池：同一种类型只创建一次
    private static final java.util.Map<String, SoldierType> CACHE = new java.util.HashMap<>();

    public static SoldierType get(String kind, String armor) {
        String key = kind + ":" + armor;
        // 先查缓存，没有再创建
        return CACHE.computeIfAbsent(key, k -> new SoldierType(kind, armor));
    }
}

public class Client {
    public static void main(String[] args) {
        SoldierType cavalry = SoldierTypeFactory.get("骑兵", "铁甲");
        SoldierType sameCavalry = SoldierTypeFactory.get("骑兵", "铁甲");

        // 两名士卒共享同一份兵种与甲胄信息
        System.out.println(cavalry == sameCavalry);
        cavalry.report("张三", "北门");
        sameCavalry.report("李四", "东门");
    }
}
```

## 给其他语言背景的读者

如果你来自 JavaScript，可以把享元模式先理解成“把大批对象里重复的数据提出来共享”。  
Java 里会专门写一个工厂和缓存池，是因为它通常更显式地管理对象创建和内存占用。  
模式本身关心的是共享重复状态，不是为了把普通缓存包装成很玄的术语。

Python 和 JavaScript 里，字符串驻留、对象池、共享配置对象都带有享元味道；Objective-C / Swift 里，值类型和 copy-on-write 会自然缓解一部分重复复制问题，但大型共享资源仍需要明确缓存。Swift 的 `String`、`Array` 等标准类型已经帮你处理了不少共享细节。

Rust 里享元常和所有权共享工具一起出现，例如 `Arc`、`Rc`、字符串驻留、arena 分配或缓存表。由于借用规则严格，内部状态和外部状态的边界必须讲清楚：共享的东西最好不可变，变化的东西由调用方带入。

## 何时用

- 存在大量相似小对象
- 多数状态可共享
- 性能或内存占用成为问题

## 何时慎用

共享状态和外部状态边界不清时，代码会很别扭。账册是省了，若把私人战功也塞进共享模板，那就要出大错。

## 类图速写

可画成“兵籍共模板图”：

- `SoldierTypeFactory` 缓存共享对象
- `SoldierType` 存内部状态
- 个体姓名与驻地作为外部状态传入

```mermaid
classDiagram
    class SoldierTypeFactory {
        -Map cache
        +get(kind, armor)
    }
    class SoldierType {
        -kind
        -armor
        +report(name, position)
    }
    class Client

    Client ..> SoldierTypeFactory : request shared type
    SoldierTypeFactory o--> SoldierType : cache
    Client ..> SoldierType : passes external state
```

## 下回伏笔

名册虽薄，旧档却还成箱。平蜀之后，查卷的人越来越多，人人先得学库房怎么排，这让沈策又想到一个更基础的问题：看东西的人，为什么要先懂它是怎么存的。

## 收束

享元模式省下的是重复成本。不是让每个人都一样，而是让“相同的部分不要一遍遍重写”。
