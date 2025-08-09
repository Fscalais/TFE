import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

type Member = {
  _id: string;
  username: string;
};

type User = {
  _id: string;
  username: string;
};

type Team = {
  _id: string;
  name: string;
  description?: string;
  members: Member[];
  creator: Member;
};

const TeamDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth() as { user: User | null; logout: () => void };

  const [team, setTeam] = useState<Team | null>(null);
  const [inviteUsername, setInviteUsername] = useState('');
  const [message, setMessage] = useState('');
  const [showTransfer, setShowTransfer] = useState(false);
  const [newCreatorId, setNewCreatorId] = useState<string>('');

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const { data } = await api.get(`/teams/${id}`);
        setTeam(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTeam();
  }, [id]);

  const handleInvite = async () => {
    if (!inviteUsername.trim()) return;
    try {
      await api.post(`/teams/${id}/invite`, { username: inviteUsername });
      setMessage('Invitation envoyée !');
      setInviteUsername('');
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Erreur lors de l’invitation');
    }
  };

  const onCreatorLeaveClick = () => {
    if (!team) return;
    if (team.members.length <= 1) {
      alert("Vous êtes le seul membre, vous ne pouvez pas quitter sans supprimer l'équipe.");
      return;
    }
    setShowTransfer(true);
  };

  const handleConfirmLeave = async () => {
    if (!team || !user) return;

    if (!newCreatorId) {
      alert("Veuillez choisir un membre pour devenir le nouveau créateur.");
      return;
    }

    try {
      await api.post(`/teams/${id}/transfer-creator`, { newCreatorId });
      await api.post(`/teams/${id}/leave`);
      setMessage('Vous avez quitté l’équipe.');
      setTeam(null);
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Erreur lors du départ de l’équipe');
    }
    setShowTransfer(false);
  };

  const handleLeaveTeam = () => {
    if (!team || !user) return;
    if (user._id === team.creator._id) {
      onCreatorLeaveClick();
    } else {
      handleConfirmLeave();
    }
  };

  if (!team) return <p>Chargement...</p>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{team.name}</h1>
      <p className="mb-4">{team.description || 'Pas de description'}</p>

      <h2 className="text-xl font-semibold mb-2">Membres</h2>
      <ul className="mb-6">
        {team.members.map(member => (
          <li key={member._id}>{member.username}</li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold mb-2">Inviter un membre</h2>
      <input
        type="text"
        placeholder="Nom d'utilisateur"
        value={inviteUsername}
        onChange={(e) => setInviteUsername(e.target.value)}
        className="border p-2 mr-2 rounded"
      />
      <button
        onClick={handleInvite}
        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-500"
      >
        Inviter
      </button>

      <div className="mt-4">
        <button
          onClick={handleLeaveTeam}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500"
        >
          Quitter l'équipe
        </button>
      </div>

      {showTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Choisissez le nouveau créateur</h3>
            <select
              className="w-full p-2 border rounded mb-4"
              value={newCreatorId}
              onChange={(e) => setNewCreatorId(e.target.value)}
            >
              <option value="">-- Sélectionnez un membre --</option>
              {team.members
                .filter(m => m._id !== team.creator._id)
                .map(m => (
                  <option key={m._id} value={m._id}>
                    {m.username}
                  </option>
                ))}
            </select>
            <button
              onClick={handleConfirmLeave}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500 mr-2"
            >
              Confirmer
            </button>
            <button
              onClick={() => setShowTransfer(false)}
              className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {message && <p className="mt-4 text-green-600">{message}</p>}
    </div>
  );
};

export default TeamDetail;
