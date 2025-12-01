// 中国边境线地图功能实现

// 地图对象
var map;

// 路线图层对象
var g219Layer, g331Layer, g228Layer;

// 标记点图层组
var markersLayerGroup;

// 地图图层对象
var mapLayers = {};

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
}

// 初始化路线
function initRoutes() {
    // G219国道路线 - 红色
    g219Layer = L.polyline(
        g219Locations.map(loc => [loc.lat, loc.lng]),
        { 
            color: '#e74c3c', 
            weight: 4, 
            opacity: 0.8, 
            name: 'G219'
        }
    ).addTo(map);
    
    // G331国道路线 - 蓝色
    g331Layer = L.polyline(
        g331Locations.map(loc => [loc.lat, loc.lng]),
        { 
            color: '#3498db', 
            weight: 4, 
            opacity: 0.8, 
            name: 'G331'
        }
    ).addTo(map);
    
    // G228国道路线 - 绿色
    g228Layer = L.polyline(
        g228Locations.map(loc => [loc.lat, loc.lng]),
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
        addMarkers(g219Locations, '#e74c3c');
    }
    
    // 添加G331国道标记点
    if (document.getElementById('g331').checked) {
        addMarkers(g331Locations, '#3498db');
    }
    
    // 添加G228国道标记点
    if (document.getElementById('g228').checked) {
        addMarkers(g228Locations, '#27ae60');
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
        { id: 'g219', name: 'G219 喀纳斯-东兴', color: '#e74c3c', locations: g219Locations },
        { id: 'g331', name: 'G331 丹东-阿勒泰', color: '#3498db', locations: g331Locations },
        { id: 'g228', name: 'G228 丹东-东兴', color: '#27ae60', locations: g228Locations }
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
            
            // 点击跳转到该地点
            li.addEventListener('click', function() {
                map.setView([loc.lat, loc.lng], 10);
                
                // 移除其他活跃状态
                document.querySelectorAll('.location-item.active').forEach(item => {
                    item.classList.remove('active');
                });
                
                // 添加活跃状态
                this.classList.add('active');
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

// 地图功能初始化函数 - 全局可用