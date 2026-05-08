# 第十六回：舟车虽异，共承其职：桥接模式

![第十六回：舟车虽异，共承其职：桥接模式小说场景图](../assets/generated/scenes/16-bridge-scene.png)

## 开篇引句

路是一种变化，货又是另一种变化，把两者捆死，多半要出乱。

## 楔子

南下途中，沈策负责调运军资。平地走车，水网走船，山路靠驮队；而运的东西又分粮草、军械、密檄。起初有人建议按组合立类，比如“船运粮草使”“车运军械使”“驮队运密檄使”。沈策听完只觉得头疼，因为运输方式和运输内容分明是两条维度，硬捆在一起，组合会无穷无尽。

等队伍行到江淮，水路忽然断了一段，只能以车队接驳。若每一种货物都绑定一种运输类，临时改道就要牵动半套代码。沈策要的，是货物制度和运输制度能各自变化。

## 史局拆解

如果一个类同时有两个独立变化维度，单靠继承往往会导致类爆炸。

继承只能沿一条主线往下分叉。可当变化本来就是两条线，硬塞进同一棵继承树，新增任一维度都会让另一维度一起膨胀。

## 模式之义

桥接模式把抽象部分和实现部分拆开，让它们各自独立变化，再通过组合连接起来。

## 如果不这样写，代码通常会长成什么样

最容易出现的问题，是把两条变化维度硬塞进继承体系：

```java
class BoatGrainOrder {
}

class BoatWeaponOrder {
}

class CartGrainOrder {
}
```

运输方式和货物类型一组合，类数量就会一路膨胀。

## 从问题代码到模式代码，应该怎么想

这里其实有两条独立变化线：

1. 用什么运输方式
2. 运什么货物

所以应该把它们拆成两套独立层次，再用组合连起来。

桥接的抽象动作，是让“货物订单”持有“运输方式”，而不是让类名同时继承两种含义。这样加一种货物不必改运输，加一种运输也不必重写所有货物。

## Java 示例

```java
interface Transporter {
    // 不同运输方式都要能承载货物
    void carry(String cargo);
}

class BoatTransporter implements Transporter {
    @Override
    public void carry(String cargo) {
        // 水路运输实现
        System.out.println("船运：" + cargo);
    }
}

class CartTransporter implements Transporter {
    @Override
    public void carry(String cargo) {
        // 陆路运输实现
        System.out.println("车运：" + cargo);
    }
}

abstract class CargoOrder {
    // 货物抽象层持有运输实现层
    protected final Transporter transporter;

    protected CargoOrder(Transporter transporter) {
        this.transporter = transporter;
    }

    public abstract void deliver();
}

class GrainOrder extends CargoOrder {
    public GrainOrder(Transporter transporter) {
        super(transporter);
    }

    @Override
    public void deliver() {
        // 粮草订单可以搭配任意运输方式
        transporter.carry("粮草");
    }
}

class WeaponOrder extends CargoOrder {
    public WeaponOrder(Transporter transporter) {
        super(transporter);
    }

    @Override
    public void deliver() {
        // 军械订单也可以搭配任意运输方式
        transporter.carry("军械");
    }
}

public class Client {
    public static void main(String[] args) {
        CargoOrder boatGrain = new GrainOrder(new BoatTransporter());
        CargoOrder cartWeapon = new WeaponOrder(new CartTransporter());

        boatGrain.deliver();
        cartWeapon.deliver();
    }
}
```

## 给其他语言背景的读者

如果你来自 JavaScript，可以把桥接模式先理解成“把两个独立维度拆成两个可组合模块”。  
Java 里用抽象类加接口的写法很常见，因为它擅长显式表达“抽象层持有实现层”。  
模式本身关心的是维度分离，不是为了把组合问题写得更像教科书。

Python 和 JavaScript 里，桥接往往就是对象组合或函数参数：一个业务对象持有一个可替换的实现模块。Objective-C / Swift 里，protocol + 组合很自然，尤其适合把平台差异、存储差异、渲染差异从业务抽象里拆出去。

Rust 里桥接通常会写成泛型参数、trait bound 或 trait object。编译期固定实现时，用泛型能少一次动态分派；运行时要换实现时，再用 `Box<dyn Trait>`。Rust 让你更明确地选择：这座桥是在编译期架好，还是运行时临时换路。

## 何时用

- 存在两个或多个独立变化维度
- 不想让继承组合爆炸
- 希望抽象与实现能独立扩展

## 何时慎用

变化维度若并不独立，硬拆会徒增理解成本。不是所有舟与货都值得另外架一座桥。

## 类图速写

可画成“舟车运货图”：

- 抽象层 `CargoOrder` 持有实现层 `Transporter`
- 运输方式与货物类型分两条维度展开

## 下回伏笔

运粮路上，沈策重看点兵册，又被另一种层级压得皱眉。一个营下面还有都、队、伍，若每层都要单独对待，军府永远忙不过来。

## 收束

桥接模式搭的不是代码层面的花架子，而是两套变化之间的通道。舟车改其路，粮械改其类，彼此不再相互拖累。
