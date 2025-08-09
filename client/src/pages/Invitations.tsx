import { useEffect, useState } from 'react';
import api from '../services/api';

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
    try {
      const { data } = await api.get('/teams/invitations'); // ✅
      setInvitations(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors du chargement des invitations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const respondInvitation = async (teamId: string, accept: boolean) => {
    try {
      await api.post(`/teams/${teamId}/${accept ? 'accept' : 'decline'}`); // ✅
      fetchInvitations();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur lors de la réponse à l’invitation');
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
