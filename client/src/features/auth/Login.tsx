import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import GoogleLoginButton from '../../components/GoogleLoginButton';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Email et mot de passe sont obligatoires');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.message) setError(data.message);
        else if (data.errors && Array.isArray(data.errors)) {
          setError(data.errors.map((e: any) => e.msg).join(', '));
        } else {
          setError('Échec de la connexion');
        }
        return;
      }

      login(data.user, data.token);
      navigate('/profile');
    } catch (err) {
      setError('Erreur réseau ou serveur');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-700 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-indigo-700 mb-6 text-center">
          Connexion
        </h1>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            required
          />
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-500 transition"
          >
            Se connecter
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

        <p className="text-center mt-4 text-sm">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-indigo-600 hover:underline">
            Inscription
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;


