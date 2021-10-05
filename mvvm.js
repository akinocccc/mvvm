class MVVM {
  constructor(options = {}) {
    this.$options = options;
    this.$data = options.data;
    this.$methods = options.methods;
    new Observer(this.$data);
    this._proxy(this.$data);
    this._proxy(this.$methods);
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
            this.$data[key] = newVal;
          },
          get: function () {
            // console.log(`获取${key}的值为`, this.$data[key])
            return this.$data[key];
          }
        });
      }
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
    Dep.target = null;
  }

  update() {
    let val = this.vm;
    this.exp.split('.').forEach(key => {
      val = val[key];
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
// function Dep() {
//   this.subs = [];
// }

// Dep.prototype.subscribe = function (sub) {
//   this.subs.push(sub);
// };
// Dep.prototype.notify = function () {
//   this.subs.forEach(sub => sub.update());
// };

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
        function replaceText() {
          node.textContent = text.replace(reg, (matched, placeholder) => {
            // console.log(placeholder);
            new Watcher(vm, placeholder, replaceText);
            return placeholder.split('.').reduce((val, key) => {
              // console.log(val, key);
              return val[key];
            }, vm);
          });
        }
        replaceText();
      } else if (node.nodeType === 1) {
        let attrs = node.attributes;     // 获取dom节点的属性
        // console.log(attrs);
        Array.from(attrs).forEach(attr => {
          let name = attr.name;
          let exp = attr.value;   // v-model="c"
          if (name.includes('v-')) {  // v-model
            node.value = vm[exp];
          } else if (name.includes('@click')) {
            console.log(vm);
            node.addEventListener('click', vm.$methods[exp]);
          }
          new Watcher(vm, exp, function (newVal) {
            node.value = newVal;    // 当watcher触发时会自动将内容放进输入框中
          });
          node.addEventListener('input', function (e) {
            let newVal = e.target.value;
            vm[exp] = newVal;
            console.log(vm);
          });
        });
      }
      if (node.childNodes && node.childNodes.length) {
        this._replace(node, vm);
      }
    });
  }
}