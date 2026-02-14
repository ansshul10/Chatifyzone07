import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { UserContextProvider } from './context/UserContext'
import { SocketContextProvider } from './context/SocketContext' // Import this

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <UserContextProvider>
      <SocketContextProvider> {/* Wrap here */}
        <App />
      </SocketContextProvider>
    </UserContextProvider>
  </React.StrictMode>,
)