import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'
import { InvestmentProvider } from './context/InvestmentContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import PlanningPage from './pages/PlanningPage'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <InvestmentProvider>
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/planning" element={<PlanningPage />} />
            </Routes>
          </InvestmentProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
