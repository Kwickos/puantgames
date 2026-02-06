import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import Room from '@/pages/Room'
import { useSocketLifecycle } from '@/hooks/useSocket'
import { fetchAuthUser } from '@/stores/authStore'

import '@/games'

function AuthManager() {
  useEffect(() => {
    fetchAuthUser()
  }, [])
  return null
}

function SocketManager() {
  useSocketLifecycle()
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthManager />
      <SocketManager />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/room/:code" element={<Room />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
