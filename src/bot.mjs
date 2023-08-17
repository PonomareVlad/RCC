import Papa from "papaparse";
import {ObjectId} from "bson";
import {Bot, InputFile, Keyboard} from "grammy";
import {accounts, stages, rounds, votes} from "./db.mjs";

export const {
    TELEGRAM_BOT_TOKEN: token,
    TELEGRAM_SECRET_TOKEN: secretToken = String(token).split(":").pop()
} = process.env;

export const bot = new Bot(token);

const columns = {
    last_name: "Фамилия",
    first_name: "Имя",
    phone: "Телефон",
    email: "Email",
    link: "VK"
};

bot.command("rounds", async ctx => {
    await ctx.replyWithChatAction("typing");
    const api = `https://rcc-vote.ru/api/round/`;
    const stagesData = await rounds.find().toArray();
    const links = stagesData.map(({name = ""} = {}) => new URL(name, api));
    return ctx.reply(["Данные по всем раундам:", "", ...links, "", "https://rcc-vote.ru/api/results"].join("\r\n"));
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

bot.on("message:text", async (ctx, next) => {
    await ctx.replyWithChatAction("typing");
    const stages = await getStages();
    if (ctx.msg.text in stages) {
        const stage = stages[ctx.msg.text];
        await selectStage(stage);
        const reply_markup = await getKeyboard();
        return ctx.reply(`Активирован этап ${ctx.msg.text}`, {reply_markup});
    } else switch (ctx.msg.text) {
        case "Сброс этапов": {
            await selectStage();
            const reply_markup = await getKeyboard();
            return ctx.reply(`Этапы сброшены`, {reply_markup});
        }
        case "Удалить голоса": {
            await votes.deleteMany({});
            const reply_markup = await getKeyboard();
            return ctx.reply(`Все голоса удалены`, {reply_markup});
        }
        case "Удалить юзеров": {
            await accounts.deleteMany({});
            const reply_markup = await getKeyboard();
            return ctx.reply(`Все юзеры удалены`, {reply_markup});
        }
    }
    return next();
});

bot.on("message:text", async ctx => ctx.reply("Выберите необходимое действие в меню", {
    reply_markup: await getKeyboard()
}));

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
    const buttons = [
        ...Object.keys(stages),
        "Сброс этапов",
        "⚠️ Удалить голоса",
        "⚠️ Удалить юзеров"
    ];
    return Keyboard.from([buttons]).resized().persistent().toFlowed(2);
}
