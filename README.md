# CMS Platform — Mobile App

React Native (Expo) mobile app for the Construction Management System.

## Tech Stack

- **Framework:** Expo SDK 54, Expo Router (file-based routing)
- **Language:** TypeScript
- **State:** Zustand (client), TanStack React Query v5 (server)
- **HTTP:** Axios with token refresh interceptor
- **Storage:** expo-secure-store (tokens), AsyncStorage (offline queue)
- **Forms:** React Hook Form + Zod

## Quick Start

```bash
# Install dependencies
npm install

# Start Expo dev server
npx expo start
```

Scan the QR code with Expo Go, or press `a` for Android emulator / `i` for iOS simulator.

## Environment Variables

Create `.env`:

| Variable | Default | Description |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `http://localhost:8000` | Backend API base URL |

## Project Structure

```
app/
├── _layout.tsx                # Root layout (QueryClient, ErrorBoundary)
├── index.tsx                  # Entry redirect
├── (auth)/
│   ├── login.tsx              # Login screen
│   └── change-password.tsx    # Force password change
└── (app)/
    ├── _layout.tsx            # Tab navigator
    ├── overview.tsx           # Dashboard KPIs
    ├── projects.tsx           # Project list
    ├── projects/[id].tsx      # Project detail
    ├── dpr.tsx                # Daily Progress Report
    ├── material-request.tsx   # Material Request
    ├── expense.tsx            # Expense logging
    ├── boq.tsx                # Bill of Quantities
    ├── safety.tsx             # Safety incidents & NCRs
    ├── documents.tsx          # Document browser
    ├── approvals.tsx          # Approval inbox
    └── settings.tsx           # Profile & theme
src/
├── components/                # Shared components
├── hooks/                     # React Query hooks
├── lib/                       # API client, storage, offline
└── store/                     # Zustand stores
```

## Features

- **Offline-first:** Mutations queued when offline, replayed on connectivity
- **Pull-to-refresh:** All list screens support refresh
- **Secure storage:** Tokens stored in encrypted device storage
- **Auto token refresh:** 401 responses trigger transparent token refresh
