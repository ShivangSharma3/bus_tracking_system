import mongoose from "mongoose";

const busRouteSchema = new mongoose.Schema({
  busId: { type: String, required: true, unique: true },
  busNumber: { type: String, required: true },
  route: { type: String, required: true },
  driver: { type: String, required: true },
  stops: [String],
  coordinates: [{
    lat: Number,
    lng: Number,
    name: String
  }]
});

export default mongoose.model("BusRoute", busRouteSchema);
