import { Composer, Scenes } from "telegraf";
import { ExtraEditMessageText } from "telegraf/typings/telegram-types";
import rlhubContext from "../models/rlhubContext";
import greeting from "./dashboardView/greeting";
import help_handler, { spb } from "./dashboardView/helpHandler";
import axios from 'axios';
const path = require('path');  // добавляем модуль path
const pdf2pic = require('pdf2pic');  // Подключаем pdf2pic
const pdf = require('pdf-parse'); // Подключите библиотеку pdf-parse
const fs = require('fs');  // Подключаем модуль fs для работы с файлами
const handler = new Composer<rlhubContext>();
const dashboard = new Scenes.WizardScene("dashboard", handler, 
    async (ctx) => await about_project(ctx), 
    async (ctx) => await help_handler(ctx),
    async (ctx) => await reference_materials_handler(ctx),
    async (ctx: rlhubContext) => await spb_handler(ctx),
    async (ctx: rlhubContext) => await messages_handler(ctx),
    async (ctx: rlhubContext) => await crypto_pay_check(ctx),
    async (ctx: rlhubContext) => await crypto_pay_check_handler(ctx),
    async (ctx: rlhubContext) => await referral_section_handler(ctx)
);

async function referral_section_handler (ctx: rlhubContext) {
    try {

        if (ctx.updateType === 'callback_query') {

            const data: string = ctx.update.callback_query.data

            if (data === 'back') {
                
                ctx.wizard.selectStep(0)
                await greeting(ctx)


            }


        }

    } catch (error) {

        ctx.wizard.selectStep(0)
        await greeting(ctx)
        console.error(error)

    }
}

async function crypto_pay_check_handler(ctx: rlhubContext) {

    try {

        if (ctx.updateType === 'message') {



        }

    } catch (error) {

        console.error(error)

    }

}

async function crypto_pay_check(ctx: rlhubContext) {
    try {

        if (ctx.updateType === 'callback_query') {

            const data: 'back' | 'success' = ctx.update.callback_query.data

            if (data === 'back') {
                await help(ctx)
            }

            if (data === 'success') {

                const message: string = `Введите сумму перевода и сеть криптовалюты, для подтверждения \n\nНапример: <code>0.000456 btc</code>`
                const extra: ExtraEditMessageText = {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'back', callback_data: 'back' }]
                        ]
                    }
                }

                await ctx.editMessageText(message, extra)

            }

        }

    } catch (error) {

        await greeting(ctx)
        ctx.wizard.selectStep(0)
        console.error(error)

    }
}

async function messages_handler (ctx: rlhubContext) {
    try {

        if (ctx.updateType === 'callback_query') {

            let data: 'back' = ctx.update.callback_query.data

            if (data === 'back') {

                ctx.wizard.selectStep(0)
                ctx.answerCbQuery()
                return await greeting(ctx)

            }

        } else {

            await messages(ctx)

        }

    } catch (error) {

        console.error(error)

    }
}

async function spb_handler (ctx: rlhubContext) {
    try {

        if (ctx.updateType === 'message') {

            if (ctx.update.message.text) {

                const message: string = ctx.update.message.text

                if (message === '/check') {

                    let reply_message: string = `Ваш перевод принят \nСпасибо 😇\n\n`
                    reply_message += `После подтверждения зачисления, вам будет начислен рейтинг и присвоен соответствующий статус`

                    await ctx.reply(reply_message, { parse_mode: 'HTML' })
                    ctx.wizard.selectStep(0)
                    return greeting(ctx)

                }

                if (message === '/cancel') {



                }

                return spb(ctx)
                

            }

        }
        
    } catch (error) {

        console.error(error)

    }
}

// Секция справочных материалов

async function reference_materials_handler(ctx: rlhubContext) {
    try {

        if (ctx.updateType === 'callback_query') {

            let data: 'back' = ctx.update.callback_query.data

            if (data === 'back') {

                ctx.wizard.selectStep(0)
                await greeting(ctx)

            }

            ctx.answerCbQuery()
        }

    } catch (error) {
        
        console.error(error)

    }
}

async function reference_materials(ctx: rlhubContext) {
    try {

        let message: string = `<b>Справочные материалы</b>\n\n`

        message += `Здесь вы можете поделиться своими справочными материалами и обогатить базу знаний сообщества, а также находить полезные материалы, предоставленные другими пользователями. \n\n`
        message += `Независимо от того, ищете ли вы информацию для учебы, работы или личного развития, эта секция позволит вам легко находить и делиться ценными ресурсами.`

        let extra: ExtraEditMessageText = {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ callback_data: 'add', text: 'Загрузить файл' }],
                    [{ callback_data: 'back', text: 'Назад' }]
                ]
            }
        }

        if (ctx.updateType === 'callback_query') {

            await ctx.editMessageText(message, extra)

        } else {

            await ctx.reply(message, extra)

        }

        ctx.wizard.selectStep(3)

    } catch (error) {
        console.error(error)
    }
}

dashboard.enter(async (ctx: rlhubContext) => {
    
    await greeting(ctx)

});

dashboard.action("referral", async (ctx: rlhubContext) => {
    try {

        const message: string = `<b>Реферальная программа</b> \n\nВаша реферальная ссылка: <code>https://t.me/burlive_test_bot?start=ref_${ctx.from?.id}</code>`
        const extra: ExtraEditMessageText = {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'back', callback_data: 'back' }]
                ]
            }
        }

        await ctx.editMessageText(message, extra)

        ctx.answerCbQuery()
        ctx.wizard.selectStep(8)

    } catch (error) {

        console.error(error)

    }
})

dashboard.action("messages", async (ctx: rlhubContext) => await messages(ctx))

async function messages (ctx: rlhubContext) {
    try {

        let message: string = `<b>Мои сообщения</b>\n\n`
        message += `Новых сообщений нет`
        const extra: ExtraEditMessageText = {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Назад', callback_data: 'back'
                        }
                    ]
                ]
            }
        }

        ctx.wizard.selectStep(5)

        if (ctx.updateType === 'callback_query') {

            ctx.answerCbQuery()
            await ctx.editMessageText(message, extra)

        } else {

            await ctx.reply(message, extra)

        }

    } catch (error) {

        console.error(error)

    }
}

// Обработчики

dashboard.action("common_settings", async (ctx) => {
    await ctx.answerCbQuery('Личный кабинет / Настройки')
    return ctx.scene.enter('settings')
})


async function fetchPdfToBuffer(pdfUrl: string) {
    try {
        const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
        return Buffer.from(response.data); // Преобразуем массив байтов в буфер
    } catch (error) {
        console.error('Ошибка при загрузке PDF:', error);
        return null;
    }
}

dashboard.on('document', async (ctx) => {
    const file = ctx.message.document;
    const fileId = await ctx.telegram.getFile(file.file_id);
    const fileLink = await ctx.telegram.getFileLink(file.file_id);

    const destinationPath = path.join(__dirname, 'dashboardView/downloaded_pdfs', file.file_name);  // устанавливаем путь для сохранения файла

    await downloadPdf(fileLink.href, destinationPath);  // вызываем функцию для скачивания файла

    ctx.reply('PDF-файл успешно загружен и сохранен.');
});

dashboard.command('page', async (ctx) => {
    const pageNumber = parseInt(ctx.message.text.split(' ')[1]);

    if (!isNaN(pageNumber)) {
        try {
            const imageBase64 = await convertPageToImage(ctx, pageNumber);
            const imageBase64String = imageBase64 as string; // Explicitly cast to string

            console.log(imageBase64)

            ctx.replyWithPhoto({ source: imageBase64String }, {
                reply_markup: {
                    inline_keyboard: [
                        [{ callback_data: 'back', text: 'Назад' }]
                    ]
                }
            });
        } catch (error) {
            ctx.reply('Произошла ошибка при обработке PDF-файла.');
            console.log(error)
        }
    } else {
        ctx.reply('Введите корректный номер страницы.');
    }
});

async function downloadPdf(pdfUrl: string, destinationPath: string) {
    try {
        const response = await axios.get(pdfUrl, {
            responseType: 'arraybuffer'
        });

        fs.writeFileSync(destinationPath, response.data);

        console.log(`PDF загружен и сохранен в ${destinationPath}`);

    } catch (error) {
        console.error('Ошибка при загрузке PDF:', error);
    }
}
async function convertPageToImage(ctx: rlhubContext, pageNumber: number) {
    if (!ctx.scene.session.link) {
        return 'Файл не найден. Пожалуйста, отправьте PDF-файл сначала.';
    }

    const fileLink = ctx.scene.session.link;
    console.log(fileLink.href)
    await downloadPdf(fileLink.href, './')
    // try {
    //     const options = {
    //         density: 100,
    //         saveFilename: "page" + pageNumber,
    //         savePath: "./images",
    //         format: "png",
    //         width: 600,
    //         height: 800
    //     };

    //     // console.log(file)

    //     const response = await axios.get(fileLink.href, { responseType: 'arraybuffer' });
    //     // const convert = pdf2pic.fromBase64(response.data, options);
    //     const pageToConvertAsImage = pageNumber;

    //     // return new Promise((resolve, reject) => {
    //     //     convert(pageToConvertAsImage, { responseType: "base64" })
    //     //         .then((resolveData: any) => {
    //     //             console.log("Page is now converted as image");
    //     //             resolve(resolveData.base64);
    //     //         })
    //     //         .catch((error: any) => {
    //     //             console.error('Ошибка при обработке PDF-файла:', error);
    //     //             reject(error);
    //     //         });
    //     // });

    // } catch (error) {
    //     console.error('Ошибка при обработке PDF-файла:', error);
    //     return 'Произошла ошибка при обработке PDF-файла.';
    // }
}



// async function extractTextFromPage(ctx: rlhubContext, pageNumber: number) {
//     if (!ctx.scene.session.link) {
//         return 'Файл не найден. Пожалуйста, отправьте PDF-файл сначала.';
//     }

//     const fileLink = ctx.scene.session.link.href;

//     try {
//         const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
//         const data = await pdf(response.data);
//         const allPages = data.text.split('\n\n');
//         const pageIndex = pageNumber - 1;

//         if (pageIndex >= 0 && pageIndex < allPages.length) {
//             return allPages[pageIndex];
//         } else {
//             return 'Страница не найдена';
//         }
//     } catch (error) {
//         console.error('Ошибка при обработке PDF-файла:', error);
//         return 'Произошла ошибка при обработке PDF-файла.';
//     }
// }

async function about_project (ctx: rlhubContext) {
    
    try {

        if (ctx.updateType === 'callback_query') {
            
            if (ctx.callbackQuery) {

                // @ts-ignore
                if (ctx.callbackQuery.data) {

                    // @ts-ignore
                    let data: 'back' = ctx.callbackQuery.data

                    if (data === 'back') {
                        
                        ctx.wizard.selectStep(0)
                        await ctx.answerCbQuery()
                        await greeting(ctx)

                    }

                }

            }
            
        } else {

            about_project_section_render (ctx)

        }

    } catch (err) {
        
        console.log(err)

    }

}

dashboard.action("about", async (ctx) => await about_project_section_render (ctx))
async function about_project_section_render (ctx: rlhubContext) {
    try {
        
        let message: string = `<b>Немного о проекте</b> \n\n`
        message += `Наш проект нацелен на развитие бурятского языка, который является важной частью культурного наследия Бурятии. \n\n`
        message += `Мы стремимся сохранить и продвигать язык среди молодого поколения, создавая образовательные материалы и организуя языковые мероприятия. \n\n`
        message += `Наша цель - сохранить богатство бурятской культуры и ее языка для будущих поколений. \n\n`
        message += `<a href="https://telegra.ph/Kak-podelitsya-spravochnymi-materialami-08-10">Как перевести предложение?</a> \n`
        message += `<a href="https://telegra.ph/Kak-podderzhat-proekt-09-02">Как поддержать проект?</a> \n`
        message += `<a href="https://telegra.ph/Kak-podelitsya-spravochnymi-materialami-08-10">Как поделиться справочными материалами?</a> \n`
        message += `<a href="https://telegra.ph/Kak-podelitsya-spravochnymi-materialami-08-10">Как предложить предложение для перевода?</a> \n\n`
        message += `<i>Буду рад вашим вопросам и предложениям по улучшению сервиса!\n\n @frntdev</i>`
        
        let extra: ExtraEditMessageText = {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Назад',
                            callback_data: 'back',
                        }
                    ]
                ]
            }
        }

        if (ctx.updateType === 'callback_query') {
            
            await ctx.editMessageText(message, extra)

            ctx.answerCbQuery()
            ctx.wizard.selectStep(1)

        } else {

            await ctx.reply(message, extra)

        }

    } catch (err) {
        console.log(err)
    }
}

handler.on("message", async (ctx) => await greeting(ctx))

dashboard.action('reference_materials', async (ctx) => {
    await reference_materials(ctx)
    return ctx.answerCbQuery()
})

dashboard.action("help", async (ctx) => await help(ctx))
async function help(ctx: rlhubContext) {
    try {

        let message: string = `<b>Поддержка проекта 💰</b> \n\n`
        // await get_link_for_payment(ctx)
        message += `Введите желаемую сумму \n\n`
        // <i>С миру по нитке!</i>\n\n`
        message += `Минимальная сумма: 1 ₽\n`
        message += `Максимальная сумма: 60 000 ₽`
        
        const extra: ExtraEditMessageText = {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '50 ₽', callback_data: 'rub 50' },
                        { text: '250 ₽', callback_data: 'rub 250' },
                        { text: '500 ₽', callback_data: 'rub 500' }
                    ],
                    [
                        { text: '750 ₽', callback_data: 'rub 750' },
                        { text: '1250 ₽', callback_data: 'rub 1250' },
                        { text: '2500 ₽', callback_data: 'rub 2500' }
                    ],
                    [
                        { text: 'Система быстрых платежей', callback_data: 'spb' }
                    ],
                    [
                        { text: 'Криптовалюта', callback_data: 'crypto' }
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

        if (ctx.updateType === 'callback_query') {
            await ctx.editMessageText(message, extra)
        }

        ctx.wizard.selectStep(2)

    } catch (err) {

        console.log(err)

    }
}

dashboard.action("home", async (ctx) => {
    return ctx.scene.enter('home')
})

dashboard.action("contact", async (ctx) => {
    return ctx.answerCbQuery('Обратная связь')
})

export default dashboard