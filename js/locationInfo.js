

// 地点信息数据库，用于快速查询
const locationInfoDatabase = new Map();

// 工具函数：规范化地点信息数据结构
function normalizeLocationInfo(location) {
    // 确保attractions字段始终是数组格式
    if (typeof location.attractions === 'string') {
        location.attractions = location.attractions.split('、').map(item => {
            // 移除可能的标点符号和空格
            return item.replace(/[，。！？]/g, '').trim();
        }).filter(Boolean);
    } else if (!Array.isArray(location.attractions)) {
        location.attractions = [];
    }
    
    // 确保food字段始终是数组格式
    if (typeof location.food === 'string') {
        location.food = location.food.split('、').map(item => {
            // 移除可能的标点符号和空格
            return item.replace(/[，。！？]/g, '').trim();
        }).filter(Boolean);
    } else if (!Array.isArray(location.food)) {
        location.food = [];
    }
    
    // 确保culture字段存在
    if (!location.culture) {
        location.culture = `这是${location.province || ''}省的一个美丽地点，有着丰富的历史文化和自然景观。`;
    }
    
    return location;
}

// 初始化地点信息数据库
function initLocationInfoDatabase() {
    // 首先获取所有路线的地点数据
    const allLocations = [...G219Locations, ...G331Locations, ...G228Locations];
    
    // 为每个地点规范化数据结构
    allLocations.forEach(location => {
        // 规范化数据结构
        const normalizedLocation = normalizeLocationInfo(location);
        
        // 将地点添加到数据库中以便快速查询
        locationInfoDatabase.set(location.name, normalizedLocation);
    });
    
    // 地点信息数据库初始化完成
}

// 获取地点信息的函数
function getLocationInfo(locationName) {
    if (!locationName) {
        return {
            name: '',
            province: '',
            culture: '暂无详细信息',
            food: [],
            attractions: [],
            altitude: 0
        };
    }
    
    const locationInfo = locationInfoDatabase.get(locationName) || {
        name: locationName,
        province: '',
        culture: '暂无详细信息',
        food: [],
        attractions: []
    };
    
    return locationInfo;
}

// 更新地点信息显示
function updateLocationInfoDisplay(locationName) {
    if (!locationName) {
        console.warn('更新地点信息显示失败：地点名称为空');
        return;
    }
    
    const locationInfo = getLocationInfo(locationName);
    
    // 更新地点信息显示区域
    const elements = {
        'location-name': locationInfo.name,
        'location-province': locationInfo.province,
        'location-culture': locationInfo.culture
    };
    
    // 更新基本信息
    Object.entries(elements).forEach(([id, content]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        } else {
            console.warn(`未找到ID为${id}的元素`);
        }
    });
    
    // 更新海拔信息
    const altitudeElement = document.getElementById('location-altitude');
    if (altitudeElement) {
        if (locationInfo.altitude && locationInfo.altitude > 0) {
            altitudeElement.textContent = `海拔 ${locationInfo.altitude} 米`;
            altitudeElement.style.display = 'block';
        } else {
            altitudeElement.style.display = 'none';
        }
    }
    
    // 更新特色美食列表（使用数组格式渲染）
    const foodElement = document.getElementById('location-food');
    if (foodElement) {
        if (Array.isArray(locationInfo.food) && locationInfo.food.length > 0) {
            foodElement.innerHTML = locationInfo.food
                .map(food => `<li class="attraction-item">${food}</li>`)
                .join('');
        } else {
            foodElement.textContent = '暂无详细信息';
        }
    }
    
    // 更新景点列表（使用数组格式便于渲染）
    const attractionsElement = document.getElementById('location-attractions');
    if (attractionsElement) {
        if (Array.isArray(locationInfo.attractions) && locationInfo.attractions.length > 0) {
            attractionsElement.innerHTML = locationInfo.attractions
                .map(attraction => `<li class="attraction-item">${attraction}</li>`)
                .join('');
        } else {
            attractionsElement.textContent = '暂无详细信息';
        }
    }
    
    // 显示地点信息面板（如果之前是隐藏的）
    const locationInfoPanel = document.getElementById('location-info');
    if (locationInfoPanel) {
        locationInfoPanel.classList.remove('hidden');
    }
}

// 页面加载时初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLocationInfoDatabase);
} else {
    initLocationInfoDatabase();
}