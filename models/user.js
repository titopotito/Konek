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

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

const User = mongoose.model("User", userSchema);

// const seedUsers = [
//     {
//         username: "James",
//         password: "taniniwonderhaplas",
//         email: "james@yahoo.com",
//     },
//     {
//         username: "Eli",
//         password: "ambot123",
//         email: "eli@yahoo.com",
//     },
// ];

// const seedDatabase = async () => {
//     const userList = await User.find({});
//     await User.deleteMany({ userList });
//     for (let userData of seedUsers) {
//         let newUser = new User(userData);
//         newUser.save((error) => {
//             if (error) console.log(error);
//         });
//     }
// };

// seedDatabase();

module.exports = User;
