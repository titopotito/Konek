const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        maxlength: 20,
        minlength: 8,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    friends: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    ],
});

userSchema.static("isAuthenticated", async function (username, password) {
    const foundUser = await User.findOne({ username });
    if (foundUser) {
        const isCorrectPassword = await bcrypt.compare(password, foundUser.password);
        return isCorrectPassword ? { username: foundUser.username, id: foundUser._id } : null;
    }
    return null;
});

userSchema.static("searchUser", async function (userInput) {
    const re = new RegExp(userInput + ".*");
    const users = await User.find(
        { username: { $regex: re, $options: "i" } },
        { _id: 0, username: 1 }
    );
    return users;
});

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
