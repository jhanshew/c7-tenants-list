// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Check if the page has finished loading and is a Commerce7 admin page
    if (changeInfo.status === 'complete' && tab.url.includes('admin.platform.commerce7.com')) {
        // Send message to content script to reinitialize
        chrome.tabs.sendMessage(tabId, { action: 'reinitialize' })
            .catch(error => console.log('Error sending reinitialize message:', error));
    }
});

// Listen for tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
    // Get the active tab
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        // Check if it's a Commerce7 admin page
        if (tab.url && tab.url.includes('admin.platform.commerce7.com')) {
            // Send message to content script to reinitialize
            chrome.tabs.sendMessage(tab.id, { action: 'reinitialize' })
                .catch(error => console.log('Error sending reinitialize message:', error));
        }
    });
}); 