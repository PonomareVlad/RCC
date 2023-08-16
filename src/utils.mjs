const {access_token} = process.env;

export function jsonResponse(value, {
    space,
    status,
    replacer,
    statusText,
    headers = {},
} = {}) {
    const body = JSON.stringify(value, replacer, space);
    return new Response(body, {
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            ...headers
        },
        statusText,
        status
    });
}

export async function apiRequest(method, payload = {}) {
    const url = new URL(method, `https://api.vk.com/method/`);
    Object.entries({access_token, lang: "ru", v: 5.131, ...payload}).forEach(
        ([key, value]) => url.searchParams.set(key, String(value))
    );
    const {response} = await fetch(url).then(r => r.json());
    return response;
}

export const hostFromRequest = (
    {headers} = {},
    header = "x-forwarded-host"
) => headers.get(header);
