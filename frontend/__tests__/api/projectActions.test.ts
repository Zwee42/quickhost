import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/projects/[id]/[action]'

jest.mock('@/lib/project-service', () => ({
  __esModule: true,
  default: {
    restartProject: jest.fn(),
    stopProject: jest.fn(),
    getProjectStatus: jest.fn(),
  },
}))

import projectService from '@/lib/project-service'

describe('/api/projects/[id]/[action]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('restart action', () => {
    it('should restart a project', async () => {
      ;(projectService.restartProject as jest.Mock).mockResolvedValueOnce(
        true
      )
      ;(projectService.getProjectStatus as jest.Mock).mockReturnValueOnce({
        id: '1',
        status: 'running',
      })

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: '1', action: 'restart' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(projectService.restartProject).toHaveBeenCalledWith('1')
    })

    it('should return error if project not found for restart', async () => {
      ;(projectService.getProjectStatus as jest.Mock).mockReturnValueOnce(null)

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: 'nonexistent', action: 'restart' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(404)
    })
  })

  describe('stop action', () => {
    it('should stop a project', async () => {
      ;(projectService.stopProject as jest.Mock).mockResolvedValueOnce(true)
      ;(projectService.getProjectStatus as jest.Mock).mockReturnValueOnce({
        id: '1',
        status: 'stopped',
      })

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: '1', action: 'stop' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(projectService.stopProject).toHaveBeenCalledWith('1')
    })

    it('should return error if project not found for stop', async () => {
      ;(projectService.getProjectStatus as jest.Mock).mockReturnValueOnce(null)

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: 'nonexistent', action: 'stop' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(404)
    })
  })

  describe('invalid action', () => {
    it('should reject unknown actions', async () => {
      ;(projectService.getProjectStatus as jest.Mock).mockReturnValueOnce({
        id: '1',
        status: 'running',
      })

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: '1', action: 'invalid' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })
  })

  describe('invalid methods', () => {
    it('should only accept POST requests', async () => {
      ;(projectService.getProjectStatus as jest.Mock).mockReturnValueOnce({
        id: '1',
        status: 'running',
      })

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: '1', action: 'restart' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })

    it('should reject DELETE requests', async () => {
      ;(projectService.getProjectStatus as jest.Mock).mockReturnValueOnce({
        id: '1',
        status: 'running',
      })

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: '1', action: 'restart' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })
  })
})
