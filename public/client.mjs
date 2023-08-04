import "@lit-labs/ssr-client/lit-element-hydrate-support.js";
import {App} from "./app.mjs";

if (Logtail in window) {
    const logtail = new Logtail("1qvKAa4X3qErJjuwfv6ji2jk");
    window.addEventListener("pagehide", logtail.flush.bind(logtail));
    window.addEventListener("error",
        ({type, message, source, lineno, colno, error} = {}) => {
            void logtail.error(message, {type, message, source, lineno, colno, error});
            return false;
        }
    );
}

App.define();
