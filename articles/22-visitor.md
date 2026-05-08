# 第二十二回：巡按四方，各察其制：访问者模式

![第二十二回：巡按四方，各察其制：访问者模式小说场景图](../assets/generated/scenes/22-visitor-scene.png)

## 开篇引句

同一座衙门，今天查粮，明天查军，后天又查赋税，变的往往不是地方，而是看它的人。

## 楔子

天下稍定后，朝廷派巡按使分赴诸州，查仓、查狱、查军、查赋。奇怪的是，他们查的对象不同，问的话也不同，可真正变化更快的，往往不是州县本身，而是“这次要查什么”。

沈策随行巡视几次后发现，若每一种机构都自己实现“接待巡按甲”“接待巡按乙”“接待巡按丙”的逻辑，衙门代码会越长越散。倒不如把“检查行为”抽到巡按身上，各类对象只负责接待。

州县、仓司、军府这些对象相对稳定，朝廷想查的项目却年年不同。若每来一种新检查就回头改所有衙门，稳定结构会被变化操作反复撕开。

## 史局拆解

当对象结构相对稳定，但经常需要在其上添加新的操作时，若把操作都塞回对象类里，类会持续膨胀。

访问者模式适合的正是这种不对称：元素种类不常变，操作种类常变。若元素种类天天增加，它反而会让访问者接口频繁改动。

## 模式之义

访问者模式把操作抽离成访问者对象，让不同访问者对同一组元素执行不同逻辑。

## 如果不这样写，代码通常会长成什么样

最常见的写法，是把各种检查行为全塞进元素对象里：

```java
class GranaryOffice {
    public void audit() {
    }

    public void inspectArmyRule() {
    }
}
```

操作一多，元素类就会越来越臃肿。

## 从问题代码到模式代码，应该怎么想

这里相对稳定的是“有哪些对象要被访问”，经常变化的是“对它们做什么操作”。

所以可以：

1. 保持元素结构稳定
2. 把操作抽到访问者身上
3. 需要新操作时，新增访问者，而不是回头改每个元素类

抽象之后，“被访问者”只负责开放入口，“访问者”负责具体检查。新增一类巡按，就新增一套访问逻辑。

## Java 示例

```java
interface Office {
    // 每个衙署都接受访问者进入
    void accept(Inspector inspector);
}

class GranaryOffice implements Office {
    @Override
    public void accept(Inspector inspector) {
        // 把具体操作交给访问者
        inspector.visit(this);
    }
}

class ArmyOffice implements Office {
    @Override
    public void accept(Inspector inspector) {
        inspector.visit(this);
    }
}

interface Inspector {
    // 访问者针对不同元素类型执行不同逻辑
    void visit(GranaryOffice office);
    void visit(ArmyOffice office);
}

class AuditInspector implements Inspector {
    @Override
    public void visit(GranaryOffice office) {
        // 对粮仓的检查逻辑
        System.out.println("核查粮仓");
    }

    @Override
    public void visit(ArmyOffice office) {
        // 对军营的检查逻辑
        System.out.println("核查军备");
    }
}

class DisciplineInspector implements Inspector {
    @Override
    public void visit(GranaryOffice office) {
        // 新增一种巡按，不需要改粮仓类
        System.out.println("核查粮仓出入记录");
    }

    @Override
    public void visit(ArmyOffice office) {
        // 新增一种巡按，不需要改军府类
        System.out.println("核查军纪名册");
    }
}

public class Client {
    public static void main(String[] args) {
        Office[] offices = {
            new GranaryOffice(),
            new ArmyOffice()
        };

        Inspector audit = new AuditInspector();
        Inspector discipline = new DisciplineInspector();

        for (Office office : offices) {
            office.accept(audit);
            office.accept(discipline);
        }
    }
}
```

## 给其他语言背景的读者

如果你来自 JavaScript，可以把访问者模式先理解成“数据结构不动，把操作抽成外部访问器”。  
Java 里这套写法看起来会比较重，因为它把双分派关系写得很显式。  
模式本身适合“结构稳定、操作多变”的场景；如果结构本身也天天变，访问者往往并不划算。

Python 和 JavaScript 里因为动态分派灵活，访问者常被普通函数、多分派库或按类型查表替代。Objective-C 的运行时也能动态派发；Swift 如果元素集合封闭，常用 enum + pattern matching 处理不同节点，未必要写完整访问者。

Rust 里访问者常见于 AST 遍历、编译器和解析器。若节点是 enum，`match` 很直接；若希望把“遍历结构”和“对节点执行什么操作”分开，就会定义 visitor trait。Rust 的模式匹配会削弱一部分访问者需求，但大型树结构上 visitor 仍然很实用。

## 何时用

- 对象结构稳定
- 需要不断添加新的操作
- 希望把操作和数据结构分离

## 何时慎用

元素类型若频繁变化，访问者接口会跟着反复修改，代价不小。巡按条目常换还好，若州县种类天天变，巡按自己先会累死。

## 类图速写

可画成“巡按分访图”：

- `Office.accept(Inspector)` 形成双分派
- 不同 `Inspector` 对同一组 `Office` 执行不同操作

## 下回伏笔

巡按走遍四方后，沈策已近晚年。旧制、旧案、旧军令堆在案上，他终于意识到，若不替这乱世立一套可解释的规则，后来人连复盘都无从下手。

## 收束

访问者模式擅长处理“结构稳、动作多”的局面。它把花样百出的检查动作，从对象身上剥下来，交给专门的人去做。
