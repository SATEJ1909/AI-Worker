import { signup, signin } from "./auth.services.js";
import type { Request, Response } from "express";

export const signupHandler = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Let Supabase check for duplicates natively. 
    // If user exists, Supabase throws a "User already registered" error caught below.
    const userData = await signup(email, password);

    return res.status(201).json({
      message: "User created successfully. Please check your email if confirmation is enabled.",
      user: userData,
    });
  } catch (err: any) {
    // Catching Supabase errors cleanly
    return res.status(400).json({ message: err.message });
  }
};

export const loginHandler = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Let Supabase handle the verification natively
    const userData = await signin(email, password);

    return res.status(200).json({
      message: "User logged in successfully",
      session: userData.session, // Contains your JWT access_token
      user: userData.user,
    });
  } catch (error: any) {
    // If user doesn't exist or password is wrong, Supabase returns a 400-level error message
    return res.status(400).json({ message: error.message });
  }
};