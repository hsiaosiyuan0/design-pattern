# 第六回：牙门深处，不见其人：代理模式

![第六回：牙门深处，不见其人：代理模式小说场景图](../assets/generated/scenes/06-proxy-scene.png)

## 开篇引句

权力越重，越不会裸露在所有请求面前。

## 楔子

沈策到淮南借粮时，第一次见识到真正的大藩镇是怎样挡人的。前来求见者，从午门外排到长街，先经牙将验牒，再由录事判轻重，最后才有资格把文书递进内堂。许多人奔波一日，连节度使的影子都看不见，只跟门前属吏打交道。

起初他觉得这是故作威严。后来他在军府任职，才发现并非如此。若任何事务都直接打到主事者身上，大人物很快就会被杂务拖死，真正要紧的军情反而沉底。

## 史局拆解

很多对象不适合被直接访问：

- 可能初始化代价高
- 可能需要权限校验
- 可能要做日志、缓存、限流
- 可能其实是远程对象

这时让调用方直接碰真实对象，既危险，也粗糙。

## 模式之义

代理模式就是在真实对象前面站一道牙门。外界先跟代理打交道，由代理决定要不要放行、何时创建真实对象、要不要附带记录与限制。

## 如果不这样写，代码通常会长成什么样

最直接的写法，就是谁来访问都直接碰真实对象：

```java
class RealGovernor {
    public void approve() {
        System.out.println("节度使亲自批示");
    }
}

class VisitorService {
    public void visit() {
        RealGovernor governor = new RealGovernor();
        governor.approve();
    }
}
```

这样会带来三个问题：

- 权限校验没地方放
- 日志记录没地方放
- 后面如果要做懒加载或远程访问，会改动业务代码

## 从问题代码到模式代码，应该怎么想

这里不是要改“批示”本身，而是要在它前面加一层控制。

所以可以这样拆：

1. 先抽一个共同接口
2. 真实对象实现这个接口
3. 代理对象也实现这个接口，并在内部调用真实对象

## Java 示例

```java
interface Governor {
    // 外界只知道这里有一个批示入口
    void approve();
}

class RealGovernor implements Governor {
    @Override
    public void approve() {
        // 真实对象只处理核心业务
        System.out.println("节度使亲自批示");
    }
}

class GovernorProxy implements Governor {
    // 代理内部持有真实对象
    private final RealGovernor realGovernor = new RealGovernor();

    @Override
    public void approve() {
        // 先做访问控制
        System.out.println("先校验来人身份");

        // 再调用真实对象
        realGovernor.approve();

        // 最后补上附加行为
        System.out.println("记录来访档案");
    }
}
```

## 给其他语言背景的读者

如果你来自 JavaScript 或 Python，可以把代理模式先理解成“在真实调用前后包一层控制逻辑”。  
Java 里常写成“代理对象和真实对象实现同一个接口”，是因为这样调用方就可以无感切换，不必知道自己拿到的是哪一层。  
模式本身关心的是访问控制、懒加载、远程包装这些职责，不是强制要求一定有某种复杂类结构。

## 何时用

- 访问前需要校验或控制
- 对象创建很重，适合懒加载
- 需要包装远程调用、日志、缓存

## 何时慎用

如果你只是想简单扩展一点行为，装饰器往往更贴切。代理强调的是“控制访问”，不是“单纯增强”。

## 类图速写

可画成“牙门设限图”：

- `GovernorProxy` 与 `RealGovernor` 共同实现 `Governor`
- 外界先触达代理，再由代理决定是否放行

## 下回伏笔

借粮事毕，北境烽火又起。沈策站上城头时，看见的不是某一个人的威权，而是一整张被信号唤醒的边防网络。

## 收束

代理模式的重点，不是多包一层，而是让秩序站在真实对象前面。
