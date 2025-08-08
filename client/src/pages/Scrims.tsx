import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import Modal from '../components/Modal';

interface Team {
  _id: string;
  name: string;
}

interface Request {
  _id: string;
  teamId: { _id: string; name: string };
  status: string;
  requestedAt: string;
}

interface Scrim {
  _id: string;
  teamA: Team;
  datetime: string;
  matchType: string;
  minRank: string;
  status: string;
  requests?: Request[];
}

const Scrims: React.FC = () => {
  const [communityScrims, setCommunityScrims] = useState<Scrim[]>([]);
  const [myScrims, setMyScrims] = useState<Scrim[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedScrimId, setSelectedScrimId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchScrimsAndTeams = async () => {
      setLoading(true);
      setError(null);
      try {
        const [teamsRes, communityRes, myRes] = await Promise.all([
          api.get('/teams'),
          api.get('/scrims'),
          api.get('/scrims/my'),
        ]);
        const userTeams: Team[] = teamsRes.data;
        setTeams(userTeams);
        const filteredCommunityScrims = communityRes.data.filter(
          (scrim: Scrim) => !userTeams.some(team => team._id === scrim.teamA._id)
        );
        setCommunityScrims(filteredCommunityScrims);
        setMyScrims(myRes.data);
      } catch (err) {
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };
    fetchScrimsAndTeams();
  }, []);

  const openModal = (scrimId: string) => {
    setSelectedScrimId(scrimId);
    setSelectedTeamId(null);
    setRequestError(null);
    setRequestSuccess(null);
    setModalOpen(true);
  };

  const sendRequest = async () => {
    if (!selectedScrimId || !selectedTeamId) return;

    setRequesting(true);
    setRequestError(null);
    setRequestSuccess(null);

    try {
      await api.post(`/scrims/${selectedScrimId}/request`, {
        teamId: selectedTeamId,
      });
      setRequestSuccess('Demande envoyée avec succès !');
      // Refresh scrims communauté
      const communityRes = await api.get('/scrims');
      const filteredCommunityScrims = communityRes.data.filter(
        (scrim: Scrim) => !teams.some(team => team._id === scrim.teamA._id)
      );
      setCommunityScrims(filteredCommunityScrims);
      setModalOpen(false);
    } catch (error: any) {
      setRequestError(error.response?.data?.message || 'Erreur lors de la demande');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <p>Chargement des scrims...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-indigo-700">Scrims disponibles</h1>
        <Link
          to="/scrims/create"
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-500"
        >
          Créer un scrim
        </Link>
      </div>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Mes scrims</h2>
        {myScrims.length === 0 ? (
          <p>Vous n'avez pas encore créé de scrims.</p>
        ) : (
          <ul className="space-y-4">
            {myScrims.map(scrim => (
              <li
                key={scrim._id}
                className="border p-4 rounded hover:shadow cursor-pointer"
              >
                <Link to={`/scrims/${scrim._id}`}>
                  <strong>{scrim.teamA.name}</strong> — {new Date(scrim.datetime).toLocaleString()} — {scrim.matchType.toUpperCase()} — Rang min : {scrim.minRank} — Statut : {scrim.status}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Scrims communautaires</h2>
        {communityScrims.length === 0 ? (
          <p>Aucun scrim disponible.</p>
        ) : (
          <ul className="space-y-4">
            {communityScrims.map(scrim => {
              // Check si l'utilisateur a déjà fait une demande avec une de ses équipes
              const alreadyRequested = scrim.requests?.some(r =>
                teams.some(t => t._id === r.teamId._id)
              );

              return (
                <li
                  key={scrim._id}
                  className="border p-4 rounded flex justify-between items-center"
                >
                  <div>
                    <strong>{scrim.teamA.name}</strong> — {new Date(scrim.datetime).toLocaleString()} — {scrim.matchType.toUpperCase()} — Rang min : {scrim.minRank} — Statut : {scrim.status}
                  </div>
                  <button
                    onClick={() => openModal(scrim._id)}
                    disabled={alreadyRequested}
                    className={`ml-4 px-4 py-2 rounded text-white ${
                      alreadyRequested ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500'
                    }`}
                  >
                    {alreadyRequested ? 'Déjà demandé' : 'Demander ce scrim'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Modal demande scrim */}
      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)}>
        <h3 className="text-xl font-semibold mb-4">Demander ce scrim</h3>
        {requestError && <p className="text-red-600 mb-2">{requestError}</p>}
        {requestSuccess && <p className="text-green-600 mb-2">{requestSuccess}</p>}

        <label htmlFor="team-select" className="block mb-2">Choisir une équipe :</label>
        <select
          id="team-select"
          value={selectedTeamId ?? ''}
          onChange={(e) => setSelectedTeamId(e.target.value)}
          className="w-full border p-2 rounded mb-4"
        >
          <option value="" disabled>-- Sélectionner une équipe --</option>
          {teams.map(team => (
            <option key={team._id} value={team._id}>{team.name}</option>
          ))}
        </select>

        <div className="flex justify-end space-x-2">
          <button
            onClick={() => setModalOpen(false)}
            className="px-4 py-2 rounded border"
          >
            Annuler
          </button>
          <button
            onClick={sendRequest}
            disabled={requesting || !selectedTeamId}
            className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-gray-400"
          >
            {requesting ? 'Envoi...' : 'Envoyer la demande'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Scrims;
