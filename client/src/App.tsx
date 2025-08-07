import { Routes, Route } from 'react-router-dom';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import TeamCreate from './pages/TeamCreate';
import TeamList from './pages/TeamList';
import TeamDetail from './pages/TeamDetail';
import Invitations from './pages/Invitations';
import Match from './pages/Match';
import Home from './pages/Home';
import Legal from './pages/Legal';
import AuthSuccess from './pages/AuthSuccess';
import Scrims from './pages/Scrims';
import CreateScrim from './pages/CreateScrim';
import ScrimDetail from './pages/ScrimDetails';

function App() {
  return (
    <>
      <Navbar />
      <div className="pt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/auth/success" element={<AuthSuccess />} />
          <Route path="/scrims/:id" element={<ScrimDetail />} />

          <Route 
            path="/profile" 
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/scrims" 
            element={
              <PrivateRoute>
                <Scrims />
              </PrivateRoute>
            } 
          />

          <Route
            path="/scrims/create"
            element={
              <PrivateRoute>
                <CreateScrim />
              </PrivateRoute>
            }
          />

          <Route 
            path="/match" 
            element={
              <PrivateRoute>
                <Match />
              </PrivateRoute>
            } 
          />

          <Route 
            path="/invitations"
            element={
              <PrivateRoute>
                <Invitations />
              </PrivateRoute>
            }
          />

          <Route path="/teams/create" element={
            <PrivateRoute>
              <TeamCreate />
            </PrivateRoute>
          } />

          <Route path="/teams" element={
            <PrivateRoute>
              <TeamList />
            </PrivateRoute>
          } />

          <Route path="/teams/:id" element={
            <PrivateRoute>
              <TeamDetail />
            </PrivateRoute>
          } />
          
          <Route 
            path="/edit-profile" 
            element={
              <PrivateRoute>
                <EditProfile />
              </PrivateRoute>
            } 
          />
        </Routes>
      </div>
    </>
  );
}
export default App;