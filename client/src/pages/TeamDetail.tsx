import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/teams/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTeam(data);
      }
    };
    fetchTeam();
  }, [id]);

  const handleInvite = async () => {
    if (!inviteUsername.trim()) return;

    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/api/teams/${id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: inviteUsername }),
    });

    const data = await res.json();

    if (res.ok) {
        setMessage('Invitation envoyée !');
        setInviteUsername('');
    } else {
        setMessage(data.message || 'Erreur lors de l\'invitation');
    }
    };

  // Quand creator clique sur quitter, on affiche la liste pour choisir nouveau creator
  const onCreatorLeaveClick = () => {
    if (!team) return;
    if (team.members.length <= 1) {
      alert("Vous êtes le seul membre, vous ne pouvez pas quitter sans supprimer l'équipe.");
      return;
    }
    setShowTransfer(true);
  };

  // Envoyer la demande transfert creator puis quitter l'équipe
  const handleConfirmLeave = async () => {
    if (!team || !user) return;

    if (!newCreatorId) {
      alert("Veuillez choisir un membre pour devenir le nouveau créateur.");
      return;
    }

    const token = localStorage.getItem('token');

    // Transfert du creator
    const resChangeCreator = await fetch(`http://localhost:5000/api/teams/${id}/transfer-creator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ newCreatorId }),
    });

    if (!resChangeCreator.ok) {
      const errData = await resChangeCreator.json();
      alert('Erreur lors du transfert du créateur : ' + (errData.message || 'Erreur inconnue'));
      return;
    }

    // Quitter l'équipe
    const resLeave = await fetch(`http://localhost:5000/api/teams/${id}/leave`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (resLeave.ok) {
      setMessage('Vous avez quitté l\'équipe.');
      setTeam(null); // ou redirige si besoin
    } else {
      const errorData = await resLeave.json();
      setMessage(errorData.message || 'Erreur lors du départ de l\'équipe');
    }
    setShowTransfer(false);
  };

  const handleLeaveTeam = () => {
    if (!team || !user) return;
    if (user._id === team.creator._id) {
      onCreatorLeaveClick();
    } else {
      // Quitter normalement (non creator)
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

      {/* Popup transfert creator */}
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
