import { Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage/LandingPage.jsx'
import LoginPage from './pages/LoginPage/LoginPage.jsx'
import SignupPage from './pages/SignupPage/SignupPage.jsx'
import OpportunitiesPage from './pages/OpportunitiesPage/OpportunitiesPage.jsx'

// picks which page to show based on the url
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/opportunities" element={<OpportunitiesPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
