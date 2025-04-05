// 对账数据
let reconciliationData = JSON.parse(localStorage.getItem('reconciliationData')) || [];

// 初始化自动完成功能
function initAutocomplete() {
    const gameNameInput = document.getElementById('gameName');
    const channelNameInput = document.getElementById('channelName');
    
    // 游戏名称自动完成
    gameNameInput.addEventListener('input', function() {
        const value = this.value.toLowerCase();
        const games = channelGameLibrary
            .filter(game => game.name.toLowerCase().includes(value))
            .map(game => game.name);
        
        showAutocomplete(this, games);
    });
    
    // 渠道名称自动完成
    channelNameInput.addEventListener('input', function() {
        const value = this.value.toLowerCase();
        const gameName = document.getElementById('gameName').value;
        const channels = channelGameLibrary
            .filter(game => game.name === gameName && game.company.toLowerCase().includes(value))
            .map(game => game.company);
        
        showAutocomplete(this, channels);
    });
    
    // 点击游戏名称时自动填充渠道名称
    gameNameInput.addEventListener('change', function() {
        const gameName = this.value;
        const game = channelGameLibrary.find(g => g.name === gameName);
        if (game) {
            document.getElementById('channelName').value = game.company;
        }
    });
}

// 显示自动完成列表
function showAutocomplete(input, suggestions) {
    const list = document.createElement('ul');
    list.className = 'autocomplete-list';
    list.style.position = 'absolute';
    list.style.zIndex = '1000';
    list.style.backgroundColor = 'white';
    list.style.border = '1px solid #ddd';
    list.style.maxHeight = '200px';
    list.style.overflowY = 'auto';
    
    suggestions.forEach(suggestion => {
        const item = document.createElement('li');
        item.textContent = suggestion;
        item.style.padding = '5px 10px';
        item.style.cursor = 'pointer';
        item.addEventListener('click', function() {
            input.value = suggestion;
            list.remove();
        });
        list.appendChild(item);
    });
    
    // 移除现有的自动完成列表
    const existingList = document.querySelector('.autocomplete-list');
    if (existingList) {
        existingList.remove();
    }
    
    if (suggestions.length > 0) {
        input.parentNode.appendChild(list);
    }
    
    // 点击其他地方时关闭自动完成列表
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
    
    // 获取游戏的分成比例
    const channelGame = channelGameLibrary.find(game => 
        game.name === gameName && game.company === channelName
    );
    
    if (!channelGame) {
        alert('未找到对应的游戏和渠道信息！请先在游戏库中添加该游戏。');
        return;
    }
    
    const shareRatio = parseFloat(channelGame.shareRatio) / 100;
    const shareAmount = revenue * shareRatio;
    
    const newRecord = {
        month: month,
        gameName: gameName,
        channelName: channelName,
        revenue: revenue,
        shareRatio: channelGame.shareRatio,
        shareAmount: shareAmount,
        createdAt: new Date().toISOString()
    };
    
    reconciliationData.push(newRecord);
    saveReconciliationData();
    refreshReconciliationTable();
    updateStats();
    clearInputs();
}

// 清空输入框
function clearInputs() {
    document.getElementById('gameName').value = '';
    document.getElementById('channelName').value = '';
    document.getElementById('revenue').value = '';
    
    // 移除自动完成列表
    const existingList = document.querySelector('.autocomplete-list');
    if (existingList) {
        existingList.remove();
    }
}

// 删除对账记录
function deleteReconciliation(index) {
    if (confirm('确定要删除这条对账记录吗？')) {
        reconciliationData.splice(index, 1);
        saveReconciliationData();
        refreshReconciliationTable();
        updateStats();
    }
}

// 保存对账数据
function saveReconciliationData() {
    localStorage.setItem('reconciliationData', JSON.stringify(reconciliationData));
}

// 刷新对账表格
function refreshReconciliationTable(searchText = '') {
    const tbody = document.querySelector('#reconciliationTable tbody');
    tbody.innerHTML = '';
    
    const filteredData = searchText
        ? reconciliationData.filter(record => 
            record.gameName.toLowerCase().includes(searchText.toLowerCase()) ||
            record.channelName.toLowerCase().includes(searchText.toLowerCase()))
        : reconciliationData;
    
    filteredData.forEach((record, index) => {
        const tr = document.createElement('tr');
        tr.className = 'fade-in';
        tr.innerHTML = `
            <td>${formatMonth(record.month)}</td>
            <td>${record.gameName}</td>
            <td>${record.channelName}</td>
            <td>¥${record.revenue.toFixed(2)}</td>
            <td>${record.shareRatio}%</td>
            <td>¥${record.shareAmount.toFixed(2)}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="deleteReconciliation(${index})" class="delete-btn tooltip">
                        删除
                        <span class="tooltip-text">删除此记录</span>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 搜索对账记录
function searchReconciliation() {
    const searchText = document.getElementById('searchInput').value.trim();
    refreshReconciliationTable(searchText);
}

// 更新统计信息
function updateStats() {
    const currentMonth = document.getElementById('reconciliationMonth').value;
    const monthData = reconciliationData.filter(record => record.month === currentMonth);
    
    const totalRevenue = monthData.reduce((sum, record) => sum + record.revenue, 0);
    const totalShare = monthData.reduce((sum, record) => sum + record.shareAmount, 0);
    
    document.getElementById('totalAmount').textContent = `¥${totalRevenue.toFixed(2)}`;
    document.getElementById('totalShare').textContent = `¥${totalShare.toFixed(2)}`;
    document.getElementById('reconciliationMonth').textContent = formatMonth(currentMonth);
    
    // 更新汇总表格
    document.getElementById('totalRevenue').textContent = `¥${totalRevenue.toFixed(2)}`;
    document.getElementById('totalChannelShare').textContent = `¥${totalShare.toFixed(2)}`;
    document.getElementById('amountInWords').textContent = `大写：${numberToChinese(totalRevenue)}`;
}

// 更新月份
function updateMonth() {
    const month = document.getElementById('reconciliationMonth').value;
    refreshReconciliationTable();
    updateStats();
}

// 导出对账表
function exportReconciliation() {
    const wb = XLSX.utils.book_new();
    const currentMonth = document.getElementById('reconciliationMonth').value;
    const monthData = reconciliationData.filter(record => record.month === currentMonth);
    
    if (monthData.length === 0) {
        alert('当前月份没有对账数据！');
        return;
    }
    
    // 导出明细数据
    const detailData = [
        ['对账月份', '游戏名称', '渠道名称', '运营收入', '渠道分成比例', '渠道分成金额']
    ];
    monthData.forEach(record => {
        detailData.push([
            formatMonth(record.month),
            record.gameName,
            record.channelName,
            record.revenue,
            record.shareRatio + '%',
            record.shareAmount
        ]);
    });
    const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
    XLSX.utils.book_append_sheet(wb, wsDetail, '对账明细');
    
    // 导出汇总数据
    const totalRevenue = monthData.reduce((sum, record) => sum + record.revenue, 0);
    const totalShare = monthData.reduce((sum, record) => sum + record.shareAmount, 0);
    
    const summaryData = [
        ['项目', '金额'],
        ['运营收入总计', totalRevenue],
        ['渠道分成总计', totalShare]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, '对账汇总');
    
    // 设置列宽
    const colWidths = [15, 20, 20, 15, 15, 15];
    wsDetail['!cols'] = colWidths.map(width => ({ width }));
    wsSummary['!cols'] = [{ width: 20 }, { width: 15 }];
    
    // 生成文件名
    const fileName = `渠道对账_${formatMonth(currentMonth)}.xlsx`;
    
    // 保存文件
    XLSX.writeFile(wb, fileName);
}

// 导入CSV文件
function importCSV() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const text = new TextDecoder('gbk').decode(new Uint8Array(e.target.result));
                const lines = text.split(/\r?\n/);
                const records = [];
                
                // 跳过标题行，从第二行开始处理
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    
                    let columns = [];
                    let inQuotes = false;
                    let currentColumn = '';
                    
                    for (let j = 0; j < line.length; j++) {
                        const char = line[j];
                        if (char === '"') {
                            inQuotes = !inQuotes;
                        } else if (char === ',' && !inQuotes) {
                            columns.push(currentColumn.trim().replace(/^"|"$/g, ''));
                            currentColumn = '';
                        } else {
                            currentColumn += char;
                        }
                    }
                    columns.push(currentColumn.trim().replace(/^"|"$/g, ''));
                    
                    if (columns.length >= 4) {
                        const month = columns[0];
                        const gameName = columns[1];
                        const channelName = columns[2];
                        const revenue = parseFloat(columns[3]);
                        
                        if (month && gameName && channelName && !isNaN(revenue)) {
                            const channelGame = channelGameLibrary.find(game => 
                                game.name === gameName && game.company === channelName
                            );
                            
                            if (channelGame) {
                                const shareRatio = parseFloat(channelGame.shareRatio) / 100;
                                const shareAmount = revenue * shareRatio;
                                
                                records.push({
                                    month: month,
                                    gameName: gameName,
                                    channelName: channelName,
                                    revenue: revenue,
                                    shareRatio: channelGame.shareRatio,
                                    shareAmount: shareAmount,
                                    createdAt: new Date().toISOString()
                                });
                            }
                        }
                    }
                }
                
                if (records.length === 0) {
                    alert('未找到有效的对账数据，请检查CSV文件格式！');
                    return;
                }
                
                reconciliationData = records;
                saveReconciliationData();
                refreshReconciliationTable();
                updateStats();
                
                alert(`成功导入 ${records.length} 条对账记录！`);
            } catch (error) {
                console.error('导入出错：', error);
                alert('导入失败，请确保CSV文件格式正确且为GBK编码！');
            }
        };
        reader.readAsArrayBuffer(file);
    };
    
    input.click();
}

// 格式化月份
function formatMonth(month) {
    if (!month) return '-';
    const [year, monthNum] = month.split('-');
    return `${year}年${monthNum}月`;
}

// 数字转中文大写
function numberToChinese(num) {
    const chineseNum = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
    const chineseUnit = ['', '拾', '佰', '仟', '万', '拾', '佰', '仟', '亿'];
    
    let result = '';
    let str = Math.floor(num).toString();
    let decimal = Math.round((num - Math.floor(num)) * 100);
    
    // 处理整数部分
    for (let i = 0; i < str.length; i++) {
        const digit = parseInt(str[i]);
        const unit = chineseUnit[str.length - 1 - i];
        result += chineseNum[digit] + unit;
    }
    
    // 处理小数部分
    if (decimal > 0) {
        result += '点';
        const decimalStr = decimal.toString().padStart(2, '0');
        result += chineseNum[parseInt(decimalStr[0])] + '角';
        result += chineseNum[parseInt(decimalStr[1])] + '分';
    } else {
        result += '元整';
    }
    
    return result;
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById('reconciliationMonth').value = currentMonth;
    
    initAutocomplete();
    refreshReconciliationTable();
    updateStats();
}); 