// Entry Next: sostituisce il main.jsx di Vite (il CSS lo importa ImmoClient).
import { AppProvider } from './store/store.jsx'
import App from './App.jsx'

export default function Root() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  )
}
