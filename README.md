## Introduction

The traditional **wechat jssdk** coding style is not convenient, as below:
``` javascript
wx.ready(function() {
  wx.getNetworkType({
      success: function (res) {
          var networkType = res.networkType; // 返回网络类型2g，3g，4g，wifi
          //...
      }
  });
})
```

This project make each **wechat jssdk** function return a `promise`.Now you write like as below ( **only one line** ) :
``` javascript
// ES7
const {networkType} = await wx.getNetworkType()
```

## Build Setup

``` bash
# build for publish
make build

# run unit tests
make test
```
