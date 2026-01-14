---
title: "Movie Ranking"
description: "A full-stack movie ranking application where users can register, add movies, and rank them on a 1-5 scale."
technologies: ["React", "TypeScript", "FastAPI", "PostgreSQL", "Docker"]
github: "https://github.com/srmccray/movie-ranking"
featured: true
order: 2
---

## Overview

A full-stack movie ranking application. Users can register, log in, add movies, and rank them on a 1-5 scale. Features JWT authentication, responsive design, and a clean API.

## Technical Details

- **Frontend**: React 18 with TypeScript, Vite, React Router
- **Backend**: FastAPI with async SQLAlchemy 2.0
- **Database**: PostgreSQL with Alembic migrations
- **Authentication**: JWT with bcrypt password hashing
- **Infrastructure**: Docker Compose for local development

## Features

- User registration and login
- Add movies with title and optional year
- Rank movies 1-5 (re-ranking updates existing)
- Paginated rankings list
- Interactive API documentation (Swagger UI)
