import {LitElement, html, css} from "lit";

const msPerSecond = 1000;
const msPerMinute = msPerSecond * 60;
const msPerHour = msPerMinute * 60;
const msPerDay = msPerHour * 24;

export class Countdown extends LitElement {

    static get properties() {
        return {
            days: {state: true},
            hours: {state: true},
            minutes: {state: true},
            seconds: {state: true},
            timestamp: {type: Number, reflect: true},
        }
    }

    static get styles() {
        return css`

          time {
            text-align: center;
            color: var(--header-font-color);
            font-size: var(--header-font-size);
            font-weight: var(--header-font-weight);
            font-family: var(--header-font-family);
          }

          span {
            font-variant-numeric: tabular-nums;
            display: inline-flex;
            flex-direction: column;
            align-items: center;
          }

          span::after {
            content: attr(title);
            display: inline-block;
            font-family: var(--font-family);
            color: var(--paragraph-font-color);
            font-size: var(--paragraph-font-size);
            font-weight: var(--paragraph-font-weight);
            margin-top: var(--countdown-paragraph-padding);
          }

        `
    }

    static define(tag = "app-countdown") {
        customElements.define(tag, this);
    }

    connectedCallback() {
        super.connectedCallback();
        this.timer = setInterval(this.updateTime.bind(this), 1000);
        this.updateTime();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        clearInterval(this.timer);
        this.timer = undefined;
    }

    updateTime() {
        if (
            !this.timestamp ||
            (this.timestamp - Date.now() < 0)
        ) return;
        let rest = Math.abs(this.timestamp - Date.now());
        this.days = Math.floor(rest / msPerDay);
        rest -= this.days * msPerDay;
        this.hours = Math.floor(rest / msPerHour);
        rest -= this.hours * msPerHour;
        this.minutes = Math.floor(rest / msPerMinute);
        rest -= this.minutes * msPerMinute;
        this.seconds = Math.floor(rest / msPerSecond);
        this.requestUpdate();
    }

    render() {
        const {
            days = 0,
            hours = 0,
            minutes = 0,
            seconds = 0,
        } = this;
        return html`
            <time>
                <span id="days" title="Дней">${days.toString().padStart(2, "0")}</span>
                :
                <span id="hours" title="Часов">${hours.toString().padStart(2, "0")}</span>
                :
                <span id="minutes" title="Минут">${minutes.toString().padStart(2, "0")}</span>
                :
                <span id="seconds" title="Секунд">${seconds.toString().padStart(2, "0")}</span>
            </time>
        `
    }

}
