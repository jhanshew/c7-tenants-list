// Main initialization function
function initializeC7Tenants() {
    'use strict';
        
    let tenantsData = null;
    let isInitialized = false;
    let xhrInterceptorSetup = false;
    let fetchInterceptorSetup = false;
    let checkInterval = null;
    let isEnabled = true;
    let searchEnabled = false;
    let urlObserver = null;

    const targetString = '#root > div > div:has(div > form div[data-testid="inline-search"])';

    function getColorMode() {
        const cookieMode = document.cookie.split('; ').find(row => row.startsWith('color-mode='))?.split('=')[1];
        if (cookieMode) return cookieMode;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function injectStyles() {
        const oldStyle = document.querySelector('#c7-tenants-styles');
        if (oldStyle) oldStyle.remove();
        const style = document.createElement('style');
        style.id = 'c7-tenants-styles';
        let stylesContent = `
            .c7-tenants-table-container {
                margin: 40px auto;
                padding: 40px 50px 50px;
                border-radius: 5px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                max-width: 90%;
                width: 875px;
                font-size: 13px;
            }
            .c7-tenants-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }
            .c7-th {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid;
                cursor: pointer;
                white-space: nowrap;
            }
            .c7-td {
                padding: 12px;
                border-bottom: 1px solid;
            }
            .c7-link {
                text-decoration: none;
            }
            .c7-title {
                margin: 0 0 10px 0;
                font-size: 22px;
                font-weight: 500;
                display: inline-flex;
                align-items: start;
                gap: 3px;
            }
            .c7-list-count {
                background: #007bff;
                border-radius: 2px;
                padding: 2px 4px;
                color: white;
                font-size: 10px;
                font-weight: 700;
                line-height: 1;
                letter-spacing: 0.025rem;
            }
            [data-theme="light"].c7-tenants-table-container {
                background: white;
            }
            [data-theme="light"] .c7-th {
                background: #f8f9fa;
                border-bottom-color: #ddd;
            }
            [data-theme="light"] .c7-td {
                border-bottom-color: #ddd;
            }
            [data-theme="light"] .c7-link {
                color: #007bff;
            }
            [data-theme="light"] .c7-title {
                color: #333;
            }
            [data-theme="dark"].c7-tenants-table-container {
                background-color: rgb(29, 35, 47);
            }
            [data-theme="dark"] .c7-th {
                border-bottom-color: rgb(107, 114, 128);
                background-color: rgb(22, 28, 39);
            }
            [data-theme="dark"] .c7-td {
                border-bottom-color: rgb(107, 114, 128);
                color: #e0e0e0;
            }
            [data-theme="dark"] .c7-link {
                color: #4dabf7;
            }
            [data-theme="dark"] .c7-title {
                color: #e0e0e0;
            }
            @media only screen and (max-width: 39.9375em) {
                .c7-th-role, .c7-th-createdAt,
                .c7-td-role, .c7-td-createdAt {
                    display: none;
                }
                .c7-tenants-table-container {
                    padding: 30px 25px 25px;
                }
            }
        `;

        style.textContent = stylesContent;
        document.head.appendChild(style);
    }

    function createTenantsTable(tenants) {
        const container = document.createElement('div');
        container.className = 'c7-tenants-table-container';
        container.setAttribute('data-theme', getColorMode());
        
        const table = document.createElement('table');
        table.className = 'c7-tenants-table';

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const headers = [
            { text: 'Tenant ID', key: 'tenantId' },
            { text: 'Tenant Name', key: 'tenant' },
            { text: 'User Role', key: 'role' },
            { text: 'Date Added', key: 'createdAt' }
        ];

        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header.text;
            th.dataset.sortKey = header.key;
            th.className = `c7-th c7-th-${header.key}`;
            th.addEventListener('click', () => sortTable(header.key));
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        
        tenants.forEach(tenant => {
            const row = document.createElement('tr');

            const idCell = document.createElement('td');
            idCell.className = 'c7-td c7-td-tenantId';
            const idLink = document.createElement('a');
            idLink.href = `https://${tenant.tenantId}.admin.platform.commerce7.com/`;
            idLink.textContent = tenant.tenantId;
            idLink.className = 'c7-link c7-link-tenantId';
            idCell.appendChild(idLink);

            const nameCell = document.createElement('td');
            nameCell.className = 'c7-td c7-td-tenant';
            nameCell.textContent = tenant.tenant;
            
            const roleCell = document.createElement('td');
            roleCell.className = 'c7-td c7-td-role';
            roleCell.textContent = tenant.role;
            
            const dateCell = document.createElement('td');
            dateCell.className = 'c7-td c7-td-createdAt';
            dateCell.textContent = new Date(tenant.createdAt).toLocaleDateString();
            
            row.appendChild(idCell);
            row.appendChild(nameCell);
            row.appendChild(roleCell);
            row.appendChild(dateCell);

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        container.appendChild(table);

        const title = document.createElement('h2');
        title.textContent = `Your Tenants`;
        title.className = 'c7-title';
        container.insertBefore(title, table);

        const listCount = document.createElement('span');
        listCount.textContent = `${tenants.length}`;
        listCount.className = 'c7-list-count';
        title.appendChild(listCount);

        return container;
    }

    function sortTable(key) {
        const table = document.querySelector('.c7-tenants-table');
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        const th = table.querySelector(`th[data-sort-key="${key}"]`);

        const currentDirection = th.dataset.sortDirection || 'asc';
        const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
        th.dataset.sortDirection = newDirection;

        const allThs = table.querySelectorAll('th');
        allThs.forEach(t => {
            if (t !== th) {
                delete t.dataset.sortDirection;
                t.textContent = t.textContent.replace(' ↑', '').replace(' ↓', '');
            }
        });
        th.textContent = th.textContent.replace(' ↑', '').replace(' ↓', '') + (newDirection === 'asc' ? ' ↑' : ' ↓');

        const sortedRows = rows.sort((a, b) => {
            const aValue = a.children[getColumnIndex(key)].textContent;
            const bValue = b.children[getColumnIndex(key)].textContent;

            let comparison;
            if (key === 'createdAt') {
                comparison = new Date(aValue) - new Date(bValue);
            } else {
                comparison = aValue.localeCompare(bValue);
            }

            return newDirection === 'asc' ? comparison : -comparison;
        });
        
        tbody.innerHTML = '';
        sortedRows.forEach(row => tbody.appendChild(row));
    }

    function getColumnIndex(key) {
        const headers = {
            'tenantId': 0,
            'tenant': 1,
            'role': 2,
            'createdAt': 3
        };
        return headers[key];
    }

    function handleTenantData(data) {
        if (!data) return;
        const tenants = data.tenants || data.data?.tenants || data;
        if (Array.isArray(tenants)) {
            const existingTable = document.querySelector('.c7-tenants-table-container');
            if (existingTable) {
                existingTable.remove();
            }
            tenantsData = tenants;
            setTimeout(() => attemptToCreateTable(), 100);
        }
    }

    function isTenantPage() {
        const path = window.location.pathname;
        return path.endsWith('/tenant') || path.includes('/tenant/');
    }

    function attemptToCreateTable() {
        if (!isTenantPage() || !tenantsData || !isEnabled) return;

        const targetElement = document.querySelector('#root > div');
        if (!targetElement) return;

        const existingTable = document.querySelector('.c7-tenants-table-container');
        if (!existingTable) {
            const table = createTenantsTable(tenantsData);
            targetElement.appendChild(table);
        }
    }

    function setupXHRInterceptor() {
        if (xhrInterceptorSetup) return;
        xhrInterceptorSetup = true;

        const originalXHR = window.XMLHttpRequest;
        window.XMLHttpRequest = function() {
            const xhr = new originalXHR();
            const originalOpen = xhr.open;
            const originalSend = xhr.send;

            xhr.open = function() {
                if (arguments[1] && arguments[1].includes('/account/self')) {
                    this._isTargetRequest = true;
                    if (!arguments[1].includes('_=')) {
                        arguments[1] = arguments[1] + (arguments[1].includes('?') ? '&' : '?') + '_=' + Date.now();
                    }
                }
                return originalOpen.apply(this, arguments);
            };

            xhr.send = function() {
                if (this._isTargetRequest) {
                    const originalOnReadyStateChange = this.onreadystatechange;
                    this.onreadystatechange = function() {
                        if (this.readyState === 4) {
                            try {
                                const data = JSON.parse(this.responseText);
                                if (data && data.tenants) {
                                    tenantsData = data.tenants;
                                    attemptToCreateTable();
                                }
                            } catch (error) {
                                console.error('C7 Tenants: Error parsing XHR response:', error);
                            }
                        }
                        if (originalOnReadyStateChange) {
                            originalOnReadyStateChange.apply(this, arguments);
                        }
                    };
                }
                return originalSend.apply(this, arguments);
            };

            return xhr;
        };
    }

    function setupFetchInterceptor() {
        if (fetchInterceptorSetup) return;
        fetchInterceptorSetup = true;

        const originalFetch = window.fetch;
        window.fetch = async function() {
            const url = arguments[0];
            
            if (url && url.includes('/account/self')) {
                const separator = url.includes('?') ? '&' : '?';
                arguments[0] = url + separator + '_=' + Date.now();
            }

            try {
                const response = await originalFetch.apply(this, arguments);
                if (url && url.includes('/account/self')) {
                    const clone = response.clone();
                    try {
                        const data = await clone.json();
                        if (data && data.tenants) {
                            tenantsData = data.tenants;
                            attemptToCreateTable();
                        }
                    } catch (error) {
                        console.error('C7 Tenants: Error parsing fetch response:', error);
                    }
                }
                return response;
            } catch (error) {
                console.error('C7 Tenants: Fetch error:', error);
                throw error;
            }
        };
    }

    function checkAndInitialize() {
        if (isTenantPage() && !document.querySelector('.c7-tenants-table-container') && isEnabled) {
            isInitialized = false;
            xhrInterceptorSetup = false;
            fetchInterceptorSetup = false;
            initialize();
        }
    }

    function initialize() {
        if (isInitialized || !isEnabled || !isTenantPage()) return;
        isInitialized = true;
        
        setupXHRInterceptor();
        setupFetchInterceptor();
        injectStyles();

        // Observer to handle removing the hide style and setting width when the target container appears
        const searchContainerObserver = new MutationObserver((mutations, obs) => {
            // Target the parent of the parent of the form
            const targetElement = document.querySelector(targetString);
            if (targetElement) {
                 // Use the global searchEnabled variable set on initial load
                if (searchEnabled === true) {
                    // Remove the injected hiding style and set width
                    const hideStyle = document.querySelector('#c7-search-container-hide-style');
                    if (hideStyle) hideStyle.remove();
                    targetElement.style.width = '875px'; // Set width here
                } else {
                  // Remove width if present and was not removed
                  targetElement.style.width = '';
                }
                // If searchEnabled is false, the injected CSS handles hiding, no width set

                // Disconnect once the element is found (regardless of searchEnabled state)
                obs.disconnect();
            }
        });

        // Start observing the body for changes that might include the target container
        // Check if document.body exists before observing
        if (document.body) {
            searchContainerObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        } else {
            // If body doesn't exist yet, wait for DOMContentLoaded
            document.addEventListener('DOMContentLoaded', () => {
                if (document.body) {
                    searchContainerObserver.observe(document.body, {
                        childList: true,
                        subtree: true
                    });
                }
            });
        }

        // No immediate check here, rely solely on the observer to find the element.

        attemptToCreateTable();
    }

    function setupUrlMonitoring() {
        if (checkInterval) {
            clearInterval(checkInterval);
        }

        checkInterval = setInterval(checkAndInitialize, 1000);
    }

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    function checkExistingRequests() {
        const requests = performance.getEntriesByType('resource');
        const targetRequest = requests.find(r => r.name.includes('/account/self'));
        if (targetRequest) {
            const tenantMatch = window.location.hostname.match(/^([^.]+)\.admin\.platform\.commerce7\.com$/);
            const tenant = tenantMatch ? tenantMatch[1] : null;
            const authToken = getCookie('token');

            if (!authToken) return;

            const originalRequest = new XMLHttpRequest();
            originalRequest.open('GET', targetRequest.name, true);
            
            originalRequest.setRequestHeader('Accept', 'application/json, text/plain, */*');
            originalRequest.setRequestHeader('Content-Type', 'application/json');
            if (tenant) {
                originalRequest.setRequestHeader('Tenant', tenant);
            }
            originalRequest.setRequestHeader('Authorization', authToken);

            originalRequest.onreadystatechange = function() {
                if (this.readyState === 4) {
                    try {
                        const data = JSON.parse(this.responseText);
                        if (data && data.tenants) {
                            tenantsData = data.tenants;
                            attemptToCreateTable();
                        }
                    } catch (error) {
                        console.error('C7 Tenants: Error parsing original request:', error);
                    }
                }
            };
            
            originalRequest.send();
        }
    }

    // Initialize immediately
    chrome.storage.local.get(['listEnabled', 'searchEnabled'], (result) => {
        isEnabled = result.listEnabled !== false;
        searchEnabled = result.searchEnabled === true;

        // Dynamically inject CSS to hide the search container if searchEnabled is false as early as possible
        const styleId = 'c7-search-container-hide-style';
        const oldSearchStyle = document.querySelector('#' + styleId);
        if (oldSearchStyle) oldSearchStyle.remove();

        if (searchEnabled === false) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                ${targetString} {
                    display: none !important;
                }
            `;
            document.head.appendChild(style);
        }

        initialize();
        setupUrlMonitoring();
        setTimeout(checkExistingRequests, 1000);
    });

    // Handle page load events
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAndInitialize);
    }

    window.addEventListener('load', checkAndInitialize);

    // Handle page show event (for back/forward navigation)
    window.addEventListener('pageshow', function(event) {
        isInitialized = false;
        xhrInterceptorSetup = false;
        fetchInterceptorSetup = false;
        checkAndInitialize();
    });

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && isTenantPage()) {
            isInitialized = false;
            xhrInterceptorSetup = false;
            fetchInterceptorSetup = false;
            checkAndInitialize();
        }
    });

    // Handle beforeunload to clean up
    window.addEventListener('beforeunload', function() {
        if (checkInterval) {
            clearInterval(checkInterval);
        }
    });

    // Handle popstate for browser navigation
    window.addEventListener('popstate', () => {
        isInitialized = false;
        xhrInterceptorSetup = false;
        fetchInterceptorSetup = false;
        checkAndInitialize();
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'enable') {
            isEnabled = true;
            initialize();
            setupUrlMonitoring();
            setTimeout(checkExistingRequests, 1000);
        } else if (message.action === 'disable') {
            isEnabled = false;
            const existingTable = document.querySelector('.c7-tenants-table-container');
            if (existingTable) {
                existingTable.remove();
            }
            if (checkInterval) {
                clearInterval(checkInterval);
            }
        }
        sendResponse({ status: 'success' });
    });
}

// Execute the initialization
initializeC7Tenants();

// Also set up a message listener to handle re-initialization requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'reinitialize') {
        initializeC7Tenants();
        sendResponse({status: 'reinitialized'});
    }
});