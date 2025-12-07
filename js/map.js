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
    G331: { color: '#32cd32', name: 'G331' }, /* 柔和的草绿色 */
G228: { color: '#1e90ff', name: 'G228' } /* 海蓝色 */
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
    currentVoiceIndex: 0,
    enableVoiceBroadcast: true,
    enableMapSwitch: false,
    enableAutoRestart: true,
    autoRestartDelay: 3000
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
            maxZoom: 18
        }),
        // 卫星地图 - 高德卫星地图（包含标注图层）
        satellite: L.layerGroup([
            // 卫星影像底图（style=6）
            L.tileLayer('https://webst0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=6&x={x}&y={y}&z={z}', {
                subdomains: ['1', '2', '3', '4'],
                maxZoom: 18
            }),
            // 标注图层（style=8，包含行政区划和路网）
            L.tileLayer('https://webst0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
                subdomains: ['1', '2', '3', '4'],
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
    // 创建地图实例，中心设置在中国境内，禁用默认版权控制
    map = L.map('map', {
        attributionControl: false
    }).setView(MAP_CONFIG.DEFAULT_CENTER, MAP_CONFIG.DEFAULT_ZOOM);
    
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
            opacity: 0.7, 
            fillOpacity: 0.3,
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
        html: `<div style="background-color: ${color}; color: white; padding: 4px 8px; border-radius: 8px; font-size: 12px; font-weight: bold; text-align: center; border: 2px solid ${color}; font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif; box-shadow: 0 2px 5px rgba(0,0,0,0.15); text-shadow: none; opacity: 0.8;">${locationName}</div>`,
        iconAnchor: [40, 40]
    });
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
        { id: 'g219', name: 'G219 东兴-喀纳斯', color: '#ff8c00', locations: G219Locations },
        { id: 'g331', name: 'G331 丹东-阿勒泰', color: '#32cd32', locations: G331Locations }, /* 柔和的草绿色 */
{ id: 'g228', name: 'G228 丹东-东兴', color: '#1e90ff', locations: G228Locations } /* 海蓝色 */
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
    // G219: 东兴向喀纳斯方向（当前G219Locations数组已调整为东兴-喀纳斯方向）
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
    const voiceBroadcastCheckbox = document.getElementById('voice-broadcast');
    const mapSwitchCheckbox = document.getElementById('map-switch');
    
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
    
    // 语音播报开关事件
    if (voiceBroadcastCheckbox) {
        voiceBroadcastCheckbox.addEventListener('change', function() {
            animationState.enableVoiceBroadcast = this.checked;
        });
    }
    
    // 地图自动切换开关事件
    if (mapSwitchCheckbox) {
        mapSwitchCheckbox.addEventListener('change', function() {
            animationState.enableMapSwitch = this.checked;
            
            if (this.checked) {
                // 如果重新开启地图自动切换，并且动画正在运行（无论是否暂停），重新启动定时器
                if (animationState.isRunning) {
                    startMapSwitchTimer();
                }
            } else {
                // 如果关闭地图自动切换，清除当前的地图切换定时器
                if (animationState.mapSwitchTimer) {
                    clearTimeout(animationState.mapSwitchTimer);
                    animationState.mapSwitchTimer = null;
                }
            }
        });
    }
    
    // 自动继续模拟开关事件
    const autoRestartCheckbox = document.getElementById('auto-restart');
    if (autoRestartCheckbox) {
        autoRestartCheckbox.addEventListener('change', function() {
            animationState.enableAutoRestart = this.checked;
        });
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
}

/**
 * 清除DOM元素缓存
 * 当DOM结构发生变化时调用，确保下次重新查询
 */
function clearDomCache() {
    cachedProgressBar = null;
    cachedStatusText = null;
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
            // G219顺时针应该是东兴向喀纳斯方向（当前G219Locations数组已调整为东兴-喀纳斯方向）
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
            const g219Reversed = getReversedRoute(G219Locations, 'g219');
            const g331Reversed = getReversedRoute(G331Locations, 'g331');
            const g228Original = G228Locations;
            
            // 返回完整的顺时针路线：G228剩余部分 → G219 → G331 → G228
            return [...g228Remaining, ...g219Reversed.slice(1), ...g331Reversed.slice(1), ...g228Original];
        } else if (startLocation.route === 'g219') {
            // G219顺时针：东兴 → 喀纳斯
            const currentLocation = fullRouteData[startIndex];
            
            if (currentLocation.name === '喀纳斯') {
                // 如果到达G219终点喀纳斯，连接到G331白沙湖并继续G331路线
                const g331Reversed = getReversedRoute(G331Locations, 'g331');
                const heiheIndex = g331Reversed.findIndex(loc => loc.name === '白沙湖');
                if (heiheIndex !== -1) {
                    // 从白沙湖开始继续G331路线，然后连接到G228
                const g331Route = g331Reversed.slice(heiheIndex);
                const g228Route = G228Locations;
                return [...g331Route, ...g228Route];
                }
            } else {
                // 先走完G219到喀纳斯，再连接G331白沙湖继续，然后连接到G228
                const g219Remaining = fullRouteData.slice(startIndex);
                const g331Reversed = getReversedRoute(G331Locations, 'g331');
                const heiheIndex = g331Reversed.findIndex(loc => loc.name === '白沙湖');
                if (heiheIndex !== -1) {
                    const g331Route = g331Reversed.slice(heiheIndex);
                    const g228Route = G228Locations;
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
                return [...g331Remaining, ...G228Locations];
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
        opacity: 0.6,
        fillOpacity: 0.2,
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
    // 检查语音播报开关状态
    if (!animationState.enableVoiceBroadcast) {
        // 直接继续动画
        animationState.isRunning = true;
        animationState.currentSegmentStartTime = null;
        animationState.animationId = requestAnimationFrame(animationLoop);
        return;
    }
    
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
        
        // 判断行政区划类型（自治区、直辖市、特别行政区、省）
        const autonomousRegions = ['新疆', '西藏', '内蒙古', '广西', '宁夏'];
        const municipalities = ['北京', '天津', '上海', '重庆'];
        const specialRegions = ['香港', '澳门'];
        
        let regionSuffix = '省'; // 默认为省
        
        if (autonomousRegions.includes(province)) {
            regionSuffix = '自治区';
        } else if (municipalities.includes(province)) {
            regionSuffix = '市';
        } else if (specialRegions.includes(province)) {
            regionSuffix = '特别行政区';
        }
        
        const speechTemplates = [
            {
                intro: altitude > 500 ? 
                    `第${animationState.dayCounter}天，到达${location.name}，${province}${regionSuffix}，海拔${altitude}米。` :
                    `第${animationState.dayCounter}天，到达${location.name}，${province}${regionSuffix}。`,
                culture: (info) => `${getCompleteSentence(info, 40)}`
            },
            {
                intro: altitude > 500 ? 
                    `第${animationState.dayCounter}天，来到${location.name}，${province}${regionSuffix}，海拔${altitude}米。` :
                    `第${animationState.dayCounter}天，来到${location.name}，${province}${regionSuffix}。`,
                culture: (info) => `${getCompleteSentence(info, 50)}`
            },
            {
                intro: altitude > 500 ? 
                    `第${animationState.dayCounter}天，抵达${location.name}，${province}${regionSuffix}，海拔${altitude}米。` :
                    `第${animationState.dayCounter}天，抵达${location.name}，${province}${regionSuffix}。`,
                culture: (info) => `${getCompleteSentence(info, 60)}`
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
        
        // 获取所有可用的中文语音角色（Chrome兼容性处理）
        let voices = window.speechSynthesis.getVoices();
        
        // Chrome浏览器可能需要等待voiceschanged事件
        if (voices.length === 0) {
            // 直接继续动画
            animationState.isRunning = true;
            animationState.currentSegmentStartTime = null;
            animationState.animationId = requestAnimationFrame(animationLoop);
            return;
        }
        
        // 选择中文语音
        const chineseVoices = voices.filter(voice => voice.lang === 'zh-CN');
        if (chineseVoices.length > 0) {
            // 循环使用所有可用的中文语音角色
            const voiceIndex = animationState.currentVoiceIndex % chineseVoices.length;
            speech.voice = chineseVoices[voiceIndex];
            
            // 更新语音索引，为下一次播报做准备
            animationState.currentVoiceIndex = (animationState.currentVoiceIndex + 1) % chineseVoices.length;
        }
        
        // 设置语音参数
        speech.rate = 1.4; // 较快语速，信息传达更高效
        speech.pitch = 1.0; // 正常音调
        
        // 语音事件处理
        speech.onend = function() {
            if (!animationState.isPaused) {
                animationState.isRunning = true;
                animationState.currentSegmentStartTime = null;
                animationState.animationId = requestAnimationFrame(animationLoop);
            }
        };
        
        speech.onerror = function(event) {
            console.warn('语音播报错误:', event.error);
            // 即使语音播报失败，也要继续动画
            if (!animationState.isPaused) {
                animationState.isRunning = true;
                animationState.currentSegmentStartTime = null;
                animationState.animationId = requestAnimationFrame(animationLoop);
            }
        };
        
        // 更新状态为语音播报中
        if (cachedStatusText) {
            cachedStatusText.textContent = '语音播报中...';
        }
        
        // 播放语音
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
        }
    }
}

    // 辅助函数：获取完整的句子，确保不截断句子
    function getCompleteSentence(text, maxLength) {
        if (!text || text === '暂无详细信息') return '';
        
        // 按句子分隔符分割文本
        const sentences = text.split(/[。！？]/).filter(sentence => sentence.trim().length > 0);
        
        if (sentences.length === 0) return '';
        
        // 找到第一个完整的句子，确保不超过最大长度
        let result = sentences[0];
        
        // 如果第一个句子太长，尝试找到合适的断点
        if (result.length > maxLength) {
            // 在标点符号处断句
            const punctuation = /[，；、]/;
            const parts = result.split(punctuation);
            
            let current = '';
            for (const part of parts) {
                const temp = current ? current + '，' + part : part;
                if (temp.length <= maxLength) {
                    current = temp;
                } else {
                    break;
                }
            }
            
            if (current) {
                result = current + '。';
            } else {
                // 如果还是太长，按字符数截取，但确保在词语边界
                result = result.substring(0, maxLength - 1);
                // 找到最后一个标点符号或空格
                const lastPunctuation = Math.max(
                    result.lastIndexOf('，'),
                    result.lastIndexOf('；'),
                    result.lastIndexOf('、'),
                    result.lastIndexOf(' ')
                );
                
                if (lastPunctuation > 0) {
                    result = result.substring(0, lastPunctuation + 1) + '。';
                } else {
                    result += '。';
                }
            }
        } else {
            result += '。';
        }
        
        return result;
    }

    // 辅助函数：提取文化特色要点（风土人情）
    function extractKeyCulturePoint(cultureInfo) {
        let keyPoint = cultureInfo;
        
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
                

                
                // 更新地点信息显示
                updateLocationInfoDisplay(currentPoint.name);
                
                // 触发地点名称强调动画
                triggerLocationEmphasis(currentPoint);
                
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
        
        // 检查是否启用自动继续功能
        if (animationState.enableAutoRestart) {
            // 延迟后自动继续模拟行程
            setTimeout(autoRestartAnimation, animationState.autoRestartDelay);
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
    // 检查地图切换开关状态
    if (!animationState.enableMapSwitch) {
        return;
    }
    
    // 清除现有定时器
    if (animationState.mapSwitchTimer) {
        clearInterval(animationState.mapSwitchTimer);
        animationState.mapSwitchTimer = null;
    }
    
    // 记录定时器启动时间
    animationState.mapSwitchStartTime = performance.now();
    
    // 启动新的定时器，根据当前地图类型设置不同的切换间隔
    animationState.mapSwitchTimer = setInterval(function() {
        // 检查是否应该切换地图（动画运行中且未暂停，或者语音播报期间，或者动画已开始但正在语音播报）
        if ((animationState.isRunning && !animationState.isPaused) || 
            (!animationState.isRunning && window.speechSynthesis.speaking) ||
            (animationState.startTime !== null)) {
            // 切换地图类型
            if (animationState.currentMapType === 'satellite') {
                switchMapType('standard');
                // 清除并重新设置定时器，使用新的间隔时间
                clearInterval(animationState.mapSwitchTimer);
                animationState.mapSwitchInterval = 5000; // 标准地图显示5秒
                animationState.mapSwitchTimer = setInterval(arguments.callee, animationState.mapSwitchInterval);
            } else {
                switchMapType('satellite');
                // 清除并重新设置定时器，使用新的间隔时间
                clearInterval(animationState.mapSwitchTimer);
                animationState.mapSwitchInterval = 8000; // 卫星地图显示8秒
                animationState.mapSwitchTimer = setInterval(arguments.callee, animationState.mapSwitchInterval);
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
 * 触发地点名称强调动画
 * @param {Object} location - 地点信息对象
 */
function triggerLocationEmphasis(location) {
    if (!location || !location.name) {
        console.warn('地点信息无效，无法触发强调动画');
        return;
    }
    
    // 查找对应的地图标记
    const marker = findMarkerByLocation(location);
    if (!marker) {
        console.warn('未找到对应的地图标记:', location.name);
        return;
    }
    
    // 获取标记的DOM元素
    const markerElement = marker.getElement();
    if (!markerElement) {
        console.warn('无法获取标记的DOM元素:', location.name);
        return;
    }
    
    // 获取标记内部的div元素（包含地点名称）
    const markerDiv = markerElement.querySelector('div');
    if (!markerDiv) {
        console.warn('标记内部没有div元素:', location.name);
        return;
    }
    
    // 添加强调动画类
    markerDiv.classList.add('location-emphasis');
    
    // 动画结束后移除类，以便下次可以重新触发
    setTimeout(() => {
        markerDiv.classList.remove('location-emphasis');
    }, 800); // 动画持续800ms
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
 * 自动继续模拟行程
 */
function autoRestartAnimation() {
    // 边界检查：确保动画状态有效
    if (!animationState || typeof animationState !== 'object') {
        console.error('动画状态无效，无法自动继续');
        return;
    }
    
    // 检查是否已经手动停止或暂停
    if (animationState.isPaused || animationState.isRunning) {
        return;
    }
    
    try {
        // 重置动画状态，但保留当前路线和方向设置
        animationState.currentIndex = 0;
        animationState.startTime = 0;
        animationState.pausedTime = 0;
        animationState.currentSegmentStartTime = null;
        animationState.dayCounter = 1; // 重置天数计数器
        animationState.isRunning = true;
        animationState.isPaused = false;
        
        // 清除路线数据缓存，确保获取最新数据
        clearRouteCache();
        
        // 获取当前路线数据
        const routeData = getCurrentRouteData();
        
        // 边界检查：确保路线数据有效
        if (!Array.isArray(routeData) || routeData.length === 0) {
            console.error('路线数据无效，无法自动继续');
            return;
        }
        
        animationState.totalPoints = routeData.length;
        
        // 重置进度条
        if (cachedProgressBar) {
            cachedProgressBar.style.width = '0%';
        }
        
        // 更新状态文本
        if (cachedStatusText) {
            cachedStatusText.textContent = '自动继续中...';
        }
        
        // 重新启动地图切换定时器
        startMapSwitchTimer();
        
        // 重新开始动画循环
        try {
            animationState.animationId = requestAnimationFrame(animationLoop);
        } catch (error) {
            console.error('自动继续动画循环失败:', error);
            animationState.isRunning = false;
            updateUIState();
        }
        
        // 更新UI状态
        updateUIState();
        
    } catch (error) {
        console.error('自动继续过程中发生错误:', error);
        animationState.isRunning = false;
        updateUIState();
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