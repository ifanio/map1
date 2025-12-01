// 中国边境线地图主程序

// 页面加载完成后初始化地图
document.addEventListener('DOMContentLoaded', function() {
    // 初始化地图
    initMap();
    
    // 添加页面加载完成的标识
    document.body.classList.add('loaded');
    
    console.log('中国边境线地图加载完成');
    
    // 悬浮控制面板功能
    const controlButton = document.getElementById('floating-control-button');
    const controlPanel = document.getElementById('floating-control-panel');
    const closeButton = document.getElementById('close-panel');

    // 切换控制面板显示状态
    function toggleControlPanel() {
        controlPanel.classList.toggle('active');
    }

    // 显示控制面板
    function showControlPanel() {
        controlPanel.classList.add('active');
    }

    // 隐藏控制面板
    function hideControlPanel() {
        controlPanel.classList.remove('active');
    }

    // 绑定事件监听器
    if (controlButton) {
        controlButton.addEventListener('click', toggleControlPanel);
    }

    if (closeButton) {
        closeButton.addEventListener('click', hideControlPanel);
    }
});

// 页面可见性变化处理
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // 页面重新可见时，确保地图正确渲染
        setTimeout(() => {
            if (typeof map !== 'undefined') {
                map.invalidateSize();
            }
        }, 100);
    }
});

// 窗口大小变化处理
window.addEventListener('resize', function() {
    // 窗口大小变化时，确保地图正确渲染
    if (typeof map !== 'undefined') {
        map.invalidateSize();
    }
});