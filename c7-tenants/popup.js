document.addEventListener('DOMContentLoaded', () => {
    const listToggle = document.getElementById('list-toggle');
    const searchToggle = document.getElementById('search-toggle');
    chrome.storage.local.get(['listEnabled', 'searchEnabled'], (result) => {
        const listEnabled = result.listEnabled !== false;
        const searchEnabled = result.searchEnabled === true;
        listToggle.checked = listEnabled;
        searchToggle.checked = searchEnabled;
        if (!listEnabled) {
            searchToggle.checked = true;
            searchToggle.disabled = true;
            chrome.storage.local.set({ searchEnabled: true });
        } else {
            searchToggle.disabled = false;
        }
    });
    function update() {
        const listEnabled = listToggle.checked;
        let searchEnabled = searchToggle.checked;
        if (!listEnabled) {
            searchEnabled = true;
            searchToggle.checked = true;
            searchToggle.disabled = true;
        } else {
            searchToggle.disabled = false;
        }
        chrome.storage.local.set({ listEnabled, searchEnabled });
        const enabled = listEnabled || searchEnabled;
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: enabled ? 'enable' : 'disable' });
        });
    }
    listToggle.addEventListener('change', () => {
        update();
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.tabs.reload(tabs[0].id);
        });
    });
    searchToggle.addEventListener('change', () => {
        update();
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.tabs.reload(tabs[0].id);
        });
    });
}); 