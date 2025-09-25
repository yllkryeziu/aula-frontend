# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend Development
- **Start dev server**: `npm run dev`
- **Install dependencies**: `npm install`
- **Build**: `npm run build`
- **Build (development mode)**: `npm run build:dev`
- **Lint**: `npm run lint`
- **Preview build**: `npm run preview`

## Architecture Overview

This is the frontend for **Aula**, an AI-powered educational platform that transforms PDF documents into interactive learning experiences with AI-generated videos. This React application connects to a separate FastAPI backend.

### Frontend Architecture

**Technology Stack**:
- React 18 + TypeScript + Vite
- shadcn/ui components (Radix UI based)
- Tailwind CSS for styling
- React Router for routing
- TanStack Query for API state management

**Key Components**:
- **`src/main.tsx`**: Application entry point with React 18 createRoot
- **`src/App.tsx`**: Main app component with routing, query client, and toast providers
- **`src/pages/Dashboard.tsx`**: Landing page showing syllabi list and creation
- **`src/pages/SyllabusDetail.tsx`**: Individual syllabus view with chapters
- **`src/lib/api.ts`**: Complete API client with TypeScript interfaces (317 LOC)
- **`src/hooks/useApi.ts`**: React Query hooks for API operations (387 LOC)
- **`src/components/ui/`**: shadcn/ui component library

**Application Flow**:
1. **Dashboard** → Display syllabi with status badges (Ready/Processing/Created/Failed)
2. **Syllabus Creation** → Modal form creates syllabus and navigates to detail page
3. **Syllabus Detail** → Shows chapters, documents, and video generation controls
4. **Chapter Management** → Open chapters to generate subchapters and videos
5. **Video Streaming** → Video player components with progress tracking

## Environment Configuration

```bash
VITE_API_BASE_URL=http://localhost:8000
```

## Key Development Patterns

### API Integration
- **Centralized API Client**: All backend communication through `src/lib/api.ts`
- **Type Safety**: TypeScript interfaces match backend Pydantic models
- **React Query**: Comprehensive hooks in `useApi.ts` handle caching, error states, loading
- **Toast Notifications**: User feedback for API operations (success/error states)

### Component Architecture
- **shadcn/ui**: Pre-built accessible components in `src/components/ui/`
- **Custom Hooks**: API operations abstracted into reusable hooks
- **Loading States**: Consistent loading UI patterns across components
- **Error Boundaries**: Graceful error handling with user-friendly messages

### State Management
- **TanStack Query**: Server state management with caching and sync
- **Local State**: React hooks for UI state (modals, forms, selections)
- **URL State**: React Router for navigation and deep linking

### Video Generation Workflow
- **Sequential Processing**: Videos generated one-by-one to prevent conflicts
- **Real-time Updates**: Polling hooks for video generation status
- **Progress Tracking**: Visual indicators for multi-stage video pipeline
- **Media Streaming**: Direct video/audio streaming from backend endpoints

## Backend Integration

This frontend connects to a FastAPI backend with the following key endpoints:
- **Syllabi Management**: `/api/v1/syllabi/` (CRUD operations)
- **Document Upload**: `/api/v1/syllabi/{id}/documents` (PDF processing)
- **Chapter Generation**: `/api/v1/syllabi/{id}/generate-chapters` (AI chapter creation)
- **Video Generation**: `/api/v1/video/chapters/{id}/generate-videos` (6-stage AI pipeline)
- **Media Streaming**: `/api/v1/subchapters/{id}/video` and `/audio` endpoints
- **Progress Monitoring**: Real-time status endpoints for generation tracking