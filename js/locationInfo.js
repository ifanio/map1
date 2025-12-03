// 地点海拔信息数据库
const locationAltitudeData = {
    // G219国道海拔信息
    '喀纳斯': 1374,
    '吉木乃': 980,
    '和布克赛尔': 1280,
    '乌什县': 1450,
    '阿克苏': 1100,
    '叶城': 1760,
    '萨嘎县': 4500,
    '定日县': 4500,
    '岗巴县': 4700,
    '康马县': 4300,
    '隆子县': 3800,
    '墨脱': 1200,
    '察隅': 2327,
    '丙中洛': 1750,

    '福贡': 1200,

    '泸水': 820,
    '腾冲': 1640,

    '永德县': 1600,
    '镇康县': 1100,
    '沧源县': 1270,
    '西盟佤族自治县': 1900,
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
    '北塔山牧场': 2000,
    
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

// 地点信息增强数据 - 补充data.js中未包含的详细信息
const enhancedLocationDetails = {
    '阿黑吐别克口岸': {
        culture: '阿黑吐别克口岸位于新疆阿勒泰地区，是中国与哈萨克斯坦的重要边境口岸，具有浓郁的哈萨克族文化特色。',
        food: '特色美食有哈萨克手抓肉、马肠子、酸奶疙瘩、奶豆腐、烤包子等，以肉类和奶制品为主。',
        attractions: ['阿黑吐别克口岸', '哈巴河白桦林', '白沙湖', '西北第一村白哈巴'],
        style: '边陲风情 - 哈萨克游牧文化与大漠戈壁的完美融合，充满异域风情的边境小镇'
    },
    '大连': {
        culture: '大连是海滨城市，开放包容，现代与传统交融。大连人热情豪爽，有着独特的闯关东文化和海洋文化。',
        food: '特色美食有大连鲍鱼、海参、螃蟹、烤鱼片、海胆、炒焖子、大连老菜等，以海鲜为主，口味鲜美。',
        attractions: ['星海广场', '金石滩', '老虎滩海洋公园', '圣亚海洋世界', '棒棰岛', '大连森林动物园'],
        style: '浪漫之都 - 欧式建筑与海滨风情的完美结合，充满活力的现代化港口城市'
    },
    '上海': {
        culture: '上海是国际大都市，海派文化兼容并蓄，中西合璧。上海人精致讲究，注重生活品质，有着独特的石库门文化。',
        food: '特色美食有小笼包、生煎包、南翔馒头、上海本帮菜（红烧肉、糖醋排骨、白斩鸡）、蟹粉豆腐等，口味鲜甜。',
        attractions: ['外滩', '东方明珠', '豫园', '南京路步行街', '迪士尼乐园', '田子坊', '上海博物馆'],
        style: '魔都魅力 - 现代摩天大楼与历史石库门的时空对话，国际化大都市的繁华与精致'
    },
    '深圳': {
        culture: '深圳是移民城市，包容开放，充满活力。深圳速度体现了中国改革开放的成就，多元文化交融。',
        food: '深圳汇聚了全国各地美食，特别是粤菜、客家菜、潮汕菜，以及各种国际美食。特色有烧腊、早茶、海鲜等。',
        attractions: ['世界之窗', '欢乐谷', '东部华侨城', '深圳湾公园', '莲花山公园', '中英街', '大鹏所城'],
        style: '创新之城 - 科技前沿与多元文化的碰撞，年轻活力的现代化移民城市'
    },
    '珠海': {
        culture: '珠海是海滨城市，环境优美，宜居宜游。粤语文化为主，同时与澳门文化交流密切，具有独特的侨乡文化。',
        food: '特色美食有横琴蚝、斗门重壳蟹、白蕉海鲈、深井烧鹅、广式早茶、海鲜等，口味清淡鲜美。',
        attractions: ['长隆海洋王国', '情侣路', '珠海渔女', '圆明新园', '东澳岛', '外伶仃岛', '港珠澳大桥'],
        style: '百岛之市 - 碧海蓝天与浪漫情调的完美结合，宜居宜游的海滨花园城市'
    },
    '北海': {
        culture: '北海是北部湾经济圈重要城市，疍家文化独特，疍家人是海上吉普赛人，以船为家。客家文化和粤语文化交融。',
        food: '特色美食有北海沙虫、沙蟹汁、疍家海鲜粥、烤生蚝、猪脚粉、越南卷粉等，以海鲜和米粉为主。',
        attractions: ['银滩', '涠洲岛', '北海老街', '侨港风情街', '冠头岭', '金海湾红树林'],
        style: '南珠故里 - 疍家渔歌与南洋风情的交融，银滩碧海的度假天堂'
    },
    // 为更多主要地点添加独特的风格描述
    '丹东': {
        style: '边境明珠 - 鸭绿江畔的百年口岸，中朝友谊的桥梁，历史与现代的交汇点'
    },
    '喀什': {
        style: '丝路重镇 - 千年古城与维吾尔文化的完美融合，东西方文明的十字路口'
    },
    '拉萨': {
        style: '圣城之光 - 藏传佛教的圣地，雪域高原的明珠，神秘而神圣的宗教文化中心'
    },
    '西双版纳': {
        style: '热带雨林 - 傣族风情与热带雨林的完美结合，充满异域风情的边境绿洲'
    },
    '满洲里': {
        style: '欧亚之窗 - 中俄蒙三国交界的边贸重镇，浓郁的俄罗斯风情与草原文化'
    },
    '漠河': {
        style: '北极之光 - 中国最北端的极地小镇，极光、白桦林与鄂伦春文化的完美融合'
    },
    '呼伦贝尔': {
        style: '草原天堂 - 世界四大草原之一，蒙古族游牧文化的发源地，壮美的草原风光'
    },
    '青岛': {
        style: '啤酒之都 - 红瓦绿树与碧海蓝天的完美结合，德式建筑与海洋文化的交融'
    },
    '厦门': {
        style: '海上花园 - 鼓浪屿的琴声与闽南文化的韵味，文艺浪漫的海滨城市'
    },
    '三亚': {
        style: '热带天堂 - 阳光沙滩与热带雨林的完美组合，中国最南端的度假胜地'
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
    const { name, province, culture, attractions } = location;
    
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
        '广西': '山水画廊 - 喀斯特地貌与壮族文化的独特魅力，边陲风情的多彩画卷'
    };
    
    // 如果有匹配的省份模板，使用模板
    if (province && styleTemplates[province]) {
        return styleTemplates[province];
    }
    
    // 否则根据文化特征生成描述
    const cultureKeywords = {
        '边境': '边境重镇 - 多民族文化的交汇点，充满异域风情的边陲之地',
        '口岸': '贸易枢纽 - 国际贸易与文化交流的重要节点，充满活力的边境城市',
        '海滨': '滨海明珠 - 碧海蓝天与海洋文化的完美结合，宜居宜游的海滨城市',
        '草原': '草原牧歌 - 辽阔草原与游牧文化的传承地，自然与人文的和谐共生',
        '高原': '高原圣境 - 壮美高原风光与独特民族文化的完美融合',
        '热带': '热带天堂 - 热带雨林与民族风情的独特魅力，充满异域风情的绿洲'
    };
    
    // 检查文化描述中的关键词
    for (const [keyword, template] of Object.entries(cultureKeywords)) {
        if (culture && culture.includes(keyword)) {
            return template;
        }
    }
    
    // 默认风格描述
    return `美丽${province || ''} - ${name}的独特魅力，自然风光与人文历史的完美结合`;
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
    
    // 更新风格描述
    const styleElement = document.getElementById('location-style');
    if (styleElement) {
        if (locationInfo.style && locationInfo.style !== '暂无详细信息') {
            styleElement.textContent = locationInfo.style;
            styleElement.style.display = 'inline-block';
        } else {
            styleElement.style.display = 'none';
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