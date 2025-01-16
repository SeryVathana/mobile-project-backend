// db.js
const mongoose = require("mongoose");

const url = "mongodb://localhost:27017/typingrunner"; // Replace with your MongoDB URI

export async function connectToDatabase() {
  try {
    await mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected to MongoDB with Mongoose");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}
