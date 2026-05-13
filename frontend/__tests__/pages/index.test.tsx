import { render, screen } from '@/__tests__/test-utils'
import Home from '@/pages/index'

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: {},
    pathname: '/',
  }),
}))

describe('Homepage', () => {
  it('should render the page title', () => {
    render(<Home />)
    expect(screen.getByRole('heading', { name: /self-hosted web platform/i })).toBeInTheDocument()
  })

  it('should have a CTA button to projects', () => {
    render(<Home />)
    const ctaButtons = screen.getAllByRole('link', { name: /projects|get started|deploy/i })
    expect(ctaButtons.length).toBeGreaterThan(0)
  })

  it('should display features section', () => {
    render(<Home />)
    expect(screen.getByRole('heading', { name: /instant deployment/i })).toBeInTheDocument()
  })

  it('should display how it works section', () => {
    render(<Home />)
    expect(screen.getByRole('heading', { name: /how it works/i })).toBeInTheDocument()
  })

  it('should have responsive layout', () => {
    const { container } = render(<Home />)
    expect(container.querySelector('[class*="flex"]')).toBeInTheDocument()
  })

  it('should display hero section', () => {
    render(<Home />)
    expect(screen.getByText(/zero manual intervention required/i)).toBeInTheDocument()
  })
})
