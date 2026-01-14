# stephenmccray.com

Personal website built with Astro and hosted on AWS.

## Tech Stack

- **Framework**: [Astro](https://astro.build/) - Static site generator
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Language**: TypeScript
- **Infrastructure**: AWS CDK (S3 + CloudFront + Route 53 + ACM)
- **CI/CD**: GitHub Actions

## Prerequisites

- Node.js 20+
- AWS CLI configured with appropriate credentials
- AWS CDK CLI (`npm install -g aws-cdk`)

## Local Development

```bash
# Install dependencies
npm install

# Start development server (http://localhost:4321)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

## Project Structure

```
├── src/
│   ├── components/        # Astro components
│   │   ├── common/        # Header, Footer, Navigation
│   │   ├── home/          # Homepage components
│   │   ├── projects/      # Project listing components
│   │   └── about/         # About page components
│   ├── content/
│   │   └── projects/      # Project markdown files
│   ├── layouts/           # Page layouts
│   ├── pages/             # Routes
│   └── styles/            # Global CSS
├── public/                # Static assets (images, favicon, etc.)
├── infra/                 # AWS CDK infrastructure code
└── .github/workflows/     # CI/CD pipeline
```

## Adding Content

### Adding a New Project

Create a markdown file in `src/content/projects/`:

```markdown
---
title: "Project Name"
description: "Brief description of the project"
technologies: ["TypeScript", "React", "AWS"]
github: "https://github.com/username/repo"
liveUrl: "https://project-url.com"
featured: true
order: 1
---

## Overview

Detailed project description here...
```

**Frontmatter fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Project name |
| `description` | string | Yes | Short description |
| `technologies` | string[] | Yes | Tech stack used |
| `github` | string | No | GitHub repository URL |
| `liveUrl` | string | No | Live demo URL |
| `featured` | boolean | No | Show on homepage (default: false) |
| `order` | number | No | Sort order (default: 0) |

## Infrastructure

The AWS infrastructure is defined in `/infra` using CDK (TypeScript).

### Resources Created

- **S3 Bucket**: Stores static site files (private, CloudFront-only access)
- **CloudFront Distribution**: CDN with HTTPS, caching, and URL rewriting
- **ACM Certificate**: SSL certificate for stephenmccray.com
- **Route 53 A Record**: DNS pointing to CloudFront
- **IAM Role**: GitHub Actions OIDC role for deployments

### First-Time Infrastructure Setup

```bash
cd infra

# Install dependencies
npm install

# Bootstrap CDK (one-time per account/region)
npx cdk bootstrap aws://ACCOUNT_ID/us-east-1

# Deploy infrastructure
npx cdk deploy
```

### Updating Infrastructure

```bash
cd infra

# Preview changes
npx cdk diff

# Deploy changes
npx cdk deploy
```

## Deployment

### Automatic (CI/CD)

Pushing to `main` triggers GitHub Actions to:
1. Build the Astro site
2. Sync files to S3
3. Invalidate CloudFront cache

**Required GitHub Secrets:**
| Secret | Description |
|--------|-------------|
| `AWS_DEPLOY_ROLE_ARN` | IAM role ARN for OIDC auth |
| `S3_BUCKET_NAME` | S3 bucket name |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID |

### Manual Deployment

```bash
# Build the site
npm run build

# Upload to S3
aws s3 sync ./dist s3://stephenmccray-com-site --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E2XRUFCE2ZILEY \
  --paths "/*"
```

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview production build

# Infrastructure (from /infra directory)
npx cdk synth            # Synthesize CloudFormation template
npx cdk diff             # Preview infrastructure changes
npx cdk deploy           # Deploy infrastructure
npx cdk destroy          # Tear down infrastructure

# Deployment
aws s3 sync ./dist s3://stephenmccray-com-site --delete
aws cloudfront create-invalidation --distribution-id E2XRUFCE2ZILEY --paths "/*"
```

## Architecture

```
                    ┌─────────────────┐
                    │    Route 53     │
                    │ stephenmccray.com│
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   CloudFront    │
                    │  Distribution   │
                    │  (CDN + HTTPS)  │
                    │                 │
                    │ URL Rewrite Fn  │
                    └────────┬────────┘
                             │ OAC
                    ┌────────▼────────┐
                    │    S3 Bucket    │
                    │   (Private)     │
                    │  Static Files   │
                    └─────────────────┘
```

## Cost

Estimated monthly cost for low-traffic personal site: **~$0.60/month**

| Service | Cost |
|---------|------|
| Route 53 Hosted Zone | $0.50 |
| S3 Storage (~50MB) | ~$0.001 |
| CloudFront (1GB transfer) | ~$0.085 |
| ACM Certificate | Free |
