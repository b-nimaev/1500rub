import mongoose, { ObjectId, Schema, model } from "mongoose"

export interface buryat_word {
    value: string,
    author: ObjectId,
    meaning?: ObjectId[],
    translations?: ObjectId[],
    createdAt: any,
    updatedAt: any
}

const buryatWordSchema: Schema<buryat_word> = new mongoose.Schema({
    value: { type: String, required: true },
    translations: { type: [mongoose.Schema.Types.ObjectId], required: false },
    meaning: { type: [mongoose.Schema.Types.ObjectId], required: false },
    author: { type: mongoose.Schema.Types.ObjectId, required: true }
}, {
    timestamps: {
        createdAt: true,
        updatedAt: true
    }
})

export const buryatWordModel = model<buryat_word>("buryat_word", buryatWordSchema)
