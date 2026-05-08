# 第三回：玉玺只可一握：单例模式

![第三回：玉玺只可一握：单例模式小说场景图](../assets/generated/scenes/03-singleton-scene.png)

## 开篇引句

乱世最怕的不只是无主，还怕多主。

## 楔子

乱世里最难守的，不是城，也不是粮，而是名分。沈策在汴梁见过两份几乎一模一样的诏书，落款不同，印文却都号称出自中枢。那一夜，三省六部吵到五更，因为谁也不敢承认，若一件东西本该只有一份，却让人随意仿造，整个朝令体系都会崩塌。

老学士对沈策说：“玉玺之所以贵，不在玉，而在它只能有一个。”

后来沈策管军府档案、调粮簿册、印信库钥时，越发明白这话不止适用于朝廷。凡是系统里需要全局唯一、统一入口的对象，都像玉玺。

## 史局拆解

比如配置管理器、线程池、日志入口、缓存中心，如果你允许别人到处 `new`，就等于让各地私刻印信。代码短期可能没坏，运行时秩序却会慢慢松掉。

## 模式之义

单例模式要做两件事：

- 保证一个类只有一个实例
- 提供统一访问入口

它的重点从来不只是“方便到处拿”，而是“有些东西制度上就不该有第二份”。

## 如果不这样写，代码通常会长成什么样

最直白的写法，就是谁想用就直接创建：

```java
class ImperialSeal {
    public void stamp(String edict) {
        System.out.println("用印：" + edict);
    }
}

public class Client {
    public static void main(String[] args) {
        ImperialSeal seal1 = new ImperialSeal();
        ImperialSeal seal2 = new ImperialSeal();
    }
}
```

问题在于：系统里会出现多个本该唯一的对象。

## 从问题代码到模式代码，应该怎么想

这里要约束的，不是“怎么盖印”，而是“这个对象能不能被重复创建”。

所以要做三件事：

1. 把构造方法设成私有
2. 让类内部自己保存唯一实例
3. 对外只暴露统一访问入口

## Java 示例

```java
class ImperialSeal {
    // volatile 用来保证多线程下的可见性
    private static volatile ImperialSeal instance;

    // 私有构造，外界不能直接 new
    private ImperialSeal() {
    }

    public static ImperialSeal getInstance() {
        // 先检查一次，避免每次都加锁
        if (instance == null) {
            synchronized (ImperialSeal.class) {
                // 再检查一次，防止并发下创建多个实例
                if (instance == null) {
                    instance = new ImperialSeal();
                }
            }
        }
        return instance;
    }

    public void stamp(String edict) {
        // 唯一实例对外提供统一能力
        System.out.println("用玉玺批复：" + edict);
    }
}
```

更简洁、也更稳妥的写法，常常是枚举单例：

```java
enum ImperialSealHolder {
    INSTANCE;

    public void stamp(String edict) {
        // 枚举写法通常更简单，也更稳妥
        System.out.println("批复：" + edict);
    }
}
```

## 给其他语言背景的读者

如果你先接触的是 JavaScript 或 Python，单例可以先理解成“全局只有一个受控实例”，而不是“随处可访问的全局变量”。  
Java 里之所以会写成私有构造、静态字段和 `getInstance()`，是因为它需要在语言层面阻止别人继续 `new`。  
模式本身要解决的是唯一性与统一入口，不是某一种写法本身。

## 何时用

- 全局确实只能存在一个实例
- 构造代价高，不适合反复创建
- 访问点需要统一治理

## 何时慎用

单例很容易演变成“大杂烩全局变量”。如果它携带太多可变状态，测试会难写，耦合会悄悄上升。玉玺只有一个，但不该让它同时管钱粮、刑名和选将。

## 类图速写

可画成“玉玺独存图”：

- `ImperialSeal` 构造方法私有
- 类内部持有唯一实例
- 外界只能通过 `getInstance()` 取用

## 下回伏笔

印信之事告一段落，北境又催筑城。沈策拿到工部图卷时才明白，天下还有另一类麻烦，不是对象太多，而是一个对象本身就复杂得不像一句话能造完。

## 收束

单例模式不是偷懒的近道，而是一种制度声明：这件东西，全局唯一，谁都不能私造第二份。
