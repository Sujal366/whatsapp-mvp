import supabase from "../supabaseClient.js";

const getProducts = async (req, res) => {
  const { data, error } = await supabase.from("products").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

const addProduct = async (req, res) => {
  const { name, description, price, stock } = req.body;
  const { data, error } = await supabase
    .from("products")
    .insert([{ name, description, price, stock }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
};

export { getProducts, addProduct };
