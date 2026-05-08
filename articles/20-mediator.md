# 第二十回：群臣争语，须有居中者：中介者模式

![第二十回：群臣争语，须有居中者：中介者模式小说场景图](../assets/generated/scenes/20-mediator-scene.png)

## 开篇引句

当人人都能直接喊话时，消息最快，也最乱。

## 楔子

某次朝议，兵部要钱，户部要凭据，工部说军械未齐，枢密院又催明日即发。四边衙门互相指摘，几乎从晨鼓吵到晚钟。沈策在殿角旁听，越听越明白：坏的不是哪一个部门，而是人人都直接找人人，消息像乱箭一样飞。

第二天，他建议由行营都督府统一协调。自此兵部不再直接追户部，工部也不再四处递话，各方都先报都督府，再由都督府统筹调度。

这并不是让都督府替所有部门干活，而是把“谁该通知谁、先后如何、冲突怎样裁断”集中到一处。部门仍做自己的事，只是不再把彼此关系织成一张乱网。

## 史局拆解

当多个对象互相直接通信、彼此依赖时，网状关系会迅速失控。任何一方改动，都可能牵连多人。

网状依赖最难排查：消息从哪里来、又被谁转发，常常没有中心记录。新增一个部门时，它还要认识所有旧部门，系统越长越难进新人。

## 模式之义

中介者模式引入一个居中协调者，让对象之间不再直接耦合，而是通过中介者通信。

## 如果不这样写，代码通常会长成什么样

最糟的时候，每个部门都直接找其他部门：

```java
armyDepartment.askFinance();
financeDepartment.askFactory();
factoryDepartment.askArmy();
```

关系一多，就会变成互相缠绕的网。

## 从问题代码到模式代码，应该怎么想

这里最需要集中治理的，不是某一个部门，而是部门之间的协作规则。

所以可以：

1. 让部门不再彼此直接通信
2. 引入一个居中的协调者
3. 所有请求统一先交给协调者分发

抽象移走的是“对象之间互相认识”的责任。每个部门只认识中介者，协作规则则集中在中介者里维护。

## Java 示例

```java
interface Mediator {
    // 所有协调请求都先进入中介者
    void notify(Department sender, String event);
}

abstract class Department {
    // 每个部门只持有中介者，不直接持有其他部门
    protected final Mediator mediator;

    protected Department(Mediator mediator) {
        this.mediator = mediator;
    }
}

class ArmyDepartment extends Department {
    public ArmyDepartment(Mediator mediator) {
        super(mediator);
    }

    public void requestFood() {
        // 部门只上报需求，不自己去找别的部门
        mediator.notify(this, "need_food");
    }
}

class CourtMediator implements Mediator {
    @Override
    public void notify(Department sender, String event) {
        // 所有协作规则集中写在这里
        System.out.println("中枢协调事件：" + event);
    }
}
```

## 给其他语言背景的读者

如果你来自 JavaScript，可以把中介者模式先理解成“把一堆对象之间的对话，收束到一个中央协调器里”。  
Java 里常写成一个明确的 `Mediator` 接口，是因为它希望把协调规则作为独立对象存在。  
模式本身关心的是减少网状耦合，不是为了把部门关系写得更像官样结构图。

## 何时用

- 多对象交互复杂
- 对象之间形成网状耦合
- 希望把协作规则集中管理

## 何时慎用

中介者自己很容易膨胀成“超级中枢”。若所有逻辑都塞进去，它会从协调者变成新的瓶颈。

## 类图速写

可画成“都督府调度图”：

- 各 `Department` 仅与 `Mediator` 通信
- 由 `CourtMediator` 集中协调规则

## 下回伏笔

中枢总算安静下来，可南征旧败案却重新被翻出。沈策看着发黄战卷，忽然觉得，制度若只会向前推进，却不能把某一刻的真相留下，后人迟早重蹈覆辙。

## 收束

中介者模式不是让众臣失语，而是让纷乱的话路先收归一处，再有秩序地发出去。
