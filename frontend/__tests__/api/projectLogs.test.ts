import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/projects/[id]/logs'

jest.mock('@/lib/project-service', () => ({
  __esModule: true,
  default: {
    getProjectStatus: jest.fn(),
    getLogs: jest.fn(),
    getContainerLogs: jest.fn(),
  },
}))

import projectService from '@/lib/project-service'

describe('/api/projects/[id]/logs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should get application logs', async () => {
      const mockLogs = [
        { id: '1', type: 'info', message: 'App started' },
        { id: '2', type: 'warn', message: 'Warning message' },
      ]

      ;(projectService.getProjectStatus as jest.Mock).mockReturnValueOnce({
        id: '1',
      })
      ;(projectService.getLogs as jest.Mock).mockReturnValueOnce(mockLogs)

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: '1', type: 'app', limit: '100' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(2)
    })

    it('should use default limit if not provided', async () => {
      ;(projectService.getProjectStatus as jest.Mock).mockReturnValueOnce({
        id: '1',
      })
      ;(projectService.getLogs as jest.Mock).mockReturnValueOnce([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: '1', type: 'app' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(projectService.getLogs).toHaveBeenCalledWith('1', 100)
    })

    it('should cap limit at 1000', async () => {
      ;(projectService.getProjectStatus as jest.Mock).mockReturnValueOnce({
        id: '1',
      })
      ;(projectService.getContainerLogs as jest.Mock).mockResolvedValueOnce([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: '1', type: 'container', limit: '5000' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(projectService.getContainerLogs).toHaveBeenCalledWith('1', 1000)
    })

    it('should return 404 if project not found', async () => {
      ;(projectService.getProjectStatus as jest.Mock).mockReturnValueOnce(null)

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'nonexistent', type: 'app' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(404)
    })

    it('should handle errors when retrieving logs', async () => {
      ;(projectService.getProjectStatus as jest.Mock).mockReturnValueOnce({
        id: '1',
      })
      ;(projectService.getLogs as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Database error')
      })

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: '1', type: 'app' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
    })
  })

  describe('Invalid methods', () => {
    it('should only accept GET requests', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: { id: '1' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })

    it('should reject DELETE requests', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: '1' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })
  })

  describe('Query validation', () => {
    it('should validate limit is a number', async () => {
      ;(projectService.getProjectStatus as jest.Mock).mockReturnValueOnce({
        id: '1',
      })

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: '1', type: 'app', limit: 'invalid' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })

    it('should require type parameter', async () => {
      ;(projectService.getProjectStatus as jest.Mock).mockReturnValueOnce({
        id: '1',
      })

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: '1' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })
  })
})
