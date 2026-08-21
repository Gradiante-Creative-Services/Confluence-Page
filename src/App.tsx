import { useEffect, useState } from 'react'
import { useAuth } from './auth/AuthContext'
import { ArtifactHub } from './components/ArtifactHub'
import { LoginScreen } from './components/LoginScreen'
import { SignupScreen } from './components/SignupScreen'

function App() {
  const { session } = useAuth()
  const [authView, setAuthView] = useState<'login' | 'signup'>('login')

  useEffect(() => {
    if (session) {
      setAuthView('login')
    }
  }, [session])

  if (session) {
    return <ArtifactHub />
  }

  if (authView === 'signup') {
    return <SignupScreen onSwitchToLogin={() => setAuthView('login')} />
  }

  return <LoginScreen onSwitchToSignup={() => setAuthView('signup')} />
}

export default App
