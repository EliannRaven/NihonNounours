import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { ExplorePage } from './pages/ExplorePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { TodayPage } from './pages/TodayPage'
import { TripPage } from './pages/TripPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/today" replace />} />
          <Route path="today" element={<TodayPage />} />
          <Route path="trip" element={<TripPage />} />
          <Route path="explore" element={<ExplorePage />} />
          <Route path="map" element={<Navigate to="/today" replace />} />
          <Route path="info" element={<Navigate to="/today" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
