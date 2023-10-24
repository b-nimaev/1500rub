import mongoose, { Schema, model, ObjectId, Date, Document } from "mongoose";

interface IChat {
    _id?: ObjectId,
    user_id: ObjectId,
    name?: string,
    context?: {
        role?: string,
        content?: string
    }[]
}

const ChatModel = model<IChat>('Chat', new Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true, unique: false },
    name: { type: String, required: false, unique: false },
    context: { type: [{ role: String, content: String }], _id: false, required: false }
}));

export { ChatModel, IChat }
