import { Request, Response } from "express";
import { hashPassword } from "../utils/Password";
import User from "../models/user";
import { createToken, verifyToken } from "../utils/Token";
import History from "../models/history";

export const loginWithEmailPassword = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  let hashedPassword = password;

  const user: any = await User.findOne({ username });

  if (user) {
    if (user.password != hashedPassword) {
      res.status(400).json({ error: "Incorrect username or password." });
    }

    const token = createToken({
      id: user.id,
      username: user.username,
      pf_image: user.pf_image,
    });

    const response = {
      id: user.id,
      username: user.username,
      pf_image: user.pf_image,
      token,
    };

    res.json(response);
  } else {
    res.status(404).json({ error: "Incorrect username or password." });
  }
};

export const registerWithEmailPassword = async (
  req: Request,
  res: Response
) => {
  const { username, password } = req.body;

  try {
    const existedUsername = await User.findOne({ username });
    if (existedUsername) {
      return res.status(401).send({ error: "Username is already existed." });
    }

    const user: any = new User({
      username,
      password,
    });

    await user.save();
  } catch (error) {
    console.error("Error while registering user:", error);
    return res.status(500).send({ error: "Internal server error" });
  }

  res.send({
    message: "User created successfully.\nPlease login to continue.",
  });
};

export const getSessionByToken = async (req: Request, res: Response) => {
  const token = req.body.token;
  if (!token) {
    return res.status(400).send({ error: "Token is required." });
  }

  let decoded;

  try {
    decoded = await verifyToken(token);
    if (!decoded) {
      return res.status(401).send({ error: "Invalid token." });
    }
  } catch (error) {
    console.error("Error while verifying token:", error);
    return res.status(500).send({ error: "Internal server error." });
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    return res.status(404).send({ error: "User not found." });
  }

  const response = {
    id: user.id,
    username: user.username,
    pf_image: user.pf_image,
    token,
  };

  res.json(response);
};

export const getHistories = async (req: Request, res: Response) => {
  const userId = req.params.id;

  try {
    const histories = await History.find({ user_id: userId });
    res.json(histories);
  } catch (error) {
    console.error("Error while getting histories:", error);
    return res.status(500).send({ error: "Internal server error." });
  }
};

export const saveHistory = async (req: Request, res: Response) => {
  const { user_id, score, play_date, play_time } = req.body;

  try {
    const history: any = new History({
      user_id,
      score,
      play_date,
      play_time,
    });

    await history.save();
  } catch (error) {
    console.error("Error while saving history:", error);
    return res.status(500).send({ error: "Internal server error" });
  }

  res.send({ message: "History saved successfully." });
};

export const updateUserName = async (req: Request, res: Response) => {
  const { username, token } = req.body;

  const decoded = await verifyToken(token);
  if (!decoded) {
    return res.status(401).send({ error: "Invalid token." });
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    return res.status(404).send({ error: "User not found." });
  }

  if (user.username === username) {
    return res
      .status(400)
      .send({ error: "New username is the same as the old one." });
  }

  const existedUsername = await User.findOne({ username });
  if (existedUsername) {
    return res.status(401).send({ error: "Username is already existed." });
  }

  user.username = username;
  await user.save();

  res.send({ message: "Username updated successfully." });
};

export const updateProfileImage = async (req: Request, res: Response) => {
  const { pf_image, token } = req.body;

  const decoded = await verifyToken(token);
  if (!decoded) {
    return res.status(401).send({ error: "Invalid token." });
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    return res.status(404).send({ error: "User not found." });
  }

  user.pf_image = pf_image;
  await user.save();

  res.send({ message: "Profile image updated successfully." });
};

export const updatePassword = async (req: Request, res: Response) => {
  const { old_password, new_password, token } = req.body;

  const decoded = await verifyToken(token);
  if (!decoded) {
    return res.status(401).send({ error: "Invalid token." });
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    return res.status(404).send({ error: "User not found." });
  }

  const isMatch = old_password === user.password;
  if (!isMatch) {
    return res.status(400).send({ error: "Incorrect old password." });
  }

  user.password = new_password;
  await user.save();

  res.send({ message: "Password updated successfully." });
};
