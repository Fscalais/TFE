import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setServerError('');

    // Validation frontend minimale
    const validationErrors = [];
    if (!email.trim()) validationErrors.push('L\'email est obligatoire');
    // Simple regex pour email valide
    else if (!/^\S+@\S+\.\S+$/.test(email)) validationErrors.push('Email invalide');

    if (!username.trim()) validationErrors.push('Le pseudo est obligatoire');

    if (!password) validationErrors.push('Le mot de passe est obligatoire');
    else if (password.length < 8)
      validationErrors.push('Le mot de passe doit contenir au moins 8 caractères');

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await api.post('/auth/register', {
        email,
        username,
        password,
      });

      alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
      navigate('/login');
    } catch (err: any) {
      if (err.response) {
        const data = err.response.data;

        if (data.errors && Array.isArray(data.errors)) {
          setErrors(data.errors.map((e: any) => e.msg));
          return;
        }

        if (data.message) {
          setServerError(data.message);
          return;
        }
      }
      setServerError('Une erreur est survenue lors de l’inscription');
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-indigo-700 mb-4">Inscription</h1>

      {(errors.length > 0 || serverError) && (
        <div className="mb-4 text-red-600">
          {errors.length > 0 && (
            <ul className="list-disc list-inside">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
          {serverError && <p>{serverError}</p>}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Pseudo"
          className="w-full p-2 border rounded"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          className="w-full p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-500"
        >
          S'inscrire
        </button>
      </form>
    </div>
  );
}

export default Register;

