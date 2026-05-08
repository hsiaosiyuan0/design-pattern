# 第十七回：大营之内，部伍成林：组合模式

![第十七回：大营之内，部伍成林：组合模式小说场景图](../assets/generated/scenes/17-composite-scene.png)

## 开篇引句

层级一多，最先崩掉的往往不是结构，而是管理它的人。

## 楔子

大军开拔时，沈策最讨厌看的不是敌报，而是点兵册。一个营下有数都，一个都下有数队，一队下又有若干什伍。若每一层都要用不同方式处理，光是统计人数、发放军饷、下达号令，军府就会被层级压垮。

后来他改了册法：无论营、都、队、伍，只要能视作“一个作战单元”，外部操作就尽量统一。于是大到全营，小到一伍，管理方式开始收拢。

这套册法的好处很快显出来：发饷的人不必先问“这是营还是队”，传令的人也不必为每层结构写一套说法。只要它能作为单元接令，就按同一个入口处理。

## 史局拆解

树形结构在系统里极常见。若容器对象和叶子对象必须分别处理，客户端会到处写分支。

这些分支会散在统计、渲染、搜索、权限等各处。树越深，调用方越像在替数据结构做内务，真正的业务意图反而被层级判断盖住。

## 模式之义

组合模式让单个对象和组合对象对外表现一致，使调用方可以统一处理层级结构。

## 如果不这样写，代码通常会长成什么样

调用方会到处判断当前节点到底是叶子还是容器：

```java
if (unit instanceof Soldier) {
    ((Soldier) unit).showPower();
} else if (unit instanceof Squad) {
    ((Squad) unit).showPower();
}
```

树一深，这种判断就会越来越多。

## 从问题代码到模式代码，应该怎么想

这里关键的，不是区分节点类型，而是让它们对外行为尽量统一。

所以可以：

1. 先抽一个统一接口 `Unit`
2. 叶子节点实现它
3. 容器节点也实现它，并在内部递归调用子节点

抽象之后，调用方只面对 `Unit`。叶子如何执行、容器如何把动作分给子节点，都是结构内部自己的事。

## Java 示例

```java
import java.util.ArrayList;
import java.util.List;

interface Unit {
    // 无论单兵还是整队，都统一暴露这个能力
    void showPower();
}

class Soldier implements Unit {
    @Override
    public void showPower() {
        // 叶子节点：最基础的作战单元
        System.out.println("士卒战力：1");
    }
}

class Squad implements Unit {
    // 容器节点：内部可以继续包含其他 Unit
    private final List<Unit> children = new ArrayList<>();

    public void add(Unit unit) {
        children.add(unit);
    }

    @Override
    public void showPower() {
        // 容器节点把操作递归分发给子节点
        for (Unit child : children) {
            child.showPower();
        }
    }
}

public class Client {
    public static void main(String[] args) {
        Squad squad = new Squad();
        squad.add(new Soldier());
        squad.add(new Soldier());

        Squad battalion = new Squad();
        battalion.add(squad);
        battalion.add(new Soldier());

        // 调用方不区分叶子还是容器，统一按 Unit 处理
        battalion.showPower();
    }
}
```

## 给其他语言背景的读者

如果你来自 JavaScript，可以把组合模式先理解成“让树节点拥有统一接口”，递归时就不用到处分支判断。  
Java 里常用接口来统一叶子和容器，是因为它特别适合把递归结构的共同能力先抽出来。  
模式本身关心的是一致对外，不是为了把树结构画得更规整。

Python 和 JavaScript 里，树节点常常就是普通对象或字典，统一入口可能只是同名方法或同形数据。Objective-C / Swift 里，若节点种类固定，Swift 的 enum 递归结构会比一组类更紧凑；若需要开放扩展，protocol + 组合对象仍然合适。

Rust 里组合结构通常会显式面对递归类型大小问题，常见写法是 `enum Node { Leaf(...), Branch(Vec<Node>) }`，必要时用 `Box` 打断递归。若需要统一行为，可给 enum 实现方法或 trait。Rust 不会隐藏树的所有权关系，这能帮你更早看清谁拥有子节点。

## 何时用

- 业务数据是树形结构
- 希望统一处理叶子和容器
- 递归操作频繁

## 何时慎用

如果层级关系并不稳定，或叶子与容器行为差异很大，强行统一接口会显得勉强。

## 类图速写

可画成“营都队伍树图”：

- `Unit` 是统一抽象
- `Soldier` 是叶子
- `Squad` 持有多个 `Unit`

## 下回伏笔

层级理顺后，账房又来抱怨名册太厚。沈策翻了几眼便看出，许多信息明明一模一样，却在小卒名下被抄了一万遍。

## 收束

组合模式像整顿军制，把散乱层级收拢成统一秩序。外部先看见“部伍”，再看它内部如何生枝。
