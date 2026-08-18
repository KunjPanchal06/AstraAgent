// ════════════════════════════════════════════════════════════════
// FILE: App.jsx
// PURPOSE: Root application component. Defines the client-side
//          route table using React Router:
//            /         → Landing page
//            /login    → Login page
//            /signup   → Signup page
//            /app      → Dashboard (authenticated workspace)
//            *         → Redirect to /
// EXPORTS: App (default)
// DEPENDS ON: react-router-dom, pages/*
// ════════════════════════════════════════════════════════════════
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/app" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
