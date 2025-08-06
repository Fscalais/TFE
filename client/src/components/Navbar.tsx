import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { to: '/', label: 'Accueil' },
    { to: user ? '/profile' : '/login', label: 'Profil' },
    { to: user ? '/match' : '/login', label: 'Match' },
    { to: '/teams', label: 'Teams' },
    { to: '/invitations', label: 'Invitations' },
  ];

  return (
    <nav className="fixed w-full backdrop-blur bg-black bg-opacity-60 text-white shadow-md z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3">
        <div className="text-2xl font-bold text-indigo-400">MatchMate</div>

        {/* Desktop Links */}
        <div className="hidden md:flex space-x-6">
          {links.map(({ to, label }, index) => (
            <Link
              key={`${to}-${index}`}
              to={to}
              className={`relative px-2 py-1 font-semibold hover:text-indigo-400 transition
                ${location.pathname === to ? 'text-indigo-500 before:absolute before:-bottom-1 before:left-0 before:w-full before:h-0.5 before:bg-indigo-500 before:rounded' : ''}`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Auth Buttons Desktop */}
        <div className="hidden md:flex space-x-4 items-center">
          {!user ? (
            <>
              <Link to="/login" className="hover:text-indigo-400 font-semibold transition">Connexion</Link>
              <Link to="/register" className="hover:text-indigo-400 font-semibold transition">Inscription</Link>
            </>
          ) : (
            <button onClick={logout} className="hover:text-indigo-400 font-semibold transition">Déconnexion</button>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden focus:outline-none"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu mobile"
        >
          <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" >
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-black bg-opacity-80 backdrop-blur px-6 py-4 space-y-4">
          {links.map(({ to, label }, index) => (
            <Link
              key={`${to}-${index}`}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={`relative px-2 py-1 font-semibold hover:text-indigo-400 transition
                ${location.pathname === to ? 'text-indigo-500 before:absolute before:-bottom-1 before:left-0 before:w-full before:h-0.5 before:bg-indigo-500 before:rounded' : 'text-white'}`}
            >
              {label}
            </Link>
          ))}

          <div className="pt-4 border-t border-indigo-700">
            {!user ? (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="block font-semibold hover:text-indigo-400 transition">Connexion</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="block font-semibold hover:text-indigo-400 transition">Inscription</Link>
              </>
            ) : (
              <button onClick={() => { logout(); setMobileOpen(false); }} className="font-semibold hover:text-indigo-400 transition">
                Déconnexion
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;

