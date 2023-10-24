import mongoose, { Schema, model, ObjectId } from "mongoose";
import { User } from "telegraf/typings/core/types/typegram";
import { vote } from "./ISentence";

interface IUser extends User {
    _id?: ObjectId;
    interface_language?: string;
    chats?: ObjectId[];
    date_of_birth?: {
        day?: number,
        mounth?: number,
        year?: number
    },
    coins?: number,
    gender?: 'male' | 'female' | undefined,
    permissions?: {
        admin?: boolean,
    },
    createdAt?: any
}

const userSchema: Schema<IUser> = new Schema<IUser>({
    id: { type: Number, required: true },
    username: { type: String, required: false },
    first_name: { type: String, required: false },
    last_name: { type: String, required: false },
    coins: { type: Number, required: false },
    date_of_birth: { type: {
        day: { type: Number, required: false },
        mounth: { type: Number, required: false },
        year: { type: Number, required: false }
    }, required: false },
    permissions: {
        type: {
            admin: { type: Boolean, required: false, default: false }
        },
        required: false
    },
    gender: { type: String || undefined, required: false },
    chats: { type: [mongoose.Schema.Types.ObjectId], required: false },
    interface_language: { type: String, required: false },
}, {
    timestamps: true
});

const User = model<IUser>('User', userSchema);

export { User, IUser }
