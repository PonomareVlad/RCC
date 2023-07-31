import {rounds, votes} from "./db.mjs";

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
