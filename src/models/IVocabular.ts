import mongoose, { Schema, ObjectId, model } from 'mongoose';

/*
Status
    0 - на модерации
    1 - отклонен
    2 - принят 
*/

export interface translation_pair {
    _id?: ObjectId,
    russian_word: ObjectId[],
    buryat_word: ObjectId[],
    author: ObjectId,
    status: 0 | 1 | 2,
    skipped_by: ObjectId[],
    createdAt: any,
    updatedAt: any
}

const translationPairSchema: Schema<translation_pair> = new mongoose.Schema({
    russian_word: { type: [ mongoose.Schema.Types.ObjectId ], required: true },
    buryat_word: { type: [ mongoose.Schema.Types.ObjectId ], required: true },
    skipped_by: { type: [ mongoose.Schema.Types.ObjectId ], required: false },
    author: { type: mongoose.Schema.Types.ObjectId, required: true },
    status: { type: Number, required: true }
}, {
    timestamps: {
        createdAt: true,
        updatedAt: true
    }
})

export const translationPairModel = model<translation_pair>("translation_pair", translationPairSchema)