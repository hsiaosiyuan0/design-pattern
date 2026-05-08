# 第七回：烽火连营，一呼百应：观察者模式

![第七回：烽火连营，一呼百应：观察者模式小说场景图](../assets/generated/scenes/07-observer-scene.png)

## 开篇引句

边关最可怕的，不是火起，而是火起之后无人响应。

## 楔子

北境入冬后，边关最怕的是夜里突然亮起的第一道火。沈策在雁门宿过一夜，亲眼见烽火台起烟：敌骑刚现踪影，台上兵卒点火，下一座台跟着应，驿站立刻备马，军仓开始开库，邻近州县封桥闭市。

没有谁挨家挨户跑去通知所有人，可所有该动的人都动了。

那天风大，火势照红了半边天。沈策站在城头说：“这不是一座台在做事，是所有看见信号的人在按规矩响应。”

他后来把这句话写进边防札记：烽火台若知道每一座仓、每一匹马、每一道桥该怎么处置，烽火台就不再是烽火台，而成了整条边线的总管。真正稳的制度，应当让它只负责把“敌至”这件事说出去。

## 史局拆解

系统里常常也有这种需求：一个对象状态变化后，多个对象要跟着反应。但如果事件源亲自维护所有后续逻辑，耦合会越攒越重。

坏处不只在“代码变长”。更麻烦的是发布者会开始知道太多下游细节：粮仓怎么开库、驿站怎么换马、州县怎么封桥，全被写进同一个类里。将来新增一个响应方，或者某个响应方的规则变了，最先被迫修改的反而是事件源。

## 模式之义

观察者模式把“事件发布者”和“事件响应者”拆开。发布者只管发信号，订阅者自行决定收到信号后做什么。

## 如果不这样写，代码通常会长成什么样

最常见的坏写法，是事件源自己把后续动作全部写死：

```java
class BeaconTower {
    public void alert() {
        System.out.println("通知守军");
        System.out.println("通知粮仓");
        System.out.println("通知驿站");
    }
}
```

这样每新增一个响应方，都得改烽火台本身。

## 从问题代码到模式代码，应该怎么想

这里真正应该变化的，是“谁来响应敌情”，而不是“敌情发生”这个事件。

所以可以这样拆：

1. 让烽火台只负责发布消息
2. 让守军、军仓、驿站自己订阅消息
3. 事件一发生，统一通知所有订阅者

这样一来，抽象移走的责任是“敌情之后谁该做什么”。烽火台仍然掌握事件发生的时刻，但不再掌握每个响应者的内部处置。

## Java 示例

```java
import java.util.ArrayList;
import java.util.List;

interface Observer {
    // 所有观察者都用同一个入口接收消息
    void update(String message);
}

class Garrison implements Observer {
    private final String name;

    public Garrison(String name) {
        this.name = name;
    }

    @Override
    public void update(String message) {
        // 不同驻军收到同一事件后，各自响应
        System.out.println(name + " 收到军情：" + message);
    }
}

class Granary implements Observer {
    @Override
    public void update(String message) {
        // 军仓收到敌情后，自行决定是否开库
        System.out.println("军仓收到军情：" + message + "，准备战时配给");
    }
}

class RelayStation implements Observer {
    @Override
    public void update(String message) {
        // 驿站收到敌情后，自行决定是否备马
        System.out.println("驿站收到军情：" + message + "，备马传令");
    }
}

class BeaconTower {
    // 发布者内部只维护订阅者列表
    private final List<Observer> observers = new ArrayList<>();

    public void subscribe(Observer observer) {
        // 新的响应方可以继续加入
        observers.add(observer);
    }

    public void alert(String message) {
        // 敌情一发生，统一通知所有订阅者
        for (Observer observer : observers) {
            observer.update(message);
        }
    }
}

public class Client {
    public static void main(String[] args) {
        BeaconTower tower = new BeaconTower();
        tower.subscribe(new Garrison("雁门守军"));
        tower.subscribe(new Granary());
        tower.subscribe(new RelayStation());

        tower.alert("敌骑逼近");
    }
}
```

## 给其他语言背景的读者

如果你先接触的是 JavaScript，可以把观察者模式先理解成事件监听或发布订阅。  
Java 里常把它写成 `Observer` 接口和一组对象，是因为它习惯用明确类型来约束“谁能接收通知”。  
模式本身关心的是事件源与响应方解耦，不是要求必须出现这些类名。

Python 里常见的是回调列表、信号库或事件总线；Objective-C 里有 NotificationCenter 和 KVO；Swift 里可能用闭包回调、Combine、NotificationCenter，或现在更常见的 async sequence。语言和框架越内置事件机制，手写观察者类就越少。

Rust 里观察者要额外面对所有权和生命周期。简单场景可以注册函数或闭包，复杂场景会用 channel、事件总线，或 `Arc<Mutex<...>>` 管理共享订阅者。Rust 会让你更早意识到一个问题：订阅者由谁持有，何时取消订阅，事件能否跨线程发送。

## 何时用

- 事件通知
- 业务状态变更广播
- GUI 监听
- 发布订阅模型

## 何时慎用

订阅者太多、链路太长时，问题会变得难追踪。烽火一起，诸镇虽动，但若没人画清楚谁响应了什么，排障会很痛苦。

## 类图速写

可画成“烽火联动图”：

- `BeaconTower` 维护多个 `Observer`
- `alert()` 触发统一通知

```mermaid
classDiagram
    class BeaconTower {
        -List~Observer~ observers
        +subscribe(observer)
        +alert(message)
    }
    class Observer {
        <<interface>>
        +update(message)
    }
    class Garrison
    class Granary
    class RelayStation

    BeaconTower o--> Observer : notifies
    Observer <|.. Garrison
    Observer <|.. Granary
    Observer <|.. RelayStation
```

## 下回伏笔

可烽火靠的是约定，军令却不能只靠约定。前线一场误传险些酿祸，沈策这才意识到，有些请求必须被写成卷、盖上印、留下可查的痕迹。

## 收束

观察者模式的妙处，在于让“事件发生”与“后续反应”分离。点火的人不必亲自去拉动整座边防体系。
