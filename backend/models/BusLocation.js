import mongoose from "mongoose";

const busLocationSchema = new mongoose.Schema({
  driverId: { type: String, required: true },
  busId: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  accuracy: Number,
  speed: Number,
  heading: Number,
  timestamp: { type: Date, default: Date.now },
  altitude: Number,
  currentStop: String,
  nextStop: String,
  route: String
});

busLocationSchema.index({ busId: 1, timestamp: -1 });

export default mongoose.model("BusLocation", busLocationSchema);
