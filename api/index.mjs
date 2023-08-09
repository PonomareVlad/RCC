import {renderLight} from "@lit-labs/ssr-client/directives/render-light.js";
import {stream} from "lit-edge-utils/render.mjs";
import {getLastRound} from "../src/api.mjs";
import {template} from "../public/page.mjs";
import {App} from "../public/app.mjs";
import {render} from "@lit-labs/ssr";
import {html} from "lit";

App.define();

const {appId} = process.env;
const headers = {
    "Content-Type": "text/html;charset=UTF-8",
    "Cache-Control": "s-maxage=1, stale-while-revalidate=59",
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
        round: await getLastRound()
    };
    return render(html`
        <app-root
                host="${host}"
                cdn="cdn.rcc-vote.ru"
                app-id="${appId}"
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
