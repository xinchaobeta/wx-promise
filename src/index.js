import Promise from 'promise-polyfill'
import wx from './jweixin-1.0.0'

const asyncApiList = [
  'onMenuShareTimeline',
  'onMenuShareAppMessage',
  'onMenuShareQQ',
  'onMenuShareWeibo',
  'onMenuShareQZone',
  'stopRecord',
  'onVoiceRecordEnd',
  'onVoicePlayEnd',
  'uploadVoice',
  'downloadVoice',
  'chooseImage',
  'uploadImage',
  'downloadImage',
  'translateVoice',
  'getNetworkType',
  'getLocation',
  'scanQRCode',
  'chooseWXPay',
  'addCard',
  'chooseCard',
]

const promisify = (obj, method) => {
  const origin = obj[method].bind(obj)
  obj[method] = function({success, fail, ...otherArgs} = {}) {
    return new Promise((resolve, reject) => {
      wx.ready(() => {
        origin({
          ...otherArgs,
          success: (...args) => {
            if(success) success(...args)
            resolve(...args)
          },
          fail: (...args) => {
            if(fail) fail(...args)
            reject(...args)
          },
        })
      })
    })
  }
}

asyncApiList.forEach(key => promisify(wx, key))

export default wx
