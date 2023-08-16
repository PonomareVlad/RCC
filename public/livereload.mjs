if (
    location.hostname === 'localhost' ||
    location.hostname.endsWith('.local')
) init().catch();

async function init(
    url = `http://${location.hostname}:8080/livereload`
) {
    const source = new EventSource(url);
    const reload = () => location.reload();
    source.onerror = () => (source.onopen = reload);
    source.onmessage = reload;
}
