import importmap from "./importmap.json";

export function* template({title, body}) {
    yield `
    <!doctype html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <meta content="ie=edge" http-equiv="X-UA-Compatible">
        <meta content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"
              name="viewport">
        <script type="importmap">${JSON.stringify(importmap, null, 2)}</script>
        <script async crossorigin="anonymous"
                src="https://ga.jspm.io/npm:es-module-shims@1.8.0/dist/es-module-shims.js"></script>
        <script defer src="/client.mjs" type="module"></script>
        <link href="/styles/reset.css" rel="stylesheet">
        <link href="/styles/vars.css" rel="stylesheet">
        <link href="/styles/page.css" rel="stylesheet">
    </head>
    <body>`;
    yield body;
    yield `
    </body>
    </html>`;
}
