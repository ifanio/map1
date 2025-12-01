// 中国边境线地图主程序

// 页面加载完成后初始化地图
document.addEventListener('DOMContentLoaded', function() {
    // 初始化地图 - 确保DOM加载完成后执行
    if (typeof initMap === 'function') {
        initMap();
    }
    
    // 添加页面加载完成的标识
    document.body.classList.add('loaded');
    
    console.log('中国边境线地图完成');
    
    // 地图控制面板功能
    const controlPanel = document.getElementById('floating-control-panel');
    const panelHeader = document.querySelector('.panel-header');
    const toggleControlButton = document.getElementById('toggle-control-panel');
    const panelContent = document.getElementById('panel-content');

    // 切换控制面板折叠状态
    function toggleControlPanel() {
        panelContent.classList.toggle('collapsed');
        // 更新切换按钮的图标
        if (panelContent.classList.contains('collapsed')) {
            toggleControlButton.textContent = '▶';
        } else {
            toggleControlButton.textContent = '▼';
        }
    }

    // 绑定事件监听器
    if (panelHeader) {
        panelHeader.addEventListener('click', toggleControlPanel);
    }

    if (toggleControlButton) {
        toggleControlButton.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止事件冒泡，避免触发头部的点击事件
            toggleControlPanel();
        });
    }
    
    // 独立模拟行程控制面板交互
    const animationHeader = document.querySelector('.animation-header');
    const toggleAnimationPanel = document.getElementById('toggle-animation-panel');
    const animationControlPanel = document.getElementById('animation-control-panel');

    function togglePanel() {
        if (animationControlPanel) {
            animationControlPanel.classList.toggle('collapsed');
            // 更新切换按钮的图标
            if (toggleAnimationPanel) {
                if (animationControlPanel.classList.contains('collapsed')) {
                    toggleAnimationPanel.textContent = '▶';
                } else {
                    toggleAnimationPanel.textContent = '▼';
                }
            }
        }
    }

    // 点击头部或切换按钮都可以切换面板
    if (animationHeader) {
        animationHeader.addEventListener('click', togglePanel);
    }
    if (toggleAnimationPanel) {
        toggleAnimationPanel.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止事件冒泡，避免触发头部的点击事件
            togglePanel();
        });
    }
});

// 页面可见性变化处理
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // 页面重新可见时，确保地图正确渲染
        setTimeout(() => {
            if (typeof map !== 'undefined' && map && typeof map.invalidateSize === 'function') {
                map.invalidateSize();
            }
        }, 100);
    }
});

// 窗口大小变化处理
window.addEventListener('resize', function() {
    // 窗口大小变化时，确保地图正确渲染
    if (typeof map !== 'undefined' && map && typeof map.invalidateSize === 'function') {
        map.invalidateSize();
    }
});