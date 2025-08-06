interface SearchCriteria {
  userId: string;      // l’ID du joueur (à récupérer depuis le token ou client)
  language: string;
  role: string;
  mood: string;
}

const waitingPlayers: SearchCriteria[] = [];

export function addPlayerToQueue(criteria: SearchCriteria) {
  waitingPlayers.push(criteria);
  console.log("Joueur ajouté à la file d'attente:", criteria);
}

export function getWaitingPlayers() {
  return waitingPlayers;
}
