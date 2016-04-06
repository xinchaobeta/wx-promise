import wx from '../../src/index'
import request from 'superagent'

before(() => {
  request
    .post('http://xinchaobeta-wechat-backend.daoapp.io/wechatapi/getJsConfig')
    .send({
      url: location.href,
    })
    .end((err, res) => {
      if(err) {
        return console.log('getJsConfig Error: ', err)
      }
      wx.config(res.body);
    })
})

describe('getNetworkType', () => {
  it('direct call should return a promise', async () => {
    const {errMsg, networkType} = await wx.getNetworkType()
    expect(errMsg).toBe('getNetworkType:ok')
    expect(['2g', '3g', '4g', 'wifi']).toInclude(networkType)
  })

  it('origin suceess callback should also be enabled', async () => {
    const success = expect.createSpy()
    const args = await wx.getNetworkType({success})
    expect(success).toHaveBeenCalledWith(args)
    expect(args.errMsg).toBe('getNetworkType:ok')
    expect(['2g', '3g', '4g', 'wifi']).toInclude(args.networkType)
  })
})
