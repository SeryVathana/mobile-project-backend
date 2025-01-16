import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: false, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  pf_image: { type: String, required: false },
});

const User = mongoose.model("user", userSchema);

export default User;
