import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import Home from './Home'
import { BrowserRouter, Routes, Route } from 'react-router'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route index element={<App />} />
        <Route path='/' element={<App />} />
        <Route path="/login" element={<App />} />
        <Route path="/home" element={<Home />} />
        {/* <Route path="/test" element={<Test />} /> */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
