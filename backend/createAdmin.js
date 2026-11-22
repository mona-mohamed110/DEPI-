const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();
const User = require("./models/User");

async function main() {
  try {
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
      console.log("Usage: node createAdmin.js EMAIL PASSWORD");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);

    const oldUser = await User.findOne({ email: email.toLowerCase() });
    if (oldUser) {
      console.log("Email already exists");
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name: "Admin",
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "admin",
      status: "active",
    });

    console.log("Admin created");
    process.exit(0);
  } catch (error) {
    console.log("Error:", error.message);
    process.exit(1);
  }
}

main();