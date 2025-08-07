export interface IUser {
  _id?: string;
  username: string;
  email: string;
  password?: string;
  googleId?: string;
  languages?: ('fr' | 'en' | 'es' | 'de')[];
  location?: string;
  games?: string[];
  riotSummonerName?: string;
  roles?: ('top' | 'jungle' | 'mid' | 'adc' | 'support')[];
  age?: number;
  mood?: string[];
  rank?: string;
  bio?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
