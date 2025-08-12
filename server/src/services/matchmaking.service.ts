//File d'attente en mémoire pour matchmaking
interface SearchCriteria {
  userId: string;
  languages: string[];
  roles: string[];
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
