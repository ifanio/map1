// =============================================
// 地址搜索功能实现
// =============================================

/**
 * 高德地图API配置
 * @type {Object}
 */
const AMAP_CONFIG = {
    KEY: 'e81c9560a11eb2fb78a50cf18566e769',
    GEOCODE_API: 'https://restapi.amap.com/v3/geocode/geo',
    PLACE_API: 'https://restapi.amap.com/v3/place/text'
};

/**
 * 搜索功能状态
 * @type {Object}
 */
let searchState = {
    isSearching: false,
    currentMarker: null,
    searchResults: []
};

/**
 * 初始化搜索功能
 */
function initSearchFunctionality() {
    const searchButton = document.getElementById('search-button');
    const addressInput = document.getElementById('address-input');
    const toggleSearchPanel = document.getElementById('toggle-search-panel');
    const searchPanel = document.getElementById('search-panel');
    const searchContainer = document.getElementById('search-container');
    const searchHeader = document.querySelector('.search-header');
    
    // 确保面板初始状态正确（展开状态）
    searchPanel.classList.remove('collapsed');
    searchContainer.classList.remove('collapsed');
    toggleSearchPanel.classList.add('rotated');
    
    // 搜索按钮点击事件
    searchButton.addEventListener('click', handleSearch);
    
    // 输入框回车事件
    addressInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    // 搜索面板切换函数
    function toggleSearchPanelState() {
        const isCollapsed = searchPanel.classList.contains('collapsed');
        
        if (isCollapsed) {
            // 展开面板
            searchPanel.classList.remove('collapsed');
            searchContainer.classList.remove('collapsed');
            toggleSearchPanel.classList.add('rotated');
            addressInput.focus();
        } else {
            // 收起面板
            searchPanel.classList.add('collapsed');
            searchContainer.classList.add('collapsed');
            toggleSearchPanel.classList.remove('rotated');
        }
        
    }
    
    // 绑定点击事件到切换按钮
    toggleSearchPanel.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleSearchPanelState();
    });
    
    // 绑定点击事件到搜索头部（整个标题区域）
    searchHeader.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleSearchPanelState();
    });
    
}

/**
 * 处理搜索请求
 */
function handleSearch() {
    const addressInput = document.getElementById('address-input');
    const address = addressInput.value.trim();
    
    if (!address) {
        showSearchError('请输入要搜索的地址');
        return;
    }
    
    if (searchState.isSearching) {
        return;
    }
    
    searchState.isSearching = true;
    showSearchLoading();
    
    // 调用高德地图API进行地理编码
    searchAddress(address)
        .then(results => {
            searchState.searchResults = results;
            displaySearchResults(results);
        })
        .catch(error => {
            showSearchError('搜索失败，请检查网络连接或稍后重试');
        })
        .finally(() => {
            searchState.isSearching = false;
        });
}

/**
 * 搜索地址并获取坐标
 * @param {string} address - 要搜索的地址
 * @returns {Promise<Array>} - 搜索结果数组
 */
async function searchAddress(address) {
    const params = new URLSearchParams({
        key: AMAP_CONFIG.KEY,
        address: address,
        output: 'JSON'
    });
    
    try {
        const response = await fetch(`${AMAP_CONFIG.GEOCODE_API}?${params}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
            return data.geocodes.map(geo => ({
                name: geo.formatted_address,
                address: geo.formatted_address,
                location: geo.location,
                province: geo.province || '',
                city: geo.city || '',
                district: geo.district || ''
            }));
        } else {
            throw new Error(data.info || '未找到相关地址');
        }
    } catch (error) {
        throw error;
    }
}

/**
 * 显示搜索结果
 * @param {Array} results - 搜索结果数组
 */
function displaySearchResults(results) {
    const searchResults = document.getElementById('search-results');
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-error">未找到相关地址</div>';
        return;
    }
    
    const resultsHTML = results.map((result, index) => `
        <div class="search-result-item" data-index="${index}">
            <div class="result-name">${result.name}</div>
            <div class="result-address">${result.province} ${result.city} ${result.district}</div>
        </div>
    `).join('');
    
    searchResults.innerHTML = resultsHTML;
    
    // 添加结果点击事件
    const resultItems = searchResults.querySelectorAll('.search-result-item');
    resultItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            selectSearchResult(results[index]);
        });
    });
}

/**
 * 选择搜索结果并定位到地图
 * @param {Object} result - 选中的搜索结果
 */
function selectSearchResult(result) {
    const [lng, lat] = result.location.split(',').map(coord => parseFloat(coord));
    
    // 清除之前的标记
    if (searchState.currentMarker) {
        map.removeLayer(searchState.currentMarker);
    }
    
    // 创建新的标记
    searchState.currentMarker = L.marker([lat, lng], {
        icon: createSearchMarkerIcon()
    }).addTo(map);
    
    // 添加弹出窗口
    searchState.currentMarker.bindPopup(`
        <div style="text-align: center;">
            <h4 style="margin: 0 0 8px 0; color: #2c3e50;">📍 ${result.name}</h4>
            <p style="margin: 0; color: #7f8c8d; font-size: 12px;">
                ${result.province} ${result.city} ${result.district}
            </p>
        </div>
    `).openPopup();
    
    // 定位到该位置
    map.setView([lat, lng], 15);
    
    // 显示成功消息
    showSearchSuccess(`已定位到: ${result.name}`);
    
    // 清空搜索结果，但不关闭面板
    clearSearchResults();
}

/**
 * 创建搜索标记图标
 * @returns {L.Icon} - Leaflet图标对象
 */
function createSearchMarkerIcon() {
    return L.divIcon({
        className: 'search-marker',
        html: '<div style="background: linear-gradient(135deg, #2ecc71, #3498db); width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">📍</div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
}

/**
 * 显示搜索加载状态
 */
function showSearchLoading() {
    const searchResults = document.getElementById('search-results');
    searchResults.innerHTML = '<div class="search-loading">搜索中</div>';
}

/**
 * 显示搜索错误
 * @param {string} message - 错误消息
 */
function showSearchError(message) {
    const searchResults = document.getElementById('search-results');
    searchResults.innerHTML = `<div class="search-error">${message}</div>`;
}

/**
 * 显示搜索成功消息
 * @param {string} message - 成功消息
 */
function showSearchSuccess(message) {
    // 可以在这里添加成功提示，比如显示一个临时通知
}

/**
 * 清除搜索结果和标记
 */
function clearSearchResults() {
    const searchResults = document.getElementById('search-results');
    searchResults.innerHTML = '';
    
    if (searchState.currentMarker) {
        map.removeLayer(searchState.currentMarker);
        searchState.currentMarker = null;
    }
    
    searchState.searchResults = [];
}

// 页面加载完成后初始化搜索功能
document.addEventListener('DOMContentLoaded', function() {
    // 等待地图初始化完成后再初始化搜索功能
    const checkMapReady = setInterval(() => {
        if (typeof map !== 'undefined' && map) {
            clearInterval(checkMapReady);
            initSearchFunctionality();
            console.log('搜索功能初始化成功');
        }
    }, 100);
    
    // 10秒后超时
    setTimeout(() => {
        clearInterval(checkMapReady);
        initSearchFunctionality();
    }, 10000);
});