import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthSuccess() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    console.log("Token from URL:", token);

    if (!token) {
      setError('Token non trouvé dans l’URL');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    fetch('http://localhost:5000/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Erreur ${res.status} lors de la récupération du profil`);
        }
        return res.json();
      })
      .then(user => {
        login(user, token);
        navigate('/profile');
      })
      .catch(err => {
        console.error('Erreur AuthSuccess:', err);
        setError('Token invalide ou expiré. Veuillez vous reconnecter.');
        setTimeout(() => navigate('/login'), 3000);
      });
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

