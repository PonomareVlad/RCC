import {hostFromRequest, jsonResponse} from "../src/utils.mjs";
import {getActiveRounds} from "../src/api.mjs";
import {data} from "../src/test.mjs";

export const config = {runtime: "edge"};

const headers = {
    "Cache-Control": "s-maxage=1, stale-while-revalidate=59",
};

export default async request => jsonResponse(
        await getActiveRounds() || [],
    {headers}
);
