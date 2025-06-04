document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('toggle');
    
    chrome.storage.local.get(['enabled'], (result) => {
        toggle.checked = result.enabled !== false;
    });

    toggle.addEventListener('change', () => {
        const enabled = toggle.checked;
        chrome.storage.local.set({ enabled });
        
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: enabled ? 'enable' : 'disable' });
        });
    });
}); 