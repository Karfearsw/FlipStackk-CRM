# Contributing to FlipStackk CRM

Thank you for your interest in contributing to FlipStackk CRM! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Respect differing viewpoints and experiences
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Git
- Basic knowledge of TypeScript, React, and Next.js

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/flipstackk-crm.git
   cd flipstackk-crm
   ```

3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/original-org/flipstackk-crm.git
   ```

## Development Setup

### Environment Configuration

1. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

2. Configure your local environment variables in `.env.local`

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up the database:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Database Setup

The project uses PostgreSQL with Drizzle ORM. For local development:

1. Install PostgreSQL locally or use Docker:
   ```bash
   docker run --name flipstackk-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
   ```

2. Update your `DATABASE_URL` in `.env.local`

3. Run database migrations:
   ```bash
   npm run db:push
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names:
- `feature/add-whatsapp-templates`
- `bugfix/fix-message-encryption`
- `docs/update-api-documentation`
- `refactor/optimize-lead-queries`

### Commit Messages

Follow conventional commits:
```
feat: add WhatsApp template management
fix: resolve message encryption issue
docs: update API documentation
refactor: optimize database queries
test: add unit tests for lead service
```

### Development Process

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Test your changes** thoroughly

4. **Update documentation** if necessary

5. **Commit your changes** with clear commit messages

6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request** on GitHub

## Coding Standards

### TypeScript Guidelines

- Use strict TypeScript configuration
- Define explicit return types for functions
- Use interfaces over type aliases when possible
- Avoid `any` type - use `unknown` or proper typing
- Use optional chaining and nullish coalescing

### React/Next.js Guidelines

- Use functional components with hooks
- Follow React best practices for performance
- Use Next.js App Router patterns
- Implement proper error boundaries
- Use proper loading states

### Code Organization

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── communication/     # Communication hub page
├── components/            # React components
│   ├── communication/     # Messaging components
│   └── ui/               # UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── encryption/        # Encryption utilities
│   ├── whatsapp/        # WhatsApp integration
│   └── discord/         # Discord integration
├── db/                    # Database schema and types
└── types/                 # TypeScript type definitions
```

### Naming Conventions

- **Components**: PascalCase (e.g., `CommunicationHub`)
- **Functions/Variables**: camelCase (e.g., `getUserChannels`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_MESSAGE_LENGTH`)
- **Files**: kebab-case for components, camelCase for utilities
- **Database tables**: snake_case (e.g., `channel_members`)

### Code Quality

- Keep functions small and focused (max ~50 lines)
- Use meaningful variable and function names
- Add comments for complex logic
- Handle errors gracefully
- Use early returns to reduce nesting

## Testing Guidelines

### Test Structure

```typescript
// Component test example
describe('CommunicationHub', () => {
  it('should render without crashing', () => {
    render(<CommunicationHub />);
  });

  it('should display channels when loaded', async () => {
    const { getByText } = render(<CommunicationHub />);
    await waitFor(() => {
      expect(getByText('General')).toBeInTheDocument();
    });
  });
});
```

### Testing Best Practices

- Write tests for all new features
- Test both success and error cases
- Use test data factories for consistent test data
- Mock external dependencies appropriately
- Test accessibility features
- Test responsive behavior

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- --testPathPattern=communication-hub
```

## Documentation

### Code Documentation

- Document public APIs with JSDoc comments
- Include examples in documentation
- Document complex algorithms and business logic
- Keep documentation up to date with code changes

### README Updates

Update README.md when:
- Adding new features
- Changing API endpoints
- Updating setup instructions
- Adding new environment variables

### API Documentation

- Keep OpenAPI specification up to date
- Document all request/response schemas
- Include authentication requirements
- Provide example requests and responses

## Submitting Changes

### Pull Request Process

1. **Ensure your branch is up to date**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks**:
   ```bash
   npm run lint
   npm run type-check
   npm run test
   ```

3. **Create a comprehensive PR description**:
   - What changes were made
   - Why the changes were necessary
   - How to test the changes
   - Any breaking changes
   - Screenshots (if UI changes)

4. **Request review** from maintainers

5. **Address review feedback** promptly

### PR Requirements

- All tests must pass
- Code must be properly formatted
- Documentation must be updated
- No console.log statements in production code
- No commented-out code
- Follow accessibility guidelines

### Review Criteria

Reviewers will check for:
- Code quality and readability
- Performance implications
- Security considerations
- Test coverage
- Documentation completeness
- Breaking changes
- Backward compatibility

## Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality
- **PATCH** version for backwards-compatible bug fixes

### Release Steps

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create release notes
4. Tag the release
5. Deploy to production
6. Update documentation

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and discussions
- **Discord**: Real-time chat with contributors
- **Email**: support@flipstackk.com

### Getting Help

If you need help:
1. Check existing documentation
2. Search closed issues
3. Ask in GitHub Discussions
4. Join our Discord server

### Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- Special mentions in community updates

---

Thank you for contributing to FlipStackk CRM! Your contributions help make this project better for everyone.