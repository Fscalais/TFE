// src/auth/googleAuth.ts
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import User from '../models/user.model';
import jwt from 'jsonwebtoken';

passport.serializeUser((user: any, done) => {
  done(null, user._id.toString());
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: "http://localhost:5000/auth/google/callback",
},
async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = await User.create({
        googleId: profile.id,
        username: profile.displayName,
        email: profile.emails?.[0].value,
      });
    }
    // Ici, on ne passe QUE l'utilisateur mongoose
    done(null, user);
  } catch (error) {
    done(error, false);
  }
}));

export default passport;

