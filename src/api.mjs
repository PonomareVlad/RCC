import {accounts, rounds, votes} from "./db.mjs";
import {ObjectId} from "bson";
import {apiRequest, jsonResponse} from "./utils.mjs";

function groupVotes(variants = [], {choice}) {
    const index = choice - 1;
    if (!variants[index])
        variants[index] = 0;
    variants[index]++;
    return variants;
}

export async function getLastRound() {
    const [data] = await rounds.find().sort({_id: -1}).limit(1).toArray();
    const roundVotes = await votes.find({round: data._id}).toArray();
    const votesCount = roundVotes.reduce(groupVotes, []);
    const results = votesCount.map(count => count / roundVotes.length);
    if (Array.isArray(data.variants)) data.variants.forEach(
        (variant = {}, index) => variant.result = results[index] || 0
    );
    return data;
}

export async function auth({uuid, token, round}) {
    if (!uuid || !token || !round) throw new Error("Bad request");
    let account = await accounts.findOne({uuid, token});
    if (!account) {
        ({response: {success: [account = {}] = []} = {}} =
            await apiRequest("auth.getProfileInfoBySilentToken", {uuid, token}));
        const {phone} = account;
        if (!phone) throw new Error("No phone");
        const $set = {...account, uuid, token, round};
        const {acknowledged} =
            await accounts.updateOne({phone}, {$set}, {upsert: true});
        if (!acknowledged) throw new Error("Couldn't save");
    }
    const {phone} = account;
    const {choice} = await votes.findOne({phone, round}) || {};
    return {round, choice};
}

export async function vote({uuid, token, round, choice} = {}) {
    if (!uuid || !token || !round || !choice) throw new Error("Bad request");
    const [targetRound, {phone} = {}] = await Promise.all([
        rounds.findOne({_id: new ObjectId(round)}),
        accounts.findOne({uuid, token}),
    ]);
    if (!phone || !targetRound) throw new Error("Wrong parameters");
    const {acknowledged} = await votes.updateOne(
        {phone, round},
        {phone, round, choice},
        {upsert: true}
    );
    return acknowledged;
}
