//page callback après authentification : si token ->/profile sinon ->/login

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function AuthSuccess() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const ranRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    const goLogin = () => navigate('/login', { replace: true });

    const clear = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    if (!token) {
      setError('Token non trouvé dans l’URL');
      timeoutRef.current = window.setTimeout(goLogin, 2000);
      return () => clear();
    }

    (async () => {
      try {
        const { data: user } = await api.get('/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        login(user, token);
        clear();
        navigate('/profile', { replace: true });
      } catch (err) {
        console.error('Erreur AuthSuccess:', err);
        setError('Token invalide ou expiré. Veuillez vous reconnecter.');
        timeoutRef.current = window.setTimeout(goLogin, 2000);
      }
    })();

    return () => clear();
  }, [login, navigate]);

  if (error) {
    return (
      <div className="p-8 max-w-md mx-auto text-center text-red-600">
        <p>{error}</p>
        <p>Redirection vers la page de connexion...</p>
      </div>
    );
  }
  return <div className="p-8 max-w-md mx-auto text-center">Connexion en cours...</div>;
}
