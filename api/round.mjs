import {jsonResponse} from "../src/utils.mjs";
import {getLastRound} from "../src/api.mjs";

export const config = {runtime: "edge"};

export default async () => jsonResponse(await getLastRound())
