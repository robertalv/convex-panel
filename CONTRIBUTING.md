# Contributing to Convex Panel

Thank you for your interest in contributing to Convex Panel! This document provides guidelines and instructions for contributing to the monorepo.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Repository Structure](#repository-structure)
- [Development Workflow](#development-workflow)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone. Please be kind, constructive, and professional in all interactions.

## Getting Started

### Prerequisites

- **Node.js** (LTS version recommended)
- **pnpm** (v10.24.0 or later) - Install globally with `npm install -g pnpm`
- **Git** for version control

### Setting Up the Development Environment

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/convex-panel.git
   cd convex-panel
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/robertalv/convex-panel.git
   ```
4. **Install dependencies**:
   ```bash
   pnpm install
   ```
5. **Build all packages**:
   ```bash
   pnpm build
   ```

## Repository Structure

This is a monorepo managed with [Turborepo](https://turbo.build/repo) and pnpm workspaces:

```
convex-panel/
├── apps/
│   ├── chrome-extension    # Chrome browser extension
│   ├── edge-extension      # Edge browser extension
│   ├── firefox-extension   # Firefox browser extension
│   ├── desktop             # Desktop application
│   ├── dev-server          # Development server
│   └── web                 # Web application
├── packages/
│   ├── panel               # Core @convex-panel React component
│   ├── shared              # @convex-panel/shared utilities and types
│   ├── convex-component    # @convex-panel/convex-component server-side
│   └── backend             # Backend utilities
├── turbo.json              # Turborepo configuration
└── pnpm-workspace.yaml     # pnpm workspace configuration
```

## Development Workflow

### Running the Development Server

```bash
# Start development mode for all packages
pnpm dev

# Start only the panel and related packages
pnpm dev:panel-only
```

### Available Commands

| Command | Description |
|---------|-------------|
| `pnpm build` | Build all packages |
| `pnpm dev` | Start development server |
| `pnpm lint` | Lint all packages |
| `pnpm test` | Run tests |
| `pnpm clean` | Clean build artifacts |
| `pnpm format` | Format code with Prettier |

### Working on Specific Packages

When working on a specific package, you can use Turborepo's filtering:

```bash
# Build only the panel package
pnpm build --filter=@convex-panel

# Run dev for panel and its dependencies
pnpm dev --filter=@convex-panel...
```

## Submitting Changes

### Creating a Branch

Create a descriptive branch from `main`:

```bash
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### Branch Naming Conventions

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or modifications
- `chore/` - Maintenance tasks

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Ensure strict type checking passes
- Avoid using `any` unless absolutely necessary
- Export types and interfaces that may be useful to consumers

### React

- Use functional components with hooks
- Follow React best practices for performance (memoization, etc.)
- Keep components focused and composable

### Styling

- Use Tailwind CSS for styling in the panel package
- Follow existing styling patterns in the codebase

### Code Formatting

This project uses Prettier for code formatting. Run before committing:

```bash
pnpm format
```

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) for clear and consistent commit messages.

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, semicolons, etc.)
- `refactor` - Code refactoring without feature changes
- `test` - Adding or updating tests
- `chore` - Maintenance tasks, dependency updates

### Examples

```
feat(panel): add new log filtering options
fix(chrome-extension): resolve popup display issue
docs: update README with new installation steps
refactor(shared): improve type definitions
```

## Pull Request Process

1. **Ensure your code builds** - Run `pnpm build` to verify
2. **Run linting** - Run `pnpm lint` and fix any issues
3. **Format your code** - Run `pnpm format`
4. **Test your changes** - Run `pnpm test` if applicable
5. **Update documentation** if your changes affect user-facing features
6. **Push your branch** to your fork
7. **Create a Pull Request** against the `main` branch

### PR Title

Follow the same conventions as commit messages:
```
feat(panel): add support for custom themes
```

### PR Description

Please include:
- A clear description of the changes
- The motivation and context
- Any breaking changes
- Screenshots for UI changes (if applicable)
- Related issue numbers (use `Closes #123` or `Fixes #123`)

### Review Process

- All PRs require at least one approval before merging
- Address review feedback promptly
- Keep PRs focused and reasonably sized
- Turborepo will automatically rebuild dependent packages

## Reporting Issues

### Bug Reports

When reporting bugs, please include:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Environment details (OS, browser, Node version)
- Screenshots or error logs if applicable

### Feature Requests

When requesting features:
- Describe the use case
- Explain why this would be valuable
- Consider if it could be implemented as a plugin/extension

## Getting Help

- **GitHub Issues** - For bugs and feature requests
- **Discussions** - For questions and general discussion
- **Pull Requests** - For code contributions

## License

By contributing to Convex Panel, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Convex Panel! 🎉

