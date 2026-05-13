import { render, screen, waitFor } from '@/__tests__/test-utils'
import ProjectDetailsPage from '@/pages/projects/[id]'

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: { id: '1' },
    pathname: '/projects/[id]',
  }),
}))

global.fetch = jest.fn()

const mockProject = {
  id: '1',
  name: 'Test Project',
  subdomain: 'test',
  url: 'https://test.quickhost',
  status: 'running' as const,
  containerName: 'test-container',
  containerPort: 5000,
  gitUrl: 'https://github.com/user/repo',
  gitBranch: 'main',
  lastUpdated: new Date().toISOString(),
}

const mockLogs = [
  { id: '1', type: 'info', message: 'Application started' },
  { id: '2', type: 'warn', message: 'Warning message' },
]

describe('Project Details Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/projects/1')) {
        if (url.includes('/logs')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockLogs,
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockProject,
        })
      }
      return Promise.resolve({
        ok: false,
        status: 404,
      })
    })
  })

  it('should render project name', async () => {
    render(<ProjectDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })
  })

  it('should display project status badge', async () => {
    render(<ProjectDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('running')).toBeInTheDocument()
    })
  })

  it('should display project information cards', async () => {
    render(<ProjectDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText(/https:\/\/test\.quickhost/i)).toBeInTheDocument()
      expect(screen.getByText(/test-container/i)).toBeInTheDocument()
      expect(screen.getByText(/5000/)).toBeInTheDocument()
    })
  })

  it('should display action buttons', async () => {
    render(<ProjectDetailsPage />)

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /restart/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /stop/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /delete/i })
      ).toBeInTheDocument()
    })
  })

  it('should display application logs', async () => {
    render(<ProjectDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText(/application started/i)).toBeInTheDocument()
    })
  })

  it('should have back button', async () => {
    render(<ProjectDetailsPage />)

    await waitFor(() => {
      const backButton = screen.getByRole('button', { name: /back to projects/i })
      expect(backButton).toBeInTheDocument()
    })
  })

  it('should auto-refresh project status', async () => {
    jest.useFakeTimers()
    render(<ProjectDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    const initialCallCount = (global.fetch as jest.Mock).mock.calls.length

    jest.advanceTimersByTime(5000) // 5 seconds

    await waitFor(() => {
      expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(
        initialCallCount
      )
    })

    jest.useRealTimers()
  })

  it('should display error state', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Failed to fetch')
    )

    render(<ProjectDetailsPage />)

    await waitFor(() => {
      expect(
        screen.getByText(/error|failed to load/i)
      ).toBeInTheDocument()
    })
  })

  it('should show delete confirmation modal', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)
    render(<ProjectDetailsPage />)

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /delete/i })
      ).toBeInTheDocument()
    })

    const deleteButton = screen.getByRole('button', { name: /delete/i })
    deleteButton.click()

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled()
    })

    confirmSpy.mockRestore()
  })

  it('should have log viewer with toggle', async () => {
    render(<ProjectDetailsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /application/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /container/i })).toBeInTheDocument()
    })
  })
})
