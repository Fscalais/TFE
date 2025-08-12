import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import GoogleLoginButton from '../../components/GoogleLoginButton';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const token = res.data?.token;
      const userFromLogin = res.data?.user;

      if (!token) throw new Error('Token manquant');

      let user = userFromLogin;
      if (!user) {
        localStorage.setItem('token', token);
        const { data } = await api.get('/users/me');
        user = data;
      }

      login(user, token);
      navigate('/profile', { replace: true });
    } catch (e: any) {
      console.error(e);
      setErr(e?.response?.data?.message || 'Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-700 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-indigo-700 mb-6 text-center">Connexion</h1>

        {err && <p className="mb-4 text-center text-red-600 text-sm">{err}</p>}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-500 transition disabled:opacity-60"
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 flex items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-4 text-gray-500 text-sm">ou</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <div className="mt-4">
          <GoogleLoginButton />
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-indigo-600 hover:underline">Inscription</Link>
        </p>
      </div>
    </div>
  );
}
