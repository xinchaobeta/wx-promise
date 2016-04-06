'use strict';

var __commonjs_global = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this;
function __commonjs(fn, module) { return module = { exports: {} }, fn(module, module.exports, __commonjs_global), module.exports; }


var babelHelpers = {};

babelHelpers.extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

babelHelpers.objectWithoutProperties = function (obj, keys) {
  var target = {};

  for (var i in obj) {
    if (keys.indexOf(i) >= 0) continue;
    if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
    target[i] = obj[i];
  }

  return target;
};

babelHelpers;

var promise = __commonjs(function (module, exports, global) {
(function (root) {

  // Store setTimeout reference so promise-polyfill will be unaffected by
  // other code modifying setTimeout (like sinon.useFakeTimers())
  var setTimeoutFunc = setTimeout;

  function noop() {
  }

  // Use polyfill for setImmediate for performance gains
  var asap = (typeof setImmediate === 'function' && setImmediate) ||
    function (fn) {
      setTimeoutFunc(fn, 1);
    };

  var onUnhandledRejection = function onUnhandledRejection(err) {
    console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
  };

  // Polyfill for Function.prototype.bind
  function bind(fn, thisArg) {
    return function () {
      fn.apply(thisArg, arguments);
    };
  }

  var isArray = Array.isArray || function (value) {
    return Object.prototype.toString.call(value) === '[object Array]';
  };

  function Promise(fn) {
    if (typeof this !== 'object') throw new TypeError('Promises must be constructed via new');
    if (typeof fn !== 'function') throw new TypeError('not a function');
    this._state = 0;
    this._handled = false;
    this._value = undefined;
    this._deferreds = [];

    doResolve(fn, this);
  }

  function handle(self, deferred) {
    while (self._state === 3) {
      self = self._value;
    }
    if (self._state === 0) {
      self._deferreds.push(deferred);
      return;
    }
    self._handled = true;
    asap(function () {
      var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
      if (cb === null) {
        (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
        return;
      }
      var ret;
      try {
        ret = cb(self._value);
      } catch (e) {
        reject(deferred.promise, e);
        return;
      }
      resolve(deferred.promise, ret);
    });
  }

  function resolve(self, newValue) {
    try {
      // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
      if (newValue === self) throw new TypeError('A promise cannot be resolved with itself.');
      if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
        var then = newValue.then;
        if (newValue instanceof Promise) {
          self._state = 3;
          self._value = newValue;
          finale(self);
          return;
        } else if (typeof then === 'function') {
          doResolve(bind(then, newValue), self);
          return;
        }
      }
      self._state = 1;
      self._value = newValue;
      finale(self);
    } catch (e) {
      reject(self, e);
    }
  }

  function reject(self, newValue) {
    self._state = 2;
    self._value = newValue;
    finale(self);
  }

  function finale(self) {
    if (self._state === 2 && self._deferreds.length === 0) {
      setTimeout(function() {
        if (!self._handled) {
          onUnhandledRejection(self._value);
        }
      }, 1);
    }
    
    for (var i = 0, len = self._deferreds.length; i < len; i++) {
      handle(self, self._deferreds[i]);
    }
    self._deferreds = null;
  }

  function Handler(onFulfilled, onRejected, promise) {
    this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
    this.onRejected = typeof onRejected === 'function' ? onRejected : null;
    this.promise = promise;
  }

  /**
   * Take a potentially misbehaving resolver function and make sure
   * onFulfilled and onRejected are only called once.
   *
   * Makes no guarantees about asynchrony.
   */
  function doResolve(fn, self) {
    var done = false;
    try {
      fn(function (value) {
        if (done) return;
        done = true;
        resolve(self, value);
      }, function (reason) {
        if (done) return;
        done = true;
        reject(self, reason);
      });
    } catch (ex) {
      if (done) return;
      done = true;
      reject(self, ex);
    }
  }

  Promise.prototype['catch'] = function (onRejected) {
    return this.then(null, onRejected);
  };

  Promise.prototype.then = function (onFulfilled, onRejected) {
    var prom = new Promise(noop);
    handle(this, new Handler(onFulfilled, onRejected, prom));
    return prom;
  };

  Promise.all = function () {
    var args = Array.prototype.slice.call(arguments.length === 1 && isArray(arguments[0]) ? arguments[0] : arguments);

    return new Promise(function (resolve, reject) {
      if (args.length === 0) return resolve([]);
      var remaining = args.length;

      function res(i, val) {
        try {
          if (val && (typeof val === 'object' || typeof val === 'function')) {
            var then = val.then;
            if (typeof then === 'function') {
              then.call(val, function (val) {
                res(i, val);
              }, reject);
              return;
            }
          }
          args[i] = val;
          if (--remaining === 0) {
            resolve(args);
          }
        } catch (ex) {
          reject(ex);
        }
      }

      for (var i = 0; i < args.length; i++) {
        res(i, args[i]);
      }
    });
  };

  Promise.resolve = function (value) {
    if (value && typeof value === 'object' && value.constructor === Promise) {
      return value;
    }

    return new Promise(function (resolve) {
      resolve(value);
    });
  };

  Promise.reject = function (value) {
    return new Promise(function (resolve, reject) {
      reject(value);
    });
  };

  Promise.race = function (values) {
    return new Promise(function (resolve, reject) {
      for (var i = 0, len = values.length; i < len; i++) {
        values[i].then(resolve, reject);
      }
    });
  };

  /**
   * Set the immediate function to execute callbacks
   * @param fn {function} Function to execute
   * @private
   */
  Promise._setImmediateFn = function _setImmediateFn(fn) {
    asap = fn;
  };
  
  Promise._setUnhandledRejectionFn = function _setUnhandledRejectionFn(fn) {
    onUnhandledRejection = fn;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Promise;
  } else if (!root.Promise) {
    root.Promise = Promise;
  }

})(__commonjs_global);
});

var Promise = (promise && typeof promise === 'object' && 'default' in promise ? promise['default'] : promise);

var wx = function (a, b) {
  return b(a, !0);
}(window, function (a, b) {
  function c(b, c, d) {
    a.WeixinJSBridge ? WeixinJSBridge.invoke(b, e(c), function (a) {
      g(b, a, d);
    }) : j(b, d);
  }

  function d(b, c, d) {
    a.WeixinJSBridge ? WeixinJSBridge.on(b, function (a) {
      d && d.trigger && d.trigger(a), g(b, a, c);
    }) : d ? j(b, d) : j(b, c);
  }

  function e(a) {
    return a = a || {}, a.appId = E.appId, a.verifyAppId = E.appId, a.verifySignType = "sha1", a.verifyTimestamp = E.timestamp + "", a.verifyNonceStr = E.nonceStr, a.verifySignature = E.signature, a;
  }

  function f(a) {
    return {
      timeStamp: a.timestamp + "",
      nonceStr: a.nonceStr,
      "package": a.package,
      paySign: a.paySign,
      signType: a.signType || "SHA1"
    };
  }

  function g(a, b, c) {
    var d, e, f;
    switch (delete b.err_code, delete b.err_desc, delete b.err_detail, d = b.errMsg, d || (d = b.err_msg, delete b.err_msg, d = h(a, d), b.errMsg = d), c = c || {}, c._complete && (c._complete(b), delete c._complete), d = b.errMsg || "", E.debug && !c.isInnerInvoke && alert(JSON.stringify(b)), e = d.indexOf(":"), f = d.substring(e + 1)) {
      case "ok":
        c.success && c.success(b);
        break;
      case "cancel":
        c.cancel && c.cancel(b);
        break;
      default:
        c.fail && c.fail(b);
    }
    c.complete && c.complete(b);
  }

  function h(a, b) {
    var e,
        f,
        c = a,
        d = p[c];
    return d && (c = d), e = "ok", b && (f = b.indexOf(":"), e = b.substring(f + 1), "confirm" == e && (e = "ok"), "failed" == e && (e = "fail"), -1 != e.indexOf("failed_") && (e = e.substring(7)), -1 != e.indexOf("fail_") && (e = e.substring(5)), e = e.replace(/_/g, " "), e = e.toLowerCase(), ("access denied" == e || "no permission to execute" == e) && (e = "permission denied"), "config" == c && "function not exist" == e && (e = "ok"), "" == e && (e = "fail")), b = c + ":" + e;
  }

  function i(a) {
    var b, c, d, e;
    if (a) {
      for (b = 0, c = a.length; c > b; ++b) {
        d = a[b], e = o[d], e && (a[b] = e);
      }return a;
    }
  }

  function j(a, b) {
    if (!(!E.debug || b && b.isInnerInvoke)) {
      var c = p[a];
      c && (a = c), b && b._complete && delete b._complete, console.log('"' + a + '",', b || "");
    }
  }

  function k() {
    0 != D.preVerifyState && (u || v || E.debug || "6.0.2" > z || D.systemType < 0 || A || (A = !0, D.appId = E.appId, D.initTime = C.initEndTime - C.initStartTime, D.preVerifyTime = C.preVerifyEndTime - C.preVerifyStartTime, H.getNetworkType({
      isInnerInvoke: !0,
      success: function success(a) {
        var b, c;
        D.networkType = a.networkType, b = "http://open.weixin.qq.com/sdk/report?v=" + D.version + "&o=" + D.preVerifyState + "&s=" + D.systemType + "&c=" + D.clientVersion + "&a=" + D.appId + "&n=" + D.networkType + "&i=" + D.initTime + "&p=" + D.preVerifyTime + "&u=" + D.url, c = new Image(), c.src = b;
      }
    })));
  }

  function l() {
    return new Date().getTime();
  }

  function m(b) {
    w && (a.WeixinJSBridge ? b() : q.addEventListener && q.addEventListener("WeixinJSBridgeReady", b, !1));
  }

  function n() {
    H.invoke || (H.invoke = function (b, c, d) {
      a.WeixinJSBridge && WeixinJSBridge.invoke(b, e(c), d);
    }, H.on = function (b, c) {
      a.WeixinJSBridge && WeixinJSBridge.on(b, c);
    });
  }
  var o, p, q, r, s, t, u, v, w, x, y, z, A, B, C, D, E, F, G, H;
  if (!a.jWeixin) return o = {
    config: "preVerifyJSAPI",
    onMenuShareTimeline: "menu:share:timeline",
    onMenuShareAppMessage: "menu:share:appmessage",
    onMenuShareQQ: "menu:share:qq",
    onMenuShareWeibo: "menu:share:weiboApp",
    onMenuShareQZone: "menu:share:QZone",
    previewImage: "imagePreview",
    getLocation: "geoLocation",
    openProductSpecificView: "openProductViewWithPid",
    addCard: "batchAddCard",
    openCard: "batchViewCard",
    chooseWXPay: "getBrandWCPayRequest"
  }, p = function () {
    var b,
        a = {};
    for (b in o) {
      a[o[b]] = b;
    }return a;
  }(), q = a.document, r = q.title, s = navigator.userAgent.toLowerCase(), t = navigator.platform.toLowerCase(), u = !(!t.match("mac") && !t.match("win")), v = -1 != s.indexOf("wxdebugger"), w = -1 != s.indexOf("micromessenger"), x = -1 != s.indexOf("android"), y = -1 != s.indexOf("iphone") || -1 != s.indexOf("ipad"), z = function () {
    var a = s.match(/micromessenger\/(\d+\.\d+\.\d+)/) || s.match(/micromessenger\/(\d+\.\d+)/);
    return a ? a[1] : "";
  }(), A = !1, B = !1, C = {
    initStartTime: l(),
    initEndTime: 0,
    preVerifyStartTime: 0,
    preVerifyEndTime: 0
  }, D = {
    version: 1,
    appId: "",
    initTime: 0,
    preVerifyTime: 0,
    networkType: "",
    preVerifyState: 1,
    systemType: y ? 1 : x ? 2 : -1,
    clientVersion: z,
    url: encodeURIComponent(location.href)
  }, E = {}, F = {
    _completes: []
  }, G = {
    state: 0,
    data: {}
  }, m(function () {
    C.initEndTime = l();
  }), H = {
    config: function config(a) {
      E = a, j("config", a);
      var b = E.check === !1 ? !1 : !0;
      m(function () {
        var a, d, e;
        if (b) c(o.config, {
          verifyJsApiList: i(E.jsApiList)
        }, function () {
          F._complete = function (a) {
            C.preVerifyEndTime = l(), G.state = 1, G.data = a;
          }, F.success = function () {
            D.preVerifyState = 0;
          }, F.fail = function (a) {
            F._fail ? F._fail(a) : G.state = -1;
          };
          var a = F._completes;
          return a.push(function () {
            k();
          }), F.complete = function () {
            for (var c = 0, d = a.length; d > c; ++c) {
              a[c]();
            }F._completes = [];
          }, F;
        }()), C.preVerifyStartTime = l();else {
          for (G.state = 1, a = F._completes, d = 0, e = a.length; e > d; ++d) {
            a[d]();
          }F._completes = [];
        }
      }), E.beta && n();
    },
    ready: function ready(a) {
      0 != G.state ? a() : (F._completes.push(a), !w && E.debug && a());
    },
    error: function error(a) {
      "6.0.2" > z || B || (B = !0, -1 == G.state ? a(G.data) : F._fail = a);
    },
    checkJsApi: function checkJsApi(a) {
      var b = function b(a) {
        var c,
            d,
            b = a.checkResult;
        for (c in b) {
          d = p[c], d && (b[d] = b[c], delete b[c]);
        }return a;
      };
      c("checkJsApi", {
        jsApiList: i(a.jsApiList)
      }, function () {
        return a._complete = function (a) {
          if (x) {
            var c = a.checkResult;
            c && (a.checkResult = JSON.parse(c));
          }
          a = b(a);
        }, a;
      }());
    },
    onMenuShareTimeline: function onMenuShareTimeline(a) {
      d(o.onMenuShareTimeline, {
        complete: function complete() {
          c("shareTimeline", {
            title: a.title || r,
            desc: a.title || r,
            img_url: a.imgUrl || "",
            link: a.link || location.href,
            type: a.type || "link",
            data_url: a.dataUrl || ""
          }, a);
        }
      }, a);
    },
    onMenuShareAppMessage: function onMenuShareAppMessage(a) {
      d(o.onMenuShareAppMessage, {
        complete: function complete() {
          c("sendAppMessage", {
            title: a.title || r,
            desc: a.desc || "",
            link: a.link || location.href,
            img_url: a.imgUrl || "",
            type: a.type || "link",
            data_url: a.dataUrl || ""
          }, a);
        }
      }, a);
    },
    onMenuShareQQ: function onMenuShareQQ(a) {
      d(o.onMenuShareQQ, {
        complete: function complete() {
          c("shareQQ", {
            title: a.title || r,
            desc: a.desc || "",
            img_url: a.imgUrl || "",
            link: a.link || location.href
          }, a);
        }
      }, a);
    },
    onMenuShareWeibo: function onMenuShareWeibo(a) {
      d(o.onMenuShareWeibo, {
        complete: function complete() {
          c("shareWeiboApp", {
            title: a.title || r,
            desc: a.desc || "",
            img_url: a.imgUrl || "",
            link: a.link || location.href
          }, a);
        }
      }, a);
    },
    onMenuShareQZone: function onMenuShareQZone(a) {
      d(o.onMenuShareQZone, {
        complete: function complete() {
          c("shareQZone", {
            title: a.title || r,
            desc: a.desc || "",
            img_url: a.imgUrl || "",
            link: a.link || location.href
          }, a);
        }
      }, a);
    },
    startRecord: function startRecord(a) {
      c("startRecord", {}, a);
    },
    stopRecord: function stopRecord(a) {
      c("stopRecord", {}, a);
    },
    onVoiceRecordEnd: function onVoiceRecordEnd(a) {
      d("onVoiceRecordEnd", a);
    },
    playVoice: function playVoice(a) {
      c("playVoice", {
        localId: a.localId
      }, a);
    },
    pauseVoice: function pauseVoice(a) {
      c("pauseVoice", {
        localId: a.localId
      }, a);
    },
    stopVoice: function stopVoice(a) {
      c("stopVoice", {
        localId: a.localId
      }, a);
    },
    onVoicePlayEnd: function onVoicePlayEnd(a) {
      d("onVoicePlayEnd", a);
    },
    uploadVoice: function uploadVoice(a) {
      c("uploadVoice", {
        localId: a.localId,
        isShowProgressTips: 0 == a.isShowProgressTips ? 0 : 1
      }, a);
    },
    downloadVoice: function downloadVoice(a) {
      c("downloadVoice", {
        serverId: a.serverId,
        isShowProgressTips: 0 == a.isShowProgressTips ? 0 : 1
      }, a);
    },
    translateVoice: function translateVoice(a) {
      c("translateVoice", {
        localId: a.localId,
        isShowProgressTips: 0 == a.isShowProgressTips ? 0 : 1
      }, a);
    },
    chooseImage: function chooseImage(a) {
      c("chooseImage", {
        scene: "1|2",
        count: a.count || 9,
        sizeType: a.sizeType || ["original", "compressed"],
        sourceType: a.sourceType || ["album", "camera"]
      }, function () {
        return a._complete = function (a) {
          if (x) {
            var b = a.localIds;
            b && (a.localIds = JSON.parse(b));
          }
        }, a;
      }());
    },
    previewImage: function previewImage(a) {
      c(o.previewImage, {
        current: a.current,
        urls: a.urls
      }, a);
    },
    uploadImage: function uploadImage(a) {
      c("uploadImage", {
        localId: a.localId,
        isShowProgressTips: 0 == a.isShowProgressTips ? 0 : 1
      }, a);
    },
    downloadImage: function downloadImage(a) {
      c("downloadImage", {
        serverId: a.serverId,
        isShowProgressTips: 0 == a.isShowProgressTips ? 0 : 1
      }, a);
    },
    getNetworkType: function getNetworkType(a) {
      var b = function b(a) {
        var c,
            d,
            e,
            b = a.errMsg;
        if (a.errMsg = "getNetworkType:ok", c = a.subtype, delete a.subtype, c) a.networkType = c;else switch (d = b.indexOf(":"), e = b.substring(d + 1)) {
          case "wifi":
          case "edge":
          case "wwan":
            a.networkType = e;
            break;
          default:
            a.errMsg = "getNetworkType:fail";
        }
        return a;
      };
      c("getNetworkType", {}, function () {
        return a._complete = function (a) {
          a = b(a);
        }, a;
      }());
    },
    openLocation: function openLocation(a) {
      c("openLocation", {
        latitude: a.latitude,
        longitude: a.longitude,
        name: a.name || "",
        address: a.address || "",
        scale: a.scale || 28,
        infoUrl: a.infoUrl || ""
      }, a);
    },
    getLocation: function getLocation(a) {
      a = a || {}, c(o.getLocation, {
        type: a.type || "wgs84"
      }, function () {
        return a._complete = function (a) {
          delete a.type;
        }, a;
      }());
    },
    hideOptionMenu: function hideOptionMenu(a) {
      c("hideOptionMenu", {}, a);
    },
    showOptionMenu: function showOptionMenu(a) {
      c("showOptionMenu", {}, a);
    },
    closeWindow: function closeWindow(a) {
      a = a || {}, c("closeWindow", {}, a);
    },
    hideMenuItems: function hideMenuItems(a) {
      c("hideMenuItems", {
        menuList: a.menuList
      }, a);
    },
    showMenuItems: function showMenuItems(a) {
      c("showMenuItems", {
        menuList: a.menuList
      }, a);
    },
    hideAllNonBaseMenuItem: function hideAllNonBaseMenuItem(a) {
      c("hideAllNonBaseMenuItem", {}, a);
    },
    showAllNonBaseMenuItem: function showAllNonBaseMenuItem(a) {
      c("showAllNonBaseMenuItem", {}, a);
    },
    scanQRCode: function scanQRCode(a) {
      a = a || {}, c("scanQRCode", {
        needResult: a.needResult || 0,
        scanType: a.scanType || ["qrCode", "barCode"]
      }, function () {
        return a._complete = function (a) {
          var b, c;
          y && (b = a.resultStr, b && (c = JSON.parse(b), a.resultStr = c && c.scan_code && c.scan_code.scan_result));
        }, a;
      }());
    },
    openProductSpecificView: function openProductSpecificView(a) {
      c(o.openProductSpecificView, {
        pid: a.productId,
        view_type: a.viewType || 0,
        ext_info: a.extInfo
      }, a);
    },
    addCard: function addCard(a) {
      var e,
          f,
          g,
          h,
          b = a.cardList,
          d = [];
      for (e = 0, f = b.length; f > e; ++e) {
        g = b[e], h = {
          card_id: g.cardId,
          card_ext: g.cardExt
        }, d.push(h);
      }c(o.addCard, {
        card_list: d
      }, function () {
        return a._complete = function (a) {
          var c,
              d,
              e,
              b = a.card_list;
          if (b) {
            for (b = JSON.parse(b), c = 0, d = b.length; d > c; ++c) {
              e = b[c], e.cardId = e.card_id, e.cardExt = e.card_ext, e.isSuccess = e.is_succ ? !0 : !1, delete e.card_id, delete e.card_ext, delete e.is_succ;
            }a.cardList = b, delete a.card_list;
          }
        }, a;
      }());
    },
    chooseCard: function chooseCard(a) {
      c("chooseCard", {
        app_id: E.appId,
        location_id: a.shopId || "",
        sign_type: a.signType || "SHA1",
        card_id: a.cardId || "",
        card_type: a.cardType || "",
        card_sign: a.cardSign,
        time_stamp: a.timestamp + "",
        nonce_str: a.nonceStr
      }, function () {
        return a._complete = function (a) {
          a.cardList = a.choose_card_info, delete a.choose_card_info;
        }, a;
      }());
    },
    openCard: function openCard(a) {
      var e,
          f,
          g,
          h,
          b = a.cardList,
          d = [];
      for (e = 0, f = b.length; f > e; ++e) {
        g = b[e], h = {
          card_id: g.cardId,
          code: g.code
        }, d.push(h);
      }c(o.openCard, {
        card_list: d
      }, a);
    },
    chooseWXPay: function chooseWXPay(a) {
      c(o.chooseWXPay, f(a), a);
    }
  }, b && (a.wx = a.jWeixin = H), H;
});

var asyncApiList = ['onMenuShareTimeline', 'onMenuShareAppMessage', 'onMenuShareQQ', 'onMenuShareWeibo', 'onMenuShareQZone', 'stopRecord', 'onVoiceRecordEnd', 'onVoicePlayEnd', 'uploadVoice', 'downloadVoice', 'chooseImage', 'uploadImage', 'downloadImage', 'translateVoice', 'getNetworkType', 'getLocation', 'scanQRCode', 'chooseWXPay', 'addCard', 'chooseCard'];

var promisify = function promisify(obj, method) {
  var origin = obj[method].bind(obj);
  obj[method] = function (_ref) {
    var _success = _ref.success;
    var _fail = _ref.fail;
    var otherArgs = babelHelpers.objectWithoutProperties(_ref, ['success', 'fail']);

    return new Promise(function (resolve, reject) {
      wx.ready(function () {
        origin(babelHelpers.extends({}, otherArgs, {
          success: function success() {
            _success.apply(undefined, arguments);
            resolve.apply(undefined, arguments);
          },
          fail: function fail() {
            _fail.apply(undefined, arguments);
            reject.apply(undefined, arguments);
          }
        }));
      });
    });
  };
};

asyncApiList.forEach(function (key) {
  return promisify(wx, key);
});

module.exports = wx;