import { ObjectId } from "mongoose";
import { Context, Scenes } from "telegraf";

interface rlhubWizardSession extends Scenes.WizardSessionData {
    sentence_id?: ObjectId,
    amount: number,
    active_translation: ObjectId,
    moderation_sentence: ObjectId,
    current_sentence_for_translate: ObjectId,
    current_translation_for_vote?: ObjectId,
    current_chat: any,
    mounth: number,
    year: number,
    day: number,
    interface_ln: string,
    link: any,
    russian_dict_word: string,
    buryat_dict_word: string,
    moderation_vocabular_active: ObjectId | undefined
}

interface rlhubSession extends Scenes.WizardSession<rlhubWizardSession> {
    sentences: string[];
    language: 'buryat-word' | 'russian-word';
}

interface rlhubContext extends Context {
    session: rlhubSession;
    scene: Scenes.SceneContextScene<rlhubContext, rlhubWizardSession>;
    wizard: Scenes.WizardContextWizard<rlhubContext>,
    update: any,
    message: any,
    startPayload?: string
}

export default rlhubContext