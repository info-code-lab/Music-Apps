# Overview

Harmony is a modern music streaming application built with a full-stack TypeScript architecture. The application allows users to browse, search, upload, and play music tracks with a clean, responsive interface. It features a Spotify-like design with support for multiple music categories, file uploads, URL-based track uploads, and real-time audio playback.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **UI Framework**: Radix UI components with shadcn/ui design system for consistent, accessible components
- **Styling**: Tailwind CSS with custom CSS variables for theming and responsive design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Audio Handling**: Custom audio player hook using HTML5 Audio API for music playback
- **File Handling**: Custom utilities for audio file validation and metadata parsing

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **API Design**: RESTful API with structured route handlers
- **File Upload**: Multer middleware for handling audio file uploads with validation
- **Storage Layer**: Abstracted storage interface with in-memory implementation for development
- **Development Setup**: Vite integration for seamless full-stack development

## Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Design**: 
  - Tracks table with metadata (title, artist, category, duration, artwork, favorites)
  - Users table for authentication support
  - UUID primary keys with PostgreSQL's gen_random_uuid()
- **Migrations**: Drizzle Kit for database schema management
- **Connection**: Neon Database serverless PostgreSQL for cloud hosting

## Authentication and Authorization
- **Framework**: Basic user schema prepared for future authentication implementation
- **Session Management**: Express session middleware configured with PostgreSQL session store
- **Security**: Input validation using Zod schemas and type-safe API requests

## API Structure
- **Track Management**: Full CRUD operations for music tracks
- **Search**: Text-based search across track titles and artists
- **Categories**: Genre-based filtering (Jazz, Electronic, Classical, Rock, Folk, Hip-Hop)
- **File Upload**: Support for MP3, WAV, and FLAC files up to 50MB
- **URL Upload**: External music URL integration
- **Favorites**: Toggle favorite status for tracks

## Development Tools
- **Build System**: ESBuild for production builds with Node.js compatibility
- **Type Safety**: Shared TypeScript types between client and server
- **Development**: Hot reload with Vite and automatic server restart
- **Code Quality**: TypeScript strict mode and path aliases for clean imports

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL dialect

## UI Component Libraries
- **Radix UI**: Headless, accessible component primitives for complex UI elements
- **shadcn/ui**: Pre-styled component library built on Radix UI
- **Lucide React**: Consistent icon library for UI elements

## Development Tools
- **Vite**: Fast build tool with React plugin and runtime error overlay
- **TanStack Query**: Server state management with caching and synchronization
- **Wouter**: Lightweight routing library for React applications
- **Tailwind CSS**: Utility-first CSS framework with custom theming

## File Processing
- **Multer**: Express middleware for handling multipart/form-data file uploads
- **Audio Validation**: Custom utilities for validating audio file types and sizes

## Deployment
- **Replit Integration**: Development environment with cartographer plugin for debugging
- **Static Assets**: Vite build system with proper asset handling and optimization
