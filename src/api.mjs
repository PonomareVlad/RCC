import {accounts, stages, rounds, votes} from "./db.mjs";
import {apiRequest} from "./utils.mjs";

const groups = JSON.parse(process.env.groups);
const group_id = parseInt(process.env.group_id);

function groupVotes(variants = [], {choice}) {
    const index = choice - 1;
    if (!variants[index])
        variants[index] = 0;
    variants[index]++;
    return variants;
}

export async function getActiveRounds() {
    try {
        const {rounds: activeRounds = []} = await stages.findOne({active: true});
        if (!activeRounds.length) return;
        const roundsData = await rounds.find({name: {$in: activeRounds}}).toArray();
        if (!roundsData.length) return;
        const roundsWithCount = await Promise.all(roundsData.map(async data => {
            const {name: round} = data;
            const roundVotes = await votes.find({round}).toArray();
            const votesCount = roundVotes.reduce(groupVotes, []);
            const results = votesCount.map(count => count / roundVotes.length);
            if (Array.isArray(data.variants)) data.variants.forEach(
                (variant = {}, index) => variant.result = results[index] || 0
            );
            return data;
        }));
        return {rounds: roundsWithCount, date: new Date()};
    } catch (e) {
        console.error(e);
    }
}

export async function auth({uuid, token}) {
    if (!uuid || !token) throw new Error("Bad request");
    let account = await accounts.findOne({uuid, token});
    if (!account) {
        const {success: [accountBySilentToken = {}] = []} =
            await apiRequest("auth.getProfileInfoBySilentToken", {uuid, token});
        account = await apiRequest("auth.exchangeSilentAuthToken", {uuid, token});
        const {phone, access_token} = account ?? {};
        if (!phone) throw new Error("No phone");
        await subscribe({access_token}).catch(console.error);
        const $set = {...accountBySilentToken, ...account, uuid, token};
        const {acknowledged} =
            await accounts.updateOne({phone}, {$set}, {upsert: true});
        if (!acknowledged) throw new Error("Couldn't save");
    }
    const {phone} = account ?? {};
    const subscribed = await isMember(account);
    const userVotes = await votes.find({phone}).toArray() || [];
    const choices = Object.fromEntries(
        userVotes.map(({round, choice}) => [round, choice])
    );
    return {choices, subscribed};
}

export async function vote({uuid, token, round, choice} = {}) {
    if (!uuid || !token || !round || !choice) throw new Error("Bad request");
    const [targetStage, targetRound, account] = await Promise.all([
        stages.findOne({rounds: {$in: [round]}, active: true}),
        rounds.findOne({name: round}),
        accounts.findOne({uuid, token}),
    ]);
    const {phone} = account;
    if (!targetStage || !targetRound || !phone)
        throw new Error("Wrong parameters");
    const subscribed = await isMember(account);
    if (!subscribed)
        throw new Error("Not subscribed");
    const {acknowledged} = await votes.updateOne(
        {phone, round},
        {phone, round, choice},
        {upsert: true}
    );
    return acknowledged;
}

export async function isMember({access_token, user_id} = {}) {
    return Boolean(await apiRequest("groups.isMember", {access_token, user_id, group_id}))
}

export function subscribe({access_token} = {}) {
    return [group_id, ...groups].reduce(
        (promise, group_id) => promise.then(
            () => apiRequest("groups.join", {access_token, group_id}).catch(console.error)
        ),
        Promise.resolve()
    );
}
