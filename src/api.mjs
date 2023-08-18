import {accounts, rounds, stages, votes} from "./db.mjs";
import {apiRequest, percentNumber} from "./utils.mjs";

const {
    VK_GROUPS,
    VK_GROUP_ID,
} = process.env;

const groups = JSON.parse(VK_GROUPS);
const group_id = parseInt(VK_GROUP_ID);

function groupVotes(variants = [], {choice}) {
    const index = choice;
    if (!variants[index])
        variants[index] = 0;
    variants[index]++;
    return variants;
}

export async function getRoundResults(data) {
    const {name: round} = data;
    const roundVotes = await votes.find({round}).toArray();
    const votesCount = roundVotes.reduce(groupVotes, []);
    const results = votesCount.map(count => count / roundVotes.length);
    if (Array.isArray(data.variants)) data.variants.forEach(
        (variant = {}, index) => {
            variant.result = results[index] || 0;
            variant.resultString = percentNumber.format(variant.result);
        }
    );
    return data;
}

export async function getResults() {
    const roundsData = await rounds.find().toArray();
    const roundsResult = await Promise.all(roundsData.map(getRoundResults));
    return roundsResult.reduce((results, round) => {
        const {_id, name, variants = [], ...data} = round;
        const prefix = name.replace("-", "_");
        Object.entries(data).forEach(
            ([field, value]) => results[[prefix, field].join("_")] = value
        );
        variants.forEach((variant, index) => Object.entries(variant).forEach(
            ([field, value]) => results[[prefix, "variants", index, field].join("_")] = value
        ));
        return results;
    }, {});
}

export function getRound(name) {
    try {
        if (!name) return;
        return rounds.findOne({name}).then(getRoundResults);
    } catch (e) {
        console.error(e);
    }
}

export async function getActiveRounds() {
    try {
        const {rounds: activeRounds = []} = await stages.findOne({active: true}) || {};
        if (!activeRounds.length) return [];
        const roundsData = await rounds.find({name: {$in: activeRounds}}).toArray();
        if (!roundsData.length) return [];
        return await Promise.all(roundsData.map(getRoundResults));
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
    if (!uuid || !token || !round || typeof choice !== "number")
        throw new Error("Bad request");
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
    if (await votes.findOne({phone, round}))
        throw new Error("Already voted");
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
