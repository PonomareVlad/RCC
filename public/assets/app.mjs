/**
 * @typedef {import("@vkontakte/superappkit").VKAuthButtonCallbackResult} VKAuthButtonCallbackResult
 * @typedef {import("@vkontakte/superappkit").ButtonOneTapSkin} ButtonOneTapSkin
 */

import {Config, Connect, ConnectEvents} from "@vkontakte/superappkit";
import {classMap} from "lit/directives/class-map.js";
import {repeat} from "lit/directives/repeat.js";
import {choose} from "lit/directives/choose.js";
import {cache} from "lit/directives/cache.js";
import {when} from "lit/directives/when.js";
import {ref} from "lit/directives/ref.js";
import {styles} from './app.styles.mjs';
import {LitElement, html} from "lit";

export class App extends LitElement {

    static styles = [styles]
    static properties = {
        round: {state: true},
        account: {state: true},
        _session: {state: true},
        appId: {type: Number, attribute: "app-id"},
    }
    task = Promise.resolve()
    options = {
        buttonStyles: {},
        buttonSkin: "flat",
        showAgreements: false,
        showAlternativeLogin: false
    }
    views = {
        auth: () => html`
            <h1>Auth</h1>
            <div>
                ${cache(html`
                    <div class="auth" ${ref(this.renderAuth)}></div>
                `)}
            </div>`,
        round: () => html`
            <h1>Round</h1>
            ${repeat(
                    (this.round?.variants || []),
                    ({name}) => name,
                    ({name, button, result}, index) => html`
                        <div>
                            <h2>${name}</h2>
                            <button class=${classMap({
                                active: index + 1 === this.account.choice
                            })}>
                                ${when(
                                        this.account.choice,
                                        () => String(result),
                                        () => button,
                                )}
                            </button>
                        </div>
                    `
            )}
        `,
    }

    get payload() {
        const {
            searchParams
        } = new URL(location);
        if (searchParams.has("payload"))
            return JSON.parse(searchParams.get("payload"))
    }

    get session() {
        if (this._session) return this._session;
        const session = localStorage.getItem("session");
        if (session) return this._session = JSON.parse(session);
    }

    set session(data) {
        if (!data) return;
        this._session = data;
        localStorage.setItem("session", JSON.stringify(data));
    }

    get state() {
        const slot = this.shadowRoot.querySelector("slot[name=state]");
        const [script] = slot.assignedElements().filter(node => node.matches("script"));
        if (script) return JSON.parse(script.innerHTML);
    }

    static define(tag = "app-root") {
        customElements.define(tag, this);
    }

    connectedCallback() {
        super.connectedCallback();
        this.session = this.payload;
        this.round = this.state?.round;
        this.task = this.task.then(
            () => this.updateAccountState()
        );
        Config.init({appId: this.appId});
    }

    update(changedProperties) {
        console.debug(changedProperties);
        super.update(changedProperties);
    }

    render() {
        return html`
            <div>
                ${choose(
                        this.account?.ok ? "round" : "auth",
                        Object.entries(this.views),
                        () => `Wrong view`
                )}
            </div>
            <slot name="state"></slot>
        `;
    }

    async renderAuth(container) {
        await this.task;
        if (!container) return;
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

    async updateAccountState(session = this.session, {_id: round} = this.round) {
        if (session && round) return this.account = await this.callApi("auth", {...session, round});
    }

    async callApi(path, payload = {}) {
        const method = "POST";
        const body = JSON.stringify(payload);
        const headers = {"Content-Type": "application/json"};
        const response = await fetch(`/api/${path}`, {method, body, headers});
        return response.json();
    }

}
