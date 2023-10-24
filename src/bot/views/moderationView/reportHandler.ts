import { IReport, ReportModel } from "../../../models/IReport"
import { IUser, User } from "../../../models/IUser"
import rlhubContext from "../../models/rlhubContext"
import moderation_translates_render from "./moderationTranslates"
import report_section_render from "./reportRender"


export default async function moderation_report_handler(ctx: rlhubContext) {

    try {

        if (ctx.updateType === 'callback_query' || ctx.updateType === 'message') {


            if (ctx.updateType === 'callback_query') {
                if (ctx.update.callback_query.data === 'continue' || ctx.update.callback_query.data === 'back') {
                    await moderation_translates_render(ctx)
                }
            }

            if (ctx.updateType === 'message') {

                // отправка жалобы в канал
                let senderReport = await ctx.telegram.forwardMessage('-1001952917634', ctx.update.message.chat.id, ctx.message.message_id)
                let user: IUser | null = await User.findOne({
                    id: ctx.from?.id
                })

                if (user && user._id && ctx.scene.session.current_translation_for_vote) {

                    const report: IReport = {
                        user_id: user._id,
                        translation_id: ctx.scene.session.current_translation_for_vote,
                        message_id: senderReport.message_id
                    }

                    await new ReportModel(report).save().then(async (report) => {
                        await User.findOneAndUpdate({
                            id: ctx.from?.id
                        }, {
                            $push: {
                                reports: report._id
                            }
                        })
                    })

                }

                let message: string = `<b>Спасибо!</b> \nВаше сообщение принято на рассмотрение.`
                await ctx.reply(message, {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Вернуться к модерации', callback_data: 'continue' }]
                        ]
                    }
                })

            }

        } else {

            await report_section_render(ctx)

        }

        ctx.answerCbQuery()

    } catch (err) { console.error(err) }

}
