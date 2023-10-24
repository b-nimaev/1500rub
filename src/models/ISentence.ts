import mongoose, { Schema, Document, ObjectId, model } from "mongoose";

interface vote {
    user_id: ObjectId,
    translation_id: ObjectId,
    vote: boolean
}

const voteSchema: Schema<vote> = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    translation_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    vote: { type: Boolean, required: true }
}, {
    timestamps: true
})

export const voteModel = model<vote>("votes", voteSchema)

interface translation {
    _id?: ObjectId;
    sentence_russian?: ObjectId;
    translate_text: string;
    author?: ObjectId;
    votes?: ObjectId[];
    rating?: number;
    reported?: boolean;
    skipped_by?: ObjectId[]
}

const translationSchema: Schema<translation> = new mongoose.Schema({
    sentence_russian: { type: mongoose.Schema.Types.ObjectId, required: false },
    translate_text: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, required: false },
    votes: {  type: [ mongoose.Schema.Types.ObjectId ], required: false },
    rating: { type: Number, required: false, default: 0 },
    reported: { type: Boolean, required: false, default: false },
    skipped_by: { type: [ mongoose.Schema.Types.ObjectId ], required: false }
}, {
    timestamps: true
})

const Translation = model<translation>("Translation", translationSchema);
const ConfirmedTranslations = model<translation>("Translatios_confirmed", translationSchema);

interface active_translator {
    _id?: ObjectId;
    user_id: ObjectId;
}

const ActiveTranslator = model<active_translator>("Active_translator", new Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true }
}, {
    timestamps: {
        createdAt: true
    },
    expireAfterSeconds: 5
}))

interface ISentence {
    _id?: ObjectId;
    author?: ObjectId;
    text: string;
    translations?: ObjectId[];
    accepted?: 'accepted' | 'declined' | 'not view';
    skipped_by?: ObjectId[];
    active_translator?: ObjectId[];
    createdAt?: any;
    updatedAt?: any;
}

const Sentence = model<ISentence>("Sentence", new Schema({
    text: { type: String, required: true },
    author: { type: [ mongoose.Schema.Types.ObjectId ], required: false },
    translations: [{ type: mongoose.Schema.Types.ObjectId, required: false }],
    skipped_by: { type: [ mongoose.Schema.Types.ObjectId ], required: false },
    accepted: { type: String, required: true, default: 'not view' },
    active_translator: [{ type: mongoose.Schema.Types.ObjectId, _id: false, required: false }]
}, {
    timestamps: {
        createdAt: true,
        updatedAt: true
    }
}));

export { Sentence, Translation, ISentence, translation, active_translator, ActiveTranslator, ConfirmedTranslations, vote };