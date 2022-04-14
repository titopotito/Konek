const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: String,
    password: String,
    email: String,
});

const User = mongoose.model("User", userSchema);

// const seedUsers = [
//     {
//         username: "James",
//         password: "taniniwonderhaplas",
//         email: "email@yahoo.com",
//     },
//     {
//         username: "Eli",
//         password: "ambot123",
//         email: "eli@yahoo.com",
//     },
// ];

// const deleteAll = async () => {
//     const userList = await User.find({});
//     await User.deleteMany({ userList });
//     for (let userData of seedUsers) {
//         let newUser = new User(userData);
//         newUser.save((error) => {
//             if (error) console.log(error);
//         });
//     }
// };

// deleteAll();

module.exports = User;
