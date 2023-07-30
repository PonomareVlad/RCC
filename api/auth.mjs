import {apiRequest, jsonResponse} from "../src/utils.mjs";
import {accounts, votes} from "../src/db.mjs";

export const config = {runtime: "edge"};

export default async request => {

    const {uuid, token, round} = await request.json();

    if (!uuid || !token || !round)
        return jsonResponse({ok: false, error: "Bad request"}, {status: 500});

    let account = await accounts.findOne({uuid, token});

    if (!account) {

        ({
            response: {
                success: [
                    account = {}
                ] = []
            } = {}
        } = await apiRequest("auth.getProfileInfoBySilentToken", {uuid, token}));

        const {phone} = account;

        if (!phone) return jsonResponse({ok: false, error: "No phone"}, {status: 500});

        const $set = {...account, uuid, token, round};

        const {acknowledged} = await accounts.updateOne({phone}, {$set}, {upsert: true});

        if (!acknowledged) return jsonResponse({ok: false, error: "Couldn't save"}, {status: 500});

    }

    const {phone} = account;

    const {choice} = await votes.findOne({phone, round}) || {};

    return jsonResponse({ok: true, choice});

};
