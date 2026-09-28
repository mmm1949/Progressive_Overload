import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Navbar from './components/navbar.js'
import ProtectedRoute from './components/protected-route.js'
import Home from './pages/home.js'
import Progress from './pages/progress.js'
import Prs from './pages/prs.js'
import Exercise from './pages/exercise.js'
import Login from './pages/login.js'
import Signup from './pages/signup.js'

function App() {
  return (
    <>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/hello" element={<Home />} />
          <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
          <Route path="/progress/exercise/:exerciseId" element={<ProtectedRoute><Exercise /></ProtectedRoute>} />
          <Route path="/prs" element={<ProtectedRoute><Prs /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
