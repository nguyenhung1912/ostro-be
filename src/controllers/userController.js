export const authMe = async (req, res) => {
  try {
    return res.status(200).json({ user: req.user });
  } catch (err) {
    console.error("Lỗi khi lấy thông tin người dùng", err);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
