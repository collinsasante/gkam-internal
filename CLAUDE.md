# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a customer service management application built with React + TypeScript + Vite, designed to interface with Airtable as the backend database. The application manages customer interactions, contacts, accounts, activities, tasks, and discovery call records.

## Development Commands

All commands should be run from the `frontend/` directory:

```bash
# Development server with hot module reloading
npm run dev

# Build for production (runs TypeScript compiler + Vite build)
npm run build

# Lint all files
npm run lint

# Preview production build locally
npm run preview
```

## Architecture

### Core Architecture Pattern

The application follows a **service layer pattern** with clear separation between:

1. **Data Layer** (`src/types/airtable.types.ts`) - TypeScript interfaces for all Airtable tables
2. **Service Layer** (`src/services/airtable.service.ts`) - API abstraction with generic CRUD operations
3. **Component Layer** (`src/components/`) - React components organized by feature
4. **State Management** - Local component state using React hooks (useState, useEffect)

### Airtable Integration

The application syncs with an existing Airtable base containing 7 interconnected tables:

- **Customer Contact** - Primary customer tracking table (Customer ID, Contact Name, Phone, Discovery Source, Tags)
- **Contact** - Contact records with lead status tracking
- **Account** - Business/company accounts with industry and size information
- **Activities** - Meeting, call, and activity logs
- **Tasks** - Task management linked to contacts and accounts
- **Interactions** - Customer interaction history
- **Discovery Call Records** - Detailed call notes with AI summaries and pain points

**Critical**: The service layer (`airtable.service.ts`) uses conditional parameter building to avoid passing `undefined` values to Airtable's API. Always build the `selectOptions` object conditionally:

```typescript
const selectOptions: Record<string, unknown> = {};
if (options?.filterByFormula) selectOptions.filterByFormula = options.filterByFormula;
if (options?.sort) selectOptions.sort = options.sort;
if (options?.maxRecords) selectOptions.maxRecords = options.maxRecords;
```

### Environment Configuration

Create a `frontend/.env` file with Airtable credentials:

```env
VITE_AIRTABLE_API_KEY="your_api_key"
VITE_AIRTABLE_BASE_ID="your_base_id"
```

Access in code via `import.meta.env.VITE_AIRTABLE_API_KEY` and `import.meta.env.VITE_AIRTABLE_BASE_ID`.

### Component Structure

The app uses a single-page architecture with view switching:

```
App.tsx (root)
├── Header (top navigation)
├── Sidebar (menu navigation)
└── View Router (renders active view)
    ├── Dashboard
    ├── CustomerContactsList
    ├── ContactsList
    ├── AccountsList
    ├── ActivitiesList
    ├── TasksList
    ├── InteractionsList
    └── DiscoveryCallsList
```

Views are switched via `activeView` state in `App.tsx`. The `Sidebar` component triggers view changes through the `onViewChange` callback.

### TypeScript Configuration

The project uses **strict TypeScript** settings:
- `strict: true` - All strict checks enabled
- `noUnusedLocals: true` - Error on unused variables
- `noUnusedParameters: true` - Error on unused parameters
- `noFallthroughCasesInSwitch: true` - Error on fallthrough cases
- Target: ES2022
- Module resolution: bundler mode
- JSX: react-jsx (new JSX transform)

### Legacy Assets

The `src/assets/` directory contains legacy vanilla JavaScript code from a previous implementation:

- `js/custom/apps/` - Application modules (customers, contacts, chat, inbox, user-management)
- `js/custom/utilities/modals/` - Modal utilities (create-campaign, users-search, offer-a-deal)
- `js/scripts.bundle.js` - Metronic theme core scripts
- `js/widgets.bundle.js` - Widget functionality
- `media/` - Image and media assets

These legacy modules show UI patterns and functionality that may inform future React component development, but are not currently integrated into the React app.

## Development Guidelines

### Data Type Safety

**Critical**: Always use defensive type checking when working with Airtable data:

```typescript
// Array fields - check with Array.isArray() before .map()
{Array.isArray(record.fields['Tag']) && record.fields['Tag'].map(...)}

// String fields - check with typeof before .substring() or other string methods
{record.fields['Summary'] && typeof record.fields['Summary'] === 'string' && (
  record.fields['Summary'].substring(0, 100)
)}
```

Airtable fields are dynamic and may not always match the expected type. Never assume a field is an array or string without checking first.

### Service Layer Pattern

When creating new table integrations, follow the established pattern:

1. Define TypeScript interface in `types/airtable.types.ts`
2. Create service object in `airtable.service.ts` with:
   - `getAll(options?)` - Fetch records with optional filtering/sorting
   - `getById(id)` - Fetch single record
   - `create(fields)` - Create new record
   - `update(id, fields)` - Update existing record
   - `delete(id)` - Delete record

3. Use the generic helper functions (`fetchRecords`, `createRecord`, `updateRecord`, `deleteRecord`)

### Component Development

**List Components Pattern**:
1. Use `useState` for data, loading, and error states
2. Fetch data in `useEffect` on component mount
3. Handle loading states with spinners
4. Handle error states with retry buttons
5. Provide search/filter functionality using local state
6. Display data in tables or cards

**Styling**:
- Currently the app has **no styling** - all CSS has been removed
- Class names reference Bootstrap-like utilities and Metronic theme classes (e.g., `card`, `btn-primary`, `table-row-dashed`)
- Future styling should be added through CSS files, not inline styles or CSS-in-JS

### Common Pitfalls

1. **Airtable API errors**: Never pass `undefined` to Airtable's `select()` method. Build options object conditionally.
2. **Array operations**: Always use `Array.isArray()` before calling `.map()`, `.filter()`, etc. on Airtable array fields.
3. **String operations**: Always check `typeof field === 'string'` before using `.substring()`, `.toLowerCase()`, etc.
4. **Linked records**: Airtable linked record fields return arrays of record IDs (strings), not full record objects.
5. **Environment variables**: Must be prefixed with `VITE_` to be accessible in client-side code.

### Authentication

The app currently has no authentication layer. The Airtable API key in `.env` provides database access. Future implementations should consider:
- User authentication system
- Role-based access control
- Secure API key management (backend proxy)
