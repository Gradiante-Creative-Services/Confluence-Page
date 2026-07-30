import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import { ArtifactHub } from './components/ArtifactHub'
import { LoginScreen } from './components/LoginScreen'
import { SignupScreen } from './components/SignupScreen'

function App() {
  const { userEmail, isLoading } = useAuth()
  const [authView, setAuthView] = useState<'login' | 'signup'>('login')

  if (isLoading) {
    return (
      <div className="login-page">
        <p className="login-subtitle">Loading session…</p>
      </div>
    )
  }

  if (userEmail) {
    return <ArtifactHub />
  }

  return authView === 'login' ? (
    <LoginScreen onShowSignup={() => setAuthView('signup')} />
  ) : (
    <SignupScreen onShowLogin={() => setAuthView('login')} />
  )
}

export default App
