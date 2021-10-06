class MVVM {
  constructor(options = {}) {
    this.$options = options;
    this.$data = options.data;
    this.$methods = options.methods;
    this.$data.vShow = [];
    new Observer(this.$data);
    this._proxy(this.$data);
    this._proxy(this.$methods);
    this._bind(this.$methods);
    new Compile(options.el, this);
  }
  // vm代理，this代理this.$data，即可以直接使用this.key访问data的数据
  _proxy(data) {
    if (typeof data === 'object') {
      for (let key in data) {
        Object.defineProperty(this, key, {
          enumerable: true, // 可被枚举
          set: function (newVal) {
            // console.log(`${key}的值改变为`, newVal)
            data[key] = newVal;
          },
          get: function () {
            // console.log(`获取${key}的值为`, this.$data[key])
            return data[key];
          }
        });
      }
    }
  }

  // 将methods里的方法的this绑定到实例上，在methods中可以使用this.key来访问data里的数据
  _bind(methods) {
    for (let key in methods) {
      methods[key] = methods[key].bind(this);
    }
  }
}

class Observer {
  constructor(data) {
    const that = this;
    for (let key in data) {
      let val = data[key];
      let dep = new Dep();
      this._traverse(val); // 递归遍历，深度劫持
      Object.defineProperty(data, key, {
        enumerable: true, // 可被枚举
        set: function (newVal) {
          if (val !== newVal) {
            val = newVal;
            dep.notify(key);
            return newVal;
          }
        },
        get: function () {
          Dep.target && dep.subscribe(key, Dep.target); //?为什么在这里订阅, 不是很理解
          return val;
        }
      });
    }
  }

  _traverse(data) {
    if (data && typeof data === 'object') {
      return new Observer(data);
    }
  }
}

class Watcher {
  constructor(vm, exp, cb) { // 实例本身，模板键值(如v-model="obj.key"的obj.key)，回调函数
    this.vm = vm;
    this.exp = exp;
    this.cb = cb;
    Dep.target = this;
    let val = vm;
    exp.split('.').forEach(key => {
      val = val[key];
    });
  }

  update() {
    let val = this.vm;
    this.exp.split('.').forEach(key => {
      val = val[key];
    });
    this.vm.vShow.forEach(obj => {
      obj.node.style.display = this.vm[obj.key] ? '' : 'none';
    });
    this.cb(val);
  }
}

class Dep {
  constructor() {
    this.subscribeObj = {};
  }

  subscribe(key, sub) {
    this.subscribeObj[key] = sub;
  }

  notify(key) {
    this.subscribeObj[key].update();
  }
}

class Compile {
  constructor(el, vm) {
    vm.$el = document.querySelector(el);
    let fragment = document.createDocumentFragment();
    let child;
    while (child = vm.$el.firstChild) {
      fragment.appendChild(child);
    }
    this._replace(fragment, vm);
    // 再将文档碎片放入el中
    vm.$el.appendChild(fragment);
  }

  _replace(fragment, vm) {
    Array.from(fragment.childNodes).forEach(node => {
      let text = node.textContent;
      let reg = /\{\{(.*?)\}\}/g;
      /*
       * nodeType: 1 元素节点，3 文本节点
       */
      if (node.nodeType === 3 && reg.test(text)) {
        console.log(node)
        function _replaceText() {  // 替换节点文本
          node.textContent = text.replace(reg, (matched, placeholder) => {
            console.log(matched)
            new Watcher(vm, placeholder, _replaceText);
            return placeholder.split('.').reduce((val, key) => {
              return val[key];
            }, vm);
          });
        }
        _replaceText();
      }
      if (node.nodeType === 1) {
        let attrs = node.attributes;     // 获取dom节点的属性
        Array.from(attrs).forEach(attr => {
          let name = attr.name;
          let exp = attr.value;
          if (name.includes('v-model')) {  // v-model
            node.value = vm[exp];
          } else if (name.includes('@click')) { //绑定点击事件
            console.log(vm);
            node.addEventListener('click', vm[exp]);
          } else if (name.includes('v-show')) {
            vm.vShow.push({
              node,
              type: 'v-show',
              key: exp
            });
            node.style.display = vm[exp] ? '' : 'none';
            console.log(vm[exp], 1);
          }
          new Watcher(vm, exp, function (newVal) {
            node.value = newVal;    // 当watcher触发时会自动将内容放进输入框中
          });
          node.addEventListener('input', function (e) { // 监听input事件，输入时更新数据
            let newVal = e.target.value;
            let val = vm;
            let k = exp;
            console.log(exp)
            // exp.split('.').forEach(key => {
            //   k = key;
            //   if (typeof val[key] === 'object') {
            //     //val = val[key];
            //   }
            // });
            vm[exp] = newVal;
            // new Observer()._traverse(val[k]);
          });
        });
      }
      if (node.childNodes && node.childNodes.length) {
        this._replace(node, vm);
      }
    });
  }
}