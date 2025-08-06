import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type Team = {
  _id: string;
  name: string;
  description?: string;
  members: string[];
};

const TeamList = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeams = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('http://localhost:5000/api/teams', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Erreur lors du chargement des équipes');
        const data = await res.json();
        setTeams(data);
      } catch (err: any) {
        setError(err.message || 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  if (loading) return <p>Chargement des équipes...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 flex justify-between items-center">
        Mes équipes
        {/* Bouton pour créer une nouvelle équipe */}
        <Link
          to="/teams/create"
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-500 text-sm"
        >
          + Créer une équipe
        </Link>
      </h1>

      {teams.length === 0 ? (
        <p>Vous n'êtes membre d'aucune équipe.</p>
      ) : (
        <ul>
  {teams.map(team => (
    <li key={team._id} className="mb-4 p-4 border rounded hover:bg-gray-100 cursor-pointer">
      <Link to={`/teams/${team._id}`}>
        <h2 className="font-semibold text-lg">{team.name}</h2>
        <p>{team.description || 'Pas de description'}</p>
        <p>Membres : {team.members.length}</p>
      </Link>
    </li>
  ))}
</ul>  
      )}
    </div>
  );
};

export default TeamList;
