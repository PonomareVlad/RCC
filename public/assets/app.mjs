/**
 * @typedef {import("@vkontakte/superappkit").VKAuthButtonCallbackResult} VKAuthButtonCallbackResult
 * @typedef {import("@vkontakte/superappkit").ButtonOneTapSkin} ButtonOneTapSkin
 */

import {Config, Connect, ConnectEvents} from "@vkontakte/superappkit";
import {choose} from "lit/directives/choose.js";
import {cache} from "lit/directives/cache.js";
import {ref} from "lit/directives/ref.js";
import {styles} from './app.styles.mjs';
import {LitElement, html} from "lit";
import {Task} from "@lit-labs/task";

export class App extends LitElement {

    static styles = [styles]
    static properties = {
        round: {state: true},
        account: {state: true},
        // _session: {state: true},
        // view: {type: String, reflect: true},
        appId: {type: Number, attribute: "app-id"},
    }
    options = {
        buttonStyles: {},
        buttonSkin: "flat",
        showAgreements: false,
        showAlternativeLogin: false
    }
    authTask = new Task(this, {
        args: () => [this._session, this.round],
        task: ([session, round]) => this.updateAccountState(session, round)
    })
    views = {
        auth: () => html`
            <h1>Auth</h1>
            <div>
                ${cache(html`
                    <div class="auth" ${ref(this.renderAuth)}></div>
                `)}
            </div>`,
        round: () => html`<h1>Round</h1>`,
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
        const {appId} = this;
        Config.init({appId});
    }

    renderView() {
        return choose(
            this.account?.ok ? "round" : "auth",
            Object.entries(this.views),
            () => `Wrong view`
        );
    }

    render() {
        console.log("render");
        const renderView = this.renderView.bind(this);
        const task = this.authTask.render({
            error: () => `Auth error`,
            complete: renderView,
            initial: renderView,
        });
        return html`
            <div>${task}</div>
            <slot name="state"></slot>
        `;
    }

    renderAuth(container) {
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
