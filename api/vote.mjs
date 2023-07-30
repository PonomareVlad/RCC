import {jsonResponse} from "../src/utils.mjs";
import {accounts, votes} from "../src/db.mjs";

export const config = {runtime: "edge"};

export default async request => {

    const {uuid, token, round, choice} = await request.json();

    if (!uuid || !token || !round || !choice)
        return jsonResponse({ok: false, error: "Bad request"}, {status: 500});

    const account = await accounts.findOne({uuid, token});

    if (!account) return jsonResponse({ok: false, error: "No account"}, {status: 500});

    const {phone} = account;

    if (!phone) return jsonResponse({ok: false, error: "No phone"}, {status: 500});

    const {acknowledged} = await votes.updateOne({phone, round}, {phone, round, choice}, {upsert: true});

    if (!acknowledged) return jsonResponse({ok: false, error: "Couldn't save"}, {status: 500});

    return jsonResponse({ok: true});

};
