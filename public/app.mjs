/**
 * @typedef {import("@vkontakte/superappkit").VKAuthButtonCallbackResult} VKAuthButtonCallbackResult
 * @typedef {import("@vkontakte/superappkit").ButtonOneTapSkin} ButtonOneTapSkin
 */

import {map} from "lit/directives/map.js";
import {ref} from "lit/directives/ref.js";
import {when} from "lit/directives/when.js";
import {cache} from "lit/directives/cache.js";
import {choose} from "lit/directives/choose.js";
import {classMap} from "lit/directives/class-map.js";
import {unsafeHTML} from "lit/directives/unsafe-html.js";
import {Config, Connect, ConnectEvents} from "@vkontakte/superappkit";
import {VercelImageGenerator} from "./generator.mjs";
import {LitElement, isServer, html, css} from "lit";

export class App extends LitElement {

    constructor() {
        super();
        this.controllers = {}
        this.task = Promise.resolve()
        this.percentNumber = new Intl.NumberFormat("ru-RU", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
            style: "percent",
        })
        this.options = {
            buttonStyles: {},
            buttonSkin: "flat",
            showAgreements: false,
            showAlternativeLogin: false
        }
        this.logger = new Proxy(console, {
            get(_, method) {
                return (...args) => {
                    console[method]?.(...args);
                    window.logger?.[method]?.(...args);
                }
            }
        })
        this.views = {
            auth: this.authView.bind(this),
            vote: this.voteView.bind(this),
        }
    }

    static get styles() {
        return css`
          @import "/styles/reset.css";
          @import "/styles/app.css";
        `
    }

    static get properties() {
        return {
            cdn: {type: String},
            host: {type: String},
            round: {state: true},
            _account: {state: true},
            _session: {state: true},
            appId: {type: Number, attribute: "app-id"},
        }
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
        const slot = this.renderRoot.querySelector("slot[name=state]");
        if (!slot) return;
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
        this.init();
        this.session = this.payload;
        this.task = this.task.then(
            () => this.updateStates()
        );
        Config.init({appId: this.appId});
    }

    init() {
        this.round = this.state?.round;
        this.images = new VercelImageGenerator(this);
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
            if (location.host !== "localhost") this.scheduleUpdateRoundState();
        });
    }

    renderLight() {
        const {state} = this;
        if (state) return unsafeHTML(`
            <script slot="state" type="application/json">${JSON.stringify(state, null, 2)}</script>
        `);
    }

    render() {
        if (isServer) this.init();
        const view = this.account?.ok ? "vote" : "auth";
        return html`
            <main class=${classMap({[view]: true})}>
                ${choose(
                        view,
                        Object.entries(this.views),
                        this.views.auth.bind(this)
                )}
            </main>
            <div class="low-resolution">
                <h1>Поверните экран</h1>
            </div>
            <slot name="state"></slot>
        `;
    }

    authView() {
        return html`
            <div class="background">
                <div class="decorations"></div>
                <div class="photos">
                    <picture class="niletto">
                        ${this.renderPicture({
                            img: {
                                width: 1024,
                                alt: "Niletto",
                                decoding: "async",
                                src: "/images/Niletto.png",
                            },
                            sources: [
                                {width: 1024, media: "(min-width: 1024px)"},
                                {width: 1536, media: "(min-width: 1536px)"},
                                {width: 2048, media: "(min-width: 2048px)"},
                            ]
                        })}
                    </picture>
                    <picture class="klava">
                        ${this.renderPicture({
                            img: {
                                width: 1024,
                                alt: "Klava",
                                decoding: "async",
                                src: "/images/Klava.png",
                            },
                            sources: [
                                {width: 1536, media: "(min-width: 1024px)"},
                                {width: 2048, media: "(min-width: 1536px)"},
                            ]
                        })}
                    </picture>
                </div>
            </div>
            <section>
                <picture class="logo">
                    <img src="/images/logo.svg" alt="RCC EXTREME" decoding="async">
                </picture>
                <h1>
                    ПРОГОЛОСУЙ
                    <br>
                    <mark>ЗА ЛЮБИМОГО</mark>
                    <br>
                    АРТИСТА!
                </h1>
                ${cache(html`
                    <div class="vk" ${ref(this.renderAuth)}></div>`)}
            </section>`
    }

    voteView() {
        return when(
            this.round,
            () => html`
                <div class="background">
                    <div class="decorations"></div>
                </div>
                <section>
                    <picture class="logo">
                        <img src="/images/logo.svg" alt="RCC EXTREME" decoding="async">
                    </picture>
                    <h1>
                        ${when(
                                this.account?.choices?.[this.round._id],
                                () => html`
                                    <span>CПАСИБО</span>
                                    <span>ЗА ГОЛОС!</span>
                                `,
                                () => this.round.title
                        )}
                    </h1>
                    <p>
                        ${when(
                                this.account?.choices?.[this.round._id],
                                () => html`
                                    <span>Следите за результатами</span>
                                    <span>голосования онлайн!</span>
                                `,
                                () => html`
                                    <span>Проголосуйте за артиста,</span>
                                    <span>чтобы увидеть результаты</span>
                                `
                        )}
                    </p>
                    <div class=${classMap({
                        variants: true,
                        results: this.account?.choices?.[this.round._id]
                    })}>
                        ${map(
                                (this.round.variants),
                                ({name, button, result, image}, index) => html`
                                    <div class="side">
                                        <div class="background">
                                            <picture>
                                                ${this.renderPicture({
                                                    img: {src: image, width: 512, alt: name},
                                                    sources: [{width: 1024, media: "(min-width: 1024px)"}]
                                                })}
                                            </picture>
                                        </div>
                                        <h2 class="name">${name}</h2>
                                        <button class=${classMap({
                                            selected: index + 1 === this.account?.choices?.[this.round._id]
                                        })} @click=${this.vote.bind(this, this.round._id, index + 1)}>
                                            ${when(
                                                    this.account?.choices?.[this.round._id],
                                                    () => this.percentNumber.format(result),
                                                    () => button,
                                            )}
                                        </button>
                                    </div>
                                `
                        )}
                    </div>
                </section>
            `,
            () => html`
                <section>
                    <picture class="logo">
                        <img src="/images/logo.svg" alt="RCC EXTREME" decoding="async">
                    </picture>
                    <h1>Голосование
                        <mark>скоро</mark>
                        начнется
                    </h1>
                </section>`
        )
    }

    renderPicture({sources = [], img = {}} = {}) {
        const {src, width, quality, ...attributes} = img;
        const output = sources.map(
            ({media, ...source} = {}) =>
                `<source media="${media}" srcset="${
                    this.images.generate({src, width, quality, ...source})
                }">`
        );
        if (src && width) {
            const url = this.images.generate({src, width, quality});
            const rest = Object.entries(attributes)
                .map(([key, value]) => `${key}="${value}"`).join(" ");
            output.push(`<img src="${url}" ${rest}>`);
        }
        return unsafeHTML(output.join("\r\n"));
    }

    async renderAuth(container) {
        await this.task.catch(console.error);
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

    async vote(round, choice) {
        this.abortSignals("round", "account");
        this.account = {
            ...this.account,
            choices: {
                ...this.account.choices,
                [round]: choice
            }
        };
        const signal = this.replaceSignal("vote");
        await this.callApi("vote", {...this.session, round, choice}, signal);
        await this.updateStates();
    }

    updateStates() {
        return Promise.all([
            this.updateAccountState(),
            this.updateRoundState(),
        ]);
    }

    async updateAccountState(session = this.session) {
        const signal = this.replaceSignal("account");
        let account = {ok: false};
        if (session)
            account = await this.callApi("auth", {...session}, signal);
        if (!account?.ok) {
            localStorage.removeItem("session");
            delete this._session;
        }
        return this.account = account;
    }

    async updateRoundState() {
        const signal = this.replaceSignal("round");
        return this.round = await this.callApi("round", undefined, signal);
    }

    scheduleUpdateRoundState(timeout = 5000) {
        setTimeout(() =>
                this.updateRoundState()
                    .catch(this.logger.error)
                    .then(this.scheduleUpdateRoundState.bind(this, timeout)),
            timeout);
    }

    async callApi(path, payload, signal) {
        const options = {signal};
        if (payload) Object.assign(options, {
            method: "POST",
            body: JSON.stringify(payload),
            headers: {"Content-Type": "application/json"},
        });
        const response = await fetch(`/api/${path}`, options);
        return response.json();
    }

}
