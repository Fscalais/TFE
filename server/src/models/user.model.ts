import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { 
  type: String, 
  required: true, 
  unique: true, 
  match: /.+\@.+\..+/,
  index: true,
},
  password: {
    type: String,
    required: function(this: any) {
      return !this.googleId;
    }
  },
  googleId: { type: String, required: false, unique: true, sparse: true },

  languages: [{ type: String, enum: ['fr', 'en', 'es', 'de'] }],
  location:        String,
  games:           [String],
  riotSummonerName: { type: String },
  roles: [{ type: String, enum: ['top', 'jungle', 'mid', 'adc', 'support'] }],
  age:             Number,
  mood:            [String],
  rank: { type: String, enum: ["Fer","Bronze","Argent","Or","Platine","Émeraude","Diamant","Maître","GrandMaître","Challenger"] },
  bio:             String,
}, { timestamps: true });

export default mongoose.model('User', userSchema);

