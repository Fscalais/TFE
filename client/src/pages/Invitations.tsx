import { useEffect, useState } from 'react';

type Team = {
  _id: string;
  name: string;
  description?: string;
  creator: { username: string };
};

const Invitations = () => {
  const [invitations, setInvitations] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInvitations = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/api/teams/invitations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur lors du chargement des invitations');
      const data = await res.json();
      setInvitations(data);
    } catch (err: any) {
      setError(err.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const respondInvitation = async (teamId: string, accept: boolean) => {
    const token = localStorage.getItem('token');
    const url = `http://localhost:5000/api/teams/${teamId}/${accept ? 'accept' : 'decline'}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur lors de la réponse à l’invitation');
      // Rafraîchir la liste
      fetchInvitations();
    } catch (err: any) {
      alert(err.message || 'Erreur inconnue');
    }
  };

  if (loading) return <p>Chargement des invitations...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (invitations.length === 0) return <p>Aucune invitation reçue.</p>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Mes invitations</h1>
      <ul>
        {invitations.map(team => (
          <li key={team._id} className="mb-4 p-4 border rounded">
            <h2 className="font-semibold text-lg">{team.name}</h2>
            <p>{team.description || 'Pas de description'}</p>
            <p>Créée par : {team.creator.username}</p>
            <div className="space-x-2 mt-2">
              <button
                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-500"
                onClick={() => respondInvitation(team._id, true)}
              >
                Accepter
              </button>
              <button
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500"
                onClick={() => respondInvitation(team._id, false)}
              >
                Refuser
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Invitations;
