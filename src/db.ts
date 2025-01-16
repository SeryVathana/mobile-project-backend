import mongoose from "mongoose";

const url = "mongodb+srv://seryvathana:o06EwxKTMW9iko2R@cluster0.dlz7mru.mongodb.net/game-db?retryWrites=true&w=majority&appName=Cluster0"; // Replace with your MongoDB URI

export async function connectToDatabase() {

  console.log("Connecting to MongoDB with Mongoose");

  try {
    await mongoose.connect(url);
    console.log("Connected to MongoDB with Mongoose");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}
