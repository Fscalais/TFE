import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface Request {
  _id: string;
  teamId: string;
  status: string;
}

interface Scrim {
  _id: string;
  datetime: string;
  matchType: string;
  minRank: string;
  status: string;
  requests: Request[];
  teamA: { _id: string; name: string };
  teamB?: { _id: string; name: string };
}

const MyScrims: React.FC = () => {
  const [scrims, setScrims] = useState<Scrim[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMyScrims = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/scrims/my'); // Il faudra exposer cette route côté backend
      setScrims(res.data);
    } catch {
      setError('Erreur lors du chargement des scrims');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyScrims();
  }, []);

  const respondRequest = async (scrimId: string, requestId: string, action: 'accept' | 'reject') => {
    try {
      await api.post(`/scrims/${scrimId}/respond`, { requestId, action });
      fetchMyScrims();
    } catch {
      alert('Erreur lors de la mise à jour de la demande');
    }
  };

  if (loading) return <p>Chargement...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h1>Mes Scrims</h1>
      {scrims.length === 0 && <p>Vous n'avez aucun scrim en cours.</p>}
      {scrims.map(scrim => (
        <div key={scrim._id} style={{ border: '1px solid gray', padding: '1rem', marginBottom: '1rem' }}>
          <p><strong>Date :</strong> {new Date(scrim.datetime).toLocaleString()}</p>
          <p><strong>Type :</strong> {scrim.matchType.toUpperCase()}</p>
          <p><strong>Rang minimum :</strong> {scrim.minRank}</p>
          <p><strong>Statut :</strong> {scrim.status}</p>

          <h3>Demandes reçues :</h3>
          {scrim.requests.length === 0 && <p>Aucune demande</p>}
          {scrim.requests.map(req => (
            <div key={req._id} style={{ marginBottom: '0.5rem' }}>
              <span>ID équipe demandeuse: {req.teamId}</span>
              <span> - Statut: {req.status}</span>
              {req.status === 'pending' && (
                <>
                  <button onClick={() => respondRequest(scrim._id, req._id, 'accept')}>Accepter</button>
                  <button onClick={() => respondRequest(scrim._id, req._id, 'reject')}>Refuser</button>
                </>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default MyScrims;
