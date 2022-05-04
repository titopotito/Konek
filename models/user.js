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
});

userSchema.static("isAuthenticated", async function (username, password) {
    const foundUser = await User.findOne({ username });
    if (foundUser) {
        const isCorrectPassword = await bcrypt.compare(
            password,
            foundUser.password
        );
        return isCorrectPassword ? foundUser._id : null;
    }
    return null;
});

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
