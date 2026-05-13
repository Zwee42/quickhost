import validation from '@/lib/validation'

describe('Validation Utilities', () => {
  describe('isValidSubdomain', () => {
    it('should accept valid subdomains', () => {
      expect(validation.isValidSubdomain('myproject')).toBe(true)
      expect(validation.isValidSubdomain('my-project')).toBe(true)
      expect(validation.isValidSubdomain('project123')).toBe(true)
      expect(validation.isValidSubdomain('a')).toBe(true)
    })

    it('should reject invalid subdomains', () => {
      expect(validation.isValidSubdomain('My-Project')).toBe(false) // uppercase
      expect(validation.isValidSubdomain('-project')).toBe(false) // starts with dash
      expect(validation.isValidSubdomain('project-')).toBe(false) // ends with dash
      expect(validation.isValidSubdomain('my project')).toBe(false) // spaces
      expect(validation.isValidSubdomain('my_project')).toBe(false) // underscore
      expect(validation.isValidSubdomain('')).toBe(false) // empty
    })

    it('should handle edge cases', () => {
      expect(validation.isValidSubdomain('a'.repeat(63))).toBe(true) // max length
      expect(validation.isValidSubdomain('a'.repeat(64))).toBe(false) // too long
    })
  })

  describe('isValidGitUrl', () => {
    it('should accept valid GitHub HTTPS URLs', () => {
      expect(
        validation.isValidGitUrl('https://github.com/user/repo.git')
      ).toBe(true)
      expect(
        validation.isValidGitUrl('https://github.com/user/repo')
      ).toBe(true)
    })

    it('should accept valid GitLab HTTPS URLs', () => {
      expect(
        validation.isValidGitUrl('https://gitlab.com/user/repo.git')
      ).toBe(true)
      expect(
        validation.isValidGitUrl('https://gitlab.com/user/repo')
      ).toBe(true)
    })

    it('should accept valid SSH URLs', () => {
      expect(validation.isValidGitUrl('git@github.com:user/repo.git')).toBe(
        true
      )
      expect(validation.isValidGitUrl('git@gitlab.com:user/repo.git')).toBe(
        true
      )
    })

    it('should reject invalid URLs', () => {
      expect(validation.isValidGitUrl('not-a-git-url')).toBe(false)
      expect(validation.isValidGitUrl('http://github.com/user/repo')).toBe(
        false
      )
      expect(validation.isValidGitUrl('')).toBe(false)
    })
  })

  describe('isValidProjectName', () => {
    it('should accept valid project names', () => {
      expect(validation.isValidProjectName('myproject')).toBe(true)
      expect(validation.isValidProjectName('my-project')).toBe(true)
      expect(validation.isValidProjectName('my_project')).toBe(true)
      expect(validation.isValidProjectName('project123')).toBe(true)
      expect(validation.isValidProjectName('a'.repeat(50))).toBe(true)
    })

    it('should reject invalid project names', () => {
      expect(validation.isValidProjectName('ab')).toBe(false) // too short
      expect(validation.isValidProjectName('a'.repeat(51))).toBe(false) // too long
      expect(validation.isValidProjectName('my project')).toBe(false) // spaces
      expect(validation.isValidProjectName('')).toBe(false) // empty
    })
  })

  describe('sanitizeInput', () => {
    it('should remove dangerous characters', () => {
      expect(validation.sanitizeInput('hello<script>')).toBe('helloscript')
      expect(validation.sanitizeInput('test"value')).toBe('testvalue')
      expect(validation.sanitizeInput("test'value")).toBe('testvalue')
      expect(validation.sanitizeInput('test`value')).toBe('testvalue')
    })

    it('should trim whitespace', () => {
      expect(validation.sanitizeInput('  hello  ')).toBe('hello')
      expect(validation.sanitizeInput('\thello\n')).toBe('hello')
    })

    it('should limit length', () => {
      const input = 'a'.repeat(500)
      const result = validation.sanitizeInput(input)
      expect(result.length).toBeLessThanOrEqual(256)
    })
  })

  describe('parseGitUrl', () => {
    it('should parse GitHub HTTPS URLs', () => {
      const result = validation.parseGitUrl('https://github.com/user/repo')
      expect(result.provider).toBe('github')
      expect(result.owner).toBe('user')
      expect(result.repo).toBe('repo')
    })

    it('should parse GitLab HTTPS URLs', () => {
      const result = validation.parseGitUrl('https://gitlab.com/user/repo')
      expect(result.provider).toBe('gitlab')
      expect(result.owner).toBe('user')
      expect(result.repo).toBe('repo')
    })

    it('should parse SSH URLs', () => {
      const result = validation.parseGitUrl('git@github.com:user/repo.git')
      expect(result.provider).toBe('github')
      expect(result.owner).toBe('user')
      expect(result.repo).toBe('repo')
    })

    it('should return null for invalid URLs', () => {
      expect(validation.parseGitUrl('not-a-url')).toBeNull()
      expect(validation.parseGitUrl('')).toBeNull()
    })
  })
})
