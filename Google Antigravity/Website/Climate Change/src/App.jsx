import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import NuclearPower from './pages/NuclearPower';
import WaterFiltration from './pages/WaterFiltration';
import WasteManagement from './pages/WasteManagement';
import COEmissions from './pages/COEmissions';
import Home from './pages/Home';
import ScrollToTop from './components/ScrollToTop';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import './styles/global.css';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Router>
          <ScrollToTop />
          <div className="App">
            <Header />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/nuclear-power" element={<NuclearPower />} />
              <Route path="/water-filtration" element={<WaterFiltration />} />
              <Route path="/waste-management" element={<WasteManagement />} />
              <Route path="/co-emissions" element={<COEmissions />} />
            </Routes>
            <Footer />
          </div>
        </Router>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
