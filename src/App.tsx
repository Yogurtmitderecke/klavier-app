import { useAppStore } from './state/appStore'
import { MicPlaceholderScreen } from './screens/MicPlaceholderScreen'
import { OverviewScreen } from './screens/OverviewScreen'
import { WelcomeScreen } from './screens/WelcomeScreen'

// Bildschirmwechsel nur über den App-Zustand – kein Router (D-03).
function App() {
  const screen = useAppStore((s) => s.screen)

  return (
    <main className="app">
      {screen === 'welcome' && <WelcomeScreen />}
      {screen === 'overview' && <OverviewScreen />}
      {screen === 'mic-placeholder' && <MicPlaceholderScreen />}
    </main>
  )
}

export default App
