import { Composer, Scenes } from "telegraf";
import { ConfirmedTranslations, ISentence, Sentence, Translation, translation, voteModel } from "../../models/ISentence";
import rlhubContext from "../models/rlhubContext";
import { IUser, User } from "../../models/IUser";
import greeting from "./moderationView/greeting";

import { ObjectId, Schema } from "mongoose";

// handlers and renders 
import { ExtraEditMessageText } from "telegraf/typings/telegram-types";
import { translationPairModel, translation_pair } from "../../models/IVocabular";
import { buryatWordModel, buryat_word } from "../../models/vocabular/IBuryatWord";
import { russianWordModel, russian_word } from "../../models/vocabular/IRussianWord";

/**
 * Report section
 */
import moderation_report_handler from "./moderationView/reportHandler";
import report_section_render from "./moderationView/reportRender";

/**
 * Sentences section
 */
import moderation_sentences_render from "./moderationView/sentencesRender";


import moderation_translates_render from "./moderationView/moderationTranslates";
import moderation_sentences_handler from "./moderationView/sentencesHandler";

const handler = new Composer<rlhubContext>();
const moderation = new Scenes.WizardScene("moderation", handler,
    async (ctx: rlhubContext) => moderation_sentences_handler(ctx),
    async (ctx: rlhubContext) => moderation_translates_handler(ctx),
    async (ctx: rlhubContext) => moderation_report_handler(ctx),
    async (ctx: rlhubContext) => moderation_vocabular_handler(ctx)
)


moderation.enter(async (ctx: rlhubContext) => await greeting(ctx));

moderation.action("moderation_sentences", async (ctx) => await moderation_sentences_render(ctx))
moderation.action("report", async (ctx) => await report_section_render(ctx))
moderation.action("moderation_translates", async (ctx) => await moderation_translates_render(ctx))

async function updateRating(translation: ObjectId) {

    console.log('Получаем рейтинг ...')

    // получаем все голоса перевода
    const votes: boolean | Schema.Types.ObjectId[] | undefined = await Translation.findById(translation)
        .then(async (document: translation | null) => {

            if (document) {

                return document.votes

            } else {

                return false

            }

        }).catch(async (error) => {

            console.error(error)
            return false

        })

    if (votes === false) {

        return false

    } else {

        // if (typeof (votes) === 'undefined' || typeof (votes) !== 'boolean') {
        //     return false
        // }

        console.log(votes)

        let rating: number = 0

        let pluses = 0
        let minuses = 0

        if (!votes) {
            return false
        }

        // @ts-ignore
        for (let i = 0; i < votes.length; i++) {
            
            // @ts-ignore
            let voteDocument = await voteModel.findById(votes[i])

            if (voteDocument) {

                if (voteDocument.vote === true) {
                    pluses = pluses + 1
                } else {
                    minuses = minuses + 1
                }

            }

        }

        console.log(`pluses: ${pluses}`)
        console.log(`minuses: ${minuses}`)

        rating = pluses - minuses
        // console.log(rating)
        return rating

    }
}

async function ratingHandler(translation: ObjectId | undefined) {
    if (translation) {

        if (!translation) {
            return false
        }

        const rating: number | false = await updateRating(translation)

        console.log(rating)

        if (rating) {

            await Translation.findByIdAndUpdate(translation, {

                $set: {
                    rating: rating
                }

            }).then(async (newtranslation: translation | null) => {

                if (rating >= 5) {

                    await new ConfirmedTranslations(newtranslation).save()
                    await Translation.findByIdAndDelete(newtranslation?._id)

                }

            })
        }

    }
}
// обрабатываем голос
async function moderation_translates_handler(ctx: rlhubContext) {
    if (ctx.updateType === 'callback_query') {

        // сохраняем коллбэк
        let data: 'back' | 'addTranslate' | 'good' | 'bad' | 'skip' = ctx.update.callback_query.data
        let translate_id: ObjectId | undefined = ctx.scene.session.current_translation_for_vote

        let user = await User.findOne({ id: ctx.from?.id })

        if (user) {
            if (data === 'good') {

                // Сохраняем голос +
                await new voteModel({ user_id: user?._id, translation_id: translate_id, vote: true }).save().then(async (data) => {

                    // Возвращаем _id сохранненого голоса
                    let vote_id = data._id

                    // пушим в массив голосов докумена перевода
                    await Translation.findByIdAndUpdate(translate_id, { $push: { votes: vote_id } })
                    await ratingHandler(translate_id)

                    await User.findOneAndUpdate({ _id: user?._id }, { $addToSet: { voted_translations: translate_id } })

                })

                await moderation_translates_render(ctx)

            } else if (data === 'bad') {

                // сохраняем голос -
                await new voteModel({ user_id: user?._id, translation_id: translate_id, vote: false }).save().then(async (data) => {

                    // вернули айдишку
                    let vote_id = data._id

                    await User.findOneAndUpdate({ _id: user?._id }, { $addToSet: { voted_translations: translate_id } })
                    // сохранили айдишку в документе перевода
                    await Translation.findOneAndUpdate({ _id: translate_id }, { $push: { votes: vote_id } })
                        .then(async (translation) => await ratingHandler(translation?._id))
                })

                await moderation_translates_render(ctx)

            } else if (data === 'skip') {

                await Translation.findByIdAndUpdate(translate_id, {
                    $push: {
                        skipped_by: user._id
                    }
                })

            }
        } else {
            ctx.wizard.selectStep(0)
            await greeting(ctx)
        }

        // Если чел хочет вернутьтся на начальный экран модерации
        if (data === 'back') {

            ctx.wizard.selectStep(0)
            await greeting(ctx)

        }

        ctx.answerCbQuery()

    } else {

        await moderation_translates_render(ctx)

    }
}

moderation.action("moderation_vocabular", async (ctx) => await moderation_vocabular(ctx))
async function moderation_vocabular_handler(ctx: rlhubContext) {
    try {

        if (ctx.updateType === 'callback_query') {

            const data: string = ctx.update.callback_query.data

            ctx.answerCbQuery(data)

            if (data === 'good') {

                await translationPairModel.findByIdAndUpdate(ctx.scene.session.moderation_vocabular_active, {
                    $set: {
                        status: 2
                    }
                })

                return await moderation_vocabular(ctx)

            }

            if (data === 'bad') {

                await translationPairModel.findByIdAndUpdate(ctx.scene.session.moderation_vocabular_active, {
                    $set: {
                        status: 1
                    }
                })

                return await moderation_vocabular(ctx)

            }

            if (data === 'skip') {

                const user: IUser | null = await User.findOne({
                    id: ctx.from?.id
                })

                await translationPairModel.findByIdAndUpdate(ctx.scene.session.moderation_vocabular_active, {
                    $set: {
                        status: 0
                    },
                    $addToSet: {
                        skipped_by: user?._id
                    }
                })

                return await moderation_vocabular(ctx)

            }

            if (data === 'report_on_variant') {

                ctx.answerCbQuery('report_on_variant')

                return await moderation_vocabular(ctx)

            }

            if (data === 'back') {

                await ctx.scene.enter('moderation')

            }


        }

    } catch (error) {

        console.error(error)

    }
}

async function moderation_vocabular(ctx: rlhubContext) {
    try {

        const user: IUser | null = await User.findOne({ id: ctx.from?.id })

        let message: string = `Модерация словаря \n\n`

        // const pair: translation_pair | null = await translationPairModel.findOne({
        // status: 0
        // })

        const pair: translation_pair | null = await translationPairModel.aggregate([
            { $match: { skipped_by: { $ne: user?._id }, status: 0 } },
            { $project: { buryat_word: 1, russian_word: 1, author: 1 } },
            { $limit: 1 }
        ]).then(async (doc) => {
            return doc[0]
        })

        if (!pair) {

            if (ctx.updateType === 'callback_query') {
                await greeting(ctx)
                ctx.wizard.selectStep(0)
                return await ctx.answerCbQuery('Не найдено предложенных слов в словарь')

            } else {
                await ctx.reply(`Не найдено предложенных слов в словарь`)
                return await greeting(ctx)

            }

        }

        const author: IUser | null = await User.findById(pair?.author)

        ctx.scene.session.moderation_vocabular_active = pair?._id

        const buryat_word: buryat_word | null = await buryatWordModel.findById(pair?.buryat_word[0])
        const russian_word: russian_word | null = await russianWordModel.findById(pair?.russian_word[0])

        message += `${russian_word?.value} — ${buryat_word?.value} \n\n`
        message += `Автор: <code>${pair?.author}</code> \n`
        message += `Рейтинг автора: ${author?.rating} \n`

        const extra: ExtraEditMessageText = {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '👍', callback_data: 'good' },
                        { text: 'Не знаю', callback_data: 'skip' },
                        { text: '👎', callback_data: 'bad' }
                    ],
                    [{ text: 'Предложить перевод', callback_data: 'suggest_translate' }],
                    [{ text: 'Пожаловаться', callback_data: 'report_on_variant' }],
                    [{ text: 'Назад', callback_data: 'back' }]
                ]
            }
        }


        // тут нужно в message передать модерируемую пару слов !!!

        if (ctx.updateType === 'callback_query') {

            if (user?.permissions?.admin || user?.permissions?.dictionary_moderator) {

                ctx.wizard.selectStep(4)
                return await ctx.editMessageText(message, extra)

            } else {

                return ctx.answerCbQuery('Недостаточно прав')

            }

        } else {

            if (user?.permissions?.admin || user?.permissions?.dictionary_moderator) {

                ctx.wizard.selectStep(4)
                return await ctx.reply(message, extra)

            } else {

                return ctx.reply('Недостаточно прав')

            }

        }

    } catch (error) {
        console.error(error)
    }
}


handler.on("message", async (ctx) => await greeting(ctx))

handler.action("back", async (ctx) => {
    await ctx.answerCbQuery()
    return ctx.scene.enter("home")
})

export default moderation