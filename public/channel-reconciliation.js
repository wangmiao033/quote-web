// 对账数据
let reconciliationData = JSON.parse(localStorage.getItem('reconciliationData')) || [];
let historyData = JSON.parse(localStorage.getItem('channelReconciliationHistory')) || [];

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 设置默认月份为当前月份
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById('reconciliationMonth').value = currentMonth;
    
    initAutocomplete();
    refreshReconciliationTable();
    updateStats();
    initChart();
});

// 初始化图表
function initChart() {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    const currentMonth = document.getElementById('reconciliationMonth').value;
    const monthData = reconciliationData.filter(record => record.month === currentMonth);
    
    // 按渠道汇总数据
    const channelData = {};
    monthData.forEach(record => {
        if (!channelData[record.channelName]) {
            channelData[record.channelName] = {
                revenue: 0,
                share: 0,
                actualShare: 0
            };
        }
        channelData[record.channelName].revenue += record.revenue;
        channelData[record.channelName].share += record.shareAmount;
        channelData[record.channelName].actualShare += record.actualShareAmount;
    });
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(channelData),
            datasets: [{
                label: '运营收入',
                data: Object.values(channelData).map(d => d.revenue),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }, {
                label: '分成金额',
                data: Object.values(channelData).map(d => d.share),
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }, {
                label: '实际分成',
                data: Object.values(channelData).map(d => d.actualShare),
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// 计算税费和实际分成
function calculateShare(revenue, shareRatio, taxRate) {
    const shareAmount = revenue * (shareRatio / 100);
    const taxAmount = shareAmount * (taxRate / 100);
    const actualShareAmount = shareAmount - taxAmount;
    
    return {
        shareAmount: shareAmount,
        taxAmount: taxAmount,
        actualShareAmount: actualShareAmount
    };
}

// 初始化自动完成功能
function initAutocomplete() {
    const gameNameInput = document.getElementById('gameName');
    const channelNameInput = document.getElementById('channelName');
    
    // 从历史记录中获取建议
    const getHistorySuggestions = (field) => {
        const suggestions = new Set();
        reconciliationData.forEach(record => {
            suggestions.add(record[field]);
        });
        return Array.from(suggestions);
    };
    
    // 游戏名称自动完成
    gameNameInput.addEventListener('input', function() {
        const value = this.value.toLowerCase();
        const suggestions = getHistorySuggestions('gameName')
            .filter(name => name.toLowerCase().includes(value));
        showAutocomplete(this, suggestions);
    });
    
    // 渠道名称自动完成
    channelNameInput.addEventListener('input', function() {
        const value = this.value.toLowerCase();
        const suggestions = getHistorySuggestions('channelName')
            .filter(name => name.toLowerCase().includes(value));
        showAutocomplete(this, suggestions);
    });
}

// 显示自动完成列表
function showAutocomplete(input, suggestions) {
    const list = document.createElement('ul');
    list.className = 'autocomplete-list';
    
    suggestions.forEach(suggestion => {
        const item = document.createElement('li');
        item.textContent = suggestion;
        item.addEventListener('click', function() {
            input.value = suggestion;
            list.remove();
        });
        list.appendChild(item);
    });
    
    // 移除现有的自动完成列表
    const existingList = input.parentNode.querySelector('.autocomplete-list');
    if (existingList) {
        existingList.remove();
    }
    
    if (suggestions.length > 0) {
        input.parentNode.appendChild(list);
    }
    
    // 点击其他地方时关闭列表
    document.addEventListener('click', function closeList(e) {
        if (!input.contains(e.target) && !list.contains(e.target)) {
            list.remove();
            document.removeEventListener('click', closeList);
        }
    });
}

// 添加对账记录
function addReconciliation() {
    const month = document.getElementById('reconciliationMonth').value;
    const gameName = document.getElementById('gameName').value.trim();
    const channelName = document.getElementById('channelName').value.trim();
    const revenue = parseFloat(document.getElementById('revenue').value);
    const shareRatio = parseFloat(document.getElementById('shareRatio').value);
    const taxRate = parseFloat(document.getElementById('taxRate').value);
    const remark = document.getElementById('remark').value.trim();
    
    // 数据验证
    if (!month) {
        alert('请选择对账月份！');
        return;
    }
    if (!gameName) {
        alert('请输入游戏名称！');
        return;
    }
    if (!channelName) {
        alert('请输入渠道名称！');
        return;
    }
    if (isNaN(revenue) || revenue <= 0) {
        alert('请输入有效的运营收入！');
        return;
    }
    if (isNaN(shareRatio) || shareRatio <= 0 || shareRatio > 100) {
        alert('请输入有效的分成比例！');
        return;
    }
    if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
        alert('请输入有效的税率！');
        return;
    }
    
    const { shareAmount, taxAmount, actualShareAmount } = calculateShare(revenue, shareRatio, taxRate);
    
    const newRecord = {
        id: Date.now().toString(),
        month: month,
        gameName: gameName,
        channelName: channelName,
        revenue: revenue,
        shareRatio: shareRatio,
        shareAmount: shareAmount,
        taxRate: taxRate,
        taxAmount: taxAmount,
        actualShareAmount: actualShareAmount,
        remark: remark,
        createdAt: new Date().toISOString()
    };
    
    reconciliationData.push(newRecord);
    saveReconciliationData();
    refreshReconciliationTable();
    updateStats();
    clearInputs();
    initChart();
}

// 保存历史记录
function saveHistory() {
    const currentData = [...reconciliationData];
    const timestamp = new Date().toISOString();
    historyData.push({
        timestamp: timestamp,
        data: currentData
    });
    localStorage.setItem('channelReconciliationHistory', JSON.stringify(historyData));
}

// 显示历史记录
function showHistoryModal() {
    const modal = document.getElementById('historyModal');
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    historyData.slice().reverse().forEach((history, index) => {
        const date = new Date(history.timestamp);
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-header">
                <span class="history-date">${date.toLocaleString()}</span>
                <div class="history-actions">
                    <button onclick="restoreHistory(${historyData.length - 1 - index})">恢复</button>
                    <button onclick="deleteHistory(${historyData.length - 1 - index})">删除</button>
                </div>
            </div>
            <div class="history-summary">
                记录数：${history.data.length}
                总收入：¥${history.data.reduce((sum, record) => sum + record.revenue, 0).toFixed(2)}
            </div>
        `;
        historyList.appendChild(historyItem);
    });
    
    modal.style.display = 'block';
}

// 关闭历史记录模态框
function closeHistoryModal() {
    document.getElementById('historyModal').style.display = 'none';
}

// 恢复历史记录
function restoreHistory(index) {
    if (confirm('确定要恢复这个历史记录吗？当前数据将被覆盖。')) {
        reconciliationData = [...historyData[index].data];
        saveReconciliationData();
        refreshReconciliationTable();
        updateStats();
        initChart();
        closeHistoryModal();
    }
}

// 删除历史记录
function deleteHistory(index) {
    if (confirm('确定要删除这个历史记录吗？')) {
        historyData.splice(index, 1);
        localStorage.setItem('channelReconciliationHistory', JSON.stringify(historyData));
        showHistoryModal(); // 刷新历史记录列表
    }
}

// 导出对账表
function exportReconciliation() {
    const currentMonth = document.getElementById('reconciliationMonth').value;
    const monthData = reconciliationData.filter(record => record.month === currentMonth);
    
    if (monthData.length === 0) {
        alert('当前月份没有对账数据！');
        return;
    }
    
    const wb = XLSX.utils.book_new();
    
    // 创建明细表
    const detailData = [
        ['月份', '游戏名称', '渠道名称', '运营收入(¥)', '分成比例(%)', '分成金额(¥)', 
         '税率(%)', '税费(¥)', '实际分成(¥)', '备注']
    ];
    
    monthData.forEach(record => {
        detailData.push([
            formatMonth(record.month),
            record.gameName,
            record.channelName,
            record.revenue,
            record.shareRatio,
            record.shareAmount,
            record.taxRate,
            record.taxAmount,
            record.actualShareAmount,
            record.remark || ''
        ]);
    });
    
    // 添加合计行
    const totals = monthData.reduce((acc, record) => {
        acc.revenue += record.revenue;
        acc.share += record.shareAmount;
        acc.tax += record.taxAmount;
        acc.actualShare += record.actualShareAmount;
        return acc;
    }, { revenue: 0, share: 0, tax: 0, actualShare: 0 });
    
    detailData.push([
        '合计', '', '', 
        totals.revenue,
        '-',
        totals.share,
        '-',
        totals.tax,
        totals.actualShare,
        ''
    ]);
    
    // 创建汇总表
    const summaryData = [
        ['汇总信息'],
        ['月份', formatMonth(currentMonth)],
        ['总运营收入', totals.revenue],
        ['总分成金额', totals.share],
        ['总税费', totals.tax],
        ['实际分成总额', totals.actualShare],
        ['游戏数量', new Set(monthData.map(record => record.gameName)).size],
        ['渠道数量', new Set(monthData.map(record => record.channelName)).size]
    ];
    
    const detailSheet = XLSX.utils.aoa_to_sheet(detailData);
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // 设置列宽
    const wscols = [
        {wch: 12}, // 月份
        {wch: 20}, // 游戏名称
        {wch: 20}, // 渠道名称
        {wch: 15}, // 运营收入
        {wch: 12}, // 分成比例
        {wch: 15}, // 分成金额
        {wch: 10}, // 税率
        {wch: 15}, // 税费
        {wch: 15}, // 实际分成
        {wch: 30}  // 备注
    ];
    detailSheet['!cols'] = wscols;
    
    XLSX.utils.book_append_sheet(wb, detailSheet, '对账明细');
    XLSX.utils.book_append_sheet(wb, summarySheet, '汇总信息');
    
    XLSX.writeFile(wb, `渠道对账表_${currentMonth}.xlsx`);
}

// 导入CSV
function importCSV(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const rows = text.split('\n');
        const headers = rows[0].split(',');
        
        // 验证CSV格式
        const requiredHeaders = ['月份', '游戏名称', '渠道名称', '运营收入', '分成比例', '税率'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
            alert(`CSV文件缺少必要的列：${missingHeaders.join(', ')}`);
            return;
        }
        
        // 解析数据
        const newRecords = [];
        for (let i = 1; i < rows.length; i++) {
            if (!rows[i].trim()) continue;
            
            const columns = rows[i].split(',');
            const revenue = parseFloat(columns[headers.indexOf('运营收入')]);
            const shareRatio = parseFloat(columns[headers.indexOf('分成比例')]);
            const taxRate = parseFloat(columns[headers.indexOf('税率')]);
            
            if (isNaN(revenue) || isNaN(shareRatio) || isNaN(taxRate)) continue;
            
            const { shareAmount, taxAmount, actualShareAmount } = calculateShare(revenue, shareRatio, taxRate);
            
            const record = {
                id: Date.now().toString() + i,
                month: columns[headers.indexOf('月份')].replace(/"/g, ''),
                gameName: columns[headers.indexOf('游戏名称')].replace(/"/g, ''),
                channelName: columns[headers.indexOf('渠道名称')].replace(/"/g, ''),
                revenue: revenue,
                shareRatio: shareRatio,
                shareAmount: shareAmount,
                taxRate: taxRate,
                taxAmount: taxAmount,
                actualShareAmount: actualShareAmount,
                remark: headers.includes('备注') ? columns[headers.indexOf('备注')].replace(/"/g, '') : '',
                createdAt: new Date().toISOString()
            };
            
            newRecords.push(record);
        }
        
        // 添加新记录
        reconciliationData = [...reconciliationData, ...newRecords];
        saveReconciliationData();
        refreshReconciliationTable();
        updateStats();
        initChart();
        
        alert(`成功导入 ${newRecords.length} 条记录`);
        event.target.value = ''; // 清空文件输入
    };
    
    reader.readAsText(file);
}

// 排序记录
function sortRecords() {
    const sortField = document.getElementById('sortField').value;
    const currentMonth = document.getElementById('reconciliationMonth').value;
    let monthData = reconciliationData.filter(record => record.month === currentMonth);
    
    switch (sortField) {
        case 'date':
            monthData.sort((a, b) => a.month.localeCompare(b.month));
            break;
        case 'revenue':
            monthData.sort((a, b) => b.revenue - a.revenue);
            break;
        case 'game':
            monthData.sort((a, b) => a.gameName.localeCompare(b.gameName));
            break;
        case 'channel':
            monthData.sort((a, b) => a.channelName.localeCompare(b.channelName));
            break;
    }
    
    refreshReconciliationTable();
}

// 更新统计信息
function updateStats() {
    const currentMonth = document.getElementById('reconciliationMonth').value;
    const monthData = reconciliationData.filter(record => record.month === currentMonth);
    
    const totalRevenue = monthData.reduce((sum, record) => sum + record.revenue, 0);
    const totalShare = monthData.reduce((sum, record) => sum + record.shareAmount, 0);
    const totalTax = monthData.reduce((sum, record) => sum + record.taxAmount, 0);
    const totalActualShare = monthData.reduce((sum, record) => sum + record.actualShareAmount, 0);
    const totalGames = new Set(monthData.map(record => record.gameName)).size;
    
    // 更新头部统计卡片
    document.getElementById('totalRevenue').textContent = `¥${totalRevenue.toFixed(2)}`;
    document.getElementById('totalChannelShare').textContent = `¥${totalShare.toFixed(2)}`;
    document.getElementById('totalActualShare').textContent = `¥${totalActualShare.toFixed(2)}`;
    document.getElementById('totalGames').textContent = totalGames;
    
    // 更新表格底部合计行
    document.getElementById('totalRevenueRow').textContent = `¥${totalRevenue.toFixed(2)}`;
    document.getElementById('totalShareRow').textContent = `¥${totalShare.toFixed(2)}`;
    document.getElementById('totalTaxRow').textContent = `¥${totalTax.toFixed(2)}`;
    document.getElementById('totalActualShareRow').textContent = `¥${totalActualShare.toFixed(2)}`;
}

// 刷新表格
function refreshReconciliationTable(searchText = '') {
    const tbody = document.getElementById('reconciliationList');
    const currentMonth = document.getElementById('reconciliationMonth').value;
    tbody.innerHTML = '';
    
    let filteredData = reconciliationData.filter(record => record.month === currentMonth);
    
    if (searchText) {
        const search = searchText.toLowerCase();
        filteredData = filteredData.filter(record =>
            record.gameName.toLowerCase().includes(search) ||
            record.channelName.toLowerCase().includes(search)
        );
    }
    
    filteredData.forEach((record, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatMonth(record.month)}</td>
            <td>${record.gameName}</td>
            <td>${record.channelName}</td>
            <td>¥${record.revenue.toFixed(2)}</td>
            <td>${record.shareRatio}%</td>
            <td>¥${record.shareAmount.toFixed(2)}</td>
            <td>${record.taxRate}%</td>
            <td>¥${record.taxAmount.toFixed(2)}</td>
            <td>¥${record.actualShareAmount.toFixed(2)}</td>
            <td>${record.remark || '-'}</td>
            <td>
                <button onclick="deleteReconciliation(${index})" class="delete-btn">删除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    updateStats();
}

// 删除对账记录
function deleteReconciliation(index) {
    if (confirm('确定要删除这条对账记录吗？')) {
        // 保存当前状态到历史记录
        saveHistory();
        
        reconciliationData.splice(index, 1);
        saveReconciliationData();
        refreshReconciliationTable();
        updateStats();
        initChart();
    }
}

// 清空输入
function clearInputs() {
    document.getElementById('gameName').value = '';
    document.getElementById('channelName').value = '';
    document.getElementById('revenue').value = '';
    document.getElementById('shareRatio').value = '';
    document.getElementById('taxRate').value = '';
    document.getElementById('remark').value = '';
}

// 保存对账数据
function saveReconciliationData() {
    localStorage.setItem('reconciliationData', JSON.stringify(reconciliationData));
}

// 格式化月份显示
function formatMonth(month) {
    return month.replace('-', '年') + '月';
}

// 搜索对账记录
function searchReconciliation() {
    const searchText = document.getElementById('searchInput').value.trim();
    refreshReconciliationTable(searchText);
}

// 排序功能
function sortReconciliation(sortBy) {
    const currentMonth = document.getElementById('reconciliationMonth').value;
    let filteredData = reconciliationData.filter(record => record.month === currentMonth);
    
    switch(sortBy) {
        case 'date':
            filteredData.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
        case 'revenue':
            filteredData.sort((a, b) => b.revenue - a.revenue);
            break;
        case 'game':
            filteredData.sort((a, b) => a.gameName.localeCompare(b.gameName));
            break;
        case 'channel':
            filteredData.sort((a, b) => a.channelName.localeCompare(b.channelName));
            break;
    }
    
    const tbody = document.getElementById('reconciliationList');
    tbody.innerHTML = '';
    
    filteredData.forEach((record, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatMonth(record.month)}</td>
            <td>${record.gameName}</td>
            <td>${record.channelName}</td>
            <td>¥${record.revenue.toFixed(2)}</td>
            <td>${record.shareRatio}%</td>
            <td>¥${record.shareAmount.toFixed(2)}</td>
            <td>${record.taxRate}%</td>
            <td>¥${record.taxAmount.toFixed(2)}</td>
            <td>¥${record.actualShareAmount.toFixed(2)}</td>
            <td>${record.remark || '-'}</td>
            <td>
                <button onclick="deleteReconciliation(${index})" class="delete-btn">删除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    updateStats();
} 