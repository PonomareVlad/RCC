import {css} from "lit";

// language=CSS
export const styles = css`

    @import "/styles/reset.css";

    main {
        display: block;
        overflow: hidden;
        position: relative;
        height: var(--page-height);
    }

    .background {
        top: 0;
        z-index: -1;
        width: 100%;
        display: block;
        position: absolute;
        height: var(--page-height);
        min-height: var(--background-height);
    }

    .background .decorations {
        bottom: 0;
        width: 100%;
        position: absolute;
        background-size: 50%;
        background-repeat: no-repeat;
        /* @formatter:off */
        background-image:
                url("/images/decoration.left.png"),
                url("/images/decoration.right.png");
        background-position:
                top calc(var(--vpx) * 257) left,
                top calc(var(--vpx) * 257) right;
        /* @formatter:on */
        height: var(--background-height);
    }

    .background .photos {
        bottom: 0;
        width: 100%;
        overflow: hidden;
        position: absolute;
        height: var(--background-height);
    }

    .background .photos > picture {
        bottom: 0;
        width: 100%;
        position: absolute;
    }

    .background .photos > picture.niletto {
        width: calc(var(--vpx) * 368.384);
        left: calc(var(--vpx) * 114.5);
        bottom: calc(var(--vpx) * 5.12);
    }

    .background .photos > picture.klava {
        width: calc(var(--vpx) * 636);
        right: calc(var(--vpx) * -54);
        bottom: calc(var(--vpx) * -337);
    }

    .background .overlay {
        width: 100%;
        position: absolute;
        top: var(--overlay-padding);
        height: var(--overlay-height);
        background: var(--overlay-background);
    }

    section {
        display: flex;
        align-items: center;
        flex-direction: column;
    }

    .logo {
        flex-shrink: 0;
        width: var(--logo-width);
        height: var(--logo-height);
        margin-top: var(--logo-padding);
    }

    .logo img {
        width: 100%;
        height: 100%;
    }

    h1 {
        text-align: center;
        color: var(--header-font-color);
        margin-top: var(--header-padding);
        font-size: var(--header-font-size);
        font-weight: var(--header-font-weight);
        font-family: var(--header-font-family);
    }

    mark {
        background: var(--accent-gradient);
        -webkit-text-fill-color: transparent;
        -webkit-background-clip: text;
        background-clip: text;
    }

    .auth {
        position: absolute;
        width: var(--auth-width);
        height: var(--auth-height);
        bottom: var(--auth-padding);
        border-radius: var(--auth-border-radius);
    }

`;
