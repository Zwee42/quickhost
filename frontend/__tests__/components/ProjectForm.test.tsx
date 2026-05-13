import { render, screen, fireEvent, waitFor } from '@/__tests__/test-utils'
import userEvent from '@testing-library/user-event'
import ProjectForm from '@/components/ProjectForm'

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: {},
    pathname: '/projects',
  }),
}))

// Mock fetch
global.fetch = jest.fn()

describe('ProjectForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: '123', status: 'pending' }),
    })
  })

  it('should render all form fields', () => {
    render(<ProjectForm />)
    expect(screen.getByLabelText(/project name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/git repository/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^branch$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/subdomain/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/enable https/i)).toBeInTheDocument()
  })

  it('should render submit button', () => {
    render(<ProjectForm />)
    expect(screen.getByRole('button', { name: /deploy/i })).toBeInTheDocument()
  })

  it('should validate project name', async () => {
    render(<ProjectForm />)
    const projectNameInput = screen.getByLabelText(/project name/i)
    
    await userEvent.type(projectNameInput, 'ab')
    expect(screen.getByText(/3-50 characters/i)).toBeInTheDocument()
  })

  it('should validate git URL', async () => {
    render(<ProjectForm />)
    const gitUrlInput = screen.getByLabelText(/git repository/i)
    
    await userEvent.type(gitUrlInput, 'not-a-git-url')
    expect(screen.getByText(/supports github, gitlab/i)).toBeInTheDocument()
  })

  it('should validate subdomain', async () => {
    render(<ProjectForm />)
    const subdomainInput = screen.getByLabelText(/subdomain/i)
    
    await userEvent.type(subdomainInput, 'My-Project')
    expect(screen.getByText(/lowercase alphanumeric/i)).toBeInTheDocument()
  })

  it('should submit form with valid data', async () => {
    const user = userEvent.setup()
    render(<ProjectForm />)

    await user.type(screen.getByLabelText(/project name/i), 'myproject')
    await user.type(
      screen.getByLabelText(/git repository/i),
      'https://github.com/user/repo'
    )
    await user.type(screen.getByLabelText(/subdomain/i), 'myproject')

    const submitButton = screen.getByRole('button', { name: /deploy/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/projects',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })
  })

  it('should disable submit button while loading', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve({ ok: true, json: async () => ({ id: '123' }) }),
            100
          )
        )
    )

    render(<ProjectForm />)

    await user.type(screen.getByLabelText(/project name/i), 'myproject')
    await user.type(
      screen.getByLabelText(/git repository/i),
      'https://github.com/user/repo'
    )
    await user.type(screen.getByLabelText(/subdomain/i), 'myproject')

    const submitButton = screen.getByRole('button', { name: /deploy/i })
    await user.click(submitButton)

    expect(submitButton).toBeDisabled()
  })

  it('should handle API errors', async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Subdomain already exists' }),
    })

    render(<ProjectForm />)

    await user.type(screen.getByLabelText(/project name/i), 'myproject')
    await user.type(
      screen.getByLabelText(/git repository/i),
      'https://github.com/user/repo'
    )
    await user.type(screen.getByLabelText(/subdomain/i), 'myproject')

    await user.click(screen.getByRole('button', { name: /deploy/i }))

    await waitFor(() => {
      expect(screen.getByText(/subdomain already exists/i)).toBeInTheDocument()
    })
  })

  it('should handle environment variables', async () => {
    render(<ProjectForm />)

    const envVarsTextarea = screen.getByPlaceholderText(/database_url/i)
    fireEvent.change(envVarsTextarea, {
      target: { value: '{"DATABASE_URL": "postgres://..."}' },
    })

    expect(envVarsTextarea).toHaveValue('{"DATABASE_URL": "postgres://..."}')
  })

  it('should toggle SSL checkbox', async () => {
    const user = userEvent.setup()
    render(<ProjectForm />)

    const sslCheckbox = screen.getByLabelText(/enable https/i) as HTMLInputElement
    expect(sslCheckbox.checked).toBe(true)

    await user.click(sslCheckbox)
    expect(sslCheckbox.checked).toBe(false)
  })

  it('should use default branch value', () => {
    render(<ProjectForm />)
    const branchInput = screen.getByLabelText(/^branch$/i) as HTMLInputElement
    expect(branchInput.value).toBe('main')
  })
})
