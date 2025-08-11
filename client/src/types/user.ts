export interface User {
  id?: string;
  _id?: string
  username: string;
  email: string;
  riotSummonerName?: string;
  location?: string;
  age?: number;
  bio?: string;
  rank?: string;
  mood?: string[];
  languages?: string[];
  games?: string[];
  roles?: string[];
}
