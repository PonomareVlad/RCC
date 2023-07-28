export const config = {runtime: "edge"};

const {access_token} = process.env;

function jsonResponse(value, {
    space,
    status,
    replacer,
    statusText,
    headers = {},
} = {}) {
    const body = JSON.stringify(value, replacer, space);
    return new Response(body, {
        headers: {
            "Content-Type": "application/json",
            ...headers
        },
        statusText,
        status
    });
}

async function apiRequest(method, payload = {}) {
    const url = new URL(method, `https://api.vk.com/method/`);
    Object.entries({access_token, v: 5.131, ...payload}).forEach(
        ([key, value]) => url.searchParams.set(key, String(value))
    );
    const response = await fetch(url);
    return response.json();
}

export default async request => {

    const {
        uuid,
        token,
    } = await request.json();

    const payload = {
        access_token,
        token,
        uuid,
    }

    const result = await apiRequest("auth.getProfileInfoBySilentToken", payload);

    return jsonResponse(result);

};
