import AppLayout from './components/layout/AppLayout'
import { Route, Routes } from 'react-router-dom'

import { appRoutes } from './routes/appRoutes'

function App() {
  return (
    <AppLayout userName="Admin">
      <Routes>
        {appRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Routes>
    </AppLayout>
  )
}

export default App
