# Technology Stack

## Overview

Acero Applications is built on a modern, full-stack JavaScript/TypeScript technology stack. This document outlines the key technologies, frameworks, libraries, and tools used throughout the application.

## Frontend Technologies

### Core Framework
- **Next.js**: A React framework providing server-side rendering, static site generation, API routes, and optimized production builds (Version 15.0.3)
- **React**: JavaScript library for building user interfaces (Version 18.3.1)
- **TypeScript**: Typed JavaScript at scale, providing improved developer experience and code reliability (Version 5)

### UI Components and Styling
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development (Version 3.4.1)
- **Shadcn UI**: A collection of reusable components built on Radix UI
- **Radix UI**: Low-level, accessible component primitives for building design systems and web applications
- **Lucide React**: Icon library with a consistent design system
- **Framer Motion**: Library for animations and transitions
- **Tailwind Merge**: Utility for merging Tailwind CSS classes

### State Management
- **Redux Toolkit**: State management library based on Redux with simplified API (Version 2.3.0)
- **React Redux**: Official React bindings for Redux (Version 9.1.2)
- **Zustand**: Lightweight state management library (Version 5.0.5)

### Form Management
- **React Hook Form**: Performant, flexible and extensible form library (Version 7.54.2)
- **Zod**: TypeScript-first schema validation with static type inference (Version 3.24.2)
- **@hookform/resolvers**: Resolvers for React Hook Form (Version 4.1.3)

### Data Visualization
- **Recharts**: Composable charting library built on React components (Version 2.15.1)
- **ReactFlow**: Library for building node-based interfaces (Version 11.11.4)

### Data Grid and Tables
- **TanStack Table**: Headless UI for building powerful tables and datagrids (Version 8.20.6)

### Date and Time
- **Date-fns**: Modern JavaScript date utility library (Version 3.6.0)
- **Moment.js**: Library for parsing, validating, manipulating, and formatting dates (Version 2.30.1)
- **React Day Picker**: Flexible date picker component (Version 8.10.1)

### Drag and Drop
- **dnd-kit**: Modern, lightweight, performant, accessible drag & drop toolkit (Version 6.3.1)
- **React Beautiful DnD**: Beautiful and accessible drag and drop for lists (Version 13.1.1)

### Notifications
- **React Toastify**: Toast notifications for React (Version 10.0.6)
- **React Hot Toast**: Lightweight toast notifications (Version 2.5.2)
- **Sonner**: An opinionated toast component for React (Version 2.0.5)

### Document Generation
- **jsPDF**: Client-side JavaScript PDF generation library (Version 2.5.2)
- **jsPDF-AutoTable**: Plugin for creating tables in jsPDF (Version 3.8.4)
- **XLSX**: Library for parsing and writing Excel files (Version 0.18.5)

## Backend Technologies

### Server Framework
- **Next.js API Routes**: Built-in API functionality in Next.js
- **Express**: Fast, unopinionated web framework for Node.js (Version 4.21.2)
- **Next Connect**: Connect/Express-like middleware for Next.js (Version 1.0.0)

### Database
- **MongoDB**: NoSQL document database (Version 7.0)
- **Mongoose**: MongoDB object modeling for Node.js (Version 8.8.2)
- **Mongoose Autopopulate**: Plugin for automatically populating mongoose relations (Version 1.1.0)

### Authentication
- **Next Auth**: Authentication solution for Next.js (Version 4.24.10)
- **bcrypt**: Library for hashing passwords (Version 5.1.1)

### File Handling
- **Multer**: Middleware for handling multipart/form-data (Version 1.4.5-lts.1)
- **Formidable**: Parser for form data, especially file uploads (Version 3.5.3)

### Email
- **Nodemailer**: Module for email sending (Version 6.9.16)
- **EJS**: Embedded JavaScript templates for email templates (Version 3.1.10)

### Real-time Communication
- **Socket.IO**: Real-time bidirectional event-based communication (Version 4.8.1)

## Development and Testing Tools

### Testing
- **Jest**: JavaScript Testing Framework (Version 29.7.0)
- **Cypress**: End-to-end testing framework (Version 13.16.0)
- **Testing Library**: Simple and complete testing utilities (React, DOM, Jest-DOM)

### Development Utilities
- **Concurrently**: Run multiple commands concurrently (Version 9.1.2)
- **ts-node**: TypeScript execution environment and REPL for Node.js (Version 10.9.2)

### Build Tools
- **Webpack**: Module bundler (Version 5.96.1)
- **PostCSS**: Tool for transforming CSS with JavaScript (Version 8)

## Development Environment

### Required Tools
- **Node.js**: JavaScript runtime (Recommended version 18.x or higher)
- **npm** or **yarn**: Package manager for Node.js
- **MongoDB**: Database server (Version 7.0)

### Development Scripts
- `npm run dev`: Start Next.js development server
- `npm run socket`: Start Socket.IO server
- `npm run dev:socket`: Start both Next.js and Socket.IO servers concurrently
- `npm run build`: Build the application for production
- `npm run start`: Start the production server
- `npm run test`: Run Jest tests
- `npm run cypress:open`: Open Cypress test runner
- `npm run e2e`: Run end-to-end tests
- `npm run component`: Run component tests

## Production Environment Requirements

### Hosting
- **Server**: Node.js environment (18.x or higher)
- **Database**: MongoDB in replica set mode
- **Storage**: File storage for uploaded media and documents
- **Environment Variables**: Proper configuration for production settings

### Performance Optimizations
- **Caching**: Optimized data caching strategies
- **CDN Integration**: For static assets and media files
- **Database Indexing**: Optimized MongoDB indices for common queries

## Security Measures

- **Authentication**: Next Auth for secure user authentication
- **Password Security**: bcrypt for password hashing
- **CORS Configuration**: Protected API endpoints
- **Input Validation**: Zod schemas for data validation
- **Environment Variables**: Secure handling of sensitive configuration
- **MongoDB Security**: Replica set with proper authentication

## Integration APIs and Services

- **Email Service**: SMTP server integration for email notifications
- **File Storage**: Local or cloud storage for media files
- **External APIs**: Integration points for third-party services
