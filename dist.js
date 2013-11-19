/*
 * Copyright 2013 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
Polymer = {};

/*
 * Copyright 2013 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */


// TODO(sorvell): this ensures Polymer is an object and not a function
// Platform is currently defining it as a function to allow for async loading
// of polymer; once we refine the loading process this likely goes away.
if (typeof window.Polymer === 'function') {
  Polymer = {};
}

(function(scope) {
  // FOUC prevention tactic
  // default list of veiled elements
  scope.veiledElements = ['body'];
  // add polymer styles
  var VEILED_CLASS = 'polymer-veiled';
  var UNVEIL_CLASS = 'polymer-unveil';
  var TRANSITION_TIME = 0.3;
  var style = document.createElement('style');
  style.textContent = '.' + VEILED_CLASS + ' { ' +
      'opacity: 0; } \n' +
      '.' + UNVEIL_CLASS +  '{ ' +
      '-webkit-transition: opacity ' + TRANSITION_TIME + 's; ' +
      'transition: opacity ' + TRANSITION_TIME +'s; }\n';
  var head = document.querySelector('head');
  head.insertBefore(style, head.firstChild);

  // apply veiled class
  function veilElements() {
    var veiled = Polymer.veiledElements;
    if (veiled) {
      for (var i=0, l=veiled.length, u; (i<l) && (u=veiled[i]); i++) {
        veilElementsBySelector(u);
      }
    }
  }

  function veilElementsBySelector(selector) {
    var nodes = document.querySelectorAll(selector);
    for (var i=0, l=nodes.length, n; (i<l) && (n=nodes[i]); i++) {
      n.classList.add(VEILED_CLASS);
    }
  }

  // apply unveil class
  function unveilElements() {
    requestAnimationFrame(function() {
      var nodes = document.querySelectorAll('.' + VEILED_CLASS);
      for (var i=0, l=nodes.length, n; (i<l) && (n=nodes[i]); i++) {
        n.classList.add(UNVEIL_CLASS);
        n.classList.remove(VEILED_CLASS);
      }
      // NOTE: depends on transition end event to remove 'unveil' class.
      if (nodes.length) {
        var removeUnveiled = function() {
          for (var i=0, l=nodes.length, n; (i<l) && (n=nodes[i]); i++) {
            n.classList.remove(UNVEIL_CLASS);
          }
          document.body.removeEventListener(endEvent, removeUnveiled, false);
        }
        document.body.addEventListener(endEvent, removeUnveiled, false);
      };
    });
  }

  // determine transition end event
  var endEvent = (document.documentElement.style.webkitTransition !== undefined) ?
      'webkitTransitionEnd' : 'transitionend';

  // hookup auto-unveiling
  document.addEventListener('DOMContentLoaded', veilElements);
  window.addEventListener('WebComponentsReady', unveilElements);

  // exports
  // can dynamically unveil elements by adding the veiled class and then 
  // calling Polymer.unveilElements
  scope.unveilElements = unveilElements;

})(Polymer);

/*
 * Copyright 2013 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
(function(scope) {

  // copy own properties from 'api' to 'prototype, with name hinting for 'super'
  function extend(prototype, api) {
    if (prototype && api) {
      // use only own properties of 'api'
      Object.getOwnPropertyNames(api).forEach(function(n) {
        // acquire property descriptor
        var pd = Object.getOwnPropertyDescriptor(api, n);
        if (pd) {
          // clone property via descriptor
          Object.defineProperty(prototype, n, pd);
          // cache name-of-method for 'super' engine
          if (typeof pd.value == 'function') {
            // hint the 'super' engine
            pd.value.nom = n;
          }
        }
      });
    }
    return prototype;
  }
  
  // exports

  scope.extend = extend;

})(Polymer);

/* 
 * Copyright 2013 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function(scope) {
  
  // usage
  
  // invoke cb.call(this) in 100ms, unless the job is re-registered,
  // which resets the timer
  // 
  // this.myJob = this.job(this.myJob, cb, 100)
  //
  // returns a job handle which can be used to re-register a job

  var Job = function(inContext) {
    this.context = inContext;
  };
  Job.prototype = {
    go: function(callback, wait) {
      this.callback = callback;
      this.handle = setTimeout(this.complete.bind(this), wait);
    },
    stop: function() {
      if (this.handle) {
        clearTimeout(this.handle);
        this.handle = null;
      }
    },
    complete: function() {
      if (this.handle) {
        this.stop();
        this.callback.call(this.context);
      }
    }
  };
  
  function job(job, callback, wait) {
    if (job) {
      job.stop();
    } else {
      job = new Job(this);
    }
    job.go(callback, wait);
    return job;
  }
  
  // exports 

  scope.job = job;
  
})(Polymer);

/*
 * Copyright 2013 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
(function(scope) {

  var registry = {};

  HTMLElement.register = function(tag, prototype) {
    registry[tag] = prototype;
  }

  // get prototype mapped to node <tag>
  HTMLElement.getPrototypeForTag = function(tag) {
    var prototype = !tag ? HTMLElement.prototype : registry[tag];
    // TODO(sjmiles): creating <tag> is likely to have wasteful side-effects
    return prototype || Object.getPrototypeOf(document.createElement(tag));
  };

  // we have to flag propagation stoppage for the event dispatcher
  var originalStopPropagation = Event.prototype.stopPropagation;
  Event.prototype.stopPropagation = function() {
    this.cancelBubble = true;
    originalStopPropagation.apply(this, arguments);
  };
  
  HTMLImports.importer.preloadSelectors += 
      ', polymer-element link[rel=stylesheet]';

})(Polymer);

/*
 * Copyright 2013 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
 (function(scope) {
    // super

    // `arrayOfArgs` is an optional array of args like one might pass
    // to `Function.apply`

    // TODO(sjmiles):
    //    $super must be installed on an instance or prototype chain
    //    as `super`, and invoked via `this`, e.g.
    //      `this.super();`
     
    //    will not work if function objects are not unique, for example,
    //    when using mixins.
    //    The memoization strategy assumes each function exists on only one 
    //    prototype chain i.e. we use the function object for memoizing)
    //    perhaps we can bookkeep on the prototype itself instead
    function $super(arrayOfArgs) {
      // since we are thunking a method call, performance is important here: 
      // memoize all lookups, once memoized the fast path calls no other 
      // functions
      //
      // find the caller (cannot be `strict` because of 'caller')
      var caller = $super.caller;
      // memoized 'name of method' 
      var nom = caller.nom;
      // memoized next implementation prototype
      var _super = caller._super;
      if (!_super) {
        if (!nom) {
          nom = caller.nom = nameInThis.call(this, caller);
        }
        if (!nom) {
          console.warn('called super() on a method not installed declaratively (has no .nom property)');
        }
        // super prototype is either cached or we have to find it
        // by searching __proto__ (at the 'top')
        _super = memoizeSuper(caller, nom, getPrototypeOf(this));
      }
      if (!_super) {
        // if _super is falsey, there is no super implementation
        //console.warn('called $super(' + nom + ') where there is no super implementation');
      } else {
        // our super function
        var fn = _super[nom];
        // memoize information so 'fn' can call 'super'
        if (!fn._super) {
          memoizeSuper(fn, nom, _super);
        }
        // invoke the inherited method
        // if 'fn' is not function valued, this will throw
        return fn.apply(this, arrayOfArgs || []);
      }
    }

    function nextSuper(proto, name, caller) {
      // look for an inherited prototype that implements name
      while (proto) {
        if ((proto[name] !== caller) && proto[name]) {
          return proto;
        }
        proto = getPrototypeOf(proto);
      }
    }

    function memoizeSuper(method, name, proto) {
      // find and cache next prototype containing `name`
      // we need the prototype so we can do another lookup
      // from here
      method._super = nextSuper(proto, name, method);
      if (method._super) {
        // _super is a prototype, the actual method is _super[name]
        // tag super method with it's name for further lookups
        method._super[name].nom = name;
      }
      return method._super;
    }

    function nameInThis(value) {
      var p = this.__proto__;
      while (p && p !== HTMLElement.prototype) {
        // TODO(sjmiles): getOwnPropertyNames is absurdly expensive
        var n$ = Object.getOwnPropertyNames(p);
        for (var i=0, l=n$.length, n; i<l && (n=n$[i]); i++) {
          var d = Object.getOwnPropertyDescriptor(p, n);
          if (typeof d.value === 'function' && d.value === value) {
            return n;
          }
        }
        p = p.__proto__;
      }
    }

    // NOTE: In some platforms (IE10) the prototype chain is faked via 
    // __proto__. Therefore, always get prototype via __proto__ instead of
    // the more standard Object.getPrototypeOf.
    function getPrototypeOf(prototype) {
      return prototype.__proto__;
    }

    // utility function to precompute name tags for functions
    // in a (unchained) prototype
    function hintSuper(prototype) {
      // tag functions with their prototype name to optimize
      // super call invocations
      for (var n in prototype) {
        var pd = Object.getOwnPropertyDescriptor(prototype, n);
        if (pd && typeof pd.value === 'function') {
          pd.value.nom = n;
        }
      }
    }

    // exports

    scope.super = $super;

})(Polymer);

/* 
 * Copyright 2013 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function(scope) {

  var typeHandlers = {
    string: function(value) {
      return value;
    },
    date: function(value) {
      return new Date(Date.parse(value) || Date.now());
    },
    boolean: function(value) {
      if (value === '') {
        return true;
      }
      return value === 'false' ? false : !!value;
    },
    number: function(value) {
      var floatVal = parseFloat(value);
      return (String(floatVal) === value) ? floatVal : value;
    },
    object: function(value, currentValue) {
      if (currentValue === null) {
        return value;
      }
      try {
        // If the string is an object, we can parse is with the JSON library.
        // include convenience replace for single-quotes. If the author omits
        // quotes altogether, parse will fail.
        return JSON.parse(value.replace(/'/g, '"'));
      } catch(e) {
        // The object isn't valid JSON, return the raw value
        return value;
      }
    },
    // avoid deserialization of functions
    'function': function(value, currentValue) {
      return currentValue;
    }
  };

  function deserializeValue(value, currentValue) {
    // attempt to infer type from default value
    var inferredType = typeof currentValue;
    // invent 'date' type value for Date
    if (currentValue instanceof Date) {
      inferredType = 'date';
    }
    // delegate deserialization via type string
    return typeHandlers[inferredType](value, currentValue);
  }

  // exports

  scope.deserializeValue = deserializeValue;

})(Polymer);

/*
 * Copyright 2013 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
(function(scope) {

  var api = {};

  api.declaration = {};
  api.instance = {};

  // exports

  scope.api = api;

})(Polymer);

/*
 * Copyright 2013 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
(function(scope) {

  var utils = {
    /**
      * Invokes a function asynchronously. The context of the callback
      * function is bound to 'this' automatically.
      * @method async
      * @param {Function|String} method
      * @param {any|Array} args
      * @param {number} timeout
      */
    async: function(method, args, timeout) {
      // when polyfilling Object.observe, ensure changes 
      // propagate before executing the async method
      Platform.flush();
      // second argument to `apply` must be an array
      args = (args && args.length) ? args : [args];
      // function to invoke
      var fn = function() {
        (this[method] || method).apply(this, args);
      }.bind(this);
      // execute `fn` sooner or later
      return timeout ? setTimeout(fn, timeout) : requestAnimationFrame(fn);
    },    
    /**
      * Fire an event.
      * @method fire
      * @param {string} type An event name.
      * @param detail
      * @param {Node} toNode Target node.
      */
    fire: function(type, detail, toNode, bubbles) {
      var node = toNode || this;
      //log.events && console.log('[%s]: sending [%s]', node.localName, inType);
      node.dispatchEvent(
        new CustomEvent(type, {
          bubbles: (bubbles !== undefined ? bubbles : true), 
          detail: detail
        }));
      return detail;
    },
    /**
      * Fire an event asynchronously.
      * @method asyncFire
      * @param {string} type An event name.
      * @param detail
      * @param {Node} toNode Target node.
      */
    asyncFire: function(/*inType, inDetail*/) {
      this.async("fire", arguments);
    },
    /**
      * Remove class from old, add class to anew, if they exist
      * @param classFollows
      * @param anew A node.
      * @param old A node
      * @param className
      */
    classFollows: function(anew, old, className) {
      if (old) {
        old.classList.remove(className);
      }
      if (anew) {
        anew.classList.add(className);
      }
    }
  };

  // deprecated

  utils.asyncMethod = utils.async;

  // exports

  scope.api.instance.utils = utils;

})(Polymer);

/*
 * Copyright 2013 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function(scope) {

  // imports

  var log = window.logFlags || {};

  // magic words

  var EVENT_PREFIX = 'on-';
  var HANDLED_LIST = '__eventHandledList__';

  // instance events api

  var events = {
    // read-only
    EVENT_PREFIX: EVENT_PREFIX,
    // event name utilities
    hasEventPrefix: function (n) {
      return n && (n[0] === 'o') && (n[1] === 'n') && (n[2] === '-');
    },
    removeEventPrefix: function(n) {
      return n.slice(prefixLength);
    },
    // event listeners on host
    addHostListeners: function() {
      var events = this.eventDelegates;
      log.events && (Object.keys(events).length > 0) && console.log('[%s] addHostListeners:', this.localName, events);
      this.addNodeListeners(this, events, this.hostEventListener);
    },
    addNodeListeners: function(node, events, listener) {
      // note: conditional inside loop as optimization
      // for empty 'events' object
      var fn;
      for (var n in events) {
        if (!fn) {
          fn = listener.bind(this);
        }
        this.addNodeListener(node, n, fn);
      }
    },
    addNodeListener: function(node, event, listener) {
      node.addEventListener(event, listener);
    },
    hostEventListener: function(event) {
      if (!event.cancelBubble) {
        log.events && console.group("[%s]: hostEventListener(%s)", this.localName, event.type);
        var h = this.findEventDelegate(event);
        if (h) {
          log.events && console.log('[%s] found host handler name [%s]', this.localName, h);
          this.dispatchMethod(this, h, [event, event.detail, this]);
        }
        log.events && console.groupEnd();
      }
    },  
    // find the method name in delegates mapped to event.type
    findEventDelegate: function(event) {
      return this.eventDelegates[event.type];
    },
    // call 'method' or function method on 'obj' with 'args', if the method exists
    dispatchMethod: function(obj, method, args) {
      if (obj) {
        log.events && console.group('[%s] dispatch [%s]', obj.localName, method);
        var fn = typeof method === 'function' ? method : obj[method];
        if (fn) {
          fn[args ? 'apply' : 'call'](obj, args);
        }
        log.events && console.groupEnd();
        Platform.flush();
      }
    },
    /*
      Bind events via attributes of the form on-eventName.
      This method hooks into the model syntax and does adds event listeners as
      needed. By default, binding paths are always method names on the root
      model, the custom element in which the node exists. Adding a '@' in the
      path directs the event binding to use the model path as the event listener.
      In both cases, the actual listener is attached to a generic method which
      evaluates the bound path at event execution time. 
    */
    prepareBinding: function(path, name, node) {
      // if lhs an event prefix,
      if (events.hasEventPrefix(name)) {
        // provide an event-binding callback
        return function(model, node) {
          log.events && console.log('event: [%s].%s => [%s].%s()"', node.localName, model.localName, path);
          var listener = function(event) {
            var ctrlr = findController(node);
            if (ctrlr && ctrlr.dispatchMethod) {
              var obj = ctrlr, method = path;
              if (path[0] == '@') {
                obj = model;
                method = Path.get(path.slice(1)).getValueFrom(model);
              }
              ctrlr.dispatchMethod(obj, method, [event, event.detail, node]);
            }
          };
          var eventName = events.removeEventPrefix(name);
          node.addEventListener(eventName, listener, false);
          return {
            close: function() {
              log.events && console.log('event.remove: [%s].%s => [%s].%s()"', node.localName, name, model.localName, path);
              node.removeEventListener(eventName, listener, false);
            }
          }
        };
      }
    }
  };

  var prefixLength = EVENT_PREFIX.length;

  function findController(node) {
    while (node.parentNode) {
      node = node.parentNode;
    }
    return node.host;
  };

  // exports

  scope.api.instance.events = events;

})(Polymer);

/*
 * Copyright 2013 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
(function(scope) {

  // instance api for attributes

  var attributes = {
    copyInstanceAttributes: function () {
      var a$ = this._instanceAttributes;
      for (var k in a$) {
        if (!this.hasAttribute(k)) {
          this.setAttribute(k, a$[k]);
        }
      }
    },
    // for each attribute on this, deserialize value to property as needed
    takeAttributes: function() {
      // if we have no publish lookup table, we have no attributes to take
      // TODO(sjmiles): ad hoc
      if (this._publishLC) {
        for (var i=0, a$=this.attributes, l=a$.length, a; (a=a$[i]) && i<l; i++) {
          this.attributeToProperty(a.name, a.value);
        }
      }
    },
    // if attribute 'name' is mapped to a property, deserialize
    // 'value' into that property
    attributeToProperty: function(name, value) {
      // try to match this attribute to a property (attributes are
      // all lower-case, so this is case-insensitive search)
      var name = this.propertyForAttribute(name);
      if (name) {
        // filter out 'mustached' values, these are to be
        // replaced with bound-data and are not yet values
        // themselves
        if (value && value.search(scope.bindPattern) >= 0) {
          return;
        }
        // get original value
        var currentValue = this[name];
        // deserialize Boolean or Number values from attribute
        var value = this.deserializeValue(value, currentValue);
        // only act if the value has changed
        if (value !== currentValue) {
          // install new value (has side-effects)
          this[name] = value;
        }
      }
    },
    // return the published property matching name, or undefined
    propertyForAttribute: function(name) {
      var match = this._publishLC && this._publishLC[name];
      //console.log('propertyForAttribute:', name, 'matches', match);
      return match;
    },
    // convert representation of 'stringValue' based on type of 'currentValue'
    deserializeValue: function(stringValue, currentValue) {
      return scope.deserializeValue(stringValue, currentValue);
    },
    serializeValue: function(value, inferredType) {
      if (inferredType === 'boolean') {
        return value ? '' : undefined;
      } else if (inferredType !== 'object' && inferredType !== 'function'
          && value !== undefined) {
        return value;
      }
    },
    reflectPropertyToAttribute: function(name) {
      var inferredType = typeof this[name];
      // try to intelligently serialize property value
      var serializedValue = this.serializeValue(this[name], inferredType);
      // boolean properties must reflect as boolean attributes
      if (serializedValue !== undefined) {
        this.setAttribute(name, serializedValue);
        // TODO(sorvell): we should remove attr for all properties
        // that have undefined serialization; however, we will need to
        // refine the attr reflection system to achieve this; pica, for example,
        // relies on having inferredType object properties not removed as
        // attrs.
      } else if (inferredType === 'boolean') {
        this.removeAttribute(name);
      }
    }
  };

  // exports

  scope.api.instance.attributes = attributes;

})(Polymer);

/*
 * Copyright 2013 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
(function(scope) {

  // imports

  var log = window.logFlags || {};

  // magic words

  var OBSERVE_SUFFIX = 'Changed';

  // element api

  var empty = [];

  var properties = {
    observeProperties: function() {
      var n$ = this._observeNames, pn$ = this._publishNames;
      if ((n$ && n$.length) || (pn$ && pn$.length)) {
        var self = this;
        var o = this._propertyObserver = generateCompoundPathObserver(this);
        for (var i=0, l=n$.length, n; (i<l) && (n=n$[i]); i++) {
          o.addPath(this, n);
          // observer array properties
          var pd = Object.getOwnPropertyDescriptor(this.__proto__, n);
          if (pd && pd.value) {
            this.observeArrayValue(n, pd.value, null);
          }
        }
        for (var i=0, l=pn$.length, n; (i<l) && (n=pn$[i]); i++) {
          if (!this.observe || (this.observe[n] === undefined)) {
            o.addPath(this, n);
          }
        }
        o.start();
      }
    },
    notifyPropertyChanges: function(newValues, oldValues, changedBits, paths) {
      var called = {};
      for (var i=0, l=changedBits.length, name, method; i<l; i++) {
        if (changedBits[i]) {
          // note: paths is of form [object, path, object, path]
          name = paths[2 * i + 1];
          if (this.publish[name] !== undefined) {
            this.reflectPropertyToAttribute(name);
          }
          method = this.observe[name];
          if (method) {
            this.observeArrayValue(name, newValues[i], oldValues[i]);
            if (!called[method]) {
              called[method] = true;
              // observes the value if it is an array
              this.invokeMethod(method, [oldValues[i], newValues[i], arguments]);
            }
          }
        }
      }
    },
    observeArrayValue: function(name, value, old) {
      // we only care if there are registered side-effects
      var callbackName = this.observe[name];
      if (callbackName) {
        // if we are observing the previous value, stop
        if (Array.isArray(old)) {
          log.observe && console.log('[%s] observeArrayValue: unregister observer [%s]', this.localName, name);
          this.unregisterObserver(name + '__array');
        }
        // if the new value is an array, being observing it
        if (Array.isArray(value)) {
          log.observe && console.log('[%s] observeArrayValue: register observer [%s]', this.localName, name, value);
          var self = this;
          var observer = new ArrayObserver(value, function(value, old) {
            self.invokeMethod(callbackName, [old]);
          });
          this.registerObserver(name + '__array', observer);
        }
      }
    },
    bindProperty: function(property, model, path) {
      // apply Polymer two-way reference binding
      return bindProperties(this, property, model, path);
    },
    unbindAllProperties: function() {
      if (this._propertyObserver) {
        this._propertyObserver.close();
      }
      this.unregisterObservers();
    },
    unbindProperty: function(name) {
      return this.unregisterObserver(name);
    },
    invokeMethod: function(method, args) {
      var fn = this[method] || method;
      if (typeof fn === 'function') {
        fn.apply(this, args);
      }
    },
    // bookkeeping observers for memory management
    registerObserver: function(name, observer) {
      var o$ = this._observers || (this._observers = {});
      o$[name] = observer;
    },
    unregisterObserver: function(name) {
      var o$ = this._observers;
      if (o$ && o$[name]) {
        o$[name].close();
        o$[name] = null;
        return true;
      }
    },
    unregisterObservers: function() {
      if (this._observers) {
        var keys=Object.keys(this._observers);
        for (var i=0, l=keys.length, k, o; (i < l) && (k=keys[i]); i++) {
          o = this._observers[k];
          o.close();
        }
        this._observers = {};
      }
    }
  };

  // compound path observer
  function generateCompoundPathObserver(element) {
    return new CompoundPathObserver(function(newValues, oldValues, 
        changedBits, paths) {
          element.notifyPropertyChanges(newValues, oldValues, changedBits, 
              paths);
        }, element, undefined, undefined);
  }

  // property binding
  // bind a property in A to a path in B by converting A[property] to a
  // getter/setter pair that accesses B[...path...]
  function bindProperties(inA, inProperty, inB, inPath) {
    log.bind && console.log(LOG_BIND_PROPS, inB.localName || 'object', inPath, inA.localName, inProperty);
    // capture A's value if B's value is null or undefined,
    // otherwise use B's value
    var path = Path.get(inPath);
    var v = path.getValueFrom(inB);
    if (v === null || v === undefined) {
      path.setValueFrom(inB, inA[inProperty]);
    }
    return PathObserver.defineProperty(inA, inProperty,
      {object: inB, path: inPath});
  }

  // logging
  var LOG_OBSERVE = '[%s] watching [%s]';
  var LOG_OBSERVED = '[%s#%s] watch: [%s] now [%s] was [%s]';
  var LOG_CHANGED = '[%s#%s] propertyChanged: [%s] now [%s] was [%s]';
  var LOG_BIND_PROPS = "[%s]: bindProperties: [%s] to [%s].[%s]";

  // exports

  scope.api.instance.properties = properties;

})(Polymer);

/*
 * Copyright 2013 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
(function(scope) {

  // imports

  var log = window.logFlags || 0;
  var events = scope.api.instance.events;

  // expressionista

  var syntax =  new PolymerExpressions();

  // TODO(sorvell): we're patching the syntax while evaluating
  // event bindings. we'll move this to a better spot when that's done.
  var _prepareBinding = syntax.prepareBinding;
  // <[node] [name] = {{path}}>
  syntax.prepareBinding = function(path, name, node) {
    // if not an event, delegate to the standard syntax
    return events.prepareBinding(path, name, node)
        || _prepareBinding.call(this, path, name, node);
  };

  // element api supporting mdv

  var mdv = {
    syntax: syntax,
    instanceTemplate: function(template) {
      return template.createInstance(this, this.syntax);
    },
    bind: function(name, model, path) {
      // note: binding is a prepare signal. This allows us to be sure that any
      // property changes that occur as a result of binding will be observed.
      if (!this._elementPrepared) {
        this.prepareElement();
      }
      var property = this.propertyForAttribute(name);
      if (!property) {
        return this.super(arguments);
      } else {
        // clean out the closets
        this.unbind(name);
        // use n-way Polymer binding
        var observer = this.bindProperty(property, model, path);
        // stick path on observer so it's available via this.bindings
        observer.path = path;
        // reflect bound property to attribute when binding
        // to ensure binding is not left on attribute if property
        // does not update due to not changing.
        this.reflectPropertyToAttribute(property);
        return this.bindings[name] = observer;
      }
    },
    asyncUnbindAll: function() {
      if (!this._unbound) {
        log.unbind && console.log('[%s] asyncUnbindAll', this.localName);
        this._unbindAllJob = this.job(this._unbindAllJob, this.unbindAll, 0);
      }
    },
    unbindAll: function() {
      if (!this._unbound) {
        this.unbindAllProperties();
        this.super();
        // unbind shadowRoot
        var root = this.shadowRoot;
        while (root) {
          unbindNodeTree(root);
          root = root.olderShadowRoot;
        }
        this._unbound = true;
      }
    },
    cancelUnbindAll: function(preventCascade) {
      if (this._unbound) {
        log.unbind && console.warn('[%s] already unbound, cannot cancel unbindAll', this.localName);
        return;
      }
      log.unbind && console.log('[%s] cancelUnbindAll', this.localName);
      if (this._unbindAllJob) {
        this._unbindAllJob = this._unbindAllJob.stop();
      }
      // cancel unbinding our shadow tree iff we're not in the process of
      // cascading our tree (as we do, for example, when the element is inserted).
      if (!preventCascade) {
        forNodeTree(this.shadowRoot, function(n) {
          if (n.cancelUnbindAll) {
            n.cancelUnbindAll();
          }
        });
      }
    }
  };

  function unbindNodeTree(node) {
    forNodeTree(node, _nodeUnbindAll);
  }

  function _nodeUnbindAll(node) {
    node.unbindAll();
  }

  function forNodeTree(node, callback) {
    if (node) {
      callback(node);
      for (var child = node.firstChild; child; child = child.nextSibling) {
        forNodeTree(child, callback);
      }
    }
  }

  var mustachePattern = /\{\{([^{}]*)}}/;

  // exports

  scope.bindPattern = mustachePattern;
  scope.api.instance.mdv = mdv;

})(Polymer);

/*
 * Copyright 2013 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
(function(scope) {
  var preparingElements = 0;

  var base = {
    PolymerBase: true,
    job: Polymer.job,
    super: Polymer.super,
    // user entry point for element has had its createdCallback called
    created: function() {
    },
    // user entry point for element has shadowRoot and is ready for
    // api interaction
    ready: function() {
    },
    createdCallback: function() {
      this.created();
      if (this.ownerDocument.defaultView || this.alwaysPrepare ||
          preparingElements > 0) {
        this.prepareElement();
      }
    },
    // system entry point, do not override
    prepareElement: function() {
      this._elementPrepared = true;
      // install property observers
      this.observeProperties();
      // install boilerplate attributes
      this.copyInstanceAttributes();
      // process input attributes
      this.takeAttributes();
      // add event listeners
      this.addHostListeners();
      // guarantees that while preparing, any
      // sub-elements are also prepared
      preparingElements++;
      // process declarative resources
      this.parseDeclarations(this.__proto__);
      // decrement semaphore
      preparingElements--;
      // user entry point
      this.ready();
    },
    enteredViewCallback: function() {
      if (!this._elementPrepared) {
        this.prepareElement();
      }
      this.cancelUnbindAll(true);
      // invoke user action
      if (this.enteredView) {
        this.enteredView();
      }
    },
    leftViewCallback: function() {
      if (!this.preventDispose) {
        this.asyncUnbindAll();
      }
      // invoke user action
      if (this.leftView) {
        this.leftView();
      }
    },
    // TODO(sorvell): bc
    enteredDocumentCallback: function() {
      this.enteredViewCallback();
    },
    // TODO(sorvell): bc
    leftDocumentCallback: function() {
      this.leftViewCallback();
    },
    // recursive ancestral <element> initialization, oldest first
    parseDeclarations: function(p) {
      if (p && p.element) {
        this.parseDeclarations(p.__proto__);
        p.parseDeclaration.call(this, p.element);
      }
    },
    // parse input <element> as needed, override for custom behavior
    parseDeclaration: function(elementElement) {
      var template = this.fetchTemplate(elementElement);
      if (template) {
        if (this.element.hasAttribute('lightdom')) {
          this.lightFromTemplate(template);
        } else {
          this.shadowFromTemplate(template);
        }
      }
    },
    // return a shadow-root template (if desired), override for custom behavior
    fetchTemplate: function(elementElement) {
      return elementElement.querySelector('template');
    },
    // utility function that creates a shadow root from a <template>
    shadowFromTemplate: function(template) {
      if (template) {
        // cache elder shadow root (if any)
        var elderRoot = this.shadowRoot;
        // make a shadow root
        var root = this.createShadowRoot();
        // migrate flag(s)
        root.applyAuthorStyles = this.applyAuthorStyles;
        root.resetStyleInheritance = this.resetStyleInheritance;
        // stamp template
        // which includes parsing and applying MDV bindings before being 
        // inserted (to avoid {{}} in attribute values)
        // e.g. to prevent <img src="images/{{icon}}"> from generating a 404.
        var dom = this.instanceTemplate(template);
        // append to shadow dom
        root.appendChild(dom);
        // perform post-construction initialization tasks on shadow root
        this.shadowRootReady(root, template);
        // return the created shadow root
        return root;
      }
    },
    // utility function that stamps a <template> into light-dom
    lightFromTemplate: function(template) {
      if (template) {
        // stamp template
        // which includes parsing and applying MDV bindings before being 
        // inserted (to avoid {{}} in attribute values)
        // e.g. to prevent <img src="images/{{icon}}"> from generating a 404.
        var dom = this.instanceTemplate(template);
        // append to shadow dom
        this.appendChild(dom);
        // perform post-construction initialization tasks on ahem, light root
        this.shadowRootReady(this, template);
        // return the created shadow root
        return dom;
      }
    },
    shadowRootReady: function(root, template) {
      // locate nodes with id and store references to them in this.$ hash
      this.marshalNodeReferences(root);
      // set up pointer gestures
      PointerGestures.register(root);
    },
    // locate nodes with id and store references to them in this.$ hash
    marshalNodeReferences: function(root) {
      // establish $ instance variable
      var $ = this.$ = this.$ || {};
      // populate $ from nodes with ID from the LOCAL tree
      if (root) {
        var n$ = root.querySelectorAll("[id]");
        for (var i=0, l=n$.length, n; (i<l) && (n=n$[i]); i++) {
          $[n.id] = n;
        };
      }
    },
    attributeChangedCallback: function(name, oldValue) {
      // TODO(sjmiles): adhoc filter
      if (name !== 'class' && name !== 'style') {
        this.attributeToProperty(name, this.getAttribute(name));
      }
      if (this.attributeChanged) {
        this.attributeChanged.apply(this, arguments);
      }
    },
    onMutation: function(node, listener) {
      var observer = new MutationObserver(function(mutations) {
        listener.call(this, observer, mutations);
        observer.disconnect();
      }.bind(this));
      observer.observe(node, {childList: true, subtree: true});
    }
  };

  // true if object has own PolymerBase api
  function isBase(object) {
    return object.hasOwnProperty('PolymerBase') 
  }

  // name a base constructor for dev tools

  function PolymerBase() {};
  PolymerBase.prototype = base;
  base.constructor = PolymerBase;
  
  // exports

  scope.Base = PolymerBase;
  scope.isBase = isBase;
  scope.api.instance.base = base;
  
})(Polymer);

/*
 * Copyright 2013 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
(function(scope) {

  // imports

  var log = window.logFlags || {};
  
  // magic words
  
  var STYLE_SCOPE_ATTRIBUTE = 'element';
  var STYLE_CONTROLLER_SCOPE = 'controller';
  
  var styles = {
    STYLE_SCOPE_ATTRIBUTE: STYLE_SCOPE_ATTRIBUTE,
    /**
     * Installs external stylesheets and <style> elements with the attribute 
     * polymer-scope='controller' into the scope of element. This is intended
     * to be a called during custom element construction. Note, this incurs a 
     * per instance cost and should be used sparingly.
     *
     * The need for this type of styling should go away when the shadowDOM spec
     * addresses these issues:
     * 
     * https://www.w3.org/Bugs/Public/show_bug.cgi?id=21391
     * https://www.w3.org/Bugs/Public/show_bug.cgi?id=21390
     * https://www.w3.org/Bugs/Public/show_bug.cgi?id=21389
     * 
     * @param element The custom element instance into whose controller (parent)
     * scope styles will be installed.
     * @param elementElement The <element> containing controller styles.
    */
    // TODO(sorvell): remove when spec issues are addressed
    installControllerStyles: function() {
      // apply controller styles, but only if they are not yet applied
      var scope = this.findStyleController();
      if (scope && !this.scopeHasElementStyle(scope, STYLE_CONTROLLER_SCOPE)) {
        // allow inherited controller styles
        var proto = getPrototypeOf(this), cssText = '';
        while (proto && proto.element) {
          cssText += proto.element.cssTextForScope(STYLE_CONTROLLER_SCOPE);
          proto = getPrototypeOf(proto);
        }
        if (cssText) {
          var style = this.element.cssTextToScopeStyle(cssText,
              STYLE_CONTROLLER_SCOPE);
          // TODO(sorvell): for now these styles are not shimmed
          // but we may need to shim them
          Polymer.applyStyleToScope(style, scope);
        }
      }
    },
    findStyleController: function() {
      if (window.ShadowDOMPolyfill) {
        return wrap(document.head);
      } else {
        // find the shadow root that contains this element
        var n = this;
        while (n.parentNode) {
          n = n.parentNode;
        }
        return n === document ? document.head : n;
      }
    },
    scopeHasElementStyle: function(scope, descriptor) {
      var rule = STYLE_SCOPE_ATTRIBUTE + '=' + this.localName + '-' + descriptor;
      return scope.querySelector('style[' + rule + ']');
    }
  };
  
  // NOTE: use raw prototype traversal so that we ensure correct traversal
  // on platforms where the protoype chain is simulated via __proto__ (IE10)
  function getPrototypeOf(prototype) {
    return prototype.__proto__;
  }

  // exports

  scope.api.instance.styles = styles;
  
})(Polymer);

/* 
 * Copyright 2013 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function(scope) {
  
  var path = {
    addResolvePathApi: function() {
      var root = this.elementPath();
      // let assetpath attribute modify the resolve path
      var assetPath = this.getAttribute('assetpath') || '';
      this.prototype.resolvePath = function(inPath) {
        return root + assetPath + inPath;
      };
    },
    elementPath: function() {
      return this.urlToPath(HTMLImports.getDocumentUrl(this.ownerDocument));
    },
    urlToPath: function(url) {
      if (!url) {
        return '';
      } else {
        var parts = url.split('/');
        parts.pop();
        parts.push('');
        return parts.join('/');
      }
    }
  };
  
  // exports
  scope.api.declaration.path = path;

})(Polymer);

/*
 * Copyright 2013 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
(function(scope) {

  // imports

  var log = window.logFlags || {};
  var api = scope.api.instance.styles;
  var STYLE_SCOPE_ATTRIBUTE = api.STYLE_SCOPE_ATTRIBUTE;

  // magic words

  var STYLE_SELECTOR = 'style';
  var SHEET_SELECTOR = '[rel=stylesheet]';
  var STYLE_GLOBAL_SCOPE = 'global';
  var SCOPE_ATTR = 'polymer-scope';

  var styles = {
    /**
     * Install external stylesheets loaded in <element> elements into the 
     * element's template.
     * @param elementElement The <element> element to style.
     */
    installSheets: function() {
      this.cacheSheets();
      this.cacheStyles();
      this.installLocalSheets();
      this.installGlobalStyles();
    },
    /**
     * Remove all sheets from element and store for later use.
     */
    cacheSheets: function() {
      this.sheets = this.findNodes(SHEET_SELECTOR);
      this.sheets.forEach(function(s) {
        if (s.parentNode) {
          s.parentNode.removeChild(s);
        }
      });
    },
    cacheStyles: function() {
      this.styles = this.findNodes(STYLE_SELECTOR + '[' + SCOPE_ATTR + ']');
      this.styles.forEach(function(s) {
        if (s.parentNode) {
          s.parentNode.removeChild(s);
        }
      });
    },
    /**
     * Takes external stylesheets loaded in an <element> element and moves
     * their content into a <style> element inside the <element>'s template.
     * The sheet is then removed from the <element>. This is done only so 
     * that if the element is loaded in the main document, the sheet does
     * not become active.
     * Note, ignores sheets with the attribute 'polymer-scope'.
     * @param elementElement The <element> element to style.
     */
    installLocalSheets: function () {
      var sheets = this.sheets.filter(function(s) {
        return !s.hasAttribute(SCOPE_ATTR);
      });
      var content = this.templateContent();
      if (content) {
        var cssText = '';
        sheets.forEach(function(sheet) {
          cssText += cssTextFromSheet(sheet) + '\n';
        });
        if (cssText) {
          content.insertBefore(createStyleElement(cssText), content.firstChild);
        }
      }
    },
    findNodes: function(selector, matcher) {
      var nodes = this.querySelectorAll(selector).array();
      var content = this.templateContent();
      if (content) {
        var templateNodes = content.querySelectorAll(selector).array();
        nodes = nodes.concat(templateNodes);
      }
      return matcher ? nodes.filter(matcher) : nodes;
    },
    templateContent: function() {
      var template = this.querySelector('template');
      return template && templateContent(template);
    },
    /**
     * Promotes external stylesheets and <style> elements with the attribute 
     * polymer-scope='global' into global scope.
     * This is particularly useful for defining @keyframe rules which 
     * currently do not function in scoped or shadow style elements.
     * (See wkb.ug/72462)
     * @param elementElement The <element> element to style.
    */
    // TODO(sorvell): remove when wkb.ug/72462 is addressed.
    installGlobalStyles: function() {
      var style = this.styleForScope(STYLE_GLOBAL_SCOPE);
      applyStyleToScope(style, document.head);
    },
    cssTextForScope: function(scopeDescriptor) {
      var cssText = '';
      // handle stylesheets
      var selector = '[' + SCOPE_ATTR + '=' + scopeDescriptor + ']';
      var matcher = function(s) {
        return matchesSelector(s, selector);
      };
      var sheets = this.sheets.filter(matcher);
      sheets.forEach(function(sheet) {
        cssText += cssTextFromSheet(sheet) + '\n\n';
      });
      // handle cached style elements
      var styles = this.styles.filter(matcher);
      styles.forEach(function(style) {
        cssText += style.textContent + '\n\n';
      });
      return cssText;
    },
    styleForScope: function(scopeDescriptor) {
      var cssText = this.cssTextForScope(scopeDescriptor);
      return this.cssTextToScopeStyle(cssText, scopeDescriptor);
    },
    cssTextToScopeStyle: function(cssText, scopeDescriptor) {
      if (cssText) {
        var style = createStyleElement(cssText);
        style.setAttribute(STYLE_SCOPE_ATTRIBUTE, this.getAttribute('name') +
            '-' + scopeDescriptor);
        return style;
      }
    }
  };

  function applyStyleToScope(style, scope) {
    if (style) {
      // TODO(sorvell): necessary for IE
      // see https://connect.microsoft.com/IE/feedback/details/790212/
      // cloning-a-style-element-and-adding-to-document-produces
      // -unexpected-result#details
      // var clone = style.cloneNode(true);
      var clone = createStyleElement(style.textContent);
      var attr = style.getAttribute(STYLE_SCOPE_ATTRIBUTE);
      if (attr) {
        clone.setAttribute(STYLE_SCOPE_ATTRIBUTE, attr);
      }
      scope.appendChild(clone);
    }
  }

  function createStyleElement(cssText) {
    var style = document.createElement('style');
    style.textContent = cssText;
    return style;
  }

  function cssTextFromSheet(sheet) {
    return (sheet && sheet.__resource) || '';
  }

  function matchesSelector(node, inSelector) {
    if (matches) {
      return matches.call(node, inSelector);
    }
  }
  var p = HTMLElement.prototype;
  var matches = p.matches || p.matchesSelector || p.webkitMatchesSelector 
      || p.mozMatchesSelector;
  
  // exports

  scope.api.declaration.styles = styles;
  scope.applyStyleToScope = applyStyleToScope;
  
})(Polymer);

/*
 * Copyright 2013 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

(function(scope) {

  // imports

  var api = scope.api.instance.events;
  var log = window.logFlags || {};

  // polymer-element declarative api: events feature

  var events = { 
    parseHostEvents: function() {
      // our delegates map
      var delegates = this.prototype.eventDelegates;
      // extract data from attributes into delegates
      this.addAttributeDelegates(delegates);
    },
    addAttributeDelegates: function(delegates) {
      // for each attribute
      for (var i=0, a; a=this.attributes[i]; i++) {
        // does it have magic marker identifying it as an event delegate?
        if (api.hasEventPrefix(a.name)) {
          // if so, add the info to delegates
          delegates[api.removeEventPrefix(a.name)] = a.value.replace('{{', '')
              .replace('}}', '').trim();
        }
      }
    },
    event_translations: {
      webkitanimationstart: 'webkitAnimationStart',
      webkitanimationend: 'webkitAnimationEnd',
      webkittransitionend: 'webkitTransitionEnd',
      domfocusout: 'DOMFocusOut',
      domfocusin: 'DOMFocusIn'
    }
  };

  // exports

  scope.api.declaration.events = events;

})(Polymer);
/*
 * Copyright 2013 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
(function(scope) {

  // element api

  var properties = {
    inferObservers: function(prototype) {
      var observe = prototype.observe, property;
      for (var n in prototype) {
        if (n.slice(-7) === 'Changed') {
          if (!observe) {
            observe  = (prototype.observe = {});
          }
          property = n.slice(0, -7)
          observe[property] = observe[property] || n;
        }
      }
    },
    optimizePropertyMaps: function(prototype) {
      if (prototype.observe) {
        // construct name list
        var a = prototype._observeNames = [];
        for (var n in prototype.observe) {
          a.push(n);
        }
      }
      if (prototype.publish) {
        // construct name list
        var a = prototype._publishNames = [];
        for (var n in prototype.publish) {
          a.push(n);
        }
      }
    },
    publishProperties: function(prototype, base) {
      // if we have any properties to publish
      var publish = prototype.publish;
      if (publish) {
        // transcribe `publish` entries onto own prototype
        this.requireProperties(publish, prototype, base);
        // construct map of lower-cased property names
        prototype._publishLC = this.lowerCaseMap(publish);
      }
    },
    requireProperties: function(properties, prototype, base) {
      // ensure a prototype value for each property
      for (var n in properties) {
        if (prototype[n] === undefined && base[n] === undefined) {
          prototype[n] = properties[n];
        }
      }
    },
    lowerCaseMap: function(properties) {
      var map = {};
      for (var n in properties) {
        map[n.toLowerCase()] = n;
      }
      return map;
    }
  };

  // exports

  scope.api.declaration.properties = properties;

})(Polymer);

/*
 * Copyright 2013 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
(function(scope) {

  // magic words

  var ATTRIBUTES_ATTRIBUTE = 'attributes';

  // attributes api

  var attributes = {
    inheritAttributesObjects: function(prototype) {
      // chain our lower-cased publish map to the inherited version
      this.inheritObject(prototype, 'publishLC');
      // chain our instance attributes map to the inherited version
      this.inheritObject(prototype, '_instanceAttributes');
    },
    publishAttributes: function(prototype, base) {
      // merge names from 'attributes' attribute
      var attributes = this.getAttribute(ATTRIBUTES_ATTRIBUTE);
      if (attributes) {
        // get properties to publish
        var publish = prototype.publish || (prototype.publish = {});
        // names='a b c' or names='a,b,c'
        var names = attributes.split(attributes.indexOf(',') >= 0 ? ',' : ' ');
        // record each name for publishing
        for (var i=0, l=names.length, n; i<l; i++) {
          // remove excess ws
          n = names[i].trim();
          // do not override explicit entries
          if (n && publish[n] === undefined && base[n] === undefined) {
            publish[n] = null;
          }
        }
      }
    },
    // record clonable attributes from <element>
    accumulateInstanceAttributes: function() {
      // inherit instance attributes
      var clonable = this.prototype._instanceAttributes;
      // merge attributes from element
      var a$ = this.attributes;
      for (var i=0, l=a$.length, a; (i<l) && (a=a$[i]); i++) {  
        if (this.isInstanceAttribute(a.name)) {
          clonable[a.name] = a.value;
        }
      }
    },
    isInstanceAttribute: function(name) {
      return !this.blackList[name] && name.slice(0,3) !== 'on-';
    },
    // do not clone these attributes onto instances
    blackList: {name: 1, 'extends': 1, constructor: 1, noscript: 1}
  };

  // add ATTRIBUTES_ATTRIBUTE to the blacklist
  attributes.blackList[ATTRIBUTES_ATTRIBUTE] = 1;

  // exports

  scope.api.declaration.attributes = attributes;

})(Polymer);

/*
 * Copyright 2013 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
(function(scope) {

  // imports
  
  var api = scope.api;
  var isBase = scope.isBase;
  var extend = scope.extend;

  // prototype api

  var prototype = {
    register: function(name, extendee) {
      // build prototype combining extendee, Polymer base, and named api
      this.prototype = this.buildPrototype(name, extendee);
      // back reference declaration element
      // TODO(sjmiles): replace `element` with `elementElement` or `declaration`
      this.prototype.element = this;
      // more declarative features
      this.desugar(name, extendee);
      // register our custom element with the platform
      this.registerPrototype(name, extendee);
      // reference constructor in a global named by 'constructor' attribute
      this.publishConstructor();
    },
    buildPrototype: function(name, extendee) {
      // get our custom prototype (before chaining)
      var prototype = scope.getRegisteredPrototype(name);
      // get basal prototype
      var base = this.generateBasePrototype(extendee);
      // transcribe `attributes` declarations onto own prototype's `publish`
      this.publishAttributes(prototype, base);
      // `publish` properties to the prototype and to attribute watch
      this.publishProperties(prototype, base);
      // infer observers for `observe` list based on method names
      this.inferObservers(prototype);
      // chain various meta-data objects to inherited versions
      this.inheritMetaData(prototype, base);
      // chain custom api to inherited
      prototype = this.chainObject(prototype, base);
      // build side-chained lists to optimize iterations
      this.optimizePropertyMaps(prototype);
      // x-platform fixup
      ensurePrototypeTraversal(prototype);
      return prototype;
    },
    inheritMetaData: function(prototype, base) {
      // chain observe object to inherited
      this.inheritObject('observe', prototype, base);
      // chain publish object to inherited
      this.inheritObject('publish', prototype, base);
      // chain our lower-cased publish map to the inherited version
      this.inheritObject('_publishLC', prototype, base);
      // chain our instance attributes map to the inherited version
      this.inheritObject('_instanceAttributes', prototype, base);
      // chain our event delegates map to the inherited version
      this.inheritObject('eventDelegates', prototype, base);
    },
    // implement various declarative features
    desugar: function(name, extendee) {
      // compile list of attributes to copy to instances
      this.accumulateInstanceAttributes();
      // parse on-* delegates declared on `this` element
      this.parseHostEvents();
      // install external stylesheets as if they are inline
      this.installSheets();
      //
      this.adjustShadowElement();
      //
      // TODO(sorvell): install a helper method this.resolvePath to aid in 
      // setting resource paths. e.g.
      // this.$.image.src = this.resolvePath('images/foo.png')
      // Potentially remove when spec bug is addressed.
      // https://www.w3.org/Bugs/Public/show_bug.cgi?id=21407
      this.addResolvePathApi();
      // under ShadowDOMPolyfill, transforms to approximate missing CSS features
      if (window.ShadowDOMPolyfill) {
        Platform.ShadowCSS.shimStyling(this.templateContent(), name, extendee);
      }
      // allow custom element access to the declarative context
      if (this.prototype.registerCallback) {
        this.prototype.registerCallback(this);
      }
    },
    // TODO(sorvell): remove when spec addressed:
    // https://www.w3.org/Bugs/Public/show_bug.cgi?id=22460
    // make <shadow></shadow> be <shadow><content></content></shadow>
    adjustShadowElement: function() {
      // TODO(sorvell): avoid under SD polyfill until this bug is addressed:
      // https://github.com/Polymer/ShadowDOM/issues/297
      if (!window.ShadowDOMPolyfill) {
        var content = this.templateContent();
        if (content) {
          var s$ = content.querySelectorAll('shadow');
          for (var i=0, l=s$.length, s; (i<l) && (s=s$[i]); i++) {
            if (!s.children.length) {
              s.appendChild(document.createElement('content'));
            }
          }
        }
      }
    },
    // if a named constructor is requested in element, map a reference
    // to the constructor to the given symbol
    publishConstructor: function() {
      var symbol = this.getAttribute('constructor');
      if (symbol) {
        window[symbol] = this.ctor;
      }
    },
    // build prototype combining extendee, Polymer base, and named api
    generateBasePrototype: function(extnds) {
      var prototype = this.findBasePrototype(extnds);
      if (!prototype) {
        // create a prototype based on tag-name extension
        var prototype = HTMLElement.getPrototypeForTag(extnds);
        // insert base api in inheritance chain (if needed)
        prototype = this.ensureBaseApi(prototype);
        // memoize this base
        memoizedBases[extnds] = prototype;
      }
      return prototype;
    },
    findBasePrototype: function(name) {
      return memoizedBases[name];
    },
    // install Polymer instance api into prototype chain, as needed 
    ensureBaseApi: function(prototype) {
      if (!prototype.PolymerBase) {
       prototype = Object.create(prototype);
       // we need a unique copy of base api for each base prototype
       // therefore we 'extend' here instead of simply chaining
       // we could memoize instead, especially for the common cases,
       // in particular, for base === HTMLElement.prototype
       for (var n in api.instance) {
         extend(prototype, api.instance[n]);
       }
      }
      // return buffed-up prototype
      return prototype;
    },
    // ensure prototype[name] inherits from a prototype.prototype[name]
    inheritObject: function(name, prototype, base) {
      // require an object
      var source = prototype[name] || {};
      // chain inherited properties onto a new object
      prototype[name] = this.chainObject(source, base[name]);
    },
    // register 'prototype' to custom element 'name', store constructor 
    registerPrototype: function(name, extendee) { 
      var info = {
        prototype: this.prototype
      }
      // native element must be specified in extends
      var typeExtension = this.findTypeExtension(extendee);
      if (typeExtension) {
        info.extends = typeExtension;
      }
      // register the custom type
      this.ctor = document.register(name, info);
      // constructor shenanigans
      this.prototype.constructor = this.ctor;
      // register the prototype with HTMLElement for name lookup
      HTMLElement.register(name, this.prototype);
    }, 
    findTypeExtension: function(name) {
      if (name && name.indexOf('-') < 0) {
        return name;
      } else {
        var p = this.findBasePrototype(name);
        if (p.element) {
          return this.findTypeExtension(p.element.extends);
        }
      }
    }
  };

  if (Object.__proto__) {
    prototype.chainObject = function(object, inherited) {
      if (object && inherited && object !== inherited) {
        object.__proto__ = inherited;
      }
      return object;
    }
  } else {
    prototype.chainObject = function(object, inherited) {
      if (object && inherited && object !== inherited) {
        var chained = Object.create(inherited);
        object = extend(chained, object);
      }
      return object;
    }
  }

  // memoize base prototypes
  memoizedBases = {};

  // On platforms that do not support __proto__ (version of IE), the prototype
  // chain of a custom element is simulated via installation of __proto__.
  // Although custom elements manages this, we install it here so it's
  // available during desugaring.
  function ensurePrototypeTraversal(prototype) {
    if (!Object.__proto__) {
      var ancestor = Object.getPrototypeOf(prototype);
      prototype.__proto__ = ancestor;
      if (isBase(ancestor)) {
        ancestor.__proto__ = Object.getPrototypeOf(ancestor);
      }
    }
  }

  // exports

  api.declaration.prototype = prototype;

})(Polymer);

/*
 * Copyright 2013 The Polymer Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */
(function(scope) {

  // imports

  var extend = scope.extend;
  var apis = scope.api.declaration;

  // imperative implementation: Polymer()

  // specify an 'own' prototype for tag `name`
  function element(name, prototype) {
    //console.log('registering [' + name + ']');
    // cache the prototype
    prototypesByName[name] = prototype || {};
    // notify the registrar waiting for 'name', if any
    notifyPrototype(name);
  }

  // declarative implementation: <polymer-element>

  var prototype = extend(Object.create(HTMLElement.prototype), {
    createdCallback: function() {
      // fetch the element name
      this.name = this.getAttribute('name');
      // fetch our extendee name
      this.extends = this.getAttribute('extends');
      // install element definition, if ready
      this.registerWhenReady();
    },
    registerWhenReady: function() {
      // if we have no prototype, wait
      if (this.waitingForPrototype(this.name)) {
        return;
      }
      var extendee = this.extends;
      if (this.waitingForExtendee(extendee)) {
        //console.warn(this.name + ': waitingForExtendee:' + extendee);
        return;
      }
      // TODO(sjmiles): HTMLImports polyfill awareness:
      // elements in the main document are likely to parse
      // in advance of elements in imports because the
      // polyfill parser is simulated
      // therefore, wait for imports loaded before
      // finalizing elements in the main document
      if (document.contains(this)) {
        whenImportsLoaded(function() {
          this._register(extendee);
        }.bind(this));
      } else {
        this._register(extendee);
      }
    },
    _register: function(extendee) {
      //console.group('registering', this.name);
      this.register(this.name, extendee);
      //console.groupEnd();
      // subclasses may now register themselves
      notifySuper(this.name);
    },
    waitingForPrototype: function(name) {
      if (!getRegisteredPrototype(name)) {
        // then wait for a prototype
        waitPrototype[name] = this;
        // if explicitly marked as 'noscript'
        if (this.hasAttribute('noscript')) {
          // TODO(sorvell): CustomElements polyfill awareness:
          // noscript elements should upgrade in logical order
          // script injection ensures this under native custom elements;
          // under imports + ce polyfills, scripts run before upgrades.
          // dependencies should be ready at upgrade time so register
          // prototype at this time.
          if (window.CustomElements && !CustomElements.useNative) {
            element(name);
          } else {
            var script = document.createElement('script');
            script.textContent = 'Polymer(\'' + name + '\');';
            this.appendChild(script);
          }
        }
        return true;
      }
    },
    waitingForExtendee: function(extendee) {
      // if extending a custom element...
      if (extendee && extendee.indexOf('-') >= 0) {
        // wait for the extendee to be registered first
        if (!isRegistered(extendee)) {
          (waitSuper[extendee] = (waitSuper[extendee] || [])).push(this);
          return true;
        }
      }
    }
  });

  // semi-pluggable APIs 
  // TODO(sjmiles): should be fully pluggable (aka decoupled, currently
  // the various plugins are allowed to depend on each other directly)
  Object.keys(apis).forEach(function(n) {
    extend(prototype, apis[n]);
  });

  // utility and bookkeeping
  
  // maps tag names to prototypes
  var prototypesByName = {};

  function getRegisteredPrototype(name) {
    return prototypesByName[name];
  }

  // elements waiting for prototype, by name
  var waitPrototype = {};

  function notifyPrototype(name) {
    if (waitPrototype[name]) {
      waitPrototype[name].registerWhenReady();
      delete waitPrototype[name];
    }
  }

  // elements waiting for super, by name
  var waitSuper = {};

  function notifySuper(name) {
    registered[name] = true;
    var waiting = waitSuper[name];
    if (waiting) {
      waiting.forEach(function(w) {
        w.registerWhenReady();
      });
      delete waitSuper[name];
    }
  }

  // track document.register'ed tag names

  var registered = {};

  function isRegistered(name) {
    return registered[name];
  }

  function whenImportsLoaded(doThis) {
    if (window.HTMLImports && !HTMLImports.readyTime) {
      addEventListener('HTMLImportsLoaded', doThis);
    } else {
      doThis();
    }
  }

  // exports
  
  scope.getRegisteredPrototype = getRegisteredPrototype;
  
  // namespace shenanigans so we can expose our scope on the registration 
  // function

  // TODO(sjmiles): find a way to do this that is less terrible
  // copy window.Polymer properties onto `element()`
  extend(element, scope);
  // make window.Polymer reference `element()`
  window.Polymer = element;

  // register polymer-element with document
  document.register('polymer-element', {prototype: prototype});
})(Polymer);


    PolymerUI = {
      validateTheme: function() {
        var theme = this.theme;
        var defaultTheme = this.defaultTheme;
        if (!theme) {
          var p = this;
          while (p && !theme) {
            theme = p.getAttribute && p.getAttribute('theme');
            defaultTheme = defaultTheme || p.defaultTheme;
            p = p.parentNode || p.host;
          }
        }
        this.activeTheme = this.theme || theme || defaultTheme;
      }
    };
    Polymer('polymer-ui-theme-aware', {
      defaultTheme: '',
      activeTheme: '',
      validateTheme: PolymerUI.validateTheme,
      enteredView: function() {
        this.validateTheme();
      },
      themeChanged: function() {
        this.activeTheme = this.theme;
      },
      activeThemeChanged: function(old) {
        this.classList.switch(old, this.activeTheme);
      }
    });
  ;


    Polymer('polymer-media-query', {
      /**
       * The Boolean return value of the media query
       * @attribute queryMatches
       * @type Boolean
       * @default false
       */
      queryMatches: false,
      /**
       * The CSS media query to evaulate
       * @attribute query
       * @type string
       * @default ''
       */
      query: '',
      ready: function() {
        this._mqHandler = this.queryHandler.bind(this);
        this._mq = null;
      },
      queryChanged: function() {
        if (this._mq) {
          this._mq.removeListener(this._mqHandler);
        }
        var query = this.query;
        if (query[0] !== '(') {
          query = '(' + this.query + ')';
        }
        this._mq = window.matchMedia(query);
        this._mq.addListener(this._mqHandler);
        this.queryHandler(this._mq);
      },
      queryHandler: function(mq) {
        this.queryMatches = mq.matches;
        this.asyncFire('polymer-mediachange', mq);
      }
    });
  ;

    Polymer('polymer-flex-layout', {
      vertical: false,
      isContainer: false,
      layoutContainer: null,
      enteredView: function() {
        this.installControllerStyles();
        this.layoutContainer = this.isContainer ? 
            this : (this.parentNode.host || this.parentNode);
        this.verticalChanged();
        this.alignChanged();
        this.justifyChanged();
      },
      leftView: function() {
        this.layoutContainer = null;
      },
      layoutContainerChanged: function(old) {
        if (old) {
          old.classList.remove('flexbox');
        }
        this.style.display = this.layoutContainer === this ? '' : 'none';
        if (this.layoutContainer) {
          this.layoutContainer.classList.add('flexbox');
        }
      },
      switchContainerClass: function(prefix, old, name) {
        if (this.layoutContainer && name) {
          this.layoutContainer.classList.switch(
              prefix + old, prefix + name);
        }
      },
      verticalChanged: function() {
        if (this.layoutContainer) {
          this.layoutContainer.classList.toggle('column', this.vertical);
        }
      },
      alignChanged: function(old) {
        this.switchContainerClass('align-', old, this.align);
      },
      justifyChanged: function(old) {
        this.switchContainerClass('justify-', old, this.justify);
      }
    });
  ;

    Polymer('polymer-ui-toolbar', {
      responsiveWidth: '800px',
      queryMatches: false,
      defaultTheme: 'polymer-ui-light-theme',
      queryMatchesChanged: function() {
        this.classList.toggle('narrow-layout', this.queryMatches);
      }
    });
  ;

    (function() {
      var icons = [
       'drawer',
       'menu',
       'search',
       'dropdown',
       'close',
       'add',
       'trash',
       'refresh',
       'settings',
       'dialoga',
       'left',
       'right',
       'down',
       'up',
       'grid',
       'contact',
       'account',
       'plus',
       'time',
       'marker',
       'briefcase',
       'array',
       'columns',
       'list',
       'modules',
       'quilt',
       'stream',
       'maximize',
       'shrink',
       'sort',
       'shortcut',
       'dialog',
       'twitter',
       'facebook',
       'favorite',
       'gplus',
       'filter',
       'tag',
       'plusone',
       'dots'
      ];
      var map = {};
      icons.forEach(function(name, i) {
        map[name] = i;
      });
      icons = map;

      Polymer('polymer-ui-icon', {
        /**
         * The URL of an image for the icon.
         *
         * @attribute src
         * @type string
         * @default ''
         */
        src: '',
        /**
         * Specifies the size of the icon.
         *
         * @attribute size
         * @type string
         * @default 24
         */
        size: 24,
        /**
         * Specifies the icon from the Polymer icon set.
         *
         * @attribute icon
         * @type string
         * @default ''
         */
        icon: '',
        bx: 0,
        by: 0,
        icons: icons,
        ready: function() {
          this.sizeChanged();
        },
        sizeChanged: function() {
          this.style.width = this.style.height = this.size + 'px';
        },
        iconChanged: function() {
          this.index = this.icon in icons ? icons[this.icon] : -1;
        },
        indexChanged: function() {
          this.classList.add('polymer-ui-icons');
          this.by = -this.size * this.index;
          this.updateIcon();
        },
        srcChanged: function() {
          this.classList.remove('polymer-ui-icons');
          this.style.backgroundImage = 'url(' + this.src + ')';
          this.updateIcon();
        },
        activeThemeChanged: function(old) {
          this.super(arguments);
          this.style.backgroundPosition = '';
          this.bx = calcThemeOffset(this.activeTheme, this);
          this.updateIcon();
        },
        updateIcon: function() {
          if (this.src) {
            this.style.backgroundPosition = 'center';
            this.style.backgroundSize = this.size + 'px ' + this.size + 'px';
          } else {
            this.style.backgroundPosition = (this.bx + 'px') + ' ' + (this.by + 'px');
          }
        }
      });
      // memoize offset because getComputedStyle is expensive
      var themes = {};
      function calcThemeOffset(theme, node) {
        if (themes[theme] === undefined) {
          var bp = getComputedStyle(node).backgroundPosition.split(' ');
          // support 4 value syntax (https://code.google.com/p/chromium/issues/detail?id=310977)
          var l = bp.length === 4 ? bp[1] : bp[0];
          var offset = parseFloat(l);
          themes[theme] = offset;
        }
        return themes[theme]; 
      }
    })();
  ;

    Polymer('polymer-ui-icon-button', {
      /**
       * The URL of an image for the icon.
       *
       * @attribute src
       * @type string
       * @default ''
       */
      src: '',
      /**
       * If true, border is placed around the button to indicate
       * active state.
       *
       * @attribute active
       * @type boolean
       * @default false
       */
      active: false,
      /**
       * Specifies the icon from the Polymer icon set.
       *
       * @attribute icon
       * @type string
       * @default ''
       */
      icon: '',
      /**
       * If a theme is applied that includes an icon set, the index of the 
       * icon to display.
       *
       * @attribute index
       * @type number
       * @default -1
       */     
      index: -1,
      activeChanged: function() {
        // TODO(sjmiles): sugar this common case
        this.classList.toggle('selected', this.active);
      }
    });
  
