import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import GoogleLoginButton from '../../components/GoogleLoginButton';

const ALLOWED_PUBLIC_DOMAINS = [
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'yahoo.com',
  'proton.me',
  'protonmail.com',
  'icloud.com',
  'gmx.com',
  'orange.fr',
  'free.fr',
  'sfr.fr',
  'laposte.net',
  'wanadoo.fr',
];

const emailFormatRegex =
  /^[A-Za-z0-9._%+\-]{2,64}@[A-Za-z0-9\-]{1,63}(\.[A-Za-z0-9\-]{2,63})+$/;

function validateEmailClient(email: string): string | null {
  const e = email.trim();
  if (e.length < 6) return 'Email trop court';
  if (e.length > 254) return 'Email trop long';
  if (!emailFormatRegex.test(e)) return 'Format email invalide';
  const [local, domain] = e.toLowerCase().split('@');
  if (!local || !domain) return 'Format email invalide';
  if (!ALLOWED_PUBLIC_DOMAINS.includes(domain)) {
    return 'Domaine non autorisé (gmail, outlook, yahoo, icloud, proton, …)';
  }
  return null;
}

function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setServerError('');

    const validationErrors: string[] = [];

    const emailErr = validateEmailClient(email);
    if (emailErr) validationErrors.push(emailErr);

    if (!username.trim()) validationErrors.push("Le pseudo est obligatoire");
    else if (username.trim().length < 3) validationErrors.push("Le pseudo doit faire au moins 3 caractères");
    else if (username.trim().length > 32) validationErrors.push("Le pseudo est trop long");

    if (!password) validationErrors.push("Le mot de passe est obligatoire");
    else if (password.length < 8) validationErrors.push("Le mot de passe doit contenir au moins 8 caractères");

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/auth/register', { email, username, password });
      alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
      navigate('/login');
    } catch (err: any) {
      if (err.response) {
        const data = err.response.data;
        if (data.errors && Array.isArray(data.errors)) {
          setErrors(data.errors.map((e: any) => e));
          return;
        }
        if (data.message) {
          setServerError(data.message);
          return;
        }
      }
      setServerError('Une erreur est survenue lors de l’inscription');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-700 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-indigo-700 mb-6 text-center">
          Crée ton compte
        </h1>

        {(errors.length > 0 || serverError) && (
          <div className="mb-4 text-red-600 text-sm">
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

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <input
            type="email"
            placeholder="Email (gmail, outlook, yahoo, …)"
            className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            onBlur={() => {
              const err = validateEmailClient(email);
              if (err) setErrors((prev) => Array.from(new Set([...prev, err])));
            }}
          />
          <input
            type="text"
            placeholder="Pseudo"
            className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Mot de passe (min. 8 caractères)"
            className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-500 transition disabled:opacity-60"
          >
            {submitting ? 'Création…' : "S'inscrire"}
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
      </div>
    </div>
  );
}

export default Register;



