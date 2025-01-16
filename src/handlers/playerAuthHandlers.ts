import { Request, Response } from "express";
import { hashPassword } from "../utils/Password";
import User from "../models/user";
import { createToken, verifyToken } from "../utils/Token";
import bcrypt from "bcrypt";
import History from "../models/history";

export const loginWithEmailPassword = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  let hashedPassword = password


  let user: any = null;
  const userEmail: any = await User.findOne({ email: email });
  const userName: any = await User.findOne({ username: email });

  if (userEmail) user = userEmail;
  if (userName) user = userName;

  if (user) {
    if (user.password != hashedPassword) {
      res.status(400).json({ error: "Incorrect password" });
    }

    const token = createToken({ id: user.id, username: user.username, email: user.email, pf_image: user.pf_image });

    const response = {
      id: user.id,
      email: user.email,
      username: user.username,
      token,
    };

    res.json(response);
  } else {
    res.status(404).json({ error: "User not found" });
  }
};

export const registerWithEmailPassword = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  try {

    const existedEmail = await User.findOne({ email });
    if (existedEmail) {
      return res.status(402).send({ error: "Email is already existed" });
    }
    
    const existedUsername = await User.findOne({ username });
    if (existedUsername) {
      return res.status(401).send({ error: "Username is already existed" });
    }
    
    let hashedPassword = password;
    
    const user: any = new User({
      username,
      email,
      password: hashedPassword,
    });
    
    await user.save();
  } catch (error) {
    console.error("Error while registering user:", error);
    return res.status(500).send({ error: "Internal server error" });
  }

  res.send({ message: "User created successfully" });
};

export const getSessionByToken = async (req: Request, res: Response) => {
  const token = req.body.token;
  if (!token) {
    return res.status(400).send({ error: "Token is required" });
  }

  const decoded = await verifyToken(token);
  if (!decoded) {
    return res.status(401).send({ error: "Invalid token" });
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    return res.status(404).send({ error: "User not found" });
  }


  const response = {
    id: user.id,
    email: user.email,
    username: user.username,
    token,
  };

  res.json(response);
}

export const getHistories = async (req: Request, res: Response) => {
  const userId = req.params.id;

  console.log("User ID:", userId);

  try {

    const histories = await History.find({user_id: userId});
    res.json(histories);
  
  } catch (error) {
    console.error("Error while getting histories:", error);
    return res.status(500).send({ error: "Internal server error" });
  }

}

export const saveHistory = async (req: Request, res: Response) => {
  const { user_id, score, play_date, play_time } = req.body;

  try {

    const history: any = new History({
      user_id,
      score,
      play_date,
      play_time
    });
    
    await history.save();
  } catch (error) {
    console.error("Error while saving history:", error);
    return res.status(500).send({ error: "Internal server error" });
  }

  res.send({ message: "History saved successfully" });
}