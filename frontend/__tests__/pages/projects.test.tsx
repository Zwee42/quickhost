import { render, screen, waitFor } from '@/__tests__/test-utils'
import ProjectsPage from '@/pages/projects/index'

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: {},
    pathname: '/projects',
  }),
}))

global.fetch = jest.fn()

describe('Projects Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    })
  })

  it('should render page title', () => {
    render(<ProjectsPage />)
    expect(screen.getByRole('heading', { name: /^projects$/i })).toBeInTheDocument()
  })

  it('should have tab navigation', async () => {
    render(<ProjectsPage />)
    
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /all projects/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /create/i })
      ).toBeInTheDocument()
    })
  })

  it('should render projects list tab by default', async () => {
    render(<ProjectsPage />)
    
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /all projects/i })
      ).toHaveClass('text-blue-400')
    })
  })

  it('should switch to create tab when clicked', async () => {
    const { getByRole } = render(<ProjectsPage />)
    
    const createTab = await waitFor(() =>
      getByRole('button', { name: /create/i })
    )
    
    createTab.click()

    await waitFor(() => {
      expect(screen.getByLabelText(/project name/i)).toBeInTheDocument()
    })
  })

  it('should display projects list on projects tab', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: '1',
          name: 'Project 1',
          status: 'running',
          subdomain: 'project1',
          containerPort: 5000,
          updatedAt: new Date().getTime(),
        },
      ],
    })

    render(<ProjectsPage />)

    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument()
    })
  })

  it('should display create form on create tab', async () => {
    render(<ProjectsPage />)

    const createTab = screen.getByRole('button', { name: /create/i })
    createTab.click()

    await waitFor(() => {
      expect(screen.getByLabelText(/project name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/git repository/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/subdomain/i)).toBeInTheDocument()
    })
  })

  it('should have proper page layout', () => {
    const { container } = render(<ProjectsPage />)
    
    expect(
      container.querySelector('main') || container.querySelector('[role="main"]')
    ).toBeInTheDocument()
  })

  it('should handle empty projects list', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    render(<ProjectsPage />)

    await waitFor(() => {
      expect(
        screen.getByText(/no projects|create your first/i)
      ).toBeInTheDocument()
    })
  })
})
