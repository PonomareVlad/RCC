import {renderLight} from "@lit-labs/ssr-client/directives/render-light.js";
import {template} from "../public/assets/page.mjs";
import {stream} from "lit-edge-utils/render.mjs";
import {App} from "../public/assets/app.mjs";
import {getLastRound} from "../src/api.mjs";
import {render} from "@lit-labs/ssr";
import {html} from "lit";

App.define();

const {appId} = process.env;
const headers = {"Content-Type": "text/html;charset=UTF-8"};

export const config = {runtime: "edge"};

async function renderPromise() {
    const state = {round: await getLastRound()};
    return render(html`
        <app-root app-id="${appId}" ._state=${state}>
            ${renderLight()}
        </app-root>
    `);
}

export default () => {
    const result = template({
        title: "Екатеринбург",
        body: renderPromise()
    });
    return new Response(stream(result), {headers});
}
