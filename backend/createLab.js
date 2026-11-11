
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const User = require("./models/User");

async function main() {
  try {
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
      console.log("Usage: node createLab.js EMAIL PASSWORD");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);

    const normalizedEmail = email.toLowerCase();
    const oldUser = await User.findOne({ email: normalizedEmail });

    if (oldUser) {
      console.log("Lab account already exists");
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name: "Shefaa Lab",
      email: normalizedEmail,
      password: hashedPassword,
      phone: "",
      role: "lab",
      status: "active",
    });

    console.log("Lab account created successfully");
    process.exit(0);
  } catch (error) {
    console.log("Error:", error.message);
    process.exit(1);
  }
}

main();
