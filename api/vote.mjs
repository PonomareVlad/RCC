import {hostFromRequest, jsonResponse} from "../src/utils.mjs";
import {data} from "../src/test.mjs";
import {vote} from "../src/api.mjs";

export const config = {runtime: "edge"};

export default async request => {
    try {
        return jsonResponse({ok: await vote(await request.json())});
    } catch ({message: error}) {
        console.debug(error);
        return jsonResponse({ok: false, error}, {status: 500});
    }
}
