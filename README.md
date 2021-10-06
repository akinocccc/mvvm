### 演示地址
[https://vkm0303.github.io/mvvm/demo.html](https://vkm0303.github.io/mvvm/demo.html)

### Finished

- [x] 双向数据绑定
- [x] 使用 mvvm 实例里的 methods 中的方法进行 click 事件绑定
- [x] 模拟 v-show 指令

### Todo

- [ ] 模拟 compute
- [ ] 模拟钩子函数

### 存留问题

当一个变量同时绑定了两个节点的时候，更新数据是，只有一个节点的值会更新

```html
<div class="on flex">
  <h4>{{title1}}</h4>
  <div class="content">
    <p>{{title1}}</p>
  </div>
</div>
```

```html
<div class="flex">
  <h4 v-show="isShow">{{title4}}</h4>
  <div>{{isShow}}</div>
  <button @click="isShowTitle">{{buttonText}}</button>
</div>
```
