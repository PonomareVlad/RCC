import {jsonResponse} from "../src/utils.mjs";
import {rounds, votes} from "../src/db.mjs";

export const config = {runtime: "edge"};

export default async () => {

    const [round = {}] = await rounds.find().sort({_id: -1}).limit(1).toArray();

    const {_id, variants} = round;

    const roundVotes = await votes.find({round: _id}).toArray();

    const votesCount = roundVotes.reduce((variants = [], {choice}) => {
        const index = choice - 1;
        if (!variants[index])
            variants[index] = 0;
        variants[index]++;
        return variants;
    }, []);

    const results = votesCount.map(count => `${count / roundVotes.length * 100}%`);

    if (Array.isArray(variants))
        round.variants = variants.map((variant, index) => ({...variant, result: results[index] || "0%"}));

    return jsonResponse(round);

}
