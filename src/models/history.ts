import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    score: { type: Number, required: true },
    play_date: { type: String, required: true },
    play_time: { type: Number, required: true },
});
    
const History = mongoose.model("history", historySchema);

export default History;
