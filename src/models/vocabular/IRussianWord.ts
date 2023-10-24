import mongoose, { ObjectId, Schema, model } from "mongoose"

export interface russian_word {
    value: string,
    author: ObjectId,
    meaning?: ObjectId[],
    translations?: ObjectId[],
    createdAt: any,
    updatedAt: any
}

const russianWordSchema: Schema<russian_word> = new mongoose.Schema({
    value: { type: String, required: true },
    translations: { type: [ mongoose.Schema.Types.ObjectId ], required: false },
    meaning: { type: [mongoose.Schema.Types.ObjectId], required: false },
    author: { type: mongoose.Schema.Types.ObjectId, required: true }
}, {
    timestamps: {
        createdAt: true,
        updatedAt: true
    }
})

export const russianWordModel = model<russian_word>("russian_word", russianWordSchema)
