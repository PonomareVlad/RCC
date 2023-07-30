import {RenderResultReadableStream} from "lit-edge-utils/render.mjs";
import {render} from "@lit-labs/ssr";
import {html} from "lit";

export const config = {runtime: "edge"};

const page = html`
    <!doctype html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <title>Екатеринбург</title>
        <meta content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"
              name="viewport">
        <meta content="ie=edge" http-equiv="X-UA-Compatible">
        <link href="/assets/fonts/stylesheet.css" rel="stylesheet">
        <link href="/assets/styles/reset.css" rel="stylesheet">
        <link href="/assets/styles/vars.css" rel="stylesheet">
        <link href="/assets/styles/main.css" rel="stylesheet">
    </head>
    <body>

    <template id="root">

        <div class="background">

            <div class="lines">
                <div class="line"></div>
                <div class="line"></div>
                <div class="line"></div>
            </div>

            <div class="decorations"></div>
            <div class="photos"></div>
            <div class="overlay"></div>

        </div>

        <div class="content">

            <div class="logo">
                <img alt="Logo" src="/assets/images/logo.svg">
            </div>

            <div class="title">
                ПРОГОЛОСУЙ
                <br>
                <span class="mark">ЗА ЛЮБИМОГО</span>
                <br>
                АРТИСТА!
            </div>

            <main></main>

        </div>

    </template>

    <template id="auth">

        <div class="auth"></div>

    </template>

    <template id="round">

        <div class="caption"></div>

        <div class="variants"></div>

    </template>

    <template id="variant">

        <div class="side">
            <div class="photo"></div>
            <div class="controls">
                <div class="name"></div>
                <button></button>
            </div>
        </div>

    </template>

    <app-root app-id="51715827"></app-root>

    </body>

    <script src="https://unpkg.com/@vkontakte/superappkit/dist/index-umd.js"></script>
    <script src="/assets/app.mjs" type="module"></script>

    </html>
`

export default async () => {

    const result = render(page);
    const stream = new RenderResultReadableStream(result);

    return new Response(stream, {
        headers: {
            "content-type": "text/html;charset=UTF-8"
        }
    });

}
