import { ObjectId } from "mongodb"
import { ISentence, Sentence } from "../../../models/ISentence"
import rlhubContext from "../../models/rlhubContext"
import greeting from "./greeting"

import moderation_sentences_render from "./sentencesRender"

export async function moderation_sentences_handler(ctx: rlhubContext) {
    try {

        let update = ctx.updateType

        if (update === 'callback_query') {

            let data: 'back' | 'good' | 'bad' = ctx.update.callback_query.data

            if (data === 'back') {
                ctx.scene.enter('moderation')
            }

            if (data === 'good') {
                await updateSentence(ctx, 'accepted')
            }

            if (data === 'bad') {
                await updateSentence(ctx, 'declined')
            }

            ctx.answerCbQuery()

        }

    } catch (err) {
        console.log(err)
    }
}

export async function updateSentence(ctx: rlhubContext, value: 'accepted' | 'declined' | 'not view') {


    await Sentence.findByIdAndUpdate(ctx.session.__scenes.moderation_sentence, { $set: { 'accepted': value } })
        .then(async (sentence: ISentence | null) => {
            if (sentence) {
            
                if (sentence.accepted === 'accepted') {
                    return ctx.answerCbQuery('Предложение принято ✅')
                }
                
                if (sentence.accepted === 'declined') {
                    return ctx.answerCbQuery('Предложение отправлено на рассмотрение')
                }

            }
            
        }).catch(async (error) => { console.error(error); await greeting(ctx) })

    await moderation_sentences_render(ctx)

}

