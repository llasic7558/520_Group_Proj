import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { AuthProvider } from './context/AuthProvider.jsx'
import CreatePostingPage from './pages/CreatePostingPage/CreatePostingPage.jsx'
import LandingPage from './pages/LandingPage/LandingPage.jsx'
import ListingApplicationsPage from './pages/ListingApplicationsPage/ListingApplicationsPage.jsx'
import LoginPage from './pages/LoginPage/LoginPage.jsx'
import OpportunitiesPage from './pages/OpportunitiesPage/OpportunitiesPage.jsx'
import ProfilePage from './pages/ProfilePage/ProfilePage.jsx'
import SignupPage from './pages/SignupPage/SignupPage.jsx'
import VerifyEmailPage from './pages/VerifyEmailPage/VerifyEmailPage.jsx'

// picks which page to show based on the url
export default function App() {
  return (
    <AuthProvider>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route
          path="/opportunities"
          element={
            <ProtectedRoute>
              <OpportunitiesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/postings/new"
          element={
            <ProtectedRoute>
              <CreatePostingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/postings/:listingId/applications"
          element={
            <ProtectedRoute>
              <ListingApplicationsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
