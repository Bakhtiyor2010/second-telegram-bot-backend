const Admin = require("../models/Admin");

async function attachAdmin(req, res, next) {
  const adminId = req.header("admin-id");
  if (!adminId) return next();

  try {
    const admin = await Admin.findById(adminId);
    if (admin) req.admin = admin;
    next();
  } catch (err) {
    console.error(err);
    next();
  }
}

module.exports = attachAdmin;