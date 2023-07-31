/**
 * @typedef {import("@vkontakte/superappkit").VKAuthButtonCallbackResult} VKAuthButtonCallbackResult
 * @typedef {import("@vkontakte/superappkit").ButtonOneTapSkin} ButtonOneTapSkin
 */

import {Config, Connect, ConnectEvents} from "@vkontakte/superappkit";
import {cache} from "lit/directives/cache.js";
import {ref} from "lit/directives/ref.js";
import {LitElement, html, css} from "lit";

export class App extends LitElement {

    options = {
        buttonStyles: {},
        buttonSkin: "flat",
        showAgreements: false,
        showAlternativeLogin: false
    }

    static properties = {
        session: {state: true},
        appId: {type: Number, attribute: "app-id"},
    };

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
        return html`
            <h1>
                <slot>🌚</slot>
            </h1>
            ${cache(html`
                <div class="auth" ${ref(this.renderAuth)}></div>
            `)}
        `;
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

}
