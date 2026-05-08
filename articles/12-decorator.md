# 第十二回：战袍加身，甲上添甲：装饰器模式

![第十二回：战袍加身，甲上添甲：装饰器模式小说场景图](../assets/generated/scenes/12-decorator-scene.png)

## 开篇引句

人未必需要换，能力却常常是一层一层披上去的。

## 楔子

大军南下前，军器监给诸将试装新甲。先是里甲，再是锁子甲，外加战袍，若担心流矢，再配护臂与护颈。沈策站在一旁看册籍，忽然笑了，因为兵部有人建议给每一种装备组合都立一个新名目。

若真这么干，很快就会出现：

- 轻甲武士
- 轻甲加护臂武士
- 轻甲加护臂加护颈武士

军器监主事听完便骂：“你是要给武人披甲，还是要把名册写成山？”

沈策让人把名册摊开，又添了一项“防火内衬”。只这一项，就会逼着原先所有组合再生出一批新名字。众人这才明白，问题不是名字起得不够快，而是组合方式错了。

## 史局拆解

给对象增加功能，最粗暴的办法是继承。但功能组合一多，子类数量就会爆炸。

继承的问题在于它提前把组合写死了。护臂、护颈、战袍彼此相乘，很快就不是“扩展功能”，而是在维护一张越来越大的组合表。

## 模式之义

装饰器模式的思路是：人还是原来的人，能力一层一层往外叠。增强逻辑放在外层包装对象里，而不是不断派生新子类。

## 如果不这样写，代码通常会长成什么样

最容易掉进去的坑，就是为每种装备组合都写一个新类：

```java
class ArmorWarrior {
}

class ArmorWithArmGuardWarrior {
}

class ArmorWithArmGuardAndNeckGuardWarrior {
}
```

组合一多，子类数量就会失控。

## 从问题代码到模式代码，应该怎么想

这里真正会变化的是“额外加了什么装备”，不是“武士这个核心对象是谁”。

所以可以：

1. 先保留一个基础武士
2. 再把每层增强写成外部包装
3. 需要什么能力，就按顺序套上去

抽象之后，基础对象只负责原本职责；额外能力像甲片一样一层层挂上去。新增能力时，改的是新装饰器，不是旧装备体系。

## Java 示例

```java
interface Warrior {
    // 对外统一暴露装备结果
    String equip();
}

class BasicWarrior implements Warrior {
    @Override
    public String equip() {
        // 基础武士没有额外加成
        return "布衣武士";
    }
}

abstract class WarriorDecorator implements Warrior {
    // 装饰器内部持有被包装对象
    protected final Warrior warrior;

    protected WarriorDecorator(Warrior warrior) {
        this.warrior = warrior;
    }
}

class ArmorDecorator extends WarriorDecorator {
    public ArmorDecorator(Warrior warrior) {
        super(warrior);
    }

    @Override
    public String equip() {
        // 在原有结果外，再叠一层锁子甲
        return warrior.equip() + " + 锁子甲";
    }
}

class ArmGuardDecorator extends WarriorDecorator {
    public ArmGuardDecorator(Warrior warrior) {
        super(warrior);
    }

    @Override
    public String equip() {
        // 再叠一层护臂
        return warrior.equip() + " + 护臂";
    }
}

public class Client {
    public static void main(String[] args) {
        Warrior warrior = new BasicWarrior();

        // 功能按需要动态叠加，不必为每种组合新建子类
        warrior = new ArmorDecorator(warrior);
        warrior = new ArmGuardDecorator(warrior);

        System.out.println(warrior.equip());
    }
}
```

## 给其他语言背景的读者

如果你先接触的是 JavaScript，可以把装饰器先理解成“在原函数或原对象外再包一层增强”。  
Java 里常写成一层层实现同一接口的装饰器类，是为了保证包装前后对外仍是同一种对象。  
模式本身关心的是动态叠加功能，不是为了把包装动作写得特别复杂。

Python 里有语言级函数装饰器，JavaScript / TypeScript 也有装饰器语法或高阶函数；Objective-C 里可以用 category 扩展能力，但 category 更像给类直接加方法，不等同于运行时叠包装。Swift 里常见的是 property wrapper、protocol wrapper、函数包装或组合式 view modifier。

Rust 里装饰器常表现为 wrapper 类型：比如给一个 reader 外面套 buffer、日志、限速或压缩层。由于所有权清晰，一层包装通常会明确接管内层对象。它不靠继承叠功能，而是靠 newtype、trait 实现和组合把“甲上添甲”写出来。

## 何时用

- 需要动态增加功能
- 不想修改原类
- 继承会导致组合爆炸

## 何时慎用

装饰层太多时，调用链会变深，可读性也会下降。甲披到第五层，连主将自己都未必知道身上到底挂了些什么。

## 类图速写

可画成“逐层披甲图”：

- `WarriorDecorator` 包装 `Warrior`
- `ArmorDecorator`、`ArmGuardDecorator` 可按顺序叠加

## 下回伏笔

军器监这边刚整明白“层层增强”，六曹那边又抛出新的难题。沈策第一次意识到，有些麻烦不是单个对象怎么造，而是一整套对象必须同时成制。

## 收束

装饰器模式的精髓，是让增强像披甲一样逐层附着，而不是给每种装备搭配都另造一个人。
