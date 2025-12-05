// 地点海拔信息数据库
const locationAltitudeData = {
    // G219国道海拔信息
    '喀纳斯': 1374,
    '吉木乃': 980,
    '和布克赛尔': 1280,
    '乌什县': 1450,
    '阿克苏': 1100,
    '库车': 900,
    '喀什': 1290,
    '叶城': 1760,
    '萨嘎县': 4500,
    '巴嘎镇': 4600,
    '定日县': 4500,
    '岗巴县': 4700,
    '康马县': 4300,
    '隆子县': 3800,
    '米林': 2950,
    '墨脱': 1200,
    '察隅': 2327,
    '丙中洛': 1750,
    '福贡': 1200,
    '泸水': 820,
    '腾冲': 1640,
    '龙陵县': 1700,
    '永德县': 1600,
    '镇康县': 1100,
    '沧源县': 1270,
    '西盟佤自治县': 1900,
    '孟连': 950,
    '澜沧': 1050,
    '景洪': 552,
    '勐海': 1176,
    '德天跨国瀑布': 200,
    '屏边': 1300,
    
    // G331国道海拔信息
    '漠河': 433,
    '呼玛县': 300,
    '黑河': 166,
    '逊克县': 200,
    '嘉荫县': 150,
    '萝北县': 80,
    '抚远': 40,
    '虎头镇': 50,
    '饶河县': 60,
    '虎林': 100,
    '密山': 150,
    '绥芬河': 500,
    '珲春': 30,
    '图们': 50,
    '龙井': 200,
    '和龙': 450,
    '白山': 500,
    '通化': 400,
    '桓仁县': 300,
    '宽甸县': 200,
    '丹东': 15,
    '淖毛湖': 1200,
    '塔城': 600,
    '裕民': 800,
    '阿拉山口': 450,
    '赛里木湖': 2071,
    '昭苏县': 1800,
    '温泉': 1200,
    '北塔山': 2000,
    
    // G228国道海拔信息
    '丹东': 15,
    '大连': 0,
    '营口': 3,
    '盘锦': 0,
    '锦州': 20,
    '葫芦岛': 10,
    '秦皇岛': 0,
    '唐山': 0,
    '天津': 5,
    '沧州': 0,
    '东营': 0,
    '潍坊': 0,
    '烟台': 0,
    '威海': 0,
    '乳山': 0,
    '青岛': 0,
    '日照': 0,
    '连云港': 0,
    '盐城': 0,
    '南通': 0,
    '上海': 0,
    '嘉兴': 0,
    '杭州': 0,
    '绍兴': 0,
    '宁波': 0,
    '台州': 0,
    '温州': 0,
    '福州': 0,
    '莆田': 0,
    '泉州': 0,
    '厦门': 0,
    '漳州': 0,
    '潮州': 0,
    '汕头': 0,
    '汕尾': 0,
    '惠州': 0,
    '深圳': 0,
    '东莞': 0,
    '广州': 0,
    '中山': 0,
    '珠海': 0,
    '江门': 0,
    '阳江': 0,
    '茂名': 0,
    '湛江': 0,
    '北海': 0,
    '钦州': 0,
    '防城港': 0,
    '东兴': 0
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
    
    // 确保style字段存在，如果没有则生成一个默认风格描述
    if (!location.style) {
        location.style = generateDefaultStyle(location);
    }
    
    // 添加海拔信息
    if (!location.altitude && locationAltitudeData[location.name]) {
        location.altitude = locationAltitudeData[location.name];
    }
    
    return location;
}

// 生成默认风格描述的函数
function generateDefaultStyle(location) {
    const { name, province } = location;
    
    // 根据省份和地区特征生成风格描述
    const styleTemplates = {
        '新疆': '西域风情 - 大漠孤烟与民族文化的完美融合，充满异域魅力的边陲之地',
        '西藏': '雪域圣境 - 高原风光与藏传佛教的神秘交融，神圣而庄严的宗教圣地',
        '云南': '彩云之南 - 多民族文化的和谐共生，热带雨林与高原风光的完美结合',
        '内蒙古': '草原牧歌 - 蒙古族游牧文化的传承地，辽阔草原与蓝天白云的壮美画卷',
        '黑龙江': '北国风光 - 冰雪世界与边境风情的独特体验，充满异域风情的极地小镇',
        '辽宁': '滨海明珠 - 港口城市与工业文明的交融，历史与现代的完美结合',
        '山东': '齐鲁大地 - 儒家文化的发源地，山海相拥的历史文化名城',
        '江苏': '江南水乡 - 小桥流水与园林艺术的精致典雅，经济发达的文化重镇',
        '浙江': '山水浙江 - 钱塘江潮与西湖美景的完美融合，民营经济的活力之都',
        '福建': '闽南风情 - 海洋文化与侨乡特色的交融，充满活力的东南沿海城市',
        '广东': '南粤风采 - 改革开放的前沿阵地，粤菜文化与现代商业的完美结合',
        '广西': '山水画廊 - 喀斯特地貌与inant文化文化的独特魅力，边陲风情的多彩画卷'
    };
    
    // 如果有匹配的省份模板，使用模板
    if (province && styleTemplates[province]) {
        return styleTemplates[province];
    }
    
    // 默认风格描述
    return `美丽${province || ''} - ${name}的独特魅力，自然风光与人文历史的完美结合`;
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
            attractions: [],
            altitude: 0
        };
    }
    
    const locationInfo = locationInfoDatabase.get(locationName) || {
        name: locationName,
        province: '',
        culture: '暂无详细信息',
        food: '暂无详细信息',
        attractions: []
    };
    
    // 确保海拔信息存在
    if (!locationInfo.altitude && locationAltitudeData[locationName]) {
        locationInfo.altitude = locationAltitudeData[locationName];
    }
    
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