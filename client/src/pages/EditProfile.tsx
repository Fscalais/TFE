import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const languageOptions = ['fr', 'en', 'de', 'es'];
const gameOptions = ['League of Legends', 'Valorant', 'CS:GO', 'Overwatch', 'Dofus', 'World of Warcraft'];
const roleOptions = ['Controlleur', 'Duelliste', 'Initiateur', 'Sentinelle'];
const moodOptions = ['Tryhard', 'Chill', 'Fun'];

type ProfileForm = {
  username: string;
  riotSummonerName: string;
  location: string;
  age: number;
  bio: string;
  rank: string;
  mood: string[];
  languages: string[];
  games: string[];
  roles: string[];
};

const EditProfile = () => {
  const [form, setForm] = useState<ProfileForm>({
    username: '',
    riotSummonerName: '',
    location: '',
    age: 8,
    bio: '',
    rank: '',
    mood: [],
    languages: [],
    games: [],
    roles: [],
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setForm({
        username: data.username || '',
        riotSummonerName: data.riotSummonerName || '',
        location: data.location || '',
        age: data.age || 8,
        bio: data.bio || '',
        rank: data.rank || '',
        mood: data.mood || [],
        languages: data.languages || [],
        games: data.games || [],
        roles: data.roles || [],
      });
    };

    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'age' ? Number(value) : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof ProfileForm) => {
    const { value, checked } = e.target;
    setForm(prev => {
      const prevArray = prev[field] as string[];
      return {
        ...prev,
        [field]: checked
          ? [...prevArray, value]
          : prevArray.filter(item => item !== value),
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:5000/api/users/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setMessage('✅ Profil mis à jour !');
      setTimeout(() => navigate('/profile'), 1000);
    } else {
      const errorData = await res.json();
      setMessage(errorData.message || 'Erreur serveur');
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Modifier mon profil</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="text"
          name="username"
          placeholder="Nom d'utilisateur"
          value={form.username}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />

        <input
          type="text"
          name="riotSummonerName"
          placeholder="Pseudo Riot (facultatif)"
          value={form.riotSummonerName}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        <input
          type="text"
          name="location"
          placeholder="Localisation"
          value={form.location}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        <input
          type="number"
          name="age"
          placeholder="Âge"
          min={8}
          value={form.age}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        <textarea
          name="bio"
          placeholder="Petite bio"
          value={form.bio}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        <input
          type="text"
          name="rank"
          placeholder="Rank (sera mis à jour plus tard)"
          value={form.rank}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          disabled
        />

        {/* Mood */}
        <div>
          <p className="font-semibold">Mood</p>
          <div className="flex gap-4 flex-wrap">
            {moodOptions.map(mood => (
              <label key={mood} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value={mood}
                  checked={form.mood.includes(mood)}
                  onChange={e => handleCheckboxChange(e, 'mood')}
                />
                {mood}
              </label>
            ))}
          </div>
        </div>

        {/* Langues */}
        <div>
          <p className="font-semibold">Langues parlées</p>
          <div className="flex gap-4 flex-wrap">
            {languageOptions.map(lang => (
              <label key={lang} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value={lang}
                  checked={form.languages.includes(lang)}
                  onChange={e => handleCheckboxChange(e, 'languages')}
                />
                {lang}
              </label>
            ))}
          </div>
        </div>

        {/* Jeux */}
        <div>
          <p className="font-semibold">Jeux préférés</p>
          <div className="flex gap-4 flex-wrap">
            {gameOptions.map(game => (
              <label key={game} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value={game}
                  checked={form.games.includes(game)}
                  onChange={e => handleCheckboxChange(e, 'games')}
                />
                {game}
              </label>
            ))}
          </div>
        </div>

        {/* Rôles */}
        <div>
          <p className="font-semibold">Rôles</p>
          <div className="flex gap-4 flex-wrap">
            {roleOptions.map(role => (
              <label key={role} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value={role}
                  checked={form.roles.includes(role)}
                  onChange={e => handleCheckboxChange(e, 'roles')}
                />
                {role}
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-500"
        >
          Sauvegarder
        </button>

        {message && <p className="text-green-600 font-medium">{message}</p>}
      </form>
    </div>
  );
};

export default EditProfile;
