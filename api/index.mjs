import {template} from "../public/assets/page.mjs";
import {stream} from "lit-edge-utils/render.mjs";
import {App} from "../public/assets/app.mjs";
import {render} from "@lit-labs/ssr";
import {html} from "lit";

App.define();

export const config = {
    runtime: "edge"
};

const {appId} = process.env;

export default async () => {

    const body = render(html`
        <app-root app-id="${appId}"></app-root>
    `);

    const result = template({title: "Екатеринбург", body});

    return new Response(stream(result), {
        headers: {
            "Content-Type": "text/html;charset=UTF-8"
        }
    });

}
