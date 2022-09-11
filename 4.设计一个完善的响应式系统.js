/*
 * @Description:
 * 1. 代理拦截data的get属性 -> 将key和副作用函数关联起来
 * 2. 代理拦截data的set属性 -> 当用户给data重新赋值时(过滤掉副作用函数里的赋值操作),自动执行[对应key]的副作用函数
 * 3. 创建工厂函数 -> 利用副作用函数栈自定义每个key的副作用函数,执行副作用函数前,先断开它与其他key的关联,执行副作用函数后,弹出顶端的副作用函数
 * 4. 手动执行副作用函数 -> 执行get拦截器,根据data的值修改网页
 * 5. 修改data的值 -> 执行set拦截器
 * @Date: 2022-09-04 14:38:11
 * @Author: ranwawa <ranwawa@zmn.cn>
 */

const data = { name: "冉娃娃", age: 18, showAge: true };

const bucket = {};
const effectStack = [];

const proxyData = new Proxy(data, {
  get(target, key) {
    const activeEffect = effectStack[effectStack.length - 1];
    bucket[key] = activeEffect;
    activeEffect.deps.push(key);

    return target[key];
  },
  set(target, key, newValue) {
    target[key] = newValue;

    const currentEffect = bucket[key];

    if (!currentEffect) {
      return true;
    }

    // 解决: 注册副作用函数时,同时读取设置对象值导致的死循环
    if (currentEffect !== effectStack[effectStack.length - 1]) {
      bucket[key]({ key });
    }
  },
});

function effectFactory(effectFn) {
  const wrappedEffectFn = ({ key } = {}) => {
    console.log("执行副作用函数,修改网页上的值", key);

    wrappedEffectFn.deps.map((dep) => {
      delete bucket[dep];
    });

    wrappedEffectFn.deps = [];

    effectStack.push(wrappedEffectFn);
    effectFn();
    effectStack.pop();
  };

  wrappedEffectFn.deps = [];

  wrappedEffectFn();
}

effectFactory(() => {
  // TODO: age上注册了2个副作用函数,但是修改age值时,前面注册的这个副作用函数未被执行
  document.querySelector("#age").innerHTML = proxyData.age;
});

effectFactory(() => {
  document.querySelector("#text").innerHTML =
    proxyData.age > 17 ? "成年" : "未成年";
});

proxyData.age = 17;
