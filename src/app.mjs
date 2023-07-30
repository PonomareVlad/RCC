/**
 * @typedef {import("@vkontakte/superappkit").ButtonOneTapSkin} ButtonOneTapSkin
 * @typedef {import("@vkontakte/superappkit").VKAuthButtonCallbackResult} VKAuthButtonCallbackResult
 */
import {auth} from "./auth.mjs";

class App extends HTMLElement {

    choice
    nodes = {}
    round = {}
    auth = false

    templates = {

        auth: async () => {

            const {appId} = this;
            const {_id: round} = this.round || {};
            const container = this.nodes.auth = this.querySelector(".auth");

            this.nodes.title.innerHTML =
                `ПРОГОЛОСУЙ<br><span class="mark">ЗА ЛЮБИМОГО</span><br>АРТИСТА!`;

            const height = getComputedStyle(container).getPropertyValue("height");
            const borderRadius = getComputedStyle(container).getPropertyValue("border-radius");

            const options = {
                buttonSkin: "flat",
                showAlternativeLogin: false,
                showAgreements: false,
                buttonStyles: {
                    borderRadius,
                    height,
                }
            }

            const {ok, choice} = await auth(container, {appId}, options, {round});

            if (!ok) return;

            Object.assign(this, {choice});

            return this.render("round");

        },

        round: async () => {

            const {
                title = "",
                variants = [],
            } = this.round || {};
            const {choice} = this;

            this.nodes.caption = this.querySelector(".caption");
            this.nodes.variants = this.querySelector(".variants");

            const {content} = document.getElementById("variant") || {};

            if (!content) return;

            this.nodes.title.innerHTML =
                choice ? `CПАСИБО<br>ЗА ГОЛОС!` : title;

            this.nodes.variants.classList.toggle("results", !!choice);

            this.nodes.caption.innerHTML = choice ?
                `Следите за результатами<br>голосования онлайн!` :
                `Проголосуйте за артиста,<br>чтобы увидеть результаты`;

            variants.forEach(({name, button, image, result} = {}, index) => {

                const variantChoice = index + 1;
                const variant = content.cloneNode(true);
                const nameNode = variant.querySelector(".name");
                const photoNode = variant.querySelector(".photo");
                const buttonNode = variant.querySelector("button");
                const photo = Object.assign(
                    document.createElement("img"),
                    {src: image, alt: name}
                );

                if (nameNode) nameNode.innerText = name;
                if (photoNode) photoNode.appendChild(photo);
                if (buttonNode) {

                    buttonNode.innerText = choice ? result : button;
                    buttonNode.classList.toggle("selected", choice === variantChoice);
                    buttonNode.addEventListener("click", this.select.bind(this, variantChoice));

                }

                this.nodes.variants.appendChild(variant);

            });

        }

    }

    static define(tag = "app-root") {
        customElements.define(tag, this);
    }

    connectedCallback() {

        this.appId = parseInt(this.getAttribute("app-id") || "0");

        const {content} = document.getElementById("root");

        this.replaceChildren(content.cloneNode(true));

        Object.assign(this.nodes, {
            title: this.querySelector(".title"),
            main: this.querySelector("main"),
        });

        void this.update();

    }

    async update() {

        await this.updateRound();
        await this.updateAuth();

        return this.render(this.auth ? "round" : "auth");

    }

    async updateRound() {

        const response = await fetch("/api/round");

        return this.round = await response.json();

    }

    async updateAuth() {

        const session = this.getSession();

        if (!session) return;

        const {_id: round} = this.round || {};

        const payload = {...session, ...{round}};

        const response = await fetch("/api/auth", {
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(payload),
            method: "POST",
        });

        const {ok: auth, choice} = await response.json();

        Object.assign(this, {auth, choice});

        return auth;

    }

    getSession() {

        const storageSession = localStorage.getItem("session");

        return storageSession ? JSON.parse(storageSession) : undefined;

    }

    render(template) {

        this.setAttribute("app-template", template);

        const {content} = document.getElementById(template) || {};

        if (content) this.nodes.main.replaceChildren(content.cloneNode(true));

        const templateRenderer = this.templates[template];

        if (typeof templateRenderer === "function") return templateRenderer();

    }

    async select(choice) {

        const {_id: round} = this.round;
        const session = this.getSession();

        if (!session) return;

        const payload = {...session, round, choice};

        const response = await fetch("/api/vote", {
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(payload),
            method: "POST"
        });

        const {ok} = await response.json();

        void this.update();

        return ok;

    }

}

App.define();
