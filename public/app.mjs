/**
 * @typedef {import("@vkontakte/superappkit").VKAuthButtonCallbackResult} VKAuthButtonCallbackResult
 * @typedef {import("@vkontakte/superappkit").ButtonOneTapSkin} ButtonOneTapSkin
 */

import {Config, Connect, ConnectEvents} from "@vkontakte/superappkit";
import {unsafeHTML} from "lit/directives/unsafe-html.js";
import {classMap} from "lit/directives/class-map.js";
import {choose} from "lit/directives/choose.js";
import {cache} from "lit/directives/cache.js";
import {when} from "lit/directives/when.js";
import {map} from "lit/directives/map.js";
import {ref} from "lit/directives/ref.js";
import {styles} from "./app.styles.mjs";
import {LitElement, html} from "lit";

export class App extends LitElement {
    static styles = [styles]
    static properties = {
        round: {state: true},
        _account: {state: true},
        _session: {state: true},
        appId: {type: Number, attribute: "app-id"},
    }
    controllers = {}
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
            ${map(
                    (this.round?.variants),
                    ({name, button, result}, index) => html`
                        <div>
                            <h2>${name}</h2>
                            <button class=${classMap({
                                active: index + 1 === this.account.choice
                            })} @click=${this.vote.bind(this, index + 1)}>
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

    get account() {
        return this._account;
    }

    set account(data) {
        if (!data) return;
        this._account = data;
        localStorage.setItem("account", JSON.stringify(data));
    }

    get state() {
        if (this._state) return this._state;
        const slot = this.shadowRoot.querySelector("slot[name=state]");
        const [script] = slot.assignedElements().filter(node => node.matches("script"));
        if (script) return this._state = JSON.parse(script.innerHTML);
    }

    static define(tag = "app-root") {
        customElements.define(tag, this);
    }

    abortSignals(...keys) {
        keys.forEach(key => this.controllers[key]?.abort());
    }

    replaceSignal(key, reason) {
        this.controllers[key]?.abort(reason);
        this.controllers[key] = new AbortController();
        return this.controllers[key].signal;
    }

    connectedCallback() {
        super.connectedCallback();
        this.session = this.payload;
        this.round = this.state?.round;
        this.task = this.task.then(
            () => this.updateAccountState()
        );
        Config.init({appId: this.appId});
        // setInterval(this.updateRoundState.bind(this), 5000);
    }

    update(changedProperties) {
        console.debug(changedProperties);
        super.update(changedProperties);
    }

    firstUpdated(_changedProperties) {
        setTimeout(() => {
            if (this.account) return;
            const storageAccount = localStorage.getItem("account");
            if (storageAccount) this.account = JSON.parse(storageAccount);
        });
    }

    renderLight() {
        const {state} = this;
        if (state) return unsafeHTML(`
            <script slot="state" type="application/json">${JSON.stringify(state, null, 2)}</script>
        `);
    }

    render() {
        return html`
            <div class="view">
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

    async vote(choice) {
        const {_id: round} = this.round;
        this.abortSignals("round", "account");
        this.account = {...this.account, choice};
        const signal = this.replaceSignal("vote");
        await this.callApi("vote", {...this.session, round, choice}, signal);
        await Promise.all([
            this.updateAccountState(),
            this.updateRoundState()
        ]);
    }

    async updateAccountState(session = this.session, {_id: round} = this.round) {
        const signal = this.replaceSignal("account");
        let account = {ok: false};
        if (session && round)
            account = await this.callApi("auth", {...session, round}, signal);
        if (!account?.ok) {
            localStorage.removeItem("session");
            delete this._session;
        }
        return this.account = account;

    }

    async updateRoundState() {
        const signal = this.replaceSignal("round");
        return this.round = await this.callApi("round", {}, signal);
    }

    async callApi(path, payload = {}, signal) {
        const method = "POST";
        const body = JSON.stringify(payload);
        const headers = {"Content-Type": "application/json"};
        const response = await fetch(`/api/${path}`, {method, body, headers, signal});
        return response.json();
    }

}
