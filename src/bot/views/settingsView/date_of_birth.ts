import { ExtraEditMessageText } from "telegraf/typings/telegram-types"
import rlhubContext from "../../models/rlhubContext"
import greeting from "./greeting"

export default async function date_birth_handler(ctx: rlhubContext) {
    try {

        let update = ctx.updateType

        if (update === 'message') {
            return await date_birth(ctx)
        }

        if (update === 'callback_query') {

            let data: string = ctx.update.callback_query.data

            let months = [
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December"
            ];

            for (let i = 0; i < months.length; i++) {
                if (months[i] === data) {
                    ctx.scene.session.mounth = i + 2
                    await date_birth_get_years(ctx)
                    ctx.wizard.selectStep(2)
                    // console.log(data)
                }
            }

            // if (months.indexOf(data) !== -1) {
                // ctx.scene.session.mounth = months.data
                // await date_birth_get_years(ctx)
                // ctx.wizard.selectStep(2)
            // }


            if (data === 'back') {
                ctx.wizard.selectStep(0)
                await greeting(ctx)
            }

            ctx.answerCbQuery(data)
        
        } else {

            await date_birth(ctx)
        
        }

    } catch (err) {

        console.log(err)

    }
}

export async function date_birth(ctx: rlhubContext) {
    try {

        let message = 'Настройки / Дата рождения \n\n'
        message += 'Выберите месяц рождения'
        let extra: ExtraEditMessageText = {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'Январь', callback_data: 'January' },
                        { text: 'Февраль', callback_data: 'February' },
                        { text: 'Март', callback_data: 'March' }
                    ],
                    [
                        { text: 'Апрель', callback_data: 'April' },
                        { text: 'Май', callback_data: 'May' },
                        { text: 'Июнь', callback_data: 'June' }
                    ],
                    [
                        { text: 'Июль', callback_data: 'July' },
                        { text: 'Август', callback_data: 'August' },
                        { text: 'Сентябрь', callback_data: 'September' }
                    ],
                    [
                        { text: 'Октябрь', callback_data: 'October' },
                        { text: 'Ноябрь', callback_data: 'November' },
                        { text: 'Декабрь', callback_data: 'December' }
                    ],
                    [{ text: 'Назад', callback_data: 'back' }]
                ]
            }
        }

        if (ctx.updateType === 'callback_query') {
            await ctx.editMessageText(message, extra)
            ctx.wizard.selectStep(1)
            return ctx.answerCbQuery()
        } else {
            await ctx.reply(message, extra)
        }

    } catch (err) {

        console.log(err)

    }
}

export async function date_birth_get_years_handler(ctx: rlhubContext) {
    try {

        if (ctx.updateType === 'callback_query') {

            if (ctx.update.callback_query.data === 'back') {

                return await date_birth(ctx)

            }

            const data: string = ctx.update.callback_query.data;
            const year_from = parseInt(data.split('-')[0]);
            const year_to = parseInt(data.split('-')[1]);

            const temp_arr = [];

            for (let year = year_from; year <= year_to; year++) {
                temp_arr.push({ text: `${year}`, callback_data: `${year}` });
            }

            const chunked_arr = chunkArray(temp_arr, 3);
            chunked_arr.push([{ text: 'Назад', callback_data: 'back' }]);

            const new_extra: ExtraEditMessageText = {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: chunked_arr
                }
            };

            let message = 'Настройки / Дата рождения \n\n'
            message += 'Выберите месяц рождения'

            await ctx.editMessageText(message, new_extra);
            ctx.wizard.selectStep(3)
        } else {

            await date_birth_get_years(ctx)

        }
    }
    catch (error) {

        console.error(error);

    }
}

export async function date_birth_get_years(ctx: rlhubContext) {
    try {

        let message = 'Настройки / Дата рождения \n\n'
        message += 'Выберите год рождения'

        let intervals = [
            "1941-1950",
            "1951-1960",
            "1961-1970",
            "1971-1980",
            "1981-1990",
            "1991-2000",
            "2001-2010",
            "2011-2020",
            "2021-2022"
        ]

        let extra: ExtraEditMessageText = {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: intervals[0], callback_data: intervals[0] },
                        { text: intervals[1], callback_data: intervals[1] },
                        { text: intervals[2], callback_data: intervals[2] },
                    ],
                    [
                        { text: intervals[3], callback_data: intervals[3] },
                        { text: intervals[4], callback_data: intervals[4] },
                        { text: intervals[5], callback_data: intervals[5] },
                    ],
                    [
                        { text: intervals[6], callback_data: intervals[6] },
                        { text: intervals[7], callback_data: intervals[7] },
                        { text: intervals[8], callback_data: intervals[8] },
                    ],
                    [{ text: 'Назад', callback_data: 'back' }]
                ]
            }
        };


        if (ctx.updateType === 'callback_query') {

            await ctx.editMessageText(message, extra)
            ctx.wizard.selectStep(3)
            return ctx.answerCbQuery()

        } else {
            await ctx.reply(message, extra)
        }

    } catch (err) {

        console.log(err)

    }
}

// Функция для разбиения массива на части указанного размера
// Функция для разбиения массива на части указанного размера
function chunkArray(array: any, size: any) {
    const chunkedArray = [];
    for (let i = 0; i < array.length; i += size) {
        const chunk = array.slice(i, i + size);
        chunkedArray.push(chunk);
    }
    return chunkedArray;
}