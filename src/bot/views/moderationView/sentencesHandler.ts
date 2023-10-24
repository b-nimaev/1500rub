import rlhubContext from "../../models/rlhubContext"
import { greeting } from "../home.scene"
import { updateSentence } from "./moderationSentencesHandler"
import moderation_sentences_render from "./sentencesRender"

export default async function moderation_sentences_handler(ctx: rlhubContext) {
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

        } else {

            await moderation_sentences_render(ctx)

        }

    } catch (err) {

        console.log(err)

    }
}