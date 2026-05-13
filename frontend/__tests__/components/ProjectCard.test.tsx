import { render, screen } from '@/__tests__/test-utils'
import ProjectCard from '@/components/ProjectCard'

const mockProject = {
  id: '1',
  name: 'Test Project',
  subdomain: 'test',
  url: 'https://test.quickhost',
  status: 'running' as const,
  lastUpdated: new Date().toISOString(),
}

describe('ProjectCard', () => {
  it('should render project name and subdomain', () => {
    render(<ProjectCard project={mockProject} />)
    expect(screen.getByText('Test Project')).toBeInTheDocument()
    expect(screen.getByText('test')).toBeInTheDocument()
  })

  it('should display running status badge', () => {
    render(<ProjectCard project={mockProject} />)
    expect(screen.getByText('running')).toBeInTheDocument()
  })

  it('should display stopped status badge', () => {
    render(
      <ProjectCard project={{ ...mockProject, status: 'stopped' }} />
    )
    expect(screen.getByText('stopped')).toBeInTheDocument()
  })

  it('should display building status badge', () => {
    render(
      <ProjectCard project={{ ...mockProject, status: 'building' }} />
    )
    expect(screen.getByText('building')).toBeInTheDocument()
  })

  it('should display error status badge', () => {
    render(
      <ProjectCard project={{ ...mockProject, status: 'error' }} />
    )
    expect(screen.getByText('error')).toBeInTheDocument()
  })

  it('should display URL link to live project', () => {
    render(<ProjectCard project={mockProject} />)
    const link = screen.getByRole('link', { name: 'https://test.quickhost' })
    expect(link).toHaveAttribute('href', 'https://test.quickhost')
  })

  it('should display details button', () => {
    render(<ProjectCard project={mockProject} />)
    expect(screen.getByText('Details')).toBeInTheDocument()
  })

  it('should display last updated time', () => {
    render(<ProjectCard project={mockProject} />)
    expect(screen.getByText(/now|ago/)).toBeInTheDocument()
  })

  it('should handle pending status', () => {
    render(
      <ProjectCard project={{ ...mockProject, status: 'pending' }} />
    )
    expect(screen.getByText('pending')).toBeInTheDocument()
  })
})
