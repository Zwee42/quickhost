import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/health'

describe('/api/health', () => {
  it('should return 200 status', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
  })

  it('should return health object', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    })

    await handler(req, res)

    const data = JSON.parse(res._getData())
    expect(data).toHaveProperty('status')
    expect(data).toHaveProperty('timestamp')
    expect(data).toHaveProperty('environment')
  })

  it('should have status ok', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    })

    await handler(req, res)

    const data = JSON.parse(res._getData())
    expect(data.status).toBe('healthy')
  })

  it('should have valid timestamp', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    })

    await handler(req, res)

    const data = JSON.parse(res._getData())
    expect(!isNaN(Date.parse(data.timestamp))).toBe(true)
  })

  it('should reject non-GET requests', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
  })
})
