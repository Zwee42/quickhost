import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/projects/[id]/index'

jest.mock('@/lib/project-service', () => ({
  __esModule: true,
  default: {
    getProjectStatus: jest.fn(),
    deleteProject: jest.fn(),
  },
}))

import projectService from '@/lib/project-service'

describe('/api/projects/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should get a project by ID', async () => {
      const mockProject = {
        id: '1',
        name: 'Test Project',
        status: 'running',
        subdomain: 'test',
        containerPort: 5000,
        updatedAt: new Date().getTime(),
      }

      ;(projectService.getProjectStatus as jest.Mock).mockReturnValueOnce(
        mockProject
      )

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: '1' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.id).toBe('1')
      expect(data.name).toBe('Test Project')
    })

    it('should return 404 if project not found', async () => {
      ;(projectService.getProjectStatus as jest.Mock).mockReturnValueOnce(null)

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'nonexistent' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(404)
    })

    it('should handle errors when getting project', async () => {
      ;(projectService.getProjectStatus as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Database error')
      })

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: '1' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
    })
  })

  describe('DELETE', () => {
    it('should delete a project', async () => {
      ;(projectService.getProjectStatus as jest.Mock).mockReturnValueOnce({
        id: '1',
        name: 'Test Project',
      })
      ;(projectService.deleteProject as jest.Mock).mockResolvedValueOnce(true)

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: '1' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(projectService.deleteProject).toHaveBeenCalledWith('1')
    })

    it('should return 404 if project not found for deletion', async () => {
      ;(projectService.getProjectStatus as jest.Mock).mockReturnValueOnce(null)

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: 'nonexistent' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(404)
    })

    it('should handle errors when deleting project', async () => {
      ;(projectService.getProjectStatus as jest.Mock).mockReturnValueOnce({
        id: '1',
        name: 'Test Project',
      })
      ;(projectService.deleteProject as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to remove container')
      )

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: '1' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
    })
  })

  describe('Invalid methods', () => {
    it('should reject POST requests', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: { id: '1' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })

    it('should reject PUT requests', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: '1' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })
  })
})
