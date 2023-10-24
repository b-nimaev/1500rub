import { ExtraEditMessageText } from "telegraf/typings/telegram-types"
import rlhubContext from "../../models/rlhubContext"
import format_money from "../../utlis/format_money"
import greeting from "./greeting"
import { IPayment, Payment } from "../../../models/IPayment";
const QiwiBillPaymentsAPI = require('@qiwi/bill-payments-node-js-sdk');

const secret_key: string | undefined = process.env.secret_key;
// const publicKey: string | undefined = process.env.public_key;

const qiwiApi = new QiwiBillPaymentsAPI(secret_key);

export async function spb(ctx: rlhubContext) {
    try {
    
        let message: string = `<b>Поддержка проекта 💰</b> \n\n`
        message += `<i>Номер телефона при клике скопируется</i>:\n`
        message += `<i><code>+7 902 531 13 66</code> `
        message += ` по-системе быстрых платежей на Юмани (выбран по-умолчанию)</i> \n\n`
        message += `<i>/check  </i><code>Проверить платеж</code>\n`
        message += `<i>/cancel  </i><code>Отменить операцию</code>`


        ctx.wizard.selectStep(4)

        if (ctx.updateType === 'callback_query') {
            ctx.answerCbQuery('spb')
            await ctx.editMessageText(message, { parse_mode: 'HTML' })
        } else {
            await ctx.reply(message, { parse_mode: 'HTML' })
        }

    
    } catch (error) {

        console.error(error)

    }
}

export default async function help_handler(ctx: rlhubContext) {
    try {

        let message: string = `<b>Поддержка проекта 💰</b> \n\n`
        // await get_link_for_payment(ctx)
        message += `Введите желаемую сумму \n\n`

        message += `Минимальная сумма: 1 ₽\n`
        message += `Максимальная сумма: 60 000 ₽`

        let extra: ExtraEditMessageText = {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Назад',
                            callback_data: 'back'
                        }
                    ]
                ]
            }
        }

        if (ctx.updateType === 'callback_query') {

            if (ctx.update.callback_query.data) {

                let data: 'crypto' | 'spb' | 'back' = ctx.update.callback_query.data

                if (data === 'crypto') {

                    let message: string = `Поддержка проекта 💰 \n\n`
                    message += `Сеть: Bitcoin - BTC. \n\n <code>1NKbc2GzhYu1E7WVBy9YwQ1NwapJLdZQk7</code> \n\n`
                    message += `Сеть: TRON (TRC20) - USDT. \n\n <code>TMnEQyxorwf5PTAQts3Vx21zQvbeEiudRm</code>`

                    const extra: ExtraEditMessageText = {
                        parse_mode: 'HTML',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: 'Success', callback_data: 'success' }],
                                [{ text: 'Back', callback_data: 'back' }]
                            ]
                        }
                    }

                    await ctx.editMessageText(message, extra)
                    ctx.answerCbQuery('crypto')
                    return ctx.wizard.selectStep(6)

                }

                if (data === 'spb') {

                    await spb(ctx)

                }

                if (data === 'back') {

                    ctx.wizard.selectStep(0)
                    ctx.answerCbQuery()

                    await greeting(ctx)

                } else {

                    const amountCb = parseFloat(data.replace('rub', ''))
                    ctx.scene.session.amount = amountCb
                    await reply_payment_info(ctx)

                }

                await ctx.answerCbQuery()

            }

        }

        if (ctx.updateType === 'message') {
            let amount: number = 0

            // @ts-ignore
            if (ctx.message.text) {

                // @ts-ignore
                if (parseFloat(ctx.message.text) > 0 && parseFloat(ctx.message.text) < 60000) {

                    // @ts-ignore
                    amount = parseFloat(ctx.message.text)

                    // @ts-ignore
                } else if (parseFloat(ctx.message.text) > 60000) {
                    amount = 60000
                }

            }

            // cохраняем введенную сумму
            ctx.scene.session.amount = amount

            if (ctx.scene.session.amount) {

                await reply_payment_info(ctx)

            } else {

                await ctx.reply('Введите сумму в цифрах', extra)

            }

        }

    } catch (err) {

        console.log(err)

    }
}

async function reply_payment_info(ctx: rlhubContext) {

    let amount_message: string = `<b>Поддержка проекта 💰</b> \n\n`

    const currentDate = new Date();
    const futureDate = (currentDate.getTime() + 1 * 60 * 60 * 1000);

    let payment: IPayment = await new Payment({
        user_id: ctx.from?.id,
        amount: ctx.scene.session.amount,
        expirationDateTime: futureDate as unknown as Date
    }).save()

    console.log(payment)
    let link: any = await get_link_for_payment(ctx, ctx.scene.session.amount, payment._id.toString(), payment.expirationDateTime)
    amount_message += `Счёт сформирован на сумму ${format_money(ctx.scene.session.amount)} ₽\n`

    let extra: ExtraEditMessageText = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Оплатить',
                        url: link.payUrl
                    }
                ],
                [
                    {
                        text: 'Назад',
                        callback_data: 'back'
                    }
                ]
            ]
        }
    }

    if (ctx.updateType === 'message') {
        await ctx.reply(amount_message, extra)
    } else {
        await ctx.editMessageText(amount_message, extra)
    }

}

async function get_link_for_payment(ctx: rlhubContext, amount: number, billID: string, expirationDateTime: any) {
    try {

        const params = {
            amount: amount.toFixed(2),
            currency: 'RUB',
            account: `${ctx.from?.id}`,
            expirationDateTime: expirationDateTime,
            comment: 'На сохранение бурятского яызыка',
            email: 'alexandrbnimaev@yandex.ru',
            successUrl: `https://profori.pro/telegraf/secret_path/success?billId=${billID}`
        }

        let link = qiwiApi.createBill(billID, params)

        return link

    } catch (err) {

        console.log(err)


    }
}