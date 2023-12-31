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
import {ifDefined} from "lit/directives/if-defined.js";
import {unsafeHTML} from "lit/directives/unsafe-html.js";
import {Config, Connect, ConnectEvents} from "@vkontakte/superappkit";
import {LitElement, isServer, nothing, html, css} from "lit";
import {VercelImageGenerator} from "./generator.mjs";
import {Countdown} from "./countdown.mjs";

Countdown.define();

export class App extends LitElement {

    constructor() {
        super();
        this.controllers = {}
        this.task = Promise.resolve()
        this.options = {
            buttonStyles: {},
            buttonSkin: "flat",
            showAgreements: false,
            showAlternativeLogin: false
        }
        this.logger = new Proxy(console, {
            get(_, method) {
                return (...args) => {
                    if (console[method])
                        console[method](...args);
                    if (
                        window.logger &&
                        window.logger[method]
                    ) window.logger[method](...args);
                }
            }
        })
        this.views = {
            auth: this.authView.bind(this),
            vote: this.voteView.bind(this),
            subscribe: this.subscribeView.bind(this),
            countdown: this.countdownView.bind(this),
        }
    }

    static get styles() {
        return css`
          @import "/styles/reset.css";
          @import "/styles/app.css";
          @import "/styles/views/auth.css";
          @import "/styles/views/vote.css";
        `
    }

    static get properties() {
        return {
            cdn: {type: String},
            host: {type: String},
            rounds: {state: true},
            version: {type: String},
            _account: {state: true},
            _session: {state: true},
            imageModal: {state: true},
            countdown: {type: Number},
            maybeSubscribed: {state: true},
            appId: {type: Number, attribute: "app-id"},
            groupId: {type: Number, attribute: "group-id"},
        }
    }

    get payload() {
        const {
            searchParams
        } = new URL(location);
        if (searchParams.has("payload")) {
            const payload = JSON.parse(searchParams.get("payload"));
            history.replaceState(payload, undefined, "/");
            return payload;
        }
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
        this.maybeSubscribed = data.subscribed;
        localStorage.setItem("account", JSON.stringify(data));
    }

    get state() {
        if (this._state) return this._state;
        const slot = this.renderRoot.querySelector("slot[name=state]");
        if (!slot) return;
        const [script] = slot.assignedElements().filter(node => node.matches("script"));
        if (script) return this._state = JSON.parse(script.innerHTML);
    }

    get groupLink() {
        return new URL(`club${this.groupId}`, `https://vk.com/`).href;
    }

    static define(tag = "app-root") {
        customElements.define(tag, this);
    }

    abortSignals(...keys) {
        keys.forEach(key => {
            if (this.controllers[key])
                this.controllers[key].abort()
        });
    }

    replaceSignal(key, reason) {
        if (this.controllers[key])
            this.controllers[key].abort(reason);
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
        const {state} = this;
        if (state) this.rounds = state.rounds;
        this.images = new VercelImageGenerator(this);
    }

    firstUpdated(_changedProperties) {
        setTimeout(() => {
            if (!this.account) {
                const storageAccount = localStorage.getItem("account");
                if (storageAccount) this.account = JSON.parse(storageAccount);
            }
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
        const {account} = this;
        let view = "auth";
        if (
            account &&
            account.ok
        ) {
            if (!account.subscribed)
                view = "subscribe";
            else if (
                !this.rounds ||
                !this.rounds.length
            )
                view = "countdown";
            else
                view = "vote";
        }
        return html`
            <main class=${classMap({[view]: true})}>
                ${choose(
                        view,
                        Object.entries(this.views),
                        this.views.auth.bind(this)
                )}
            </main>
            <div class="low-resolution">
                <div class="background">
                    <div class="decorations"></div>
                </div>
                <picture class="logo">
                    <img src="/images/logo.svg" alt="RCC EXTREME" loading="lazy">
                </picture>
                <h1>
                    <mark>Поверните</mark>
                    <br>
                    экран
                </h1>
            </div>
            <div class="${classMap({modal: true, active: !!this.imageModal})}">
                ${when(
                        this.imageModal,
                        () => html`<img src="${this.images.generate({src: this.imageModal, width: 2048})}">`,
                        () => nothing
                )}
                <button @click="${() => this.imageModal = undefined}">Закрыть</button>
            </div>
            <slot name="state"></slot>
        `;
    }

    authView() {
        return html`
            <div class="background">
                <div class="decorations"></div>
            </div>
            <section>
                <picture class="logo">
                    <img src="/images/logo.svg" alt="RCC EXTREME">
                </picture>
                <h1>
                    ПРОГОЛОСУЙ
                    <br>
                    <mark>ЗА ЛЮБИМОГО</mark>
                    <br>
                    АРТИСТА!
                </h1>
                ${cache(html`
                    <div class="vk" ${ref(this.renderAuth)}></div>
                `)}
            </section>`
    }

    voteView() {
        return html`
            <div class="background">
                <div class="decorations"></div>
            </div>
            <section>
                <picture class="logo">
                    <img src="/images/logo.svg" alt="RCC EXTREME">
                </picture>
                ${choose(
                        this.rounds.length,
                        [
                            [
                                1,
                                (
                                        [
                                            {
                                                title,
                                                name: round,
                                                variants = [],
                                            } = {}
                                        ] = this.rounds
                                ) => html`
                                    <h1>
                                        ${when(
                                                this.hasChoice(round),
                                                () => "CПАСИБО ЗА ГОЛОС!",
                                                () => title
                                        )}
                                    </h1>
                                    <p>
                                        ${when(
                                                this.hasChoice(round),
                                                () => html`
                                                    <span>Следите за результатами</span>
                                                    <span>голосования онлайн!</span>
                                                `,
                                                () => html`
                                                    <span>Проголосуйте за своего фаворита</span>
                                                `
                                        )}
                                    </p>
                                    ${choose(
                                            variants.length,
                                            [
                                                [
                                                    2,
                                                    () => html`
                                                        <div class=${classMap({
                                                            columns: true,
                                                            variants: true,
                                                            results: this.hasChoice(round)
                                                        })}>
                                                            ${this.renderVariants({round, variants})}
                                                        </div>
                                                    `
                                                ],
                                                [
                                                    4,
                                                    () => html`
                                                        <div class=${classMap({
                                                            grid: true,
                                                            full: true,
                                                            variants: true,
                                                            results: this.hasChoice(round)
                                                        })}>
                                                            ${this.renderVariants({round, variants}, {modal: true})}
                                                        </div>
                                                    `
                                                ],
                                            ],
                                            () => html`
                                                <p>Ошибка в данных голосования</p>
                                            `
                                    )}
                                `
                            ],
                            [
                                2,
                                () => html`
                                    <div class="rounds">
                                        ${map(
                                                this.rounds,
                                                (
                                                        {
                                                            title,
                                                            name: round,
                                                            variants = [],
                                                        } = {}
                                                ) => html`
                                                    <div class="round">
                                                        <h1>${title}</h1>
                                                        <div class=${classMap({
                                                            grid: true,
                                                            variants: true,
                                                            results: this.hasChoice(round)
                                                        })}>
                                                            ${this.renderVariants({round, variants})}
                                                        </div>
                                                    </div>
                                                `
                                        )}
                                    </div>
                                `
                            ]
                        ],
                        () => html`
                            <p>Ошибка в данных голосования</p>
                        `
                )}
            </section>
        `
    }

    subscribeView() {
        return html`
            <div class="background">
                <div class="decorations"></div>
            </div>
            <section>
                <picture class="logo">
                    <img src="/images/logo.svg" alt="RCC EXTREME">
                </picture>
                <h1>
                    ПОДПИШИСЬ
                    <br>
                    <mark>НА НАС</mark>
                    <br>
                    ВКОНТАКТЕ
                </h1>
                <p>
                    <span>Чтобы участвовать в голосовании</span>
                    <span>за артистов и розыгрыше ярких призов!</span>
                </p>
                <div class="controls">
                    ${when(
                            this.maybeSubscribed,
                            () => html`
                                <button @click="${this.updateStates.bind(this)}">
                                    Я уже подписался
                                </button>
                            `,
                            () => html`
                                <a
                                        class="button"
                                        target="_blank"
                                        href="${this.groupLink}"
                                        @click="${this.subscribe.bind(this)}"
                                >
                                    Подписаться на RCC Extreme
                                </a>
                            `
                    )}
                </div>
            </section>`
    }

    countdownView() {
        return html`
            <div class="background">
                <div class="decorations"></div>
            </div>
            <section>
                <picture class="logo">
                    <img src="/images/logo.svg" alt="RCC EXTREME">
                </picture>
                <h1>
                    ГОЛОСОВАНИЕ
                    <br>
                    <mark>УЖЕ СКОРО</mark>
                    <br>
                    НАЧНЕТСЯ!
                </h1>
                <div class="controls">
                    <app-countdown timestamp="${ifDefined(this.countdown)}"></app-countdown>
                </div>
            </section>
        `
    }

    getChoice(round) {
        if (!this.account) return;
        if (!this.account.choices) return;
        return this.account.choices[round];
    }

    hasChoice(round) {
        return this.getChoice(round) !== undefined;
    }

    subscribe() {
        this.maybeSubscribed = true;
    }

    renderVariants({round, variants = []} = {}, {modal} = {}) {
        return map(
            variants,
            ({name, resultString, image, logo} = {}, index) => html`
                <div class="variant">
                    <div class="background">
                        <picture @click="${() => {
                            if (modal) this.imageModal = image;
                        }}">
                            ${this.renderPicture({
                                img: {src: image, width: 512, alt: name},
                                sources: [
                                    {width: 1024, media: "(min-width: 1024px)"}
                                ]
                            })}
                        </picture>
                    </div>
                    ${when(
                            logo,
                            () => html`
                                <picture class="variant-logo">
                                    ${this.renderPicture({
                                        img: {src: logo, width: 512, alt: name},
                                        sources: [
                                            {width: 1024, media: "(min-width: 1024px)"}
                                        ]
                                    })}
                                </picture>
                            `,
                            () => html`
                                <h2 class="name">${name}</h2>
                            `
                    )}
                    <button
                            @click=${this.vote.bind(this, round, index)}
                            class=${classMap({
                                selected: index === this.getChoice(round)
                            })}
                    >
                        ${when(
                                this.hasChoice(round),
                                () => resultString,
                                () => "Голосовать",
                        )}
                    </button>
                </div>
            `
        );
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
        const style = getComputedStyle(container);
        const callback = this.authCallback.bind(this);
        const height = parseInt(style.getPropertyValue("height"));
        const borderRadius = parseInt(style.getPropertyValue("border-radius"));
        const options = {...this.options, buttonStyles: {height, borderRadius}};
        Connect.buttonOneTapAuth({container, callback, options});
    }

    authCallback(event) {
        const url = new URL("/", location);
        switch (event.type) {
            case ConnectEvents.OneTapAuthEventsSDK.LOGIN_SUCCESS:
                this.session = event.payload;
                return this.updateStates();
            case ConnectEvents.ButtonOneTapAuthEventsSDK.SHOW_LOGIN:
            case ConnectEvents.OneTapAuthEventsSDK.FULL_AUTH_NEEDED:
            case ConnectEvents.OneTapAuthEventsSDK.PHONE_VALIDATION_NEEDED:
                return Connect.redirectAuth({url});
            case ConnectEvents.ButtonOneTapAuthEventsSDK.SHOW_LOGIN_OPTIONS:
                return Connect.redirectAuth({screen: "phone", url});
        }
    }

    async vote(round, choice) {
        if (this.hasChoice(round)) return;
        this.abortSignals("rounds", "account");
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
            this.updateRoundsState(),
        ]);
    }

    async updateAccountState(session = this.session) {
        const signal = this.replaceSignal("account");
        let account = {ok: false};
        if (session)
            account = await this.callApi("auth", {...session}, signal);
        if (!account || !account.ok) {
            localStorage.removeItem("session");
            delete this._session;
        }
        return this.account = account;
    }

    async updateRoundsState() {
        const signal = this.replaceSignal("rounds");
        return this.rounds = await this.callApi("rounds", undefined, signal);
    }

    scheduleUpdateRoundState(timeout = 5000) {
        setTimeout(() =>
                this.updateRoundsState()
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
