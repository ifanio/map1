// 地点信息增强数据 - 补充data.js中未包含的详细信息
const enhancedLocationDetails = {
    '阿黑吐别克口岸': {
        culture: '阿黑吐别克口岸位于新疆阿勒泰地区，是中国与哈萨克斯坦的重要边境口岸，具有浓郁的哈萨克族文化特色。',
        food: '特色美食有哈萨克手抓肉、马肠子、酸奶疙瘩、奶豆腐、烤包子等，以肉类和奶制品为主。',
        attractions: ['阿黑吐别克口岸', '哈巴河白桦林', '白沙湖', '西北第一村白哈巴']
    },
    '大连': {
        culture: '大连是海滨城市，开放包容，现代与传统交融。大连人热情豪爽，有着独特的闯关东文化和海洋文化。',
        food: '特色美食有大连鲍鱼、海参、螃蟹、烤鱼片、海胆、炒焖子、大连老菜等，以海鲜为主，口味鲜美。',
        attractions: ['星海广场', '金石滩', '老虎滩海洋公园', '圣亚海洋世界', '棒棰岛', '大连森林动物园']
    },
    '上海': {
        culture: '上海是国际大都市，海派文化兼容并蓄，中西合璧。上海人精致讲究，注重生活品质，有着独特的石库门文化。',
        food: '特色美食有小笼包、生煎包、南翔馒头、上海本帮菜（红烧肉、糖醋排骨、白斩鸡）、蟹粉豆腐等，口味鲜甜。',
        attractions: ['外滩', '东方明珠', '豫园', '南京路步行街', '迪士尼乐园', '田子坊', '上海博物馆']
    },
    '深圳': {
        culture: '深圳是移民城市，包容开放，充满活力。深圳速度体现了中国改革开放的成就，多元文化交融。',
        food: '深圳汇聚了全国各地美食，特别是粤菜、客家菜、潮汕菜，以及各种国际美食。特色有烧腊、早茶、海鲜等。',
        attractions: ['世界之窗', '欢乐谷', '东部华侨城', '深圳湾公园', '莲花山公园', '中英街', '大鹏所城']
    },
    '珠海': {
        culture: '珠海是海滨城市，环境优美，宜居宜游。粤语文化为主，同时与澳门文化交流密切，具有独特的侨乡文化。',
        food: '特色美食有横琴蚝、斗门重壳蟹、白蕉海鲈、深井烧鹅、广式早茶、海鲜等，口味清淡鲜美。',
        attractions: ['长隆海洋王国', '情侣路', '珠海渔女', '圆明新园', '东澳岛', '外伶仃岛', '港珠澳大桥']
    },
    '北海': {
        culture: '北海是北部湾经济圈重要城市，疍家文化独特，疍家人是海上吉普赛人，以船为家。客家文化和粤语文化交融。',
        food: '特色美食有北海沙虫、沙蟹汁、疍家海鲜粥、烤生蚝、猪脚粉、越南卷粉等，以海鲜和米粉为主。',
        attractions: ['银滩', '涠洲岛', '北海老街', '侨港风情街', '冠头岭', '金海湾红树林']
    }
};

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
    
    // 确保culture和food字段存在
    if (!location.culture) {
        location.culture = `这是${location.province || ''}省的一个美丽地点，有着丰富的历史文化和自然景观。`;
    }
    
    if (!location.food) {
        location.food = `${location.province || ''}省的特色美食，口味独特，值得品尝。`;
    }
    
    return location;
}

// 初始化地点信息数据库
function initLocationInfoDatabase() {
    // 首先获取所有路线的地点数据
    const allLocations = [...G219Locations, ...G331Locations, ...G228Locations];
    
    // 为每个地点添加详细信息并规范化数据结构
    allLocations.forEach(location => {
        // 如果有增强数据，则合并
        if (enhancedLocationDetails[location.name]) {
            Object.assign(location, enhancedLocationDetails[location.name]);
        }
        
        // 规范化数据结构
        const normalizedLocation = normalizeLocationInfo(location);
        
        // 将地点添加到数据库中以便快速查询
        locationInfoDatabase.set(location.name, normalizedLocation);
    });
    
    console.log('地点信息数据库初始化完成，共包含', locationInfoDatabase.size, '个地点');
}

// 获取地点信息的函数
function getLocationInfo(locationName) {
    if (!locationName) {
        return {
            name: '',
            province: '',
            culture: '暂无详细信息',
            food: '暂无详细信息',
            attractions: []
        };
    }
    
    return locationInfoDatabase.get(locationName) || {
        name: locationName,
        province: '',
        culture: '暂无详细信息',
        food: '暂无详细信息',
        attractions: []
    };
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
        'location-culture': locationInfo.culture,
        'location-food': locationInfo.food
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