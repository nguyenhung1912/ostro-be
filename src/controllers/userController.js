export const authMe = async (req, res) => {
  try {
    const user = req.user;

    return res.status(200).json({ user });
  } catch (err) {
    console.error("Failed to call authMe", err);
    return res.status(500).json({ message: "System error" });
  }
};

export const test = async (req, res) => {
  return res.sendStatus(204);
};
