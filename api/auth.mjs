import {hostFromRequest, jsonResponse} from "../src/utils.mjs";
import {data} from "../src/test.mjs";
import {auth} from "../src/api.mjs";

export const config = {runtime: "edge"};

export default async request => {
    try {
        return jsonResponse({ok: true, ...await auth(await request.json())});
    } catch ({message: error}) {
        console.debug(error);
        return jsonResponse({ok: false, error}, {status: 500});
    }
}
