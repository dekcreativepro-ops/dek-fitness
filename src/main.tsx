import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyAccent, loadAccent } from './utils/theme'
import { startTrialIfNeeded } from './utils/premium'
import { refreshAccount } from './utils/account'

applyAccent(loadAccent())
startTrialIfNeeded()
void refreshAccount()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
