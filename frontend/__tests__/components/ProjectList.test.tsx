import { render, screen, waitFor } from '@/__tests__/test-utils'
import ProjectList from '@/components/ProjectList'

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: {},
    pathname: '/projects',
  }),
}))

global.fetch = jest.fn()

const mockProjects = [
  {
    id: '1',
    name: 'Project 1',
    subdomain: 'project1',
    url: 'https://project1.example.com',
    status: 'running' as const,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Project 2',
    subdomain: 'project2',
    url: 'https://project2.example.com',
    status: 'stopped' as const,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Project 3',
    subdomain: 'project3',
    url: 'https://project3.example.com',
    status: 'building' as const,
    lastUpdated: new Date().toISOString(),
  },
]

describe('ProjectList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockProjects,
    })
  })

  it('should render status cards with correct counts', async () => {
    render(<ProjectList />)

    await waitFor(() => {
      expect(screen.getByText('Running').previousElementSibling).toHaveTextContent('1')
      expect(screen.getByText('Stopped').previousElementSibling).toHaveTextContent('1')
      expect(screen.getByText('Building').previousElementSibling).toHaveTextContent('1')
      expect(screen.getByText('Errors').previousElementSibling).toHaveTextContent('0')
    })
  })

  it('should render all projects', async () => {
    render(<ProjectList />)

    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument()
      expect(screen.getByText('Project 2')).toBeInTheDocument()
      expect(screen.getByText('Project 3')).toBeInTheDocument()
    })
  })

  it('should filter projects by status', async () => {
    render(<ProjectList />)

    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument()
    })

    const runningFilter = screen.getByRole('button', { name: /running/i })
    runningFilter.click()

    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument()
      expect(screen.queryByText('Project 2')).not.toBeInTheDocument()
    })
  })

  it('should auto-refresh projects', async () => {
    jest.useFakeTimers()
    render(<ProjectList />)

    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument()
    })

    const initialCallCount = (global.fetch as jest.Mock).mock.calls.length

    jest.advanceTimersByTime(10000) // 10 seconds

    await waitFor(() => {
      expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(
        initialCallCount
      )
    })

    jest.useRealTimers()
  })

  it('should display empty state when no projects', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    render(<ProjectList />)

    await waitFor(() => {
      expect(
        screen.getByText(/no projects yet|create your first/i)
      ).toBeInTheDocument()
    })
  })

  it('should handle fetch errors', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Failed to fetch')
    )

    render(<ProjectList />)

    await waitFor(() => {
      expect(screen.getByText(/error loading projects/i)).toBeInTheDocument()
    })
  })

  it('should have manual refresh button', async () => {
    render(<ProjectList />)

    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument()
    })

    const refreshButtons = screen.getAllByTitle(/refresh status/i)
    expect(refreshButtons.length).toBeGreaterThan(0)
  })

  it('should render filter tabs for all statuses', async () => {
    render(<ProjectList />)

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /^all$/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /running/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /stopped/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /error/i })
      ).toBeInTheDocument()
    })
  })

  it('should render project cards in grid layout', async () => {
    render(<ProjectList />)

    await waitFor(() => {
      const projectCards = screen.getAllByText(/details/i)
      expect(projectCards.length).toBe(3)
    })
  })
})
