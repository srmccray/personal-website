# Claude Instructions

Project-specific instructions for Claude Code.

## Commit Messages

- Do NOT include "Co-Authored-By: Claude" or any similar AI attribution in commit messages
- Write concise, conventional commit messages focused on what changed and why
- Use conventional commit format when appropriate (feat:, fix:, docs:, etc.)

## Project Context

This is a personal website for stephenmccray.com built with:
- Astro (static site generator)
- Tailwind CSS v4
- AWS CDK for infrastructure (S3 + CloudFront)
- GitHub Actions for CI/CD

## Key Directories

- `src/content/projects/` - Markdown files for project entries
- `infra/` - AWS CDK infrastructure code
- `.claude/agents/` - Specialized agent configurations
- `.claude/plans/` - Feature planning documents
