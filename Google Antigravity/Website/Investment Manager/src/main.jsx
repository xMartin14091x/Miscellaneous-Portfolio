/**
 * main.jsx - Application Entry Point
 * 
 * This is the first file that runs when the app starts.
 * It renders the root App component into the DOM.
 * 
 * StrictMode is enabled for development warnings about
 * deprecated APIs and potential problems.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Find the root element in index.html and render the React app into it
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
