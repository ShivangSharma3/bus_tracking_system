import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  driverId: { type: String, required: true },
  driverName: { type: String, required: true },
  busId: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD format
  time: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  tripType: { type: String, enum: ['home-to-campus', 'campus-to-home'], required: true },
  presentStudents: [{
    rollNo: String,
    name: String,
    email: String
  }],
  absentStudents: [{
    rollNo: String,
    name: String,
    email: String
  }],
  totalStudents: { type: Number, required: true },
  route: String,
  notes: String
});

// Compound index to ensure unique records per bus, date, and trip type
attendanceSchema.index({ busId: 1, date: 1, tripType: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
