/**
 * Copyright (c) 2015 Xinix Technology
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

(function(root, factory) {
  'use strict';

  root.xin = root.xin || {};
  root.xin.App = factory(root, root.xin);

})(this, function(root, xin) {
  'use strict';

  var inherits = function(ctor, superCtor) {
    if (!superCtor) return;

    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    // mixin EventEmitter to App
    // if (xin.EventEmitter) {
    //   for(var i in xin.EventEmitter.prototype) {
    //     App.prototype[i] = xin.EventEmitter.prototype[i];
    //   }
    // }
  };

  var optionalParam = /\((.*?)\)/g;
  var namedParam    = /(\(\?)?:\w+/g;
  var splatParam    = /\*\w+/g;
  var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

  var App = function(options) {
    if (!(this instanceof App)) return new App(options);

    // if location and history are nulls then you are not in browser
    this.location = root.location;
    this.history = root.history;

    // default values
    this.mode = 'hash';
    this.hashSeparator = '#!';
    this.root = '/';
    this.handlers = [];

    options = options || {
      el: document.body
    };

    if (options instanceof HTMLElement) {
      options = {
        el: options
      };
    }

    // mixin options to app instance
    for(var i in options) {
      this[i] = options[i];
    }
  };

  inherits(App, xin.EventEmitter);

  App.prototype.routeToRegExp_ = function(route) {
    route = route.replace(escapeRegExp, '\\$&')
      .replace(optionalParam, '(?:$1)?')
      .replace(namedParam, function(match, optional) {
        return optional ? match : '([^/?]+)';
      })
      .replace(splatParam, '([^?]*?)');
    return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
  };

  App.prototype.route = function(route, callback) {
    var re;
    if (route instanceof RegExp) {
      re = route;
    } else {
      re = this.routeToRegExp_(route);
    }
    this.handlers.push({
      re: re,
      route: route,
      callback: callback
    });
  };

  App.prototype.getFragment = function() {
    var fragment;
    if(this.mode === 'history') {
        fragment = decodeURI(this.location.pathname + this.location.search);
        fragment = fragment.replace(/\?(.*)$/, '');
        fragment = this.root != '/' ? fragment.replace(this.root, '') : fragment;
    } else {
        var match = this.location.href.match(this.reHashSeparator);
        fragment = match ? match[1] : '';
    }
    return '/' + fragment.toString().replace(/\/$/, '').replace(/^\//, '');
  };

  App.prototype.start = function() {

    this.reHashSeparator = new RegExp(this.hashSeparator + '(.*)$');

    var addEventListener = window.addEventListener || function (eventName, listener) {
      return attachEvent('on' + eventName, listener);
    };

    if (this.mode === 'history') {
      window.addEventListener('popstate', this.check.bind(this), false);

      this.el.addEventListener('click', function(evt) {
        var target = evt.target;
        var realTarget = target;
        while(realTarget.nodeName !== 'A' && realTarget !== this.el) {
          realTarget = realTarget.parentElement;
        }

        if (realTarget.nodeName === 'A' && !realTarget.attributes.bypass) {
          this.navigate(realTarget.href.replace(this.location.origin, ''));

          evt.preventDefault();
        }
      }.bind(this));
    } else {
      window.addEventListener('hashchange', this.check.bind(this), false);
    }

    this.check();
  };

  App.prototype.check = function() {
    var fragment = this.getFragment();
    // console.log('app#check', 'fragment:' + fragment);

    if (this.fragment === fragment) {
      return false;
    }

    this.fragment = fragment;

    return this.handlers.some(function(handler) {
      var matches = fragment.match(handler.re);
      if (matches) {
        matches.shift();
        handler.callback.apply(null, matches);
        return true;
      }
    });
  };

  App.prototype.navigate = function(path) {
    path = path ? path : '';
    if(this.mode === 'history') {
      var url = this.root + path.toString().replace(/\/$/, '').replace(/^\//, '');
      if (this.location.href.replace(this.location.origin, '') !== url) {
        this.history.pushState({}, document.title, url);
        this.check();
      }
    } else {
      this.location.href.match(this.reHashSeparator);
      this.location.href = this.location.href.replace(this.reHashSeparator, '') + this.hashSeparator + path;
    }
    return this;
  };

  return App;
});