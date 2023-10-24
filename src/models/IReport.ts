import mongoose, { Schema, model, ObjectId, Date, Document } from "mongoose";

interface IReport {
    user_id: ObjectId,
    translation_id: ObjectId,
    message_id: number,
}

const ReportModel = model<IReport>('Report', new Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    translation_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    message_id: { type: Number, required: true },
}));

export { ReportModel, IReport }
