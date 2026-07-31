import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import { ArtifactHub } from './components/ArtifactHub'
import { LandingPage } from './components/LandingPage'
import { LoginScreen } from './components/LoginScreen'
import { SignupScreen } from './components/SignupScreen'
import { Skeleton } from '@/components/ui/skeleton'

type AuthView = 'landing' | 'login' | 'signup'

function App() {
  const { userEmail, isLoading } = useAuth()
  const [authView, setAuthView] = useState<AuthView>('landing')

  if (isLoading) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    )
  }

  if (userEmail) {
    return <ArtifactHub />
  }

  if (authView === 'landing') {
    return (
      <LandingPage
        onSignIn={() => setAuthView('login')}
        onSignUp={() => setAuthView('signup')}
      />
    )
  }

  return authView === 'login' ? (
    <LoginScreen onShowSignup={() => setAuthView('signup')} />
  ) : (
    <SignupScreen onShowLogin={() => setAuthView('login')} />
  )
}

export default App
