import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useMemo } from 'react';

function Navbar() {
  const { user, logout, loading } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname === to || location.pathname.startsWith(to + '/');
  };

  const navLinks = useMemo(
    () => [
      { to: '/', label: 'Accueil' },
      { to: user ? '/profile' : '/login', label: 'Profil' },
      { to: '/teams', label: 'Teams' },
      { to: '/invitations', label: 'Invitations' },
    ],
    [user]
  );

  const matchLink = user ? '/match' : '/login';

  return (
    <nav className="fixed inset-x-0 top-0 z-50">
      <div className="backdrop-blur-md bg-[#0b0b18]/70 border-b border-white/10">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md" />
              <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
                MatchMate
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-2">
                {navLinks.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className={[
                      'relative px-3 py-2 text-sm font-semibold rounded-lg transition',
                      'hover:text-indigo-300 hover:bg-white/5',
                      isActive(to)
                        ? 'text-indigo-200 before:absolute before:left-3 before:right-3 before:-bottom-[6px] before:h-[2px] before:rounded before:bg-gradient-to-r before:from-indigo-400 before:to-purple-400'
                        : 'text-gray-200',
                    ].join(' ')}
                  >
                    {label}
                  </Link>
                ))}
              </div>

              <Link
                to={matchLink}
                aria-label="Aller au matchmaking"
                className={[
                  'group relative inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 font-extrabold',
                  'bg-gradient-to-b from-red-500 to-red-600 text-white shadow-lg shadow-red-600/30',
                  'ring-1 ring-inset ring-white/10 transition transform',
                  'hover:scale-[1.03] hover:shadow-red-500/40 active:scale-[0.98]',
                ].join(' ')}
              >
                <svg className="h-5 w-5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7-11-7z" />
                </svg>
                Match
                <span className="absolute inset-0 -z-10 rounded-2xl blur-md opacity-40 bg-red-500 group-hover:opacity-60 transition" />
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-4">
              {loading ? (
                <div className="text-sm text-gray-400">…</div>
              ) : !user ? (
                <>
                  <Link to="/login" className="text-sm font-semibold text-gray-200 hover:text-indigo-300 transition">
                    Connexion
                  </Link>
                  <Link to="/register" className="text-sm font-semibold text-indigo-200 hover:text-white bg-indigo-600/20 hover:bg-indigo-600/30 px-3 py-1.5 rounded-lg transition">
                    Inscription
                  </Link>
                </>
              ) : (
                <button onClick={logout} className="text-sm font-semibold text-gray-300 hover:text-rose-300 transition">
                  Déconnexion
                </button>
              )}
            </div>

            <button
              className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-indigo-300 hover:text-white hover:bg-white/10 transition"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu mobile"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-white/10">
            <div className="px-4 py-4 space-y-2">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={[
                    'block rounded-lg px-3 py-2 font-semibold transition',
                    'hover:bg-white/5',
                    isActive(to) ? 'text-indigo-200 bg-white/5' : 'text-gray-200',
                  ].join(' ')}
                >
                  {label}
                </Link>
              ))}

              <Link
                to={matchLink}
                onClick={() => setMobileOpen(false)}
                className={[
                  'mt-3 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-extrabold',
                  'bg-gradient-to-b from-red-500 to-red-600 text-white shadow-lg shadow-red-600/30',
                  'ring-1 ring-inset ring-white/10 transition active:scale-[0.99]',
                ].join(' ')}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7-11-7z" />
                </svg>
                Match
              </Link>

              <div className="pt-3 border-t border-white/10">
                {loading ? (
                  <div className="text-sm text-gray-400">…</div>
                ) : !user ? (
                  <div className="flex items-center gap-3">
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 text-center rounded-lg px-3 py-2 font-semibold text-gray-200 hover:text-white hover:bg-white/5 transition"
                    >
                      Connexion
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 text-center rounded-lg px-3 py-2 font-semibold text-indigo-200 bg-indigo-600/20 hover:bg-indigo-600/30 transition"
                    >
                      Inscription
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={() => { logout(); setMobileOpen(false); }}
                    className="w-full text-center rounded-lg px-3 py-2 font-semibold text-gray-300 hover:text-rose-300 hover:bg-white/5 transition"
                  >
                    Déconnexion
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="h-px w-full bg-gradient-to-r from-indigo-600/40 via-purple-600/40 to-pink-600/40" />
    </nav>
  );
}

export default Navbar;


