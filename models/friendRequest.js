const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const friendRequestSchema = new Schema({
    requestor: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    requestee: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
});

friendRequestSchema.static("sendFriendRequest", async function (requestor, requestee) {
    const friendRequest = {
        requestor: requestor,
        requestee: requestee,
    };

    const newFriendRequest = new FriendRequest(friendRequest);
    const savedFriendRequest = await newFriendRequest.save();
    return savedFriendRequest;
});

const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);

module.exports = FriendRequest;
