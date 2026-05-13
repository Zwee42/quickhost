import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/projects/index'

jest.mock('@/lib/project-service', () => ({
  __esModule: true,
  default: {
    listProjects: jest.fn(),
    createProject: jest.fn(),
  },
}))

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    prepare: jest.fn(() => ({
      get: jest.fn(() => null),
    })),
  },
}))

jest.mock('@/lib/validation', () => ({
  isValidProjectName: jest.fn(() => true),
  isValidGitUrl: jest.fn(() => true),
  isValidSubdomain: jest.fn(() => true),
  sanitizeInput: jest.fn((input) => input),
}))

import projectService from '@/lib/project-service'
import * as validation from '@/lib/validation'
import db from '@/lib/db'

describe('/api/projects', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should list all projects', async () => {
      const mockProjects = [
        {
          id: '1',
          name: 'Project 1',
          status: 'running',
          subdomain: 'project1',
          containerPort: 5000,
          updatedAt: new Date().getTime(),
        },
      ]

      ;(projectService.listProjects as jest.Mock).mockReturnValueOnce(mockProjects)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(1)
      expect(data[0].name).toBe('Project 1')
    })

    it('should handle errors when listing projects', async () => {
      ;(projectService.listProjects as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Database error')
      })

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
    })
  })

  describe('POST', () => {
    it('should create a new project', async () => {
      const projectData = {
        name: 'New Project',
        gitUrl: 'https://github.com/user/repo',
        gitBranch: 'main',
        subdomain: 'newproject',
        enableSsl: true,
        environmentVariables: {},
      }

      ;(projectService.createProject as jest.Mock).mockResolvedValueOnce({
        id: '123',
        status: 'pending',
      })

      const { req, res } = createMocks({
        method: 'POST',
        body: projectData,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(201)
      expect(projectService.createProject).toHaveBeenCalledWith(projectData)
    })

    it('should validate project name', async () => {
      ;(validation.isValidProjectName as jest.Mock).mockReturnValueOnce(false)

      const projectData = {
        name: 'ab',
        gitUrl: 'https://github.com/user/repo',
        gitBranch: 'main',
        subdomain: 'newproject',
        enableSsl: true,
        environmentVariables: {},
      }

      const { req, res } = createMocks({
        method: 'POST',
        body: projectData,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })

    it('should validate git URL', async () => {
      ;(validation.isValidGitUrl as jest.Mock).mockReturnValueOnce(false)

      const projectData = {
        name: 'newproject',
        gitUrl: 'not-a-git-url',
        gitBranch: 'main',
        subdomain: 'newproject',
        enableSsl: true,
        environmentVariables: {},
      }

      const { req, res } = createMocks({
        method: 'POST',
        body: projectData,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })

    it('should validate subdomain', async () => {
      ;(validation.isValidSubdomain as jest.Mock).mockReturnValueOnce(false)

      const projectData = {
        name: 'newproject',
        gitUrl: 'https://github.com/user/repo',
        gitBranch: 'main',
        subdomain: 'Invalid-Subdomain',
        enableSsl: true,
        environmentVariables: {},
      }

      const { req, res } = createMocks({
        method: 'POST',
        body: projectData,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })

    it('should handle duplicate project name', async () => {
      const projectData = {
        name: 'Existing Project',
        gitUrl: 'https://github.com/user/repo',
        gitBranch: 'main',
        subdomain: 'newproject',
        enableSsl: true,
        environmentVariables: {},
      }

      ;(db.prepare as jest.Mock).mockReturnValueOnce({
        get: jest.fn(() => ({ id: 'existing' })),
      })

      ;(projectService.createProject as jest.Mock).mockRejectedValueOnce(
        new Error('UNIQUE constraint failed')
      )

      const { req, res } = createMocks({
        method: 'POST',
        body: projectData,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(409)
    })

    it('should reject non-GET/POST requests', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })
  })
})
