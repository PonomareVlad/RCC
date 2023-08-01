import {accounts, rounds, votes} from "./db.mjs";
import {ObjectId} from "bson";

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
