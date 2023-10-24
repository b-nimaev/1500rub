import mongoose, { ObjectId, Schema, model } from "mongoose"

export interface IMeaning {
    value: string,
    author: ObjectId,
    createdAt: any,
    updatedAt: any
}

export const meaningWordSchema: Schema<IMeaning> = new mongoose.Schema({
    value: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, required: true }
}, {
    timestamps: {
        createdAt: true,
        updatedAt: true
    }
})

export const meaning = model<IMeaning>("meaning", meaningWordSchema)