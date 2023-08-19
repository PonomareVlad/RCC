import {jsonResponse} from "../src/utils.mjs";
import {getRound} from "../src/api.mjs";

export const config = {runtime: "edge"};

const headers = {
    "Cache-Control": "s-maxage=5, stale-while-revalidate=59",
};

export default async request => {
    const round = new URL(request.url)
        .searchParams.get("round");
    const data = await getRound(round);
    if (data) return jsonResponse(data, {headers});
    return jsonResponse(null, {headers, status: 404});
};
