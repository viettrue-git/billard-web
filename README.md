# Billiard Management Web

Frontend React + TypeScript cho hệ thống quản lý quán bi-a.

## Yêu cầu
- Node.js 18+
- Backend API đang chạy tại http://localhost:5001

## Cài đặt & Chạy

```bash
npm install
npm run dev
```

App sẽ chạy tại: http://localhost:5173

## Cấu hình
File `.env`:
```
VITE_API_URL=http://localhost:5001/api
VITE_HUB_URL=http://localhost:5001/hubs/tables
```

## Tech Stack
- React 18 + TypeScript + Vite
- Ant Design (UI)
- TanStack Query (data fetching)
- Zustand (state management)
- React Router v6
- SignalR (real-time)
- Recharts (biểu đồ)
