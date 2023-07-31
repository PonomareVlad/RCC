/**
 * @typedef {import("@vkontakte/superappkit").VKAuthButtonCallbackResult} VKAuthButtonCallbackResult
 * @typedef {import("@vkontakte/superappkit").ButtonOneTapSkin} ButtonOneTapSkin
 */

import {Config, Connect, ConnectEvents} from "@vkontakte/superappkit";
import {choose} from "lit/directives/choose.js";
import {cache} from "lit/directives/cache.js";
import {ref} from "lit/directives/ref.js";
import {LitElement, html, css} from "lit";
import {Task} from "@lit-labs/task";

export class App extends LitElement {

    static properties = {
        session: {state: true},
        view: {type: String, reflect: true},
        appId: {type: Number, attribute: "app-id"},
    }

    options = {
        buttonStyles: {},
        buttonSkin: "flat",
        showAgreements: false,
        showAlternativeLogin: false
    }

    authTask = new Task(this, {
        args: () => [this.session],
        task: ([session]) => session ? this.callApi("auth", session)
            .then(({ok}) => this.view = ok ? "vote" : "auth") : false
    })

    views = {
        auth: () => html`
            <h1>Auth</h1>
            ${cache(html`
                <div class="auth" ${ref(this.renderAuth)}></div>
            `)}`,
        vote: () => html`<h1>Vote</h1>`,
    }

    constructor() {
        super();
        this.view = "auth";
    }

    static define(tag = "app-root") {
        customElements.define(tag, this);
    }

    connectedCallback() {
        super.connectedCallback();
        const session = localStorage.getItem("session");
        if (session) this.session = JSON.parse(session);
        const {appId} = this;
        Config.init({appId});
    }

    render() {
        return this.authTask.render({
            error: () => html`error`,
            // initial: () => html`initial`,
            pending: () => html`pending`,
            complete: () => choose(this.view, Object.entries(this.views), () => html`<h1>Error</h1>`),
        });
    }

    renderAuth(container) {
        const callback = this.authCallback;
        const style = getComputedStyle(container);
        const height = style.getPropertyValue("height");
        const borderRadius = style.getPropertyValue("border-radius");
        const options = {...this.options, buttonStyles: {height, borderRadius}};
        Connect.buttonOneTapAuth({container, callback, options});
    }

    authCallback(event) {
        const url = new URL("/", location);
        switch (event.type) {
            case ConnectEvents.OneTapAuthEventsSDK.LOGIN_SUCCESS:
                return event;
            case ConnectEvents.ButtonOneTapAuthEventsSDK.SHOW_LOGIN:
            case ConnectEvents.OneTapAuthEventsSDK.FULL_AUTH_NEEDED:
            case ConnectEvents.OneTapAuthEventsSDK.PHONE_VALIDATION_NEEDED:
                return Connect.redirectAuth({url});
            case ConnectEvents.ButtonOneTapAuthEventsSDK.SHOW_LOGIN_OPTIONS:
                return Connect.redirectAuth({screen: "phone", url});
        }
    }

    async callApi(path, payload = {}) {
        const method = "POST";
        const body = JSON.stringify(payload);
        const headers = {"Content-Type": "application/json"};
        const response = await fetch(`/api/${path}`, {method, body, headers});
        return response.json();
    }

}
