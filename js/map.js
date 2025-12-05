// =============================================
// 中国边境线地图功能实现
// =============================================

/**
 * 地图配置常量
 * @type {Object}
 */
const MAP_CONFIG = {
    DEFAULT_ZOOM: 4,
    DEFAULT_CENTER: [35.8617, 104.1954],
    DETAIL_ZOOM: 10,
    ANIMATION_ZOOM: 8,
    ANIMATION_SPEED: 1,
    MAP_SWITCH_INTERVALS: {
        SATELLITE: 8000,
        STANDARD: 5000
    }
};

/**
 * 路线配置
 * @type {Object}
 */
const ROUTE_CONFIG = {
    G219: { color: '#ff8c00', name: 'G219' },
    G331: { color: '#2ecc71', name: 'G331' },
    G228: { color: '#3498db', name: 'G228' }
};

/**
 * 地图对象
 * @type {L.Map}
 */
let map;

/**
 * 路线图层对象
 * @type {Object}
 */
const routeLayers = {
    g219: null,
    g331: null,
    g228: null
};

/**
 * 标记点图层组
 * @type {L.LayerGroup}
 */
let markersLayerGroup;

/**
 * 地图图层对象
 * @type {Object}
 */
let mapLayers = {};

/**
 * 模拟行程动画状态管理
 * @type {Object}
 */
const animationState = {
    isRunning: false,
    isPaused: false,
    currentRoute: 'g219',
    currentDirection: 'clockwise',
    currentLocationId: null,
    currentIndex: 0,
    totalPoints: 0,
    speed: MAP_CONFIG.ANIMATION_SPEED,
    animationId: null,
    startTime: 0,
    pausedTime: 0,
    currentSegmentStartTime: null,
    vehicleMarker: null,
    visitedPoints: [],
    trailLine: null,
    allLocations: [],
    dayCounter: 1,
    mapSwitchTimer: null,
    currentMapType: 'satellite',
    mapSwitchInterval: MAP_CONFIG.MAP_SWITCH_INTERVALS.SATELLITE,
    currentVoiceIndex: 0
};

/**
 * 初始化地图图层配置
 * @returns {Object} 地图图层配置对象
 */
function initMapLayers() {
    return {
        // 标准地图 - 高德地图
        standard: L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
            subdomains: ['1', '2', '3', '4'],
            attribution: '© 高德地图',
            maxZoom: 18
        }),
        // 卫星地图 - 高德卫星地图（包含标注图层）
        satellite: L.layerGroup([
            // 卫星影像底图（style=6）
            L.tileLayer('https://webst0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=6&x={x}&y={y}&z={z}', {
                subdomains: ['1', '2', '3', '4'],
                attribution: '© 高德地图',
                maxZoom: 18
            }),
            // 标注图层（style=8，包含行政区划和路网）
            L.tileLayer('https://webst0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
                subdomains: ['1', '2', '3', '4'],
                attribution: '© 高德地图',
                maxZoom: 18
            })
        ])
    };
}

/**
 * 初始化地图
 * 创建地图实例，配置图层，初始化路线和标记点
 */
function initMap() {
    // 创建地图实例，中心设置在中国境内
    map = L.map('map').setView(MAP_CONFIG.DEFAULT_CENTER, MAP_CONFIG.DEFAULT_ZOOM);
    
    // 初始化地图图层
    mapLayers = initMapLayers();
    
    // 添加默认图层（卫星地图）
    mapLayers.satellite.addTo(map);
    
    // 创建标记点图层组
    markersLayerGroup = L.layerGroup().addTo(map);
    
    // 初始化路线图层
    initRoutes();
    
    // 初始化标记点
    initMarkers();
    
    // 绑定地图图层切换事件
    bindMapLayerControls();
    
    // 生成地点列表
    generateLocationsList();
    
    // 初始化行程动画控制
    initRouteAnimationControls();
}

/**
 * 创建路线图层
 * @param {Array} locations - 地点数据数组
 * @param {string} routeKey - 路线标识符
 * @returns {L.Polyline} 路线图层对象
 */
function createRouteLayer(locations, routeKey) {
    const config = ROUTE_CONFIG[routeKey.toUpperCase()];
    if (!config) {
        console.error(`未找到路线配置: ${routeKey}`);
        return null;
    }
    
    return L.polyline(
        locations.map(loc => [loc.lat, loc.lng]),
        { 
            color: config.color,
            weight: 6, 
            opacity: 0.9, 
            name: config.name,
            lineCap: 'round',
            lineJoin: 'round'
        }
    );
}

/**
 * 初始化路线图层
 */
function initRoutes() {
    // 初始化G219国道路线
    routeLayers.g219 = createRouteLayer(G219Locations, 'G219');
    if (routeLayers.g219) {
        routeLayers.g219.addTo(map);
    }
    
    // 初始化G331国道路线
    routeLayers.g331 = createRouteLayer(G331Locations, 'G331');
    if (routeLayers.g331) {
        routeLayers.g331.addTo(map);
    }
    
    // 初始化G228国道路线
    routeLayers.g228 = createRouteLayer(G228Locations, 'G228');
    if (routeLayers.g228) {
        routeLayers.g228.addTo(map);
    }
}

/**
 * 初始化标记点
 */
function initMarkers() {
    // 清除现有标记点
    markersLayerGroup.clearLayers();
    
    // 添加所有路线标记点（默认显示所有）
    addMarkers(G219Locations, 'G219');
    addMarkers(G331Locations, 'G331');
    addMarkers(G228Locations, 'G228');
}

/**
 * 创建标记点自定义图标
 * @param {string} locationName - 地点名称
 * @param {string} routeKey - 路线标识符
 * @returns {L.DivIcon} 自定义图标对象
 */
function createMarkerIcon(locationName, routeKey) {
    const config = ROUTE_CONFIG[routeKey.toUpperCase()];
    const color = config ? config.color : '#666666';
    
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; color: white; padding: 4px 8px; border-radius: 8px; font-size: 12px; font-weight: bold; text-align: center; border: 2px solid ${color}; font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif; box-shadow: 0 2px 5px rgba(0,0,0,0.15); text-shadow: none;">${locationName}</div>`,
        iconAnchor: [40, 40]
    });
}

/**
 * 创建标记点弹出窗口内容
 * @param {Object} location - 地点数据对象
 * @param {string} routeKey - 路线标识符
 * @returns {string} 弹出窗口HTML内容
 */
function createMarkerPopupContent(location, routeKey) {
    const config = ROUTE_CONFIG[routeKey.toUpperCase()];
    const color = config ? config.color : '#666666';
    
    return `
        <div style="font-size: 14px; font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif; background-color: #f8f9fa; border: 1px solid #bdc3c7; border-radius: 8px; padding: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <div style="font-size: 16px; font-weight: bold; color: ${color}; border-bottom: 1px solid #ecf0f1; padding-bottom: 5px; margin-bottom: 5px; text-align: center;">${location.name}</div>
            <div style="margin-bottom: 3px;">省份: <span style="color: #2c3e50;">${location.province}</span></div>
            <div>坐标: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}</div>
        </div>
    `;
}

/**
 * 处理标记点点击事件
 * @param {Object} location - 地点数据对象
 * @param {string} routeKey - 路线标识符
 */
function handleMarkerClick(location, routeKey) {
    // 将地图中心定位到当前地点并放大
    map.setView([location.lat, location.lng], MAP_CONFIG.DETAIL_ZOOM, {
        animate: true,
        duration: 0.5
    });
    
    // 更新地点详情面板
    if (typeof updateLocationInfoDisplay === 'function') {
        updateLocationInfoDisplay(location.name);
    }
    
    // 移除其他活跃状态
    document.querySelectorAll('.location-item.active').forEach(item => {
        item.classList.remove('active');
        item.style.backgroundColor = '#f8f0e3';
        item.style.borderColor = '#e0d0c0';
    });
    
    // 设置对应的地点列表项为活跃状态
    const locationItems = document.querySelectorAll('.location-item');
    locationItems.forEach(item => {
        if (item.textContent.includes(location.name)) {
            item.classList.add('active');
            item.style.backgroundColor = '#e0d0c0';
            const config = ROUTE_CONFIG[routeKey.toUpperCase()];
            item.style.borderColor = config ? config.color : '#666666';
        }
    });
    
    // 同步更新模拟行程起点下拉菜单
    const startLocationSelect = document.getElementById('start-location');
    if (startLocationSelect) {
        startLocationSelect.value = location.name;
        animationState.currentLocationId = location.name;
    }
}

/**
 * 添加标记点
 * @param {Array} locations - 地点数据数组
 * @param {string} routeKey - 路线标识符
 */
function addMarkers(locations, routeKey) {
    locations.forEach(location => {
        // 创建标记点
        const marker = L.marker([location.lat, location.lng], {
            title: `${location.name} (${location.province})`
        });
        
        // 设置自定义图标
        marker.setIcon(createMarkerIcon(location.name, routeKey));
        
        // 绑定弹出窗口
        marker.bindPopup(createMarkerPopupContent(location, routeKey));
        
        // 添加点击事件
        marker.on('click', () => handleMarkerClick(location, routeKey));
        
        // 添加到图层组
        marker.addTo(markersLayerGroup);
    });
}



// 生成地点列表
function generateLocationsList() {
    const locationsList = document.getElementById('locations-list');
    locationsList.innerHTML = '';
    
    // 创建按路线分类的地点列表
    const routes = [
        { id: 'g219', name: 'G219 喀纳斯-东兴', color: '#ff8c00', locations: G219Locations },
        { id: 'g331', name: 'G331 丹东-阿勒泰', color: '#2ecc71', locations: G331Locations },
        { id: 'g228', name: 'G228 丹东-东兴', color: '#3498db', locations: G228Locations }
    ];
    
    routes.forEach(route => {
        const routeSection = document.createElement('div');
        routeSection.className = `route-section route-${route.id}`;
        routeSection.style.marginBottom = '1rem';
        
        // 路线标题 - 中国风印章样式
        const routeTitle = document.createElement('h4');
        routeTitle.textContent = route.name;
        routeTitle.style.color = route.color;
        routeTitle.style.marginBottom = '0.5rem';
        routeTitle.style.fontFamily = "'KaiTi', 'STKaiti', '楷体', serif";
        routeTitle.style.textAlign = 'center';
        routeTitle.style.padding = '5px';
        routeTitle.style.borderBottom = '2px solid ' + route.color;
        routeTitle.style.textShadow = '1px 1px 2px rgba(0,0,0,0.2)';
        routeSection.appendChild(routeTitle);
        
        // 地点列表
        const ul = document.createElement('ul');
        ul.style.listStyle = 'none';
        ul.style.padding = '0';
        
        route.locations.forEach(loc => {
            const li = document.createElement('li');
            li.className = 'location-item';
            li.textContent = `${loc.name} (${loc.province})`;
            li.style.cursor = 'pointer';
            li.style.padding = '0.4rem 0.8rem';
            li.style.marginBottom = '0.3rem';
            li.style.borderRadius = '2px';
            li.style.backgroundColor = '#f8f0e3';
            li.style.transition = 'all 0.2s';
            li.style.fontFamily = "'SimSun', 'STSong', '宋体', serif";
            li.style.border = '1px solid #e0d0c0';
            li.style.boxShadow = '1px 1px 2px rgba(0,0,0,0.1)';
            
            // 添加悬停效果
            li.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#f0e0d0';
                this.style.transform = 'translateX(5px)';
                this.style.boxShadow = '2px 2px 4px rgba(0,0,0,0.2)';
                this.style.borderColor = route.color;
            });
            
            li.addEventListener('mouseleave', function() {
                this.style.backgroundColor = '#f8f0e3';
                this.style.transform = 'translateX(0)';
                this.style.boxShadow = '1px 1px 2px rgba(0,0,0,0.1)';
                this.style.borderColor = '#e0d0c0';
            });
            
            // 点击设置为模拟行程起点
            li.addEventListener('click', function() {
                // 将地图中心定位到当前地点并放大
                map.setView([loc.lat, loc.lng], 10, {
                    animate: true,
                    duration: 0.5
                });
                
                // 更新地点详情面板
                if (typeof updateLocationInfoDisplay === 'function') {
                    updateLocationInfoDisplay(loc.name);
                }
                
                // 移除其他活跃状态
                document.querySelectorAll('.location-item.active').forEach(item => {
                    item.classList.remove('active');
                    item.style.backgroundColor = '#f8f0e3';
                    item.style.borderColor = '#e0d0c0';
                });
                
                // 添加活跃状态
                this.classList.add('active');
                this.style.backgroundColor = '#e0d0c0';
                this.style.borderColor = route.color;
                
                // 设置为模拟行程起点（但不重置动画）
                const startLocationSelect = document.getElementById('start-location');
                if (startLocationSelect) {
                    startLocationSelect.value = loc.name;
                    animationState.currentLocationId = loc.name;
                    // 移除resetAnimation()调用，避免触发路线连接逻辑
                }
            });
            
            ul.appendChild(li);
        });
        
        routeSection.appendChild(ul);
        locationsList.appendChild(routeSection);
    });
}

// 切换地图类型
function switchMapType(mapType) {
    if (mapType === 'satellite') {
        map.removeLayer(mapLayers.standard);
        map.addLayer(mapLayers.satellite);
        animationState.currentMapType = 'satellite';
        // 更新UI单选按钮状态
        const satelliteRadio = document.getElementById('satellite-map');
        if (satelliteRadio) {
            satelliteRadio.checked = true;
        }
    } else if (mapType === 'standard') {
        map.removeLayer(mapLayers.satellite);
        map.addLayer(mapLayers.standard);
        animationState.currentMapType = 'standard';
        // 更新UI单选按钮状态
        const standardRadio = document.getElementById('standard-map');
        if (standardRadio) {
            standardRadio.checked = true;
        }
    }
}

// 绑定地图图层切换事件
function bindMapLayerControls() {
    // 标准地图控制
    document.getElementById('standard-map').addEventListener('change', function() {
        if (this.checked) {
            switchMapType('standard');
        }
    });
    
    // 卫星地图控制
    document.getElementById('satellite-map').addEventListener('change', function() {
        if (this.checked) {
            switchMapType('satellite');
        }
    });
}

// 路线数据处理函数
function getReversedRoute(routeLocations, routeName) {
    return [...routeLocations].reverse().map(loc => ({ ...loc, route: routeName }));
}

// 生成所有地点的合并列表
function generateAllLocationsList() {
    // 按照指定方向顺序合并所有路线的地点
    // G219: 东兴向喀纳斯方向（反转G219Locations数组）
    const g219Reversed = getReversedRoute(G219Locations, 'g219');
    
    // G331: 阿勒泰向丹东方向（反转G331Locations数组）
    const g331Reversed = getReversedRoute(G331Locations, 'g331');
    
    // G228: 丹东向东兴方向（保持原顺序）
    const g228Original = G228Locations.map(loc => ({ ...loc, route: 'g228' }));
    
    // 合并所有路线，按照指定顺序排列
    animationState.allLocations = [
        ...g219Reversed,
        ...g331Reversed,
        ...g228Original
    ];
}

// 生成起点下拉列表
function generateStartLocationSelect() {
    const select = document.getElementById('start-location');
    if (!select) return;
    
    // 清空现有选项
    select.innerHTML = '';
    
    // 添加选项
    animationState.allLocations.forEach((loc, index) => {
        const option = document.createElement('option');
        option.value = loc.name;
        option.textContent = `${loc.name} (${loc.route} - ${loc.province})`;
        select.appendChild(option);
    });
    
    // 设置默认起点为东兴
    const dongxingLocation = animationState.allLocations.find(loc => loc.name === '东兴');
    if (dongxingLocation) {
        select.value = dongxingLocation.name;
        animationState.currentLocationId = dongxingLocation.name;
    } else if (animationState.allLocations.length > 0) {
        // 如果找不到东兴，回退到第一个选项
        select.value = animationState.allLocations[0].name;
        animationState.currentLocationId = animationState.allLocations[0].name;
    }
}

// 初始化行程动画控制
function initRouteAnimationControls() {
    // 生成所有地点列表
    generateAllLocationsList();
    generateStartLocationSelect();
    
    // 获取控制元素
    const startLocationSelect = document.getElementById('start-location');
    const directionSelect = document.getElementById('direction-select');
    const speedSlider = document.getElementById('animation-speed');
    const speedValue = document.getElementById('speed-value');
    const startBtn = document.getElementById('start-animation');
    const pauseBtn = document.getElementById('pause-animation');
    const resetBtn = document.getElementById('reset-animation');
    const progressFill = document.getElementById('progress-fill');
    const statusText = document.getElementById('animation-status');
    
    // 起点选择事件
    if (startLocationSelect) {
        startLocationSelect.addEventListener('change', function() {
            animationState.currentLocationId = this.value;
            
            // 将地图中心定位到选中的地点
            const selectedLocation = animationState.allLocations.find(loc => loc.name === this.value);
            if (selectedLocation && map) {
                map.setView([selectedLocation.lat, selectedLocation.lng], 10, {
                    animate: true,
                    duration: 0.5
                });
                
                // 更新地点详情面板
                if (typeof updateLocationInfoDisplay === 'function') {
                    updateLocationInfoDisplay(selectedLocation.name);
                }
            }
            
            resetAnimation();
        });
    }
    
    // 方向选择事件
    if (directionSelect) {
        directionSelect.addEventListener('change', function() {
            animationState.currentDirection = this.value;
            resetAnimation();
        });
    }
    
    // 速度固定为默认值1
    animationState.speed = 1;
    
    // 开始按钮事件
    if (startBtn) {
        startBtn.addEventListener('click', startAnimation);
    }
    
    // 暂停按钮事件
    if (pauseBtn) {
        pauseBtn.addEventListener('click', function() {
    if (animationState.isPaused) {
        resumeAnimation();
    } else {
        pauseAnimation();
    }
});
    }
    
    // 重置按钮事件
    if (resetBtn) {
        resetBtn.addEventListener('click', resetAnimation);
    }
    
    // 初始化UI状态
    updateUIState();
}

// 根据起点和方向获取行程数据
// 缓存当前路线数据，避免重复计算
let cachedRouteData = null;
let cacheKey = '';

// DOM元素缓存，避免重复查询
let cachedProgressBar = null;
let cachedStatusText = null;

/**
 * 清除路线数据缓存
 * 当动画状态发生变化时调用，确保下次获取最新数据
 */
function clearRouteCache() {
    cachedRouteData = null;
    cacheKey = '';
    console.log('路线数据缓存已清除');
}

/**
 * 清除DOM元素缓存
 * 当DOM结构发生变化时调用，确保下次重新查询
 */
function clearDomCache() {
    cachedProgressBar = null;
    cachedStatusText = null;
    console.log('DOM元素缓存已清除');
}

function getCurrentRouteData() {
    // 生成缓存键：基于当前状态的关键参数
    const newCacheKey = `${animationState.currentLocationId}_${animationState.currentDirection}_${animationState.allLocations.length}`;
    
    // 如果缓存有效，直接返回缓存数据
    if (cachedRouteData && cacheKey === newCacheKey) {
        return cachedRouteData;
    }
    
    // 找到当前选择的起点
    const startLocation = animationState.allLocations.find(loc => loc.name === animationState.currentLocationId);
    if (!startLocation) {
        return [];
    }
    
    // 获取对应的完整路线数据
    let fullRouteData;
    let isRouteReversed = false; // 标记是否需要反转路线顺序
    
    switch (startLocation.route) {
        case 'g219':
            fullRouteData = G219Locations;
            // G219顺时针应该是东兴向喀纳斯方向，需要反转当前顺序
            isRouteReversed = animationState.currentDirection === 'clockwise';
            break;
        case 'g331':
            fullRouteData = G331Locations;
            // G331顺时针应该是阿勒泰向丹东方向，需要反转当前顺序
            isRouteReversed = animationState.currentDirection === 'clockwise';
            break;
        case 'g228':
            fullRouteData = G228Locations;
            // G228顺时针应该是丹东向东兴方向，当前顺序正确
            isRouteReversed = animationState.currentDirection === 'counterclockwise';
            break;
        default:
            fullRouteData = g219Locations;
            isRouteReversed = animationState.currentDirection === 'clockwise';
    }
    
    // 根据需要反转路线数据
    if (isRouteReversed) {
        fullRouteData = [...fullRouteData].reverse();
    }
    
    // 找到起点在完整路线中的索引
    const startIndex = fullRouteData.findIndex(loc => loc.name === startLocation.name);
    if (startIndex === -1) {
        return [];
    }
    
    // 根据方向生成行程数据
    if (animationState.currentDirection === 'clockwise') {
        // 顺时针方向的统一处理逻辑
        if (startLocation.route === 'g228') {
            // G228顺时针：丹东 → 东兴
            const currentLocation = fullRouteData[startIndex];
            
            // 先走完G228到东兴，再连接G219东兴继续，然后连接到G331白沙湖，最后连接到G228丹东
            const g228Remaining = fullRouteData.slice(startIndex);
            const g219Reversed = getReversedRoute(G219Locations, 'g219'); // G219顺时针需要反转
            const g331Reversed = getReversedRoute(G331Locations, 'g331'); // G331顺时针需要反转
            const g228Original = G228Locations.slice(1); // 跳过G228丹东重复点
            
            // 返回完整的顺时针路线：G228剩余部分 → G219 → G331 → G228
            return [...g228Remaining, ...g219Reversed.slice(1), ...g331Reversed.slice(1), ...g228Original];
        } else if (startLocation.route === 'g219') {
            // G219顺时针：东兴 → 喀纳斯
            const currentLocation = fullRouteData[startIndex];
            
            if (currentLocation.name === '喀纳斯') {
                // 如果到达G219终点喀纳斯，连接到G331白沙湖并继续G331路线
                const g331Reversed = getReversedRoute(G331Locations, 'g331'); // G331顺时针需要反转
                const heiheIndex = g331Reversed.findIndex(loc => loc.name === '白沙湖');
                if (heiheIndex !== -1) {
                    // 从白沙湖开始继续G331路线，然后连接到G228
                    const g331Route = g331Reversed.slice(heiheIndex);
                    const g228Route = G228Locations.slice(1); // 跳过G228丹东重复点
                    return [...g331Route, ...g228Route];
                }
            } else {
                // 先走完G219到喀纳斯，再连接G331白沙湖继续，然后连接到G228
                const g219Remaining = fullRouteData.slice(startIndex);
                const g331Reversed = getReversedRoute(G331Locations, 'g331'); // G331顺时针需要反转
                const heiheIndex = g331Reversed.findIndex(loc => loc.name === '白沙湖');
                if (heiheIndex !== -1) {
                    const g331Route = g331Reversed.slice(heiheIndex);
                    const g228Route = G228Locations.slice(1); // 跳过G228丹东重复点
                    return [...g219Remaining, ...g331Route, ...g228Route];
                }
            }
        } else if (startLocation.route === 'g331') {
            // G331顺时针：白沙湖 → 丹东
            const currentLocation = fullRouteData[startIndex];
            
            if (currentLocation.name === '丹东') {
                // 如果到达G331终点丹东，连接到G228丹东并继续G228路线
                return G228Locations; // 直接返回G228路线，包含丹东
            } else {
                // 先走完G331到丹东，再连接G228丹东继续
                const g331Remaining = fullRouteData.slice(startIndex);
                return [...g331Remaining, ...G228Locations.slice(1)]; // 跳过G228丹东重复点
            }
        }
    }
    
    // 默认路线处理（包括逆时针和未匹配的顺时针情况）
    let result;
    if (animationState.currentDirection === 'clockwise') {
        // 顺时针默认处理：从起点到路线末尾，再从路线开头到起点前一点
        result = [
            ...fullRouteData.slice(startIndex),
            ...fullRouteData.slice(0, startIndex)
        ];
    } else {
        // 逆时针：从起点到路线开头（反转），再加上路线末尾到起点后一个点（反转）
        const firstPart = fullRouteData.slice(0, startIndex + 1).reverse();
        const secondPart = fullRouteData.slice(startIndex + 1).reverse();
        result = [...firstPart, ...secondPart];
    }
    
    // 更新缓存
    cachedRouteData = result;
    cacheKey = newCacheKey;
    
    return result;
}

// 获取当前路线的颜色
function getCurrentRouteColor() {
    const routeData = getCurrentRouteData();
    if (routeData.length === 0) return '#e74c3c';
    
    const currentRoute = routeData[0].route;
    switch (currentRoute) {
        case 'g219':
            return '#e74c3c';
        case 'g331':
            return '#3498db';
        case 'g228':
            return '#27ae60';
        default:
            return '#e74c3c';
    }
}

// 创建车辆标记
function createVehicleMarker() {
    // 如果已有车辆标记，先移除
    if (animationState.vehicleMarker) {
        map.removeLayer(animationState.vehicleMarker);
    }
    
    const routeData = getCurrentRouteData();
    if (routeData.length === 0) return;
    
    const startPoint = routeData[0];
    
    // 创建中国风车辆图标 - 现代汽车样式
    const vehicleIcon = L.divIcon({
        className: 'vehicle-icon',
        html: '<div style="font-size: 36px; color: #b22222; text-shadow: 2px 2px 6px rgba(0,0,0,0.4);">🚗</div>',
        iconSize: [60, 60],
        iconAnchor: [30, 30],
        className: 'chinese-vehicle-icon'
    });
    
    // 创建车辆标记
    animationState.vehicleMarker = L.marker([startPoint.lat, startPoint.lng], {
        icon: vehicleIcon,
        title: '模拟车辆'
    }).addTo(map);
    
    // 添加中国风车辆弹出信息
    animationState.vehicleMarker.bindPopup(`
        <div style="text-align: center; font-family: 'SimSun', 'STSong', '宋体', serif; background-color: #f8f0e3; border: 1px solid #d4a017; border-radius: 4px; padding: 10px; box-shadow: 3px 3px 6px rgba(0,0,0,0.2);">
            <div style="font-size: 16px; font-weight: bold; color: #b22222; margin-bottom: 5px;">🚗 ${startPoint.name}</div>
            <div style="margin-bottom: 3px; color: black;">${startPoint.province}</div>
            <div style="color: black;">进度: 1/${animationState.totalPoints}</div>
        </div>
    `);
}

// 创建轨迹线
function createTrailLine() {
    // 如果已有轨迹线，先移除
    if (animationState.trailLine) {
        map.removeLayer(animationState.trailLine);
    }
    
    const routeData = getCurrentRouteData();
    if (routeData.length === 0) return;
    
    // 创建中国风轨迹线 - 毛笔风格
    animationState.trailLine = L.polyline([], {
        color: '#b22222', // 中国红
        weight: 8,
        opacity: 0.9,
        className: 'trail-line',
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: '10,5'
    }).addTo(map);
}

// 更新车辆位置和轨迹
function updateVehiclePosition(currentLat, currentLng, currentPoint) {
    const routeData = getCurrentRouteData();
    
    // 更新车辆位置（使用插值坐标）
    if (animationState.vehicleMarker) {
        animationState.vehicleMarker.setLatLng([currentLat, currentLng]);
        
        // 更新车辆弹出信息
        animationState.vehicleMarker.setPopupContent(`
            <div style="text-align: center;">
                <h4 style="color: #b22222; margin-bottom: 5px;">🚗 ${currentPoint.name}</h4>
                <p style="color: black; margin-bottom: 3px;">${currentPoint.province}</p>
                <p style="color: black;">进度: ${animationState.currentIndex + 1}/${animationState.totalPoints}</p>
            </div>
        `);
        
        // 打开弹出信息
        animationState.vehicleMarker.openPopup();
    }
    
    // 更新轨迹线（添加当前插值点）
    if (animationState.trailLine) {
        const visitedPoints = routeData.slice(0, animationState.currentIndex + 1)
            .map(point => [point.lat, point.lng]);
        
        // 添加当前插值点到轨迹线末尾
        visitedPoints.push([currentLat, currentLng]);
        animationState.trailLine.setLatLngs(visitedPoints);
    }
    
    // 更新地图视图（平滑过渡）
    map.panTo([currentLat, currentLng], {
        animate: true,
        duration: 0.1 // 更短的过渡时间，使视图跟随更流畅
    });
    
    // 确保地图保持合适的缩放级别（如果当前缩放级别过低）
    if (map.getZoom() < 7) {
        map.setZoom(8, { 
            animate: true,
            duration: 0.5
        });
    }
    
    // 更新进度条
    updateProgressBar();
    
    // 更新状态文本
    updateStatusText();
}

// 更新进度条
function updateProgressBar() {
    // 使用缓存或查询DOM元素
    if (!cachedProgressBar) {
        cachedProgressBar = document.getElementById('progress-fill');
    }
    
    if (cachedProgressBar) {
        const progress = (animationState.currentIndex / (animationState.totalPoints - 1)) * 100;
        cachedProgressBar.style.width = `${progress}%`;
    }
}

// 更新状态文本
function updateStatusText() {
    // 使用缓存或查询DOM元素
    if (!cachedStatusText) {
        cachedStatusText = document.getElementById('animation-status');
    }
    
    if (!cachedStatusText) return;
    
    const routeData = getCurrentRouteData();
    const currentPoint = routeData[animationState.currentIndex];
    
    if (animationState.isPaused) {
        cachedStatusText.textContent = `已暂停 - 当前位置: ${currentPoint.name}`;
    } else if (animationState.isRunning) {
        cachedStatusText.textContent = `行驶中 - ${currentPoint.name} (${animationState.currentIndex + 1}/${animationState.totalPoints})`;
    } else {
        cachedStatusText.textContent = '准备就绪';
    }
}

// 线性插值函数
function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * 语音播报函数 - 包含海拔信息和风土人情
 * @param {Object} location - 地点信息对象
 */
function speakLocation(location) {
    // 添加防御性检查，确保location参数有效
    if (!location || typeof location !== 'object') {
        console.warn('语音播报：location参数无效');
        return;
    }
    
    if (!location.name || typeof location.name !== 'string') {
        console.warn('语音播报：地点名称无效');
        return;
    }
    
    // 检查浏览器是否支持语音合成
    if (!('speechSynthesis' in window)) {
        console.warn('浏览器不支持语音合成功能');
        return;
    }
    
    try {
        // 获取地点详细信息
        const locationInfo = getLocationInfo(location.name);
        const province = locationInfo.province || location.province || '';
        const altitude = locationInfo.altitude || 0;
        
        // 创建语音实例
        const speech = new SpeechSynthesisUtterance();
        
        // 使用天数跟踪的语音模板，海拔低于500米不播报海拔信息
        const speechTemplates = [
            {
                intro: altitude > 500 ? 
                    `第${animationState.dayCounter}天，到达${location.name}，${province}，海拔${altitude}米。` :
                    `第${animationState.dayCounter}天，到达${location.name}，${province}。`,
                culture: (info) => `${extractKeyCulturePoint(info)}。`
            },
            {
                intro: altitude > 500 ? 
                    `第${animationState.dayCounter}天，我们来到${location.name}，${province}，海拔高度${altitude}米。` :
                    `第${animationState.dayCounter}天，我们来到${location.name}，${province}。`,
                culture: (info) => `${extractKeyCulturePoint(info)}。`
            },
            {
                intro: altitude > 500 ? 
                    `第${animationState.dayCounter}天，抵达${location.name}，${province}，此处海拔${altitude}米。` :
                    `第${animationState.dayCounter}天，抵达${location.name}，${province}。`,
                culture: (info) => `${extractKeyCulturePoint(info)}。`
            }
        ];
        
        // 随机选择一个语音模板，增加变化性
        const template = speechTemplates[Math.floor(Math.random() * speechTemplates.length)];
        
        // 构建语音文本
        let speechText = template.intro;
        
        // 添加文化特色（风土人情）
        if (locationInfo.culture && locationInfo.culture !== '暂无详细信息') {
            speechText += template.culture(locationInfo.culture);
        }
        
        speech.text = speechText;
        speech.lang = 'zh-CN'; // 设置为中文
        speech.volume = 1; // 音量 (0 to 1) - 已设置为最大值
        
        // 获取所有可用的中文语音角色
        const voices = window.speechSynthesis.getVoices();
        const chineseVoices = voices.filter(voice => voice.lang === 'zh-CN');
        
        // 按优先级选择语音：1) Microsoft语音 2) Natural语音 3) 其他中文语音
        let availableVoices = [];
        
        // 优先选择Microsoft语音（通常音量较大）
        const microsoftVoices = chineseVoices.filter(voice => voice.name.includes('Microsoft'));
        if (microsoftVoices.length > 0) {
            availableVoices = availableVoices.concat(microsoftVoices);
        }
        
        // 选择Natural语音
        const naturalVoices = chineseVoices.filter(voice => voice.name.includes('Natural'));
        if (naturalVoices.length > 0) {
            availableVoices = availableVoices.concat(naturalVoices);
        }
        
        // 添加其他中文语音
        const otherVoices = chineseVoices.filter(voice => 
            !voice.name.includes('Microsoft') && !voice.name.includes('Natural')
        );
        if (otherVoices.length > 0) {
            availableVoices = availableVoices.concat(otherVoices);
        }
        
        // 如果没有找到任何中文语音，使用所有语音
        if (availableVoices.length === 0) {
            availableVoices = voices;
        }
        
        // 循环选择语音角色
        let selectedVoice = null;
        if (availableVoices.length > 0) {
            selectedVoice = availableVoices[animationState.currentVoiceIndex % availableVoices.length];
            // 更新索引，为下一次播报准备
            animationState.currentVoiceIndex = (animationState.currentVoiceIndex + 1) % availableVoices.length;
        }
        
        if (selectedVoice) {
            speech.voice = selectedVoice;
        }
        
        // 不同的语音配置选项（语速、音调）- 加快语速范围
        const voiceConfigs = [
            { rate: 2.0, pitch: 1.1 }, // 较快，音调较高
            { rate: 2.2, pitch: 1.0 }, // 快，自然音调
            { rate: 2.5, pitch: 0.9 }, // 较快偏快，音调较低
            { rate: 2.1, pitch: 1.2 }, // 较快，音调偏高
            { rate: 2.3, pitch: 0.95 }  // 快，音调偏低
        ];
        
        // 随机选择一个语音配置
        const randomConfig = voiceConfigs[Math.floor(Math.random() * voiceConfigs.length)];
        speech.rate = randomConfig.rate;
        speech.pitch = randomConfig.pitch;
        
        // 语音开始事件 - 添加视觉反馈和状态更新
        speech.onstart = function() {
            // 在语音开始播放时，立即更新状态文本显示当前地点信息
            if (cachedStatusText && location) {
                cachedStatusText.textContent = `行驶中 - ${location.name} (${animationState.currentIndex + 1}/${animationState.totalPoints})`;
            }
            
            // 给当前地点标记添加视觉反馈
            const currentMarker = findMarkerByLocation(location);
            if (currentMarker) {
                // 添加闪烁效果
                currentMarker.getElement().style.animation = 'pulse 0.5s ease-in-out 3';
            }
        };
        
        // 语音结束事件 - 继续动画（仅在未暂停状态下）
        speech.onend = function() {
            console.log('语音播报结束，准备继续动画');
            
            // 语音播放完成后，只有在未暂停状态下才继续动画
            if (!animationState.isPaused) {
                animationState.isRunning = true;
                // 重置当前段起始时间，确保下一段动画正确计时
                animationState.currentSegmentStartTime = null;
                
                // 确保动画索引没有越界
                if (animationState.currentIndex < animationState.totalPoints - 1) {
                    try {
                        animationState.animationId = requestAnimationFrame(animationLoop);
                        console.log('动画继续，当前索引:', animationState.currentIndex);
                    } catch (error) {
                        console.error('请求动画帧失败:', error);
                        // 如果请求动画帧失败，手动触发动画继续
                        setTimeout(() => {
                            if (!animationState.isPaused) {
                                animationState.animationId = requestAnimationFrame(animationLoop);
                            }
                        }, 100);
                    }
                } else {
                    // 行程结束
                    animationState.isRunning = false;
                    if (cachedStatusText) {
                        cachedStatusText.textContent = '行程结束！';
                    }
                    console.log('模拟行程结束');
                }
            }
            
            // 更新状态文本显示当前地点信息
            if (cachedStatusText && location) {
                cachedStatusText.textContent = `行驶中 - ${location.name} (${animationState.currentIndex + 1}/${animationState.totalPoints})`;
            }
            
            // 移除视觉反馈
            const currentMarker = findMarkerByLocation(location);
            if (currentMarker) {
                currentMarker.getElement().style.animation = '';
            }
        };
        
        // 语音错误事件
        speech.onerror = function(event) {
            console.warn('语音播报错误:', event.error);
            // 即使语音播报失败，也要继续动画
            animationState.isRunning = true;
            animationState.currentSegmentStartTime = null;
            
            // 确保动画索引没有越界
            if (animationState.currentIndex < animationState.totalPoints - 1) {
                try {
                    animationState.animationId = requestAnimationFrame(animationLoop);
                    console.log('语音播报失败，动画继续，当前索引:', animationState.currentIndex);
                } catch (error) {
                    console.error('请求动画帧失败:', error);
                    // 如果请求动画帧失败，手动触发动画继续
                    setTimeout(() => {
                        if (!animationState.isPaused) {
                            animationState.animationId = requestAnimationFrame(animationLoop);
                        }
                    }, 100);
                }
            } else {
                // 行程结束
                animationState.isRunning = false;
                if (cachedStatusText) {
                    cachedStatusText.textContent = '行程结束！';
                }
                console.log('模拟行程结束（语音播报失败）');
            }
        };
        
        // 播放语音，添加错误处理
        try {
            window.speechSynthesis.speak(speech);
        } catch (error) {
            console.error('语音播报失败:', error);
            // 语音播报失败时，继续动画
            animationState.isRunning = true;
            animationState.currentSegmentStartTime = null;
            
            // 确保动画索引没有越界
            if (animationState.currentIndex < animationState.totalPoints - 1) {
                try {
                    animationState.animationId = requestAnimationFrame(animationLoop);
                    console.log('语音播报失败，动画继续，当前索引:', animationState.currentIndex);
                } catch (error) {
                    console.error('请求动画帧失败:', error);
                    // 如果请求动画帧失败，手动触发动画继续
                    setTimeout(() => {
                        if (!animationState.isPaused) {
                            animationState.animationId = requestAnimationFrame(animationLoop);
                        }
                    }, 100);
                }
            } else {
                // 行程结束
                animationState.isRunning = false;
                if (cachedStatusText) {
                    cachedStatusText.textContent = '行程结束！';
                }
                console.log('模拟行程结束（语音播报失败）');
            }
        }
    } catch (error) {
        console.error('语音播报初始化失败:', error);
        // 语音播报初始化失败时，继续动画
        animationState.isRunning = true;
        animationState.currentSegmentStartTime = null;
        
        // 确保动画索引没有越界
        if (animationState.currentIndex < animationState.totalPoints - 1) {
            try {
                animationState.animationId = requestAnimationFrame(animationLoop);
                console.log('语音播报初始化失败，动画继续，当前索引:', animationState.currentIndex);
            } catch (error) {
                console.error('请求动画帧失败:', error);
                // 如果请求动画帧失败，手动触发动画继续
                setTimeout(() => {
                    if (!animationState.isPaused) {
                        animationState.animationId = requestAnimationFrame(animationLoop);
                    }
                }, 100);
            }
        } else {
            // 行程结束
            animationState.isRunning = false;
            if (cachedStatusText) {
                cachedStatusText.textContent = '行程结束！';
            }
            console.log('模拟行程结束（语音播报初始化失败）');
        }
    }
}

    // 辅助函数：提取文化特色要点（风土人情）
    function extractKeyCulturePoint(cultureInfo) {
        let keyPoint = cultureInfo;
        
        // 提取最核心的文化信息（风土人情）
        // 按优先级从高到低排列的关键词数组
        const keywords = [
            // 一级关键词：核心文化元素
            '京族', '独弦琴', '哈节', '长桌宴', '海洋文化', '渔猎文化',
            // 二级关键词：特色习俗
            '竹竿舞', '京族服饰', '京族语言', '京族文字', '祭海仪式',
            // 三级关键词：文化类别
            '非物质文化遗产', '海洋少数民族', '边境风情', '民族特色',
            // 四级关键词：通用文化标识
            '文化', '传统', '习俗', '风情'
        ];
        
        // 按优先级搜索关键词
        for (const keyword of keywords) {
            if (keyPoint.includes(keyword)) {
                const sentences = keyPoint.split(/[。！？]/).filter(s => s.includes(keyword));
                if (sentences.length > 0) {
                    keyPoint = sentences[0];
                    break; // 找到第一个匹配的关键词就停止
                }
            }
        }
        
        // 如果没有找到包含关键词的句子，使用整个描述的前40个字符
        if (keyPoint === cultureInfo && keyPoint.length > 0) {
            const sentences = keyPoint.split(/[。！？]/);
            if (sentences.length > 0) {
                keyPoint = sentences[0];
            }
        }
        
        // 控制最大长度，确保简洁
        if (keyPoint.length > 40) {
            keyPoint = keyPoint.substring(0, 40) + '...';
        }
        
        return keyPoint;
    }

// 辅助函数：根据地点信息查找对应的标记点
function findMarkerByLocation(location) {
    if (!location || !location.lat || !location.lng) return null;
    
    let foundMarker = null;
    
    // 遍历所有标记点，找到匹配的标记
    markersLayerGroup.eachLayer(function(layer) {
        if (layer instanceof L.Marker) {
            const markerLatLng = layer.getLatLng();
            // 比较坐标是否匹配（允许小的误差）
            if (Math.abs(markerLatLng.lat - location.lat) < 0.001 && 
                Math.abs(markerLatLng.lng - location.lng) < 0.001) {
                foundMarker = layer;
            }
        }
    });
    
    return foundMarker;
}

/**
 * 动画循环函数，处理车辆移动和语音播报逻辑
 * @param {number} timestamp - 当前时间戳
 */
function animationLoop(timestamp) {
    // 边界检查：确保动画状态有效
    if (!animationState || typeof animationState !== 'object') {
        console.error('动画状态无效，停止动画循环');
        animationState.isRunning = false;
        return;
    }
    
    const routeData = getCurrentRouteData();
    
    // 边界检查：确保路线数据有效
    if (!Array.isArray(routeData) || routeData.length === 0) {
        console.error('路线数据无效，停止动画循环');
        animationState.isRunning = false;
        updateUIState();
        return;
    }
    
    const totalPoints = routeData.length - 1;
    
    // 边界检查：确保总点数有效
    if (totalPoints <= 0) {
        console.error('总点数无效，停止动画循环');
        animationState.isRunning = false;
        updateUIState();
        return;
    }
    
    // 如果是新的一段移动（刚从语音播报恢复或刚开始），重置该段的起始时间
    if (!animationState.currentSegmentStartTime) {
        animationState.currentSegmentStartTime = timestamp;
    }
    
    // 计算当前段的已用时间（相对于该段开始的时间）
    const segmentElapsed = timestamp - animationState.currentSegmentStartTime;
    
    // 计算每段移动的持续时间（根据速度），添加边界检查
    const segmentDuration = Math.max(100, (300000 / Math.max(1, animationState.speed)) / totalPoints); // 每段的时长，最小100ms
    
    // 计算当前段内的进度（0到1之间）
    const segmentProgress = Math.min(segmentElapsed / segmentDuration, 1);
    
    // 使用当前索引和段内进度计算精确位置，添加边界检查
    const currentIndex = Math.max(0, Math.min(animationState.currentIndex, totalPoints));
    const nextIndex = Math.min(currentIndex + 1, totalPoints);
    const t = segmentProgress;
    
    // 检查当前段是否完成
    if (segmentProgress >= 1 && currentIndex < totalPoints) {
        // 移动到下一个索引
        animationState.currentIndex++;
        // 暂停动画，等待语音播报完成
        animationState.isRunning = false;
        // 重置当前段起始时间，准备下一段移动
        animationState.currentSegmentStartTime = null;
        
        // 确保新索引在有效范围内
        if (animationState.currentIndex >= 0 && animationState.currentIndex < routeData.length) {
            // 每到一个新地点，天数加1
            animationState.dayCounter++;
            
            // 语音播报当前位置
            const currentPoint = routeData[animationState.currentIndex];
            if (currentPoint && currentPoint.name) {
                // 立即更新状态文本显示当前地点信息
                if (cachedStatusText && currentPoint) {
                    cachedStatusText.textContent = `行驶中 - ${currentPoint.name} (${animationState.currentIndex + 1}/${animationState.totalPoints})`;
                }
                
                // 立即更新车辆弹出窗口内容，确保语音播报开始时数据已更新
                if (animationState.vehicleMarker) {
                    animationState.vehicleMarker.setPopupContent(`
                        <div style="text-align: center;">
                            <h4 style="color: #b22222; margin-bottom: 5px;">🚗 ${currentPoint.name}</h4>
                            <p style="color: black; margin-bottom: 3px;">${currentPoint.province}</p>
                            <p style="color: black;">进度: ${animationState.currentIndex + 1}/${animationState.totalPoints}</p>
                        </div>
                    `);
                }
                
                // 更新地点信息显示
                updateLocationInfoDisplay(currentPoint.name);
                
                // 尝试语音播报，但如果失败则继续动画
                try {
                    speakLocation(currentPoint);
                } catch (error) {
                    console.error('语音播报调用失败:', error);
                    // 语音播报失败时，立即继续动画
                    animationState.isRunning = true;
                    animationState.currentSegmentStartTime = null;
                    animationState.animationId = requestAnimationFrame(animationLoop);
                }
            } else {
                // 如果地点信息无效，直接继续动画
                console.warn('地点信息无效，跳过语音播报，继续动画');
                animationState.isRunning = true;
                animationState.currentSegmentStartTime = null;
                animationState.animationId = requestAnimationFrame(animationLoop);
            }
        } else {
            // 如果索引无效，直接继续动画
            console.warn('动画索引无效，继续动画');
            animationState.isRunning = true;
            animationState.currentSegmentStartTime = null;
            animationState.animationId = requestAnimationFrame(animationLoop);
        }
        
        // 注意：动画将在语音播报完成后的onend事件中继续（如果语音播报成功）
        return; // 提前返回，等待语音播报完成
    }
    
    // 计算当前位置（两个点之间的插值）
    // 添加防御性检查，确保索引有效
    const currentPoint = routeData[currentIndex] || routeData[0];
    const nextPoint = routeData[nextIndex] || routeData[Math.min(currentIndex + 1, routeData.length - 1)];
    
    // 边界检查：确保坐标点有效
    if (!currentPoint || !nextPoint || 
        typeof currentPoint.lat !== 'number' || typeof currentPoint.lng !== 'number' ||
        typeof nextPoint.lat !== 'number' || typeof nextPoint.lng !== 'number') {
        console.error('坐标点数据无效，停止动画循环');
        animationState.isRunning = false;
        updateUIState();
        return;
    }
    
    const currentLat = lerp(currentPoint.lat, nextPoint.lat, t);
    const currentLng = lerp(currentPoint.lng, nextPoint.lng, t);
    
    // 边界检查：确保插值结果有效
    if (!isFinite(currentLat) || !isFinite(currentLng)) {
        console.error('插值坐标无效，停止动画循环');
        animationState.isRunning = false;
        updateUIState();
        return;
    }
    
    // 更新车辆位置（使用插值坐标）
    try {
        updateVehiclePosition(currentLat, currentLng, currentPoint);
    } catch (error) {
        console.error('更新车辆位置失败:', error);
        animationState.isRunning = false;
        updateUIState();
        return;
    }
    
    // 检查动画是否结束
    if (currentIndex >= totalPoints && segmentProgress >= 1) {
        // 动画结束
        animationState.isRunning = false;
        // 停止地图切换定时器
        stopMapSwitchTimer();
        updateUIState();
        if (cachedStatusText) {
            cachedStatusText.textContent = '行程结束！';
        }
    } else {
        // 如果动画正在运行，或者需要继续执行（比如语音播报完成后），则继续请求下一帧
        try {
            animationState.animationId = requestAnimationFrame(animationLoop);
        } catch (error) {
            console.error('请求下一帧动画失败:', error);
            animationState.isRunning = false;
            updateUIState();
        }
    }
}

// 开始地图切换定时器
function startMapSwitchTimer() {
    // 清除现有定时器
    if (animationState.mapSwitchTimer) {
        clearInterval(animationState.mapSwitchTimer);
        animationState.mapSwitchTimer = null;
    }
    
    // 记录定时器启动时间
    animationState.mapSwitchStartTime = performance.now();
    
    // 启动新的定时器，根据当前地图类型设置不同的切换间隔
    animationState.mapSwitchTimer = setInterval(function() {
        // 检查是否应该切换地图（动画运行中且未暂停，或者语音播报期间）
        if ((animationState.isRunning && !animationState.isPaused) || 
            (!animationState.isRunning && window.speechSynthesis.speaking)) {
            // 切换地图类型
            if (animationState.currentMapType === 'satellite') {
                switchMapType('standard');
                // 标准地图显示5秒
                animationState.mapSwitchInterval = 5000;
            } else {
                switchMapType('satellite');
                // 卫星地图显示8秒
                animationState.mapSwitchInterval = 8000;
            }
        }
    }, animationState.mapSwitchInterval);
}

// 停止地图切换定时器
function stopMapSwitchTimer() {
    if (animationState.mapSwitchTimer) {
        clearInterval(animationState.mapSwitchTimer);
        animationState.mapSwitchTimer = null;
    }
}

/**
 * 开始动画
 */
function startAnimation() {
    // 边界检查：确保动画状态有效
    if (!animationState || typeof animationState !== 'object') {
        console.error('动画状态无效，无法开始动画');
        return;
    }
    
    const routeData = getCurrentRouteData();
    
    // 边界检查：确保路线数据有效
    if (!Array.isArray(routeData) || routeData.length === 0) {
        alert('请先选择一个有效的起点！');
        return;
    }
    
    // 边界检查：确保地图实例有效
    if (!map || typeof map.setView !== 'function') {
        console.error('地图实例无效，无法开始动画');
        return;
    }
    
    try {
        // 清除路线数据缓存，确保获取最新数据
        clearRouteCache();
        
        // 重置动画状态
        animationState.totalPoints = routeData.length;
        animationState.currentIndex = 0;
        animationState.startTime = null;
        animationState.pausedTime = 0;
        animationState.currentSegmentStartTime = null;
        animationState.isRunning = true;
        animationState.isPaused = false;
        animationState.dayCounter = 1; // 重置天数计数器
        
        // 启动地图切换定时器
        startMapSwitchTimer();
        
        // 初始化车辆和轨迹
        createVehicleMarker();
        createTrailLine();
        
        // 地图放大到合适比例（根据当前路线和车辆位置）
        const currentPoint = routeData[animationState.currentIndex];
        
        // 边界检查：确保当前点有效
        if (!currentPoint || typeof currentPoint.lat !== 'number' || typeof currentPoint.lng !== 'number') {
            console.error('起始点坐标无效，无法开始动画');
            return;
        }
        
        map.setView([currentPoint.lat, currentPoint.lng], 8, { 
            animate: true,
            duration: 1
        });
        
        // 立即播报第一个地点的语音
        if (currentPoint && currentPoint.name) {
            // 更新车辆弹出窗口内容
            if (animationState.vehicleMarker) {
                animationState.vehicleMarker.setPopupContent(`
                    <div style="text-align: center;">
                        <h4 style="color: #b22222; margin-bottom: 5px;">🚗 ${currentPoint.name}</h4>
                        <p style="color: black; margin-bottom: 3px;">${currentPoint.province}</p>
                        <p style="color: black;">进度: ${animationState.currentIndex + 1}/${animationState.totalPoints}</p>
                    </div>
                `);
                // 确保弹窗打开显示
                animationState.vehicleMarker.openPopup();
            }
            
            // 更新状态文本显示当前地点信息
            if (cachedStatusText && currentPoint) {
                cachedStatusText.textContent = `行驶中 - ${currentPoint.name} (${animationState.currentIndex + 1}/${animationState.totalPoints})`;
            }
            
            // 暂停动画，等待语音播报完成
            animationState.isRunning = false;
            animationState.isPaused = false;
            
            // 立即更新UI状态，确保暂停按钮在语音播报期间可用
            updateUIState();
            
            speakLocation(currentPoint);
            // 更新地点信息显示
            updateLocationInfoDisplay(currentPoint.name);
        } else {
            animationState.isRunning = true;
            animationState.isPaused = false;
            
            try {
                animationState.animationId = requestAnimationFrame(animationLoop);
            } catch (error) {
                console.error('开始动画循环失败:', error);
                animationState.isRunning = false;
            }
            
            // 更新UI状态
            updateUIState();
        }
    } catch (error) {
        console.error('开始动画过程中发生错误:', error);
        animationState.isRunning = false;
        animationState.isPaused = false;
        updateUIState();
    }
}

/**
 * 暂停动画
 */
function pauseAnimation() {
    // 边界检查：确保动画状态有效
    if (!animationState || typeof animationState !== 'object') {
        console.error('动画状态无效，无法暂停动画');
        return;
    }
    
    // 如果动画正在运行，或者正在语音播报期间（isRunning为false但语音正在播放），都可以暂停
    if (animationState.isRunning || (!animationState.isRunning && window.speechSynthesis.speaking)) {
        try {
            animationState.isRunning = false;
            animationState.isPaused = true;
            
            // 计算暂停时间
            if (animationState.startTime) {
                animationState.pausedTime += performance.now() - animationState.startTime;
                animationState.startTime = 0;
            }
            
            // 停止语音播报
            if (window.speechSynthesis && window.speechSynthesis.speaking) {
                try {
                    window.speechSynthesis.cancel();
                } catch (error) {
                    console.warn('停止语音播报失败:', error);
                }
            }
            
            // 停止地图切换定时器
            stopMapSwitchTimer();
            
            // 停止动画帧
            if (animationState.animationId) {
                try {
                    cancelAnimationFrame(animationState.animationId);
                    animationState.animationId = null;
                } catch (error) {
                    console.warn('取消动画帧失败:', error);
                }
            }
            
            updateUIState();
        } catch (error) {
            console.error('暂停动画过程中发生错误:', error);
        }
    }
}

/**
 * 继续动画
 */
function resumeAnimation() {
    // 边界检查：确保动画状态有效
    if (!animationState || typeof animationState !== 'object') {
        console.error('动画状态无效，无法继续动画');
        return;
    }
    
    if (animationState.isPaused) {
        try {
            animationState.isRunning = true;
            animationState.isPaused = false;
            
            // 计算继续时间
            if (animationState.pausedTime > 0) {
                animationState.startTime = performance.now() - animationState.pausedTime;
                animationState.pausedTime = 0;
            }
            
            animationState.currentSegmentStartTime = null; // 重置当前段起始时间
            
            // 重新启动地图切换定时器
            startMapSwitchTimer();
            
            // 重新开始动画循环
            try {
                animationState.animationId = requestAnimationFrame(animationLoop);
            } catch (error) {
                console.error('重新开始动画循环失败:', error);
                animationState.isRunning = false;
                animationState.isPaused = true;
            }
            
            updateUIState();
        } catch (error) {
            console.error('继续动画过程中发生错误:', error);
            animationState.isRunning = false;
            animationState.isPaused = true;
            updateUIState();
        }
    }
}

/**
 * 重置动画
 */
function resetAnimation() {
    // 边界检查：确保动画状态有效
    if (!animationState || typeof animationState !== 'object') {
        console.error('动画状态无效，无法重置动画');
        return;
    }
    
    try {
        // 清除路线数据缓存，确保下次获取最新数据
        clearRouteCache();
        
        // 停止动画
        if (animationState.animationId) {
            try {
                cancelAnimationFrame(animationState.animationId);
                animationState.animationId = null;
            } catch (error) {
                console.warn('取消动画帧失败:', error);
            }
        }
        
        // 停止地图切换定时器
        stopMapSwitchTimer();
        
        // 重置状态
        animationState.isRunning = false;
        animationState.isPaused = false;
        animationState.currentIndex = 0;
        animationState.startTime = 0;
        animationState.pausedTime = 0;
        animationState.currentSegmentStartTime = null;
        animationState.dayCounter = 1; // 重置天数计数器
        
        // 更新UI
        updateUIState();
        
        // 重置进度条
        if (cachedProgressBar) {
            cachedProgressBar.style.width = '0%';
        }
        
        // 重置状态文本
        if (cachedStatusText) {
            cachedStatusText.textContent = '准备就绪';
        }
        
        // 移除现有的车辆和轨迹
        if (animationState.vehicleMarker) {
            try {
                if (map && typeof map.removeLayer === 'function') {
                    map.removeLayer(animationState.vehicleMarker);
                }
                animationState.vehicleMarker = null;
            } catch (error) {
                console.warn('移除车辆标记失败:', error);
            }
        }
        
        if (animationState.trailLine) {
            try {
                if (map && typeof map.removeLayer === 'function') {
                    map.removeLayer(animationState.trailLine);
                }
                animationState.trailLine = null;
            } catch (error) {
                console.warn('移除轨迹线失败:', error);
            }
        }
        
        // 初始化车辆和轨迹（如果有选择起点）
        const routeData = getCurrentRouteData();
        if (routeData.length > 0) {
            createVehicleMarker();
            createTrailLine();
            const startPoint = routeData[0];
            
            // 边界检查：确保起始点有效
            if (startPoint && typeof startPoint.lat === 'number' && typeof startPoint.lng === 'number') {
                updateVehiclePosition(startPoint.lat, startPoint.lng, startPoint);
            }
        }
    } catch (error) {
        console.error('重置动画过程中发生错误:', error);
    }
}

/**
 * 更新UI状态
 */
function updateUIState() {
    // 边界检查：确保动画状态有效
    if (!animationState || typeof animationState !== 'object') {
        console.error('动画状态无效，无法更新UI状态');
        return;
    }
    
    try {
        const startBtn = document.getElementById('start-animation');
        const pauseBtn = document.getElementById('pause-animation');
        const resetBtn = document.getElementById('reset-animation');
        const routeSelect = document.getElementById('route-select');
        
        // 检查是否正在语音播报期间
        let isSpeaking = false;
        if (window.speechSynthesis && typeof window.speechSynthesis.speaking === 'boolean') {
            isSpeaking = window.speechSynthesis.speaking;
        }
        
        if (startBtn) {
            // 开始按钮在动画运行且未暂停时禁用，其他情况可用
            startBtn.disabled = animationState.isRunning && !animationState.isPaused;
        }
        
        if (pauseBtn) {
            // 暂停按钮在动画运行且未暂停时可用，或者在语音播报期间也可用
            pauseBtn.disabled = !((animationState.isRunning && !animationState.isPaused) || 
                                 (!animationState.isRunning && isSpeaking && !animationState.isPaused));
        }
        
        if (resetBtn) {
            // 边界检查：确保vehicleMarker属性存在
            const hasVehicleMarker = animationState.vehicleMarker !== null && animationState.vehicleMarker !== undefined;
            resetBtn.disabled = !hasVehicleMarker;
        }
        
        if (routeSelect) {
            routeSelect.disabled = animationState.isRunning && !animationState.isPaused;
        }
    } catch (error) {
        console.error('更新UI状态过程中发生错误:', error);
    }
}

// 确保initMap函数全局可用
globalThis.initMap = initMap;