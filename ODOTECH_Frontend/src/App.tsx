import AppLayout from './components/layout/AppLayout'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { appRoutes } from './routes/appRoutes'
import { getToken } from './utils/auth'

function App() {
  const location = useLocation()
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register'
  const isLoggedIn = Boolean(getToken())

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
