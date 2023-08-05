import "@lit-labs/ssr-client/lit-element-hydrate-support.js";
import {App} from "./app.mjs";

if (Logtail in window) {
    const logger = window.logger = new Logtail("1qvKAa4X3qErJjuwfv6ji2jk");
    window.addEventListener("pagehide", logger.flush.bind(logger));
    window.addEventListener("unhandledrejection", ({type, reason, promise}) => {
        void logger.error(reason?.message || reason, {type, reason, promise});
    });
    window.addEventListener("error",
        ({type, message, source, lineno, colno, error} = {}) => {
            void logger.error(message, {type, message, source, lineno, colno, error});
            return false;
        }
    );
}

App.define();
