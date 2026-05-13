# Frontend Tests

Comprehensive test suite for the QuickHost frontend using Jest and React Testing Library.

## Test Structure

```
__tests__/
├── api/                          # API endpoint tests
│   ├── health.test.ts           # GET /api/health
│   ├── projects.test.ts         # POST/GET /api/projects
│   ├── projectById.test.ts      # GET/DELETE /api/projects/[id]
│   ├── projectActions.test.ts   # POST /api/projects/[id]/[action]
│   └── projectLogs.test.ts      # GET /api/projects/[id]/logs
├── components/                   # React component tests
│   ├── ProjectForm.test.tsx     # Project creation form
│   ├── ProjectCard.test.tsx     # Project status card
│   └── ProjectList.test.tsx     # Project list with filtering
├── pages/                        # Page component tests
│   ├── index.test.tsx           # Homepage
│   ├── projects.test.tsx        # Projects dashboard
│   └── projectDetails.test.tsx  # Project details page
├── lib/                          # Utility function tests
│   └── validation.test.ts       # Input validation functions
├── test-utils.tsx              # Test utilities and custom render
└── README.md                   # This file
```

## Running Tests

### Watch Mode (Development)
```bash
npm test
```

Runs tests in watch mode, re-running tests when files change.

### Single Run (CI/CD)
```bash
npm run test:ci
```

Runs all tests once with coverage reporting. Used in CI/CD pipelines.

### Coverage Report
```bash
npm run test:coverage
```

Generates detailed coverage report showing which parts of the code are tested.

## Test Coverage

Current coverage targets:
- **Statements**: 50%+
- **Branches**: 50%+
- **Functions**: 50%+
- **Lines**: 50%+

Coverage is measured for:
- `pages/**/*.{js,jsx,ts,tsx}`
- `components/**/*.{js,jsx,ts,tsx}`
- `lib/**/*.{js,jsx,ts,tsx}`

## Writing New Tests

### Component Test Template

```typescript
import { render, screen } from '@/__tests__/test-utils'
import MyComponent from '@/components/MyComponent'

describe('MyComponent', () => {
  it('should render properly', () => {
    render(<MyComponent />)
    expect(screen.getByText('text')).toBeInTheDocument()
  })
})
```

### API Test Template

```typescript
import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/endpoint'

describe('/api/endpoint', () => {
  it('should handle GET request', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
  })
})
```

## Key Testing Utilities

### Custom Render Function
```typescript
import { render, screen } from '@/__tests__/test-utils'
```

Wraps components with providers and simplifies testing setup.

### User Interaction
```typescript
import userEvent from '@testing-library/user-event'

await userEvent.type(input, 'text')
await userEvent.click(button)
```

### Async Waiting
```typescript
import { waitFor } from '@/__tests__/test-utils'

await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument()
})
```

## Test Organization Guidelines

### Unit Tests (50% of tests)
- Test individual functions in `lib/validation.ts`
- Test component rendering with different props
- Test API endpoint parameter validation

### Integration Tests (40% of tests)
- Test form submission workflows
- Test API endpoints with mocked services
- Test component interactions with user events

### E2E-style Tests (10% of tests)
- Test full page workflows
- Test navigation between pages
- Test complete project creation flow

## Mocking Strategy

### Next.js Router
```typescript
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: {},
    pathname: '/',
  }),
}))
```

### API Calls
```typescript
global.fetch = jest.fn()

beforeEach(() => {
  ;(global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => mockData,
  })
})
```

### Services
```typescript
jest.mock('@/lib/project-service', () => ({
  projectService: {
    createProject: jest.fn(),
  },
}))
```

## Best Practices

1. **Descriptive Test Names**: Use clear, descriptive names for test suites and cases
2. **AAA Pattern**: Arrange → Act → Assert
3. **Single Responsibility**: Each test should verify one thing
4. **Mock External Dependencies**: Mock API calls, router, external services
5. **Test User Behavior**: Focus on what users see and interact with
6. **Avoid Implementation Details**: Test behavior, not internal state
7. **Use Data Attributes**: Add `data-testid` for hard-to-select elements
8. **Keep Tests Isolated**: Each test should be independent

## Common Testing Patterns

### Testing Form Submission
```typescript
it('should submit form', async () => {
  const user = userEvent.setup()
  render(<ProjectForm />)

  await user.type(screen.getByLabelText(/name/i), 'myproject')
  await user.click(screen.getByRole('button', { name: /submit/i }))

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith('/api/projects', expect.any(Object))
  })
})
```

### Testing Component State Changes
```typescript
it('should toggle status', async () => {
  const user = userEvent.setup()
  render(<ProjectCard project={mockProject} />)

  expect(screen.getByText('Running')).toBeInTheDocument()
  
  await user.click(screen.getByText('Stop'))
  
  await waitFor(() => {
    expect(screen.getByText('Stopped')).toBeInTheDocument()
  })
})
```

### Testing Error Handling
```typescript
it('should display error message', async () => {
  ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))
  
  render(<MyComponent />)
  
  await waitFor(() => {
    expect(screen.getByText(/error|failed/i)).toBeInTheDocument()
  })
})
```

## Debugging Tests

### View Rendered HTML
```typescript
const { debug } = render(<Component />)
debug() // Prints DOM to console
```

### Use screen.logTestingPlaygroundURL()
```typescript
import { screen } from '@testing-library/react'

screen.logTestingPlaygroundURL() // Generates query selectors
```

### Run Single Test
```bash
npm test -- ProjectForm.test.tsx
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="form validation"
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run tests
  run: npm run test:ci

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
```

### Pre-commit Hook
Add to `.husky/pre-commit`:
```bash
npm run test:ci
```

## Troubleshooting

### Tests Timeout
- Increase Jest timeout: `jest.setTimeout(10000)`
- Check for infinite loops or unresolved promises

### Mock Not Applied
- Ensure mock is before imports: place `jest.mock()` at top of file
- Check mock path matches exactly

### Component Not Rendering
- Check mock setup for routing/providers
- Verify all required props are passed

### Async Issues
- Use `waitFor` for async state updates
- Ensure `async/await` is properly used

## Performance Tips

1. **Mock Expensive Operations**: Mock API calls, large computations
2. **Use Shallow Rendering**: When deep render not needed
3. **Batch Tests**: Group related tests in `describe` blocks
4. **Clean Up**: Always clean up timers and mocks between tests

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library Docs](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [node-mocks-http](https://github.com/howardabrams/node-mocks-http)

## Contributing

When adding new features:
1. Write tests first (TDD) or alongside implementation
2. Maintain >50% coverage threshold
3. Follow existing test patterns
4. Update this README if adding new test categories
5. Run `npm run test:coverage` before committing

---

**Last Updated**: May 13, 2026  
**Test Framework**: Jest 29.7.0  
**Testing Library**: React Testing Library 14.0.0
