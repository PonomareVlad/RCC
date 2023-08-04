import {jsonResponse} from "../src/utils.mjs";
import {getLastRound} from "../src/api.mjs";

export const config = {runtime: "edge"};

const headers = {
    "Cache-Control": "s-maxage=10, stale-while-revalidate=50",
};

export default async () => jsonResponse(await getLastRound(), {headers})
