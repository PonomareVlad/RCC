import "../src/debug.mjs";
import mime from "mime/lite";
import {bot, token} from "../src/bot.mjs";
import {getHeaders} from "../src/utils.mjs";

const api = "api.telegram.org";

export default async ({url} = {}) => {
    try {
        const {
            searchParams
        } = new URL(url);
        const query = Object.fromEntries(searchParams.entries());
        const {
            file_id,
            mime_sub_type = "jpeg",
            mime_base_type = "image",
        } = query;
        const {
            file_path
        } = await bot.api.getFile(file_id) || {};
        if (!file_path)
            return new Response(null, {status: 404});
        const mime_type = `${mime_base_type}/${mime_sub_type}`;
        const extension = mime.getExtension(mime_type);
        const file_name = `${file_id}.${extension}`;
        const headers = getHeaders(file_name, mime_type, "inline");
        const fileURL = `https://${api}/file/bot${token}/${file_path}`;
        const {body, status, statusText} = await fetch(fileURL);
        return new Response(body, {headers, status, statusText});
    } catch (e) {
        console.error(e);
        return new Response(null, {status: 404});
    }
}

export const config = {runtime: "edge"};
