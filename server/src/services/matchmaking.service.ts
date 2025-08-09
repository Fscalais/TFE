interface SearchCriteria {
  userId: string;
  languages: string[];
  roles: string[];  // 1..2
  moods: string[];
}
const waitingPlayers: SearchCriteria[] = [];

export function addPlayerToQueue(criteria: SearchCriteria) {
  waitingPlayers.push(criteria);
  console.log("Joueur ajouté à la file d'attente:", criteria);
}
export function getWaitingPlayers() {
  return waitingPlayers;
}
