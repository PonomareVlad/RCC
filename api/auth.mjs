import {apiRequest, jsonResponse} from "../src/utils.mjs";

export const config = {runtime: "edge"};

export default async request => {

    const {uuid, token} = await request.json();

    const result = await apiRequest("auth.getProfileInfoBySilentToken", {uuid, token});

    return jsonResponse(result);

};
