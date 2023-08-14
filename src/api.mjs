import {accounts, rounds, votes} from "./db.mjs";
import {apiRequest} from "./utils.mjs";
import {ObjectId} from "bson";

const {group_id} = process.env;

const activeRoundQuery = {
    complete: {
        $not: {
            $in: [true]
        }
    }
};

function groupVotes(variants = [], {choice}) {
    const index = choice - 1;
    if (!variants[index])
        variants[index] = 0;
    variants[index]++;
    return variants;
}

export async function getLastRound() {
    try {
        const [data] =
            await rounds.find(activeRoundQuery).sort({_id: 1}).limit(1).toArray();
        if (!data) return;
        const {_id: round} = data;
        const roundVotes = await votes.find({round}).toArray();
        const votesCount = roundVotes.reduce(groupVotes, []);
        const results = votesCount.map(count => count / roundVotes.length);
        if (Array.isArray(data.variants)) data.variants.forEach(
            (variant = {}, index) => variant.result = results[index] || 0
        );
        return {...data, date: new Date()};
    } catch (e) {
        console.error(e);
    }
}

export async function auth({uuid, token}) {
    if (!uuid || !token) throw new Error("Bad request");
    let account = await accounts.findOne({uuid, token});
    if (!account) {
        account = await apiRequest("auth.exchangeSilentAuthToken", {uuid, token});
        const {phone} = account;
        if (!phone) throw new Error("No phone");
        const $set = {...account, uuid, token};
        const {acknowledged} =
            await accounts.updateOne({phone}, {$set}, {upsert: true});
        if (!acknowledged) throw new Error("Couldn't save");
    }
    const {phone} = account;
    const subscribed = await isMember(account);
    const userVotes = await votes.find({phone}).toArray() || [];
    const choices = Object.fromEntries(
        userVotes.map(({round, choice}) => [round, choice])
    );
    return {choices, subscribed};
}

export async function vote({uuid, token, round, choice} = {}) {
    if (!uuid || !token || !round || !choice) throw new Error("Bad request");
    const [targetRound, account] = await Promise.all([
        rounds.findOne({...activeRoundQuery, _id: new ObjectId(round)}),
        accounts.findOne({uuid, token}),
    ]);
    const {phone} = account;
    if (!phone || !targetRound)
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
