# CapShop Frontend

## Overview
This React + TypeScript frontend consumes APIs through the gateway (`/gateway`) and includes customer features for addresses and notifications.

## Features Added

### 1. Real Location and Address Management
Component: `src/components/shared/LocationSelector.tsx`

What it supports:
- Detect current location using browser geolocation.
- Reverse geocode via OpenStreetMap Nominatim.
- Search location text via Nominatim.
- Add, edit, delete, and select addresses.
- Persist addresses to backend (`/auth/addresses`) for authenticated users.
- Fallback to local storage for unauthenticated users.

Backend endpoints used:
- `GET /auth/addresses`
- `POST /auth/addresses`
- `PUT /auth/addresses/{id}`
- `DELETE /auth/addresses/{id}`

### 2. Notification Bell
Component: `src/components/shared/NotificationBell.tsx`

What it supports:
- Poll notifications every 30 seconds.
- Show unread count badge in navbar.
- Mark notification as read.
- Display email delivery state from NotificationService:
  - `Email Sent`
  - `Email Failed`
  - `Email Pending`

Backend endpoints used:
- `GET /notifications`
- `POST /notifications/{id}/read`

## Run Locally

```powershell
cd frontend
npm install
npm run dev
```

## Environment/Runtime Notes
- The app expects gateway routing at `/gateway` in Docker and local proxy mode.
- JWT token in local storage is used to determine authenticated behavior for address APIs.
