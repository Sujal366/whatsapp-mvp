import supabase from "../supabaseClient.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const register = async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (existingUser) return res.status(400).json({ msg: "User already exists" });

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert user
  const { data, error } = await supabase
    .from("users")
    .insert([{ name, email, password_hash: hashedPassword }])
    .select();

  if (error) return res.status(500).json({ error: error.message });

  // Create JWT
  const token = jwt.sign({ id: data[0].id, email }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  res.json({ token, user: { id: data[0].id, name, email } });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (!user) return res.status(400).json({ msg: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

  const token = jwt.sign({ id: user.id, email }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
};

export { register, login };
