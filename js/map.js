// 中国边境线地图功能实现

// 地图对象
var map;

// 路线图层对象
var g219Layer, g331Layer, g228Layer;

// 标记点图层组
var markersLayerGroup;

// 地图图层对象
var mapLayers = {};

// 模拟行程动画相关变量
var animationState = {
    isRunning: false,
    isPaused: false,
    currentRoute: 'g219',
    currentDirection: 'clockwise', // 'clockwise' 或 'counterclockwise'
    currentLocationId: null, // 起点ID
    currentIndex: 0,
    totalPoints: 0,
    speed: 1, // 1-10之间的值
    animationId: null,
    startTime: 0,
    pausedTime: 0,
    vehicleMarker: null,
    visitedPoints: [],
    trailLine: null,
    allLocations: [] // 所有地点的合并列表
};

// 初始化地图
function initMap() {
    // 创建地图实例，中心设置在中国境内
    map = L.map('map').setView([35.8617, 104.1954], 4);
    
    // 定义地图图层
    mapLayers = {
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
    
    // 添加默认图层（卫星地图）
    mapLayers.satellite.addTo(map);
    
    // 创建标记点图层组
    markersLayerGroup = L.layerGroup().addTo(map);
    
    // 初始化路线图层
    initRoutes();
    
    // 初始化标记点
    initMarkers();
    
    // 绑定路线控制事件
    bindRouteControls();
    
    // 绑定地图图层切换事件
    bindMapLayerControls();
    
    // 生成地点列表
    generateLocationsList();
    
    // 初始化行程动画控制
    initRouteAnimationControls();
}

// 初始化路线
function initRoutes() {
    // G219国道路线 - 红色
    g219Layer = L.polyline(
        G219Locations.map(loc => [loc.lat, loc.lng]),
        { 
            color: '#e74c3c', 
            weight: 4, 
            opacity: 0.8, 
            name: 'G219'
        }
    ).addTo(map);
    
    // G331国道路线 - 蓝色
    g331Layer = L.polyline(
        G331Locations.map(loc => [loc.lat, loc.lng]),
        { 
            color: '#3498db', 
            weight: 4, 
            opacity: 0.8, 
            name: 'G331'
        }
    ).addTo(map);
    
    // G228国道路线 - 绿色
    g228Layer = L.polyline(
        G228Locations.map(loc => [loc.lat, loc.lng]),
        { 
            color: '#27ae60', 
            weight: 4, 
            opacity: 0.8, 
            name: 'G228'
        }
    ).addTo(map);
}

// 初始化标记点
function initMarkers() {
    // 清除现有标记点
    markersLayerGroup.clearLayers();
    
    // 添加G219国道标记点
    if (document.getElementById('g219').checked) {
        addMarkers(G219Locations, '#e74c3c');
    }
    
    // 添加G331国道标记点
    if (document.getElementById('g331').checked) {
        addMarkers(G331Locations, '#3498db');
    }
    
    // 添加G228国道标记点
    if (document.getElementById('g228').checked) {
        addMarkers(G228Locations, '#27ae60');
    }
}

// 添加标记点
function addMarkers(locations, color) {
    locations.forEach(loc => {
        // 创建标记点
        const marker = L.marker([loc.lat, loc.lng], {
            title: `${loc.name} (${loc.province})`
        });
        
        // 创建自定义图标
        const icon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: ${color}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 14px; font-weight: bold; text-align: center;">${loc.name}</div>`,
            // 移除固定宽度，让弹出框根据内容自适应
            iconAnchor: [35, 35]
        });
        
        marker.setIcon(icon);
        
        // 添加弹出信息
        marker.bindPopup(`
            <div style="font-size: 14px;">
                <strong>${loc.name}</strong><br>
                省份: ${loc.province}<br>
                坐标: ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}
            </div>
        `);
        
        // 添加到图层组
        marker.addTo(markersLayerGroup);
    });
}

// 绑定路线控制事件
function bindRouteControls() {
    // G219控制
    document.getElementById('g219').addEventListener('change', function() {
        if (this.checked) {
            map.addLayer(g219Layer);
        } else {
            map.removeLayer(g219Layer);
        }
        initMarkers();
    });
    
    // G331控制
    document.getElementById('g331').addEventListener('change', function() {
        if (this.checked) {
            map.addLayer(g331Layer);
        } else {
            map.removeLayer(g331Layer);
        }
        initMarkers();
    });
    
    // G228控制
    document.getElementById('g228').addEventListener('change', function() {
        if (this.checked) {
            map.addLayer(g228Layer);
        } else {
            map.removeLayer(g228Layer);
        }
        initMarkers();
    });
}

// 生成地点列表
function generateLocationsList() {
    const locationsList = document.getElementById('locations-list');
    locationsList.innerHTML = '';
    
    // 创建按路线分类的地点列表
    const routes = [
        { id: 'g219', name: 'G219 喀纳斯-东兴', color: '#e74c3c', locations: G219Locations },
        { id: 'g331', name: 'G331 丹东-阿勒泰', color: '#3498db', locations: G331Locations },
        { id: 'g228', name: 'G228 丹东-东兴', color: '#27ae60', locations: G228Locations }
    ];
    
    routes.forEach(route => {
        const routeSection = document.createElement('div');
        routeSection.className = `route-section route-${route.id}`;
        routeSection.style.marginBottom = '1rem';
        
        // 路线标题
        const routeTitle = document.createElement('h4');
        routeTitle.textContent = route.name;
        routeTitle.style.color = route.color;
        routeTitle.style.marginBottom = '0.5rem';
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
            li.style.padding = '0.3rem 0.5rem';
            li.style.marginBottom = '0.2rem';
            li.style.borderRadius = '3px';
            li.style.backgroundColor = '#f9f9f9';
            li.style.transition = 'all 0.2s';
            
            // 添加悬停效果
            li.addEventListener('mouseenter', function() {
                this.style.backgroundColor = `${route.color}20`; // 添加透明度的颜色
                this.style.transform = 'translateX(3px)';
            });
            
            li.addEventListener('mouseleave', function() {
                this.style.backgroundColor = '#f9f9f9';
                this.style.transform = 'translateX(0)';
            });
            
            // 点击跳转到该地点并设置为模拟行程起点
            li.addEventListener('click', function() {
                map.setView([loc.lat, loc.lng], 10);
                
                // 移除其他活跃状态
                document.querySelectorAll('.location-item.active').forEach(item => {
                    item.classList.remove('active');
                });
                
                // 添加活跃状态
                this.classList.add('active');
                
                // 设置为模拟行程起点
                const startLocationSelect = document.getElementById('start-location');
                if (startLocationSelect) {
                    startLocationSelect.value = loc.name;
                    animationState.currentLocationId = loc.name;
                    resetAnimation();
                }
            });
            
            ul.appendChild(li);
        });
        
        routeSection.appendChild(ul);
        locationsList.appendChild(routeSection);
    });
}

// 绑定地图图层切换事件
function bindMapLayerControls() {
    // 标准地图控制
    document.getElementById('standard-map').addEventListener('change', function() {
        if (this.checked) {
            map.removeLayer(mapLayers.satellite);
            map.addLayer(mapLayers.standard);
        }
    });
    
    // 卫星地图控制
    document.getElementById('satellite-map').addEventListener('change', function() {
        if (this.checked) {
            map.removeLayer(mapLayers.standard);
            map.addLayer(mapLayers.satellite);
        }
    });
}

// 生成所有地点的合并列表
function generateAllLocationsList() {
    // 合并所有路线的地点
    animationState.allLocations = [
        ...G219Locations.map(loc => ({ ...loc, route: 'g219' })),
        ...G331Locations.map(loc => ({ ...loc, route: 'g331' })),
        ...G228Locations.map(loc => ({ ...loc, route: 'g228' }))
    ];
    
    // 按名称排序
    animationState.allLocations.sort((a, b) => a.name.localeCompare(b.name));
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
    
    // 速度控制事件
    if (speedSlider && speedValue) {
        speedSlider.addEventListener('input', function() {
            animationState.speed = parseInt(this.value);
            speedValue.textContent = this.value;
        });
    }
    
    // 开始按钮事件
    if (startBtn) {
        startBtn.addEventListener('click', startAnimation);
    }
    
    // 暂停按钮事件
    if (pauseBtn) {
        pauseBtn.addEventListener('click', pauseAnimation);
    }
    
    // 重置按钮事件
    if (resetBtn) {
        resetBtn.addEventListener('click', resetAnimation);
    }
}

// 根据起点和方向获取行程数据
function getCurrentRouteData() {
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
            
            if (currentLocation.name === '东兴') {
                    // 如果到达G228终点东兴，连接到G219东兴并继续G219路线
                    const g219Reversed = [...G219Locations].reverse(); // G219顺时针需要反转
                    return g219Reversed; // 直接返回G219路线，包含东兴
                } else {
                    // 先走完G228到东兴，再连接G219东兴继续
                    const g228Remaining = fullRouteData.slice(startIndex);
                    const g219Reversed = [...G219Locations].reverse(); // G219顺时针需要反转
                    return [...g228Remaining, ...g219Reversed.slice(1)]; // 跳过G219东兴重复点
                }
        } else if (startLocation.route === 'g219') {
            // G219顺时针：东兴 → 喀纳斯
            const currentLocation = fullRouteData[startIndex];
            
            if (currentLocation.name === '喀纳斯') {
                // 如果到达G219终点喀纳斯，连接到G331阿黑吐别克口岸并继续G331路线
                const g331Reversed = [...G331Locations].reverse(); // G331顺时针需要反转
                const heiheIndex = g331Reversed.findIndex(loc => loc.name === '阿黑吐别克口岸');
                if (heiheIndex !== -1) {
                    return g331Reversed.slice(heiheIndex - 1); // 包含喀纳斯和阿黑吐别克口岸之间的连接
                }
            } else {
                // 先走完G219到喀纳斯，再连接G331阿黑吐别克口岸继续
                const g219Remaining = fullRouteData.slice(startIndex);
                const g331Reversed = [...G331Locations].reverse(); // G331顺时针需要反转
                const heiheIndex = g331Reversed.findIndex(loc => loc.name === '阿黑吐别克口岸');
                if (heiheIndex !== -1) {
                    return [...g219Remaining, ...g331Reversed.slice(heiheIndex)]; // 从阿黑吐别克口岸开始继续G331路线
                }
            }
        } else if (startLocation.route === 'g331') {
            // G331顺时针：阿黑吐别克口岸 → 丹东
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
    if (animationState.currentDirection === 'clockwise') {
        // 顺时针默认处理：从起点到路线末尾，再从路线开头到起点前一点
        return [
            ...fullRouteData.slice(startIndex),
            ...fullRouteData.slice(0, startIndex)
        ];
    } else {
        // 逆时针：从起点到路线开头（反转），再加上路线末尾到起点后一个点（反转）
        const firstPart = fullRouteData.slice(0, startIndex + 1).reverse();
        const secondPart = fullRouteData.slice(startIndex + 1).reverse();
        return [...firstPart, ...secondPart];
    }
}

// 获取当前路线的颜色
function getCurrentRouteColor() {
    switch (animationState.currentRoute) {
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
    
    // 创建车辆图标
    const vehicleIcon = L.divIcon({
        className: 'vehicle-icon',
        html: '<i class="fas fa-car"></i>',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });
    
    // 创建车辆标记
    animationState.vehicleMarker = L.marker([startPoint.lat, startPoint.lng], {
        icon: vehicleIcon,
        title: '模拟车辆'
    }).addTo(map);
    
    // 添加车辆弹出信息
    animationState.vehicleMarker.bindPopup(`
        <div style="text-align: center;">
            <h4>🚗 模拟车辆</h4>
            <p>当前位置: ${startPoint.name}</p>
            <p>${startPoint.province}</p>
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
    
    // 创建轨迹线（初始为空）
    animationState.trailLine = L.polyline([], {
        color: getCurrentRouteColor(),
        weight: 6,
        opacity: 0.9,
        className: 'trail-line',
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: '5,5'
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
                <h4>🚗 模拟车辆</h4>
                <p>当前位置: ${currentPoint.name}</p>
                <p>${currentPoint.province}</p>
                <p>进度: ${animationState.currentIndex + 1}/${animationState.totalPoints}</p>
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
    const progressBar = document.getElementById('progress-fill');
    if (progressBar) {
        const progress = (animationState.currentIndex / (animationState.totalPoints - 1)) * 100;
        progressBar.style.width = `${progress}%`;
    }
}

// 更新状态文本
function updateStatusText() {
    const statusText = document.getElementById('animation-status');
    if (!statusText) return;
    
    const routeData = getCurrentRouteData();
    const currentPoint = routeData[animationState.currentIndex];
    
    if (animationState.isPaused) {
        statusText.textContent = `已暂停 - 当前位置: ${currentPoint.name}`;
    } else if (animationState.isRunning) {
        statusText.textContent = `行驶中 - ${currentPoint.name} (${animationState.currentIndex + 1}/${animationState.totalPoints})`;
    } else {
        statusText.textContent = '准备就绪';
    }
}

// 线性插值函数
function lerp(start, end, t) {
    return start + (end - start) * t;
}

// 语音播报函数
function speakLocation(location) {
    if ('speechSynthesis' in window) {
        // 创建语音实例
        const speech = new SpeechSynthesisUtterance();
        
        // 设置语音属性
        // 处理特殊行政区划名称
        const regionName = location.province === '新疆' ? `${location.province}维吾尔自治区` : 
                          location.province === '西藏' ? `${location.province}自治区` : 
                          location.province === '内蒙古' ? `${location.province}自治区` : 
                          location.province === '宁夏' ? `${location.province}回族自治区` : 
                          location.province === '广西' ? `${location.province}壮族自治区` : 
                          `${location.province}省`;
        
        speech.text = `现在经过${location.name}，位于${regionName}。`;
        speech.lang = 'zh-CN'; // 设置为中文
        speech.volume = 1; // 音量 (0 to 1)
        speech.rate = 0.9; // 语速 (0.1 to 10)
        speech.pitch = 1; // 音调 (0 to 2)
        
        // 播放语音
        window.speechSynthesis.speak(speech);
    }
}

// 动画循环
function animationLoop(timestamp) {
    if (!animationState.startTime) {
        animationState.startTime = timestamp - animationState.pausedTime;
    }
    
    const elapsed = timestamp - animationState.startTime;
    const routeData = getCurrentRouteData();
    
    // 根据速度计算应该到达的位置
    const duration = 300000 / animationState.speed; // 总动画时长（毫秒），速度越快时长越短（增加基础时长使速度更慢）
    const progress = Math.min(elapsed / duration, 1);
    
    // 计算精确的位置（包括两个点之间的插值）
    const totalPoints = routeData.length - 1;
    const exactIndex = progress * totalPoints;
    const currentIndex = Math.floor(exactIndex);
    const nextIndex = Math.min(currentIndex + 1, totalPoints);
    const t = exactIndex - currentIndex;
    
    // 更新当前索引（用于UI显示和进度跟踪）
    if (currentIndex !== animationState.currentIndex) {
        animationState.currentIndex = currentIndex;
        // 语音播报当前位置
        const currentPoint = routeData[currentIndex];
        speakLocation(currentPoint);
        // 更新地点信息显示
        updateLocationInfoDisplay(currentPoint.name);
    }
    
    // 计算当前位置（两个点之间的插值）
    const currentPoint = routeData[currentIndex];
    const nextPoint = routeData[nextIndex];
    
    const currentLat = lerp(currentPoint.lat, nextPoint.lat, t);
    const currentLng = lerp(currentPoint.lng, nextPoint.lng, t);
    
    // 更新车辆位置（使用插值坐标）
    updateVehiclePosition(currentLat, currentLng, currentPoint);
    
    // 检查动画是否结束
    if (progress < 1 && animationState.isRunning) {
        animationState.animationId = requestAnimationFrame(animationLoop);
    } else if (progress >= 1) {
        // 动画结束
        animationState.isRunning = false;
        updateUIState();
        const statusText = document.getElementById('animation-status');
        if (statusText) {
            statusText.textContent = '行程结束！';
        }
    }
}

// 开始动画
function startAnimation() {
    const routeData = getCurrentRouteData();
    if (routeData.length === 0) {
        alert('请先选择一个有效的起点！');
        return;
    }
    
    animationState.totalPoints = routeData.length;
    animationState.currentIndex = 0;
    
    // 初始化车辆和轨迹
    createVehicleMarker();
    createTrailLine();
    
    // 地图放大到合适比例（根据当前路线和车辆位置）
    const currentPoint = routeData[animationState.currentIndex];
    map.setView([currentPoint.lat, currentPoint.lng], 8, { 
        animate: true,
        duration: 1
    });
    
    animationState.isRunning = true;
    animationState.isPaused = false;
    animationState.animationId = requestAnimationFrame(animationLoop);
    
    updateUIState();
}

// 暂停动画
function pauseAnimation() {
    if (animationState.isRunning) {
        animationState.isRunning = false;
        animationState.isPaused = true;
        animationState.pausedTime += performance.now() - animationState.startTime;
        animationState.startTime = 0;
        
        if (animationState.animationId) {
            cancelAnimationFrame(animationState.animationId);
        }
        
        updateUIState();
    }
}

// 重置动画
function resetAnimation() {
    // 停止动画
    if (animationState.animationId) {
        cancelAnimationFrame(animationState.animationId);
    }
    
    // 重置状态
    animationState.isRunning = false;
    animationState.isPaused = false;
    animationState.currentIndex = 0;
    animationState.startTime = 0;
    animationState.pausedTime = 0;
    
    // 更新UI
    updateUIState();
    
    // 重置进度条
    const progressBar = document.getElementById('progress-fill');
    if (progressBar) {
        progressBar.style.width = '0%';
    }
    
    // 重置状态文本
    const statusText = document.getElementById('animation-status');
    if (statusText) {
        statusText.textContent = '准备就绪';
    }
    
    // 移除现有的车辆和轨迹
    if (animationState.vehicleMarker) {
        map.removeLayer(animationState.vehicleMarker);
        animationState.vehicleMarker = null;
    }
    
    if (animationState.trailLine) {
        map.removeLayer(animationState.trailLine);
        animationState.trailLine = null;
    }
    
    // 初始化车辆和轨迹（如果有选择起点）
    const routeData = getCurrentRouteData();
    if (routeData.length > 0) {
        createVehicleMarker();
        createTrailLine();
        const startPoint = routeData[0];
        updateVehiclePosition(startPoint.lat, startPoint.lng, startPoint);
    }
}

// 更新UI状态
function updateUIState() {
    const startBtn = document.getElementById('start-animation');
    const pauseBtn = document.getElementById('pause-animation');
    const resetBtn = document.getElementById('reset-animation');
    const routeSelect = document.getElementById('route-select');
    
    if (startBtn) {
        startBtn.disabled = animationState.isRunning && !animationState.isPaused;
    }
    
    if (pauseBtn) {
        pauseBtn.disabled = !animationState.isRunning;
    }
    
    if (resetBtn) {
        resetBtn.disabled = !animationState.vehicleMarker;
    }
    
    if (routeSelect) {
        routeSelect.disabled = animationState.isRunning && !animationState.isPaused;
    }
}

// 确保initMap函数全局可用
globalThis.initMap = initMap;