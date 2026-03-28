import Court from "../models/Court.model.js";

// Get all courts
export const getCourts = async (req, res) => {
  try {
    const courts = await Court.find();
    res.json(courts);
  } catch (error) {
    console.error("Get courts error:", error);
    res.status(500).json({ message: "Error fetching courts" });
  }
};

// Get court by ID
export const getCourtById = async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);
    
    if (!court) {
      return res.status(404).json({ message: "Court not found" });
    }
    
    res.json(court);
  } catch (error) {
    console.error("Get court error:", error);
    res.status(500).json({ message: "Error fetching court" });
  }
};

// Create new court
export const createCourt = async (req, res) => {
  try {
    const { name, location, pricePerHour, amenities } = req.body;
    
    if (!name || !location || !pricePerHour) {
      return res.status(400).json({ 
        message: "Please provide name, location, and price" 
      });
    }
    
    const court = await Court.create({
      name,
      location,
      pricePerHour,
      amenities: amenities || [],
    });
    
    res.status(201).json(court);
  } catch (error) {
    console.error("Create court error:", error);
    res.status(500).json({ message: "Error creating court" });
  }
};

// Update court
export const updateCourt = async (req, res) => {
  try {
    const { name, location, pricePerHour, amenities } = req.body;
    
    const court = await Court.findById(req.params.id);
    
    if (!court) {
      return res.status(404).json({ message: "Court not found" });
    }
    
    if (name) court.name = name;
    if (location) court.location = location;
    if (pricePerHour) court.pricePerHour = pricePerHour;
    if (amenities) court.amenities = amenities;
    
    await court.save();
    
    res.json(court);
  } catch (error) {
    console.error("Update court error:", error);
    res.status(500).json({ message: "Error updating court" });
  }
};

// Delete court
export const deleteCourt = async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);
    
    if (!court) {
      return res.status(404).json({ message: "Court not found" });
    }
    
    await court.deleteOne();
    
    res.json({ message: "Court deleted successfully" });
  } catch (error) {
    console.error("Delete court error:", error);
    res.status(500).json({ message: "Error deleting court" });
  }
};