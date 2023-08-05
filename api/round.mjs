import {jsonResponse} from "../src/utils.mjs";
import {getLastRound} from "../src/api.mjs";

export const config = {runtime: "edge"};

const headers = {
    "Cache-Control": "s-maxage=1, stale-while-revalidate=59",
};

export default async () => jsonResponse(await getLastRound() || null, {headers})
