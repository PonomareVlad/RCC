import importmap from "./importmap.json";

export function* template({title, body}) {
    yield `<!doctype html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <meta content="#070707" name="theme-color">
        <meta content="ie=edge" http-equiv="X-UA-Compatible">
        <meta content="yes" name="apple-mobile-web-app-capable">
        <meta content="viewport-fit=cover, width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no"
              name="viewport">
        <script type="importmap">${JSON.stringify(importmap, null, 2)}</script>
        <link href="/images/logo.svg" rel="icon" sizes="any" type="image/svg+xml">
        <link href="/fonts/stylesheet.css" rel="stylesheet">
        <link href="/styles/reset.css" rel="stylesheet">
        <link href="/styles/vars.css" rel="stylesheet">
        <link href="/styles/app.css" rel="stylesheet">
        <link href="/styles/views/auth.css" rel="preload" type="text/css" as="style">
        <link href="/styles/views/vote.css" rel="preload" type="text/css" as="style">
        <link rel="modulepreload" href="https://ga.jspm.io/npm:@lit-labs/ssr-client@1.1.3/_/15086f1b.js"/>
        <link rel="modulepreload" href="https://ga.jspm.io/npm:@lit-labs/ssr-client@1.1.3/index.js"/>
        <link rel="modulepreload" href="https://ga.jspm.io/npm:@lit-labs/ssr-client@1.1.3/lit-element-hydrate-support.js"/>
        <link rel="modulepreload" href="https://ga.jspm.io/npm:@lit-labs/task@3.0.1/index.js"/>
        <link rel="modulepreload" href="https://ga.jspm.io/npm:@lit-labs/task@3.0.1/task.js"/>
        <link rel="modulepreload" href="https://ga.jspm.io/npm:@lit/reactive-element@1.6.3/css-tag.js"/>
        <link rel="modulepreload" href="https://ga.jspm.io/npm:@lit/reactive-element@1.6.3/reactive-element.js"/>
        <link rel="modulepreload" href="https://ga.jspm.io/npm:@vkontakte/superappkit@1.60.4/dist/index.js"/>
        <link rel="modulepreload" href="https://ga.jspm.io/npm:lit-element@3.3.3/lit-element.js"/>
        <link rel="modulepreload" href="https://ga.jspm.io/npm:lit-html@2.8.0/async-directive.js"/>
        <link rel="modulepreload" href="https://ga.jspm.io/npm:lit-html@2.8.0/directive-helpers.js"/>
        <link rel="modulepreload" href="https://ga.jspm.io/npm:lit-html@2.8.0/directive.js"/>
        <link rel="modulepreload" href="https://ga.jspm.io/npm:lit-html@2.8.0/directives/cache.js"/>
        <link rel="modulepreload" href="https://ga.jspm.io/npm:lit-html@2.8.0/directives/choose.js"/>
        <link rel="modulepreload" href="https://ga.jspm.io/npm:lit-html@2.8.0/directives/class-map.js"/>
        <link rel="modulepreload" href="https://ga.jspm.io/npm:lit-html@2.8.0/directives/if-defined.js"/>
        <link rel="modulepreload" href="https://ga.jspm.io/npm:lit-html@2.8.0/directives/map.js"/>
        <link rel="modulepreload" href="https://ga.jspm.io/npm:lit-html@2.8.0/directives/ref.js"/>
        <link rel="modulepreload" href="https://ga.jspm.io/npm:lit-html@2.8.0/directives/repeat.js"/>
        <link rel="modulepreload" href="https://ga.jspm.io/npm:lit-html@2.8.0/directives/unsafe-html.js"/>
        <link rel="modulepreload" href="https://ga.jspm.io/npm:lit-html@2.8.0/is-server.js"/>
        <link rel="modulepreload" href="https://ga.jspm.io/npm:lit-html@2.8.0/lit-html.js"/>
        <link rel="modulepreload" href="https://ga.jspm.io/npm:lit-html@2.8.0/private-ssr-support.js"/>
        <link rel="modulepreload" href="https://ga.jspm.io/npm:lit@2.8.0/directives/cache.js"/>
        <link rel="modulepreload" href="https://ga.jspm.io/npm:lit@2.8.0/directives/choose.js"/>
        <link rel="modulepreload" href="https://ga.jspm.io/npm:lit@2.8.0/directives/class-map.js"/>
        <link rel="modulepreload" href="https://ga.jspm.io/npm:lit@2.8.0/directives/if-defined.js"/>
        <link rel="modulepreload" href="https://ga.jspm.io/npm:lit@2.8.0/directives/map.js"/>
        <link rel="modulepreload" href="https://ga.jspm.io/npm:lit@2.8.0/directives/ref.js"/>
        <link rel="modulepreload" href="https://ga.jspm.io/npm:lit@2.8.0/directives/repeat.js"/>
        <link rel="modulepreload" href="https://ga.jspm.io/npm:lit@2.8.0/directives/unsafe-html.js"/>
        <link rel="modulepreload" href="https://ga.jspm.io/npm:lit@2.8.0/index.js"/>
        <script>if (typeof globalThis === "undefined") window.globalThis = window;</script>
        <script async crossorigin="anonymous"
                src="https://ga.jspm.io/npm:es-module-shims@1.8.0/dist/es-module-shims.js"></script>
        <script async src="/_vercel/insights/script.js"></script>
        <script defer src="/client.mjs" type="module"></script>
        <script async src="/livereload.mjs"></script>
    </head>
    <body>
    `;
    yield body;
    yield `
    </body>
    </html>
    `;
}
