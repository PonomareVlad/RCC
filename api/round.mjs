import {jsonResponse} from "../src/utils.mjs";
import {rounds} from "../src/db.mjs";

export const config = {runtime: "edge"};

export default async () => {

    const [round = {}] = await rounds.find().sort({_id: -1}).limit(1).toArray();

    const {variants} = round;

    if (Array.isArray(variants))
        round.variants = variants.map(variant => ({...variant, result: "50%"}));

    return jsonResponse(round);

}
