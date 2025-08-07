import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

interface Team {
  _id: string;
  name: string;
}

const CreateScrim: React.FC = () => {
  const navigate = useNavigate();

  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [minRank, setMinRank] = useState('bronze');
  const [matchType, setMatchType] = useState('bo1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupérer les équipes de l'utilisateur pour le select
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await api.get('/teams'); // Assure-toi que cette route renvoie les équipes de l'user
        setTeams(res.data);
        if (res.data.length > 0) {
          setSelectedTeamId(res.data[0]._id);
        }
      } catch (err) {
        setError('Erreur lors du chargement des équipes');
      }
    };
    fetchTeams();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!date || !time) {
      setError('Merci de choisir la date et l’heure');
      return;
    }
    if (!selectedTeamId) {
      setError('Merci de choisir une équipe');
      return;
    }

    const datetime = new Date(`${date}T${time}:00`).toISOString();

    setLoading(true);
    try {
      await api.post('/scrims', {
        datetime,
        matchType,
        minRank,
        teamId: selectedTeamId, // à gérer côté backend si besoin
      });
      navigate('/scrims');
    } catch {
      setError('Erreur lors de la création du scrim');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8 bg-white rounded shadow space-y-6">
      <h1 className="text-3xl font-bold text-indigo-600">Créer un scrim</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          Équipe
          <select
            value={selectedTeamId}
            onChange={e => setSelectedTeamId(e.target.value)}
            className="w-full border rounded p-2 mt-1"
          >
            {teams.map(team => (
              <option key={team._id} value={team._id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-4">
          <label className="flex-1">
            Date de début
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border rounded p-2 mt-1"
            />
          </label>

          <label className="flex-1">
            Heure
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full border rounded p-2 mt-1"
            />
          </label>
        </div>

        <label>
          Rang minimum
          <select
            value={minRank}
            onChange={e => setMinRank(e.target.value)}
            className="w-full border rounded p-2 mt-1"
          >
            <option value="bronze">Bronze</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
            <option value="diamond">Diamond</option>
            <option value="master">Master</option>
            <option value="grandmaster">Grandmaster</option>
            <option value="challenger">Challenger</option>
          </select>
        </label>

        <label>
          Type de match
          <select
            value={matchType}
            onChange={e => setMatchType(e.target.value)}
            className="w-full border rounded p-2 mt-1"
          >
            <option value="bo1">BO1</option>
            <option value="bo3">BO3</option>
            <option value="bo5">BO5</option>
          </select>
        </label>

        {error && <p className="text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white p-3 rounded hover:bg-indigo-700"
        >
          {loading ? 'Création en cours...' : 'Créer le scrim'}
        </button>
      </form>
    </div>
  );
};

export default CreateScrim;
