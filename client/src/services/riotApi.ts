//Récup data riot via backend
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export async function fetchRiotData(riotId: string) {
  const res = await fetch(`${API_URL}/api/riot/data/${encodeURIComponent(riotId)}`);
  if (!res.ok) throw new Error('Erreur récupération données Riot');
  return res.json();
}
