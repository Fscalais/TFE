import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  requestedAt: { type: Date, default: Date.now },
});

const scrimSchema = new mongoose.Schema(
  {
    teamA: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    teamB: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    datetime: { type: Date, required: true },
    status: {
      type: String,
      enum: ['open', 'pending', 'confirmed', 'cancelled', 'finished'],
      default: 'open',
    },
    matchType: { type: String, enum: ['bo1', 'bo3', 'bo5'], default: 'bo1' },
    minRank: {
      type: String,
      enum: ['bronze','silver','gold','platinum','diamond','master','grandmaster','challenger'],
      default: 'bronze',
    },
    requests: [requestSchema],

    discordInvite: { type: String, default: null },
    discordRoomId: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Scrim', scrimSchema);

