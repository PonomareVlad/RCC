import Papa from "papaparse";
import {ObjectId} from "bson";
import {getRandomInt} from "./utils.mjs";
import {autoQuote} from "@roziscoding/grammy-autoquote";
import {accounts, stages, rounds, votes} from "./db.mjs";
import {Bot, InlineKeyboard, InputFile, Keyboard} from "grammy";

export const {
    TELEGRAM_BOT_TOKEN: token,
    TELEGRAM_SECRET_TOKEN: secretToken = String(token).split(":").pop(),
    BOT_ACCESS_LIST: accessList = "[]",
    APP_HOST: host = "localhost",
    EDITABLE_ROUND: name = "",
} = process.env;

const buttons = {
    resetStages: "Сброс этапов",
    refresh: "Обновить статусы этапов"
}

const columns = {
    last_name: "Фамилия",
    first_name: "Имя",
    phone: "Телефон",
    email: "Email",
    link: "VK"
};

const access = JSON.parse(accessList);

export const bot = new Bot(token);

bot.use(autoQuote);

bot.on("callback_query:data", async ctx => {
    try {
        const {
            chat: {id} = {},
            callbackQuery: {data} = {},
            msg: {reply_to_message} = {},
        } = ctx;
        if (!access.includes(id))
            return ctx.answerCallbackQuery();
        const index = parseInt(data);
        const file = getFileFromMessage(reply_to_message);
        if (!file.file_id)
            return ctx.answerCallbackQuery("Файл не найден");
        const {
            variants = []
        } = await rounds.findOne({name}) || {};
        if (!variants[index])
            return ctx.answerCallbackQuery("Вариант не найден");
        await replaceVariantImage(index, getFileURL(file));
        const text = `Изображение установлено для варианта: ${variants[index].name}`;
        await ctx.answerCallbackQuery("Изображение установлено");
        return ctx.editMessageText(text);
    } catch (e) {
        console.error(e);
        await ctx.answerCallbackQuery("Произошла ошибка");
    }
});

bot.drop(ctx => access.includes(ctx.chat?.id), () => undefined);

bot.on("msg:file", async ctx => {
    await ctx.replyWithChatAction("typing");
    const {
        variants = []
    } = await rounds.findOne({name}) || {};
    if (!variants?.length)
        return ctx.reply("Нет подходящих вариантов");
    const buttons = variants.map(
        ({name} = {}, index) =>
            InlineKeyboard.text(name, String(index))
    );
    const reply_markup =
        InlineKeyboard.from([buttons]).toFlowed(2);
    const text = "Выберите вариант для этого изображения";
    return ctx.reply(text, {reply_markup});
});

bot.command("rounds", async ctx => {
    await ctx.replyWithChatAction("typing");
    const api = `https://rcc-vote.ru/api/round/`;
    const stagesData = await rounds.find().toArray();
    const links = stagesData.map(({name = ""} = {}) => new URL(name, api));
    return ctx.reply(["Данные по всем раундам:", "", ...links, "", "https://rcc-vote.ru/api/results"].join("\r\n"), {disable_web_page_preview: true});
});

bot.command("stats", async ctx => {
    await ctx.replyWithChatAction("typing");
    const [
        votesData,
        accountsData
    ] = await Promise.all([
        votes.find().toArray(),
        accounts.find().toArray(),
    ]);
    return ctx.reply(`Статистика: 

Количество голосов: ${votesData.length}
Количество пользователей: ${accountsData.length}`);
});

bot.command("accounts", async ctx => {
    await ctx.replyWithChatAction("upload_document");
    const accountsData = await accounts.find().toArray();
    const options = {columns: Object.keys(columns), header: false, delimiter: ";"};
    const data = accountsData.map(
        ({user_id, ...data} = {}) => ({...data, link: `https://vk.com/id${user_id}`})
    );
    const csv = new Blob([Papa.unparse([columns, ...data], options)]);
    const file = new InputFile(csv.stream(), "accounts.csv");
    const date = new Date();
    const caption = [
        date.toLocaleString("ru", {dateStyle: "short"}),
        date.toLocaleString("ru", {timeStyle: "short"}),
    ].join(" ");
    return ctx.replyWithDocument(file, {caption});
});

bot.command("random", async ctx => {
    await ctx.replyWithChatAction("upload_document");
    const accountsData = await accounts.find().toArray();
    const index = getRandomInt(0, accountsData.length);
    const {last_name, first_name, phone, user_id} = accountsData[index];
    return ctx.reply([
        `Случайный пользователь:`,
        "",
        `Имя: ${first_name}`,
        `Фамилия: ${last_name}`,
        `Телефон: ${phone}`,
        `Порядковый номер: ${index}`,
        `VK ID: ${user_id}`,
    ].join("\r\n"));
});

/*bot.command("delete_votes", async ctx => {
    await ctx.replyWithChatAction("typing");
    await votes.deleteMany({});
    const reply_markup = await getKeyboard();
    return ctx.reply(`Все голоса удалены`, {reply_markup});
});*/

/*bot.command("delete_accounts", async ctx => {
    await ctx.replyWithChatAction("typing");
    await accounts.deleteMany({});
    const reply_markup = await getKeyboard();
    return ctx.reply(`Все юзеры удалены`, {reply_markup});
});*/

bot.hears(buttons.resetStages, async ctx => {
    await ctx.replyWithChatAction("typing");
    await selectStage();
    const reply_markup = await getKeyboard();
    return ctx.reply(`Этапы сброшены`, {reply_markup});
});

bot.on("msg:text", async ctx => {
    await ctx.replyWithChatAction("typing");
    const stages = await getStages();
    if (ctx.msg.text in stages) {
        const stage = stages[ctx.msg.text];
        await selectStage(stage);
        return ctx.reply(`Активирован этап ${ctx.msg.text}`, {
            reply_markup: await getKeyboard()
        });
    }
    return ctx.reply("Выберите необходимое действие в меню", {
        reply_markup: await getKeyboard()
    });
});

async function getStages() {
    const stagesData = await stages.find().toArray();
    const getButton = ({active, rounds = []}) => [
        (active ? "✅" : ""),
        rounds.at(0),
        (rounds.length > 1 ? `(+${rounds.length - 1})` : "")
    ].filter(Boolean).join(" ");
    return Object.fromEntries(stagesData.map(stage => [getButton(stage), stage]))
}

async function selectStage({_id: id} = {}) {
    const activate = {$set: {active: true}};
    const deactivate = {$set: {active: false}};
    if (!id) return stages.updateMany({}, deactivate).then(console.debug);
    const _id = new ObjectId(id);
    await stages.updateOne({_id}, activate).then(console.debug);
    await stages.updateMany({_id: {$not: {$in: [_id]}}}, deactivate).then(console.debug);
}

async function getKeyboard() {
    const stages = await getStages();
    const targetButtons = [
        ...Object.keys(stages),
        ...Object.values(buttons),
    ];
    return Keyboard.from([targetButtons]).resized().persistent().toFlowed(2);
}

function replaceVariantImage(index, image) {
    return rounds.updateOne({name}, {
        $set: {
            [`variants.${index}.image`]: image
        }
    });
}

function getFileURL({file_id, mime_type, file_name} = {}) {
    let {href} = new URL(`https://${host}/api/telegram/${file_id}`);
    if (mime_type) ({href} = new URL(mime_type, href + "/"));
    if (file_name) ({href} = new URL(file_name, href + "/"));
    return href;
}

const getFileFromMessage = (
    {
        photo = [],
        document = photo.at(-1)
    } = {}
) => ({
    mime_type: "image/jpeg",
    ...document
});
