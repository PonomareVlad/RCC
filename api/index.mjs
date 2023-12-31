import {renderLight} from "@lit-labs/ssr-client/directives/render-light.js";
import {stream} from "lit-edge-utils/render.mjs";
import {getActiveRounds} from "../src/api.mjs";
import {template} from "../public/page.mjs";
import {App} from "../public/app.mjs";
import {render} from "@lit-labs/ssr";
import {html} from "lit";

App.define();

const {
    VK_APP_ID: appId,
    VK_GROUP_ID: group_id,
    COUNTDOWN: countdown,
    APP_VERSION: version,
    APP_CDN_HOST: cdn,
} = process.env;

const headers = {
    "Content-Type": "text/html;charset=UTF-8",
    "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
};

export const config = {runtime: "edge"};

async function renderPromise(request) {
    const {
        headers = {}
    } = request;
    const header = "x-forwarded-host";
    const host =
        headers instanceof Headers ?
            headers?.get?.(header) :
            headers[header];
    const state = {
        rounds: await getActiveRounds()
    };
    return render(html`
        <app-root
                cdn="${cdn}"
                host="${host}"
                app-id="${appId}"
                version="${version}"
                group-id="${group_id}"
                countdown="${countdown}"
                ._state=${state}
        >
            ${renderLight()}
        </app-root>
    `);
}

export default request => {
    const result = template({
        title: "RCC EXTREME",
        body: renderPromise(request)
    });
    return new Response(stream(result), {headers});
}
