import {ObjectId} from "bson";
import {Bot, Keyboard} from "grammy";
import {accounts, stages, rounds, votes} from "./db.mjs";

export const {

    // Telegram bot token from t.me/BotFather
    TELEGRAM_BOT_TOKEN: token,

    // Secret token to validate incoming updates
    TELEGRAM_SECRET_TOKEN: secretToken = String(token).split(":").pop()

} = process.env;

// Default grammY bot instance
export const bot = new Bot(token);

bot.command("rounds", async ctx => {
    await ctx.replyWithChatAction("typing");
    const api = `https://rcc-vote.ru/api/round/`;
    const stagesData = await rounds.find().toArray();
    const links = stagesData.map(({name = ""} = {}) => new URL(name, api));
    return ctx.reply(["Данные по всем раундам:", "", ...links].join("\r\n"));
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
