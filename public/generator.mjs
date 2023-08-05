import {isServer} from "lit";

export class VercelImageGenerator {

    options = {}

    constructor({host, cdn} = {}) {
        Object.assign(this.options, {host, cdn});
    }

    get local() {
        return isServer ? process?.env?.VERCEL_URL : location?.host;
    }

    generate(options = {}) {
        const {local} = this;
        const {
            src,
            width,
            quality = 100,
            host = local,
            cdn = host
        } = {
            ...this.options,
            ...options
        };
        if (
            local === "localhost" ||
            ![src, cdn, host, width, quality].every(Boolean)
        ) return src;
        const srcURL = new URL(src, `https://${host}/`);
        const cdnURL = new URL(`https://${cdn}/_vercel/image`);
        const url = srcURL.host === cdn ? srcURL.pathname : srcURL.href;
        cdnURL.searchParams.set("q", String(quality));
        cdnURL.searchParams.set("w", String(width));
        cdnURL.searchParams.set("url", url);
        return cdnURL.href;
    }

}
