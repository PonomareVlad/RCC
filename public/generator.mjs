import {isServer} from "lit";

export class VercelImageGenerator {

    constructor({host, cdn, version} = {}) {
        this.options = {host, cdn, version};
    }

    get local() {
        if (isServer) return process.env.VERCEL_URL;
        if (location) return location.host;
    }

    generate(options = {}) {
        const {local} = this;
        const {
            src,
            width,
            version = 1,
            quality = 100,
            host = local,
            cdn = host
        } = {
            ...this.options,
            ...options
        };
        if (
            host === "localhost" ||
            ![src, cdn, host, width, quality].every(Boolean)
        ) return src;
        const srcURL = new URL(src, `https://${host}/`);
        srcURL.searchParams.set("version", String(version));
        const cdnURL = new URL(`https://${cdn}/_vercel/image`);
        const url = srcURL.host === cdn ? srcURL.pathname : srcURL.href;
        cdnURL.searchParams.set("q", String(quality));
        cdnURL.searchParams.set("w", String(width));
        cdnURL.searchParams.set("url", url);
        return cdnURL.href;
    }

}
