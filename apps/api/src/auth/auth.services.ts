import { supabase } from "../config/supabase.js";

export async function signup(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function logout(accessToken: string) {
  // Use admin sign out to explicitly sign a user out by their token on the backend
  const { error } = await supabase.auth.admin.signOut(accessToken);
  if (error) {
    throw new Error(error.message);
  }
}