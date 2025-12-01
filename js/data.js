// 中国边境线地图数据 - G219、G331、G228国道

// G219国道 (喀纳斯-东兴) 主要地点数据 - 按地理位置合理顺序排列
var g219Locations = [
    { name: "喀纳斯", lat: 48.8167, lng: 87.0758, province: "新疆" }, // 起点：最北端
    { name: "吉木乃", lat: 47.2311, lng: 85.8344, province: "新疆" },
    { name: "和布克赛尔", lat: 46.7811, lng: 85.1322, province: "新疆" },
    { name: "乌什县", lat: 41.2356, lng: 79.2428, province: "新疆" },
    { name: "阿克苏", lat: 41.1231, lng: 80.2644, province: "新疆" },
    { name: "叶城", lat: 37.8811, lng: 77.4767, province: "新疆" },
    { name: "萨嘎县", lat: 29.3667, lng: 85.3167, province: "西藏" },
    { name: "康马县", lat: 28.5833, lng: 89.6000, province: "西藏" },
    { name: "墨脱", lat: 29.2744, lng: 95.3383, province: "西藏" },
    { name: "察隅", lat: 28.6500, lng: 97.4833, province: "西藏" },
    { name: "丙中洛", lat: 28.5000, lng: 98.3833, province: "云南" },
    { name: "六库", lat: 25.9333, lng: 98.8333, province: "云南" },
    { name: "泸水", lat: 25.8000, lng: 98.8833, province: "云南" },
    { name: "腾冲", lat: 25.0167, lng: 98.4833, province: "云南" },
    { name: "临沧", lat: 23.8833, lng: 100.0833, province: "云南" },
    { name: "永德县", lat: 24.0333, lng: 99.2500, province: "云南" },
    { name: "镇康县", lat: 23.8333, lng: 99.0500, province: "云南" },
    { name: "沧源县", lat: 23.1833, lng: 99.2500, province: "云南" },
    { name: "西盟县", lat: 22.7833, lng: 99.4333, province: "云南" },
    { name: "孟连", lat: 22.3333, lng: 99.5500, province: "云南" },
    { name: "澜沧", lat: 22.5833, lng: 99.9833, province: "云南" },
    { name: "景洪", lat: 22.0000, lng: 100.8000, province: "云南" },
    { name: "勐腊", lat: 21.4833, lng: 101.5667, province: "云南" },
    { name: "李仙江", lat: 22.6333, lng: 102.5500, province: "云南" },
    { name: "绿春", lat: 23.0333, lng: 102.4500, province: "云南" },
    { name: "西畴", lat: 23.4500, lng: 104.6833, province: "云南" },
    { name: "富宁", lat: 23.6000, lng: 105.6000, province: "云南" },
    { name: "东兴", lat: 21.6333, lng: 107.9667, province: "广西" } // 终点
];

// G331国道 (丹东-阿勒泰) 主要地点数据 - 按地理位置合理顺序排列
var g331Locations = [
    { name: "丹东", lat: 40.1246, lng: 124.3900, province: "辽宁" }, // 起点：最东端
    { name: "珲春", lat: 42.8519, lng: 130.3200, province: "吉林" },
    { name: "绥芬河", lat: 44.4144, lng: 131.1717, province: "黑龙江" },
    { name: "抚远", lat: 48.2333, lng: 134.1833, province: "黑龙江" },
    { name: "黑河", lat: 50.2500, lng: 127.4333, province: "黑龙江" },
    { name: "漠河", lat: 53.0833, lng: 122.5000, province: "黑龙江" }, // 中国最北端
    { name: "额尔古纳", lat: 50.2200, lng: 119.7800, province: "内蒙古" },
    { name: "呼伦贝尔", lat: 49.2128, lng: 119.7661, province: "内蒙古" },
    { name: "满洲里", lat: 49.6089, lng: 117.4333, province: "内蒙古" },
    { name: "阿尔山", lat: 47.2833, lng: 119.8167, province: "内蒙古" },
    { name: "别力古台", lat: 44.7500, lng: 116.0000, province: "内蒙古" },
    { name: "满都拉图", lat: 43.9500, lng: 115.8000, province: "内蒙古" },
    { name: "二连浩特", lat: 43.6500, lng: 111.9700, province: "内蒙古" },
    { name: "乌拉特中旗", lat: 41.5500, lng: 108.5000, province: "内蒙古" },
    { name: "策克口岸", lat: 42.1000, lng: 101.1000, province: "内蒙古" },
    { name: "马鬃山镇", lat: 41.8500, lng: 97.5000, province: "甘肃" },
    { name: "淖毛湖", lat: 42.4333, lng: 95.0000, province: "新疆" },
    { name: "三塘湖", lat: 43.4500, lng: 94.8000, province: "新疆" },
    { name: "阿勒泰", lat: 47.8667, lng: 88.1167, province: "新疆" },
    { name: "阿黑吐别克口岸", lat: 48.3000, lng: 85.9000, province: "新疆" } // 终点
];

// G228国道 (丹东-东兴) 主要地点数据
var g228Locations = [
    { name: "丹东", lat: 40.1246, lng: 124.3900, province: "辽宁" },
    { name: "庄河", lat: 39.7000, lng: 122.9833, province: "辽宁" },
    { name: "大连", lat: 38.9140, lng: 121.6147, province: "辽宁" },
    { name: "营口", lat: 40.6678, lng: 122.2063, province: "辽宁" },
    { name: "盘锦", lat: 41.1192, lng: 122.0758, province: "辽宁" },
    { name: "锦州", lat: 41.1117, lng: 121.1400, province: "辽宁" },
    { name: "葫芦岛", lat: 40.7500, lng: 120.8333, province: "辽宁" },
    { name: "秦皇岛", lat: 39.9450, lng: 119.5833, province: "河北" },
    { name: "唐山", lat: 39.6375, lng: 118.1750, province: "河北" },
    { name: "天津", lat: 39.3434, lng: 117.3616, province: "天津" },
    { name: "黄骅", lat: 38.4000, lng: 117.3333, province: "河北" },
    { name: "滨州", lat: 37.3667, lng: 117.9833, province: "山东" },
    { name: "东营", lat: 37.4688, lng: 118.6686, province: "山东" },
    { name: "潍坊", lat: 36.7015, lng: 119.1070, province: "山东" },
    { name: "青岛", lat: 36.0671, lng: 120.3826, province: "山东" },
    { name: "日照", lat: 35.4281, lng: 119.4544, province: "山东" },
    { name: "连云港", lat: 34.5997, lng: 119.1790, province: "江苏" },
    { name: "南通", lat: 32.0167, lng: 121.0000, province: "江苏" },
    { name: "上海", lat: 31.2317, lng: 121.4727, province: "上海" },
    { name: "宁波", lat: 29.8683, lng: 121.5440, province: "浙江" },
    { name: "台州", lat: 28.6687, lng: 121.4264, province: "浙江" },
    { name: "温州", lat: 28.0167, lng: 120.6167, province: "浙江" },
    { name: "福州", lat: 26.0745, lng: 119.2965, province: "福建" },
    { name: "泉州", lat: 24.9086, lng: 118.5894, province: "福建" },
    { name: "厦门", lat: 24.4798, lng: 118.0894, province: "福建" },
    { name: "汕头", lat: 23.3500, lng: 116.6000, province: "广东" },
    { name: "深圳", lat: 22.5431, lng: 114.0579, province: "广东" },
    { name: "珠海", lat: 22.2769, lng: 113.5674, province: "广东" },
    { name: "湛江", lat: 21.1783, lng: 110.3677, province: "广东" },
    { name: "北海", lat: 21.4817, lng: 109.1217, province: "广西" },
    { name: "钦州", lat: 21.9789, lng: 108.6214, province: "广西" },
    { name: "防城港", lat: 21.6700, lng: 108.3600, province: "广西" },
    { name: "东兴", lat: 21.6333, lng: 107.9667, province: "广西" }
];

