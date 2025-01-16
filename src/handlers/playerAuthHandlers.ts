import { Request, Response } from "express";
import { hashPassword } from "../utils/Password";
import User from "../models/user";
import { createToken } from "../utils/Token";

export const loginWithEmailPassword = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const hashedPassword = hashPassword(password);

  let user: any = null;
  const userEmail: any = await User.findOne({ email: email });
  const userName: any = await User.findOne({ username: email });

  if (userEmail) user = userEmail;
  if (userName) user = userName;

  if (user) {
    if (user.password != hashedPassword) {
      res.status(400).json({ error: "Incorrect password" });
    }

    const token = createToken({ id: user.id, username: user.username, email: user.email });

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

  const existedEmail = await User.findOne({ email });
  if (existedEmail) {
    return res.status(402).send({ error: "Email is already existed" });
  }

  const existedUsername = await User.findOne({ username });
  if (existedUsername) {
    return res.status(401).send({ error: "Username is already existed" });
  }

  const hashedPassword = hashPassword(password);

  const user: any = new User({
    username,
    email,
    password: hashedPassword,
  });

  await user.save();

  res.send({ message: "User created successfully" });
};
