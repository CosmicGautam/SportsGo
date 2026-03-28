import mongoose from "mongoose";

const courtSchema = new mongoose.Schema({
  _id: {
    type: String,  
  },
  name: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  pricePerHour: {
    type: Number,
    required: true,
  },
  amenities: [{
    type: String,
  }],
}, {
  timestamps: true,
  _id: false  
});

export default mongoose.model("Court", courtSchema);
