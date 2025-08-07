import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Team {
  _id: string;
  name: string;
}

interface Request {
  _id: string;
  teamId: Team;
  status: string;
  requestedAt: string;
}

interface Scrim {
  _id: string;
  teamA: Team;
  teamB?: Team;
  datetime: string;
  matchType: string;
  minRank: string;
  status: string;
}

const ScrimDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [scrim, setScrim] = useState<Scrim | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loadingScrim, setLoadingScrim] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  const navigate = useNavigate();

  // Charger les infos scrim
  useEffect(() => {
    const fetchScrim = async () => {
      setLoadingScrim(true);
      setError(null);
      try {
        const res = await api.get('/scrims/my');
        const foundScrim = res.data.find((s: Scrim) => s._id === id);
        if (!foundScrim) {
          setError('Scrim non trouvé ou vous n\'êtes pas le créateur');
          setScrim(null);
        } else {
          setScrim(foundScrim);
        }
      } catch {
        setError('Erreur lors du chargement du scrim');
      } finally {
        setLoadingScrim(false);
      }
    };

    if (id) fetchScrim();
  }, [id]);

  // Charger les demandes
  const fetchRequests = async () => {
    if (!id) return;
    setLoadingRequests(true);
    setRequestError(null);
    try {
      const res = await api.get(`/scrims/${id}/requests`);
      setRequests(res.data);
    } catch {
      setRequestError('Erreur lors du chargement des demandes');
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (scrim) {
      fetchRequests();
    }
  }, [scrim]);

  // Accepter ou refuser une demande
  const handleResponse = async (requestId: string, action: 'accept' | 'reject') => {
    if (!id) return;
    setRequestError(null);
    setRequestSuccess(null);
    try {
      await api.post(`/scrims/${id}/respond`, { requestId, action });
      setRequestSuccess(`Demande ${action}ée avec succès.`);
      // Recharger demandes et scrim pour rafraîchir statut
      fetchRequests();

      // Aussi recharger scrim (pour maj teamB et statut)
      const res = await api.get('/scrims/my');
      const foundScrim = res.data.find((s: Scrim) => s._id === id);
      setScrim(foundScrim || null);

      // Si accepté, on peut rediriger vers page match par exemple, ou juste afficher
      if (action === 'accept') {
        // navigate(`/match/${id}`); // si tu as une page match
      }
    } catch {
      setRequestError(`Erreur lors de la mise à jour de la demande.`);
    }
  };

  if (loadingScrim) return <p>Chargement du scrim...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!scrim) return null;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-4">Détail du scrim</h2>

      <div className="mb-6 border rounded p-4 bg-white shadow">
        <p><strong>Équipe créatrice :</strong> {scrim.teamA.name}</p>
        <p><strong>Équipe adverse :</strong> {scrim.teamB?.name || 'En attente d\'adversaire'}</p>
        <p><strong>Date :</strong> {new Date(scrim.datetime).toLocaleString()}</p>
        <p><strong>Type :</strong> {scrim.matchType.toUpperCase()}</p>
        <p><strong>Rang minimum :</strong> {scrim.minRank}</p>
        <p><strong>Statut :</strong> {scrim.status}</p>
      </div>

      <h3 className="text-2xl font-semibold mb-4">Demandes reçues</h3>

      {requestError && <p className="text-red-600 mb-2">{requestError}</p>}
      {requestSuccess && <p className="text-green-600 mb-2">{requestSuccess}</p>}

      {loadingRequests ? (
        <p>Chargement des demandes...</p>
      ) : requests.length === 0 ? (
        <p>Aucune demande en attente.</p>
      ) : (
        <ul className="space-y-4">
          {requests.map(req => (
            <li
              key={req._id}
              className="border p-4 rounded flex justify-between items-center bg-white shadow"
            >
              <div>
                <strong>{req.teamId.name}</strong><br />
                Demandé le {new Date(req.requestedAt).toLocaleString()}
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => handleResponse(req._id, 'accept')}
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Accepter
                </button>
                <button
                  onClick={() => handleResponse(req._id, 'reject')}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Refuser
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6">
        <Link
          to="/scrims"
          className="text-indigo-600 hover:underline"
        >
          ← Retour à la liste des scrims
        </Link>
      </div>
    </div>
  );
};

export default ScrimDetail;
