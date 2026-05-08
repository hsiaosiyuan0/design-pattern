# 第四回：边城起于图卷：建造者模式

![第四回：边城起于图卷：建造者模式小说场景图](../assets/generated/scenes/04-builder-scene.png)

## 开篇引句

一座城若能被一句话造完，多半也会被一句话攻破。

## 楔子

北境秋寒，边报又急。朝廷命河东修一座新城，要求“可守三月，可屯万人，可纳粮，可驻骑兵”。诏书只有短短十几字，可工部一到现场就发现，真正的难处全在没写出来的地方。

城墙多高，箭楼几座，瓮城要不要，粮仓放内城还是外郭，水源引河还是凿井，敌军若以火攻，城门结构还得另改。一个年轻工匠提议，把所有配置都塞进构造方法，老师傅听完冷笑：“你这是想用一行竹简写完一座城。”

沈策翻着图卷，看了半天，只说：“筑城不能一锤子砸出来，得按步骤来。”

## 史局拆解

对象字段多、可选参数多、构建顺序复杂时，直接写一个“大而全”的构造方法，会让调用者根本看不出自己到底造了个什么东西。

这就是经典的构造参数地狱。

## 模式之义

建造者模式把复杂对象的创建过程拆成多个清晰步骤，最后由 `build()` 收口。

图卷一页一页画，城池一层一层起。调用者不再被迫一次性背出所有参数。

## 如果不这样写，代码通常会长成什么样

最容易写成一个很长的构造方法：

```java
class Fortress {
    public Fortress(int wallHeight, int towerCount, boolean hasMoat, boolean hasGranary) {
    }
}

public class Client {
    public static void main(String[] args) {
        Fortress fortress = new Fortress(12, 4, true, true);
    }
}
```

## 给其他语言背景的读者

如果你来自 JavaScript 或 Python，可能会觉得“传一个大配置对象进去不就行了”。这种感觉并没有错。  
建造者模式在 Java 里常见，是因为 Java 的构造器参数一多，读写体验会迅速变差，尤其在字段很多、可选项很多时更明显。  
模式本身关心的是“把复杂创建过程拆开”，至于在别的语言里用链式 builder、配置对象还是工厂函数，都是落地方式的差异。

表面上构造成功了，但读代码的人很难一眼看出 `12, 4, true, true` 到底分别代表什么。

## 从问题代码到模式代码，应该怎么想

这里真正复杂的，不是对象本身，而是“创建过程”。

所以可以这样拆：

1. 先准备一个 `Builder`
2. 按步骤设置各项配置
3. 最后调用 `build()` 生成完整对象

## Java 示例

```java
class Fortress {
    private final int wallHeight;
    private final int towerCount;
    private final boolean hasMoat;
    private final boolean hasGranary;

    private Fortress(Builder builder) {
        // 最终对象从 Builder 中取出全部配置
        this.wallHeight = builder.wallHeight;
        this.towerCount = builder.towerCount;
        this.hasMoat = builder.hasMoat;
        this.hasGranary = builder.hasGranary;
    }

    public static class Builder {
        private int wallHeight;
        private int towerCount;
        private boolean hasMoat;
        private boolean hasGranary;

        public Builder wallHeight(int wallHeight) {
            // 设置城墙高度
            this.wallHeight = wallHeight;
            return this;
        }

        public Builder towerCount(int towerCount) {
            // 设置箭楼数量
            this.towerCount = towerCount;
            return this;
        }

        public Builder hasMoat(boolean hasMoat) {
            // 是否修护城河
            this.hasMoat = hasMoat;
            return this;
        }

        public Builder hasGranary(boolean hasGranary) {
            // 是否配置粮仓
            this.hasGranary = hasGranary;
            return this;
        }

        public Fortress build() {
            // 所有步骤完成后，再生成最终对象
            return new Fortress(this);
        }
    }
}
```

## 何时用

- 对象参数很多，且多数是可选项
- 创建步骤本身有顺序和校验要求
- 希望对象创建完后尽量保持不可变

## 何时慎用

如果对象很简单，两个字段就能说清，建造者模式反而像修一间草屋却先立了都城图籍司。

## 类图速写

可画成“图卷筑城图”：

- `Fortress.Builder` 分步收集参数
- `build()` 最终生成 `Fortress`

## 下回伏笔

边城图成后，吴越使者恰入汴梁。沈策本以为工部已经够难缠，没想到真正让朝廷发愁的，是两套制度之间连话都说不通。

## 收束

建造者模式承认了一件事：复杂对象本就不该“一把铸成”，而应当“按图分步而成”。
