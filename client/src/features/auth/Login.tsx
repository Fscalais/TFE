import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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

    console.log('Tentative login avec email:', email);

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Erreur backend login:', data);
        // Affiche message d’erreur si présent dans data.message ou dans data.errors
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
    } catch (err: any) {
      console.error('Erreur lors du fetch login:', err);
      setError('Erreur réseau ou serveur');
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-indigo-700 mb-4">Connexion</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-500"
        >
          Se connecter
        </button>
      </form>

      <p className="text-center mt-4 text-sm">
        Pas encore de compte ?{' '}
        <Link to="/register" className="text-indigo-600 hover:underline">
          Inscription
        </Link>
      </p>
    </div>
  );
}

export default Login;
