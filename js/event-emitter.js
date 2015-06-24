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
  root.xin.EventEmitter = factory(root, root.xin);

})(this, function(root, xin) {
  'use strict';

  var EventEmitter = function() {
    if (!(this instanceof EventEmitter)) return new EventEmitter();
  };

  EventEmitter.prototype._maxListeners = 10;

  EventEmitter.prototype.on = function(name, handler) {
    var events = this._events = this._events || {};
    events[name] = events[name] || [];

    if (events[name].length >= this._maxListeners) {
      throw new Error('Max listener of ' + name + ' reached!');
    }

    if (events[name].indexOf(handler) > -1) {
      throw new Error('Unable to register handler twice!');
    }

    events[name].push(handler);

    return this;
  };

  EventEmitter.prototype.off = function(name, handler) {
    var events = this._events = this._events || {};
    events[name] = events[name] || [];

    var index = events[name].indexOf(handler);
    if (index > -1) {
      events[name].splice(index, 1);
    }

    return this;
  };

  EventEmitter.prototype.once = function(name, handler) {
    var that = this;
    var onceHandler = function() {
      that.off(name, onceHandler);
      handler.apply(this, arguments);
    };

    return this.on(name, onceHandler);
  };

  EventEmitter.prototype.emit = function(name) {
    var events = this._events = this._events || {};
    events[name] = events[name] || [];

    var args = Array.prototype.slice.call(arguments, 1);
    (events[name] || []).forEach(function(handler) {
      handler.apply(this, args);
    });
  };

  return EventEmitter;
});