const {
    VK_ACCESS_TOKEN: access_token
} = process.env;

export const percentNumber = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    style: "percent",
})

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

export const getHeaders = (name, mime = "application/octet-stream", context = "attachment") => ({
    "Content-Disposition": [context, name ? `filename="${name}"` : undefined].filter(Boolean).join("; "),
    "Content-Type": mime
});

export const hostFromRequest = (
    {headers} = {},
    header = "x-forwarded-host"
) => headers.get(header);

export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}
