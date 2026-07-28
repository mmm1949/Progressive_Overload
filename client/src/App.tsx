import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Navbar from './components/navbar.js'
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
          <Route path='/progress' element={<Progress />} />
          <Route path="/progress/:bodyPart/:exercise" element={<Exercise />} />
          <Route path = '/prs' element= {<Prs />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
