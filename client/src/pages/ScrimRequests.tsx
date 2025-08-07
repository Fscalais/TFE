import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface Request {
  _id: string;
  teamId: { _id: string; name: string };
  status: string;
  requestedAt: string;
}

interface Props {
  scrimId: string;
}

const ScrimRequests: React.FC<Props> = ({ scrimId }) => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/scrims/${scrimId}/requests`);
      setRequests(res.data);
    } catch {
      setError('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [scrimId]);

  const handleResponse = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      await api.post(`/scrims/${scrimId}/respond`, { requestId, action });
      fetchRequests(); // rafraîchir la liste après action
    } catch {
      alert('Erreur lors de la mise à jour de la demande');
    }
  };

  if (loading) return <p>Chargement...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (requests.length === 0) return <p>Aucune demande en attente</p>;

  return (
    <div className="mt-6 p-4 border rounded shadow-md bg-white max-w-lg mx-auto">
      <h3 className="text-xl font-semibold mb-4">Demandes de scrim</h3>
      <ul>
        {requests.map(req => (
          <li key={req._id} className="mb-3 p-3 border rounded flex justify-between items-center">
            <div>
              <strong>{req.teamId.name}</strong> — demandé le {new Date(req.requestedAt).toLocaleString()}
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
    </div>
  );
};

export default ScrimRequests;
