import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password?: string;
  googleId?: string;

  languages?: Array<'fr' | 'en' | 'es' | 'de'>;
  location?: string;
  games?: string[];
  riotSummonerName?: string;
  roles?: Array<'top' | 'jungle' | 'mid' | 'adc' | 'support'>;
  age?: number;
  mood?: string[];
  rank?:
    | 'Fer'
    | 'Bronze'
    | 'Argent'
    | 'Or'
    | 'Platine'
    | 'Émeraude'
    | 'Diamant'
    | 'Maître'
    | 'GrandMaître'
    | 'Challenger';
  bio?: string;

  isEmailVerified: boolean;
  emailVerificationTokenHash?: string | null;
  emailVerificationExpires?: Date | null;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      match: /.+\@.+\..+/,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: function (this: any) {
        return !this.googleId;
      },
      select: false,
    },

    googleId: { type: String, unique: true, sparse: true },

    languages: [{ type: String, enum: ['fr', 'en', 'es', 'de'] }],
    location: String,
    games: [String],
    riotSummonerName: { type: String },
    roles: [{ type: String, enum: ['top', 'jungle', 'mid', 'adc', 'support'] }],
    age: Number,
    mood: [String],
    rank: {
      type: String,
      enum: [
        'Fer',
        'Bronze',
        'Argent',
        'Or',
        'Platine',
        'Émeraude',
        'Diamant',
        'Maître',
        'GrandMaître',
        'Challenger',
      ],
    },
    bio: String,

    isEmailVerified: { type: Boolean, default: false },

    emailVerificationTokenHash: { type: String, default: null, select: false },
    emailVerificationExpires: { type: Date, default: null, select: false },
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.emailVerificationTokenHash;
    delete ret.emailVerificationExpires;
    return ret;
  },
});

export default mongoose.model<IUser>('User', userSchema);


