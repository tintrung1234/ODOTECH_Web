import AppLayout from './components/layout/AppLayout'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

import { appRoutes } from './routes/appRoutes'
import { getTokenUser } from './utils/auth'

function App() {
  const location = useLocation()
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register'
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    // Check authentication status on mount and location change
    (async () => {
      const user = await getTokenUser()
      setIsLoggedIn(!!user)
    })()
  }, [location.pathname])

  // Show loading state while checking auth
  if (isLoggedIn === null) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!isAuthRoute && !isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (isAuthRoute) {
    return (
      <Routes>
        {appRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Routes>
    )
  }

  return (
    <AppLayout>
      <Routes>
        {appRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Routes>
    </AppLayout>
  )
}

export default App
