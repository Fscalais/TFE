export async function fetchRiotData(riotId: string) {
  const res = await fetch(`http://localhost:5000/api/riot/data/${encodeURIComponent(riotId)}`);
  if (!res.ok) throw new Error("Erreur récupération données Riot");
  return res.json();
}
