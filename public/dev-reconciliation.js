// 存储对账数据
let reconciliationData = JSON.parse(localStorage.getItem('devReconciliationData')) || [];

// 历史记录管理
let historyRecords = JSON.parse(localStorage.getItem('devReconciliationHistory')) || [];

// 全局变量
let records = [];
let gameList = [];
let filteredRecords = [];

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    loadGameList();
    loadRecords();
    filterRecords();
    updateTable();
    updateSummary();
});

// 加载游戏列表
function loadGameList() {
    // 从localStorage加载游戏列表
    const savedGames = localStorage.getItem('gameList');
    if (savedGames) {
        gameList = JSON.parse(savedGames);
        updateGameList();
    }
}

// 更新游戏列表下拉框
function updateGameList() {
    const datalist = document.getElementById('gameList');
    datalist.innerHTML = '';
    gameList.forEach(game => {
        const option = document.createElement('option');
        option.value = game.name;
        datalist.appendChild(option);
    });
}

// 添加新行
function addRow() {
    const newRow = {
        gameName: '',
        settlementMonth: '',
        rechargeAmount: 0,
        testFee: 0,
        operatingIncome: 0,
        channelRate: 0,
        channelFee: 0,
        taxRate: 0,
        tax: 0,
        shareRatio: 0,
        shareIncome: 0,
        formula: ''
    };
    records.push(newRow);
    filterRecords();
    updateSummary();
    saveRecords();
}

// 删除最后一行
function deleteLastRow() {
    if (records.length > 0) {
        records.pop();
        filterRecords();
        updateSummary();
        saveRecords();
    }
}

// 筛选记录
function filterRecords() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const monthFilter = document.getElementById('monthFilter').value;

    filteredRecords = records.filter(record => {
        const matchesSearch = record.gameName.toLowerCase().includes(searchText);
        const matchesMonth = !monthFilter || record.settlementMonth === monthFilter;
        return matchesSearch && matchesMonth;
    });

    updateTable();
    updateSummary();
}

// 更新表格
function updateTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    filteredRecords.forEach((record, index) => {
        const originalIndex = records.indexOf(record);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" value="${record.gameName}" onchange="updateField(${originalIndex}, 'gameName', this.value)"></td>
            <td><input type="month" value="${record.settlementMonth}" onchange="updateField(${originalIndex}, 'settlementMonth', this.value)"></td>
            <td><input type="number" value="${record.rechargeAmount}" onchange="updateField(${originalIndex}, 'rechargeAmount', this.value)" step="0.01"></td>
            <td><input type="number" value="${record.testFee}" onchange="updateField(${originalIndex}, 'testFee', this.value)" step="0.01"></td>
            <td>${record.operatingIncome.toFixed(2)}</td>
            <td><input type="number" value="${record.channelRate}" onchange="updateField(${originalIndex}, 'channelRate', this.value)" step="0.01"></td>
            <td>${record.channelFee.toFixed(2)}</td>
            <td><input type="number" value="${record.taxRate}" onchange="updateField(${originalIndex}, 'taxRate', this.value)" step="0.01"></td>
            <td>${record.tax.toFixed(2)}</td>
            <td><input type="number" value="${record.shareRatio}" onchange="updateField(${originalIndex}, 'shareRatio', this.value)" step="0.01"></td>
            <td>${record.shareIncome.toFixed(2)}</td>
            <td>${record.formula}</td>
        `;
        tbody.appendChild(tr);
    });
}

// 更新字段值并重新计算
function updateField(index, field, value) {
    const record = records[index];
    record[field] = field === 'gameName' || field === 'settlementMonth' ? value : parseFloat(value) || 0;
    
    // 计算可分配运营收入
    record.operatingIncome = record.rechargeAmount - record.testFee;
    
    // 计算通道费
    record.channelFee = record.operatingIncome * (record.channelRate / 100);
    
    // 计算税费
    const taxableIncome = record.operatingIncome - record.channelFee;
    record.tax = taxableIncome * (record.taxRate / 100);
    
    // 计算分成收入
    record.shareIncome = taxableIncome * (record.shareRatio / 100);
    
    // 更新公式
    record.formula = `(充值金额${record.rechargeAmount} - 测试费${record.testFee}) * (1 - 通道费率${record.channelRate}%) * (1 - 税率${record.taxRate}%) * 分成比例${record.shareRatio}%`;
    
    filterRecords();
    updateSummary();
    saveRecords();
}

// 更新汇总信息
function updateSummary() {
    const totalIncome = filteredRecords.reduce((sum, record) => sum + record.operatingIncome, 0);
    const totalChannelFee = filteredRecords.reduce((sum, record) => sum + record.channelFee, 0);
    const totalTax = filteredRecords.reduce((sum, record) => sum + record.tax, 0);
    const totalShare = filteredRecords.reduce((sum, record) => sum + record.shareIncome, 0);

    document.getElementById('totalIncome').textContent = totalIncome.toFixed(2);
    document.getElementById('totalChannelFee').textContent = totalChannelFee.toFixed(2);
    document.getElementById('totalTax').textContent = totalTax.toFixed(2);
    document.getElementById('totalShare').textContent = totalShare.toFixed(2);
}

// 清空输入框
function clearInputs() {
    document.getElementById('gameName').value = '';
    document.getElementById('settlementMonth').value = '';
    document.getElementById('rechargeAmount').value = '';
    document.getElementById('testFee').value = '';
    document.getElementById('channelRate').value = '';
    document.getElementById('taxRate').value = '';
    document.getElementById('shareRatio').value = '';
}

// 搜索记录
function searchRecords() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const filteredRecords = records.filter(record => 
        record.gameName.toLowerCase().includes(searchText)
    );
    displayFilteredRecords(filteredRecords);
}

// 按月份筛选
function filterByMonth() {
    const month = document.getElementById('monthFilter').value;
    const filteredRecords = month ? 
        records.filter(record => record.settlementMonth.startsWith(month)) : 
        records;
    displayFilteredRecords(filteredRecords);
}

// 显示筛选后的记录
function displayFilteredRecords(filteredRecords) {
    const tbody = document.querySelector('#reconciliationTable tbody');
    tbody.innerHTML = '';

    filteredRecords.forEach(record => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${record.gameName}</td>
            <td>${record.settlementMonth}</td>
            <td>${record.rechargeAmount.toFixed(2)}</td>
            <td>${record.testFee.toFixed(2)}</td>
            <td>${record.operatingIncome.toFixed(2)}</td>
            <td>${record.channelRate.toFixed(2)}</td>
            <td>${record.channelFee.toFixed(2)}</td>
            <td>${record.taxRate.toFixed(2)}</td>
            <td>${record.tax.toFixed(2)}</td>
            <td>${record.shareRatio.toFixed(2)}</td>
            <td>${record.shareIncome.toFixed(2)}</td>
            <td>${record.formula}</td>
        `;
        tbody.appendChild(tr);
    });
}

// 导出为CSV
function exportCSV() {
    const headers = ['游戏名称', '结算月份', '充值金额', '测试费&代金券金额', '可分配运营收入', 
                    '通道费率 (%)', '通道费', '税率 (%)', '税费', '分成比例 (%)', '分成收入', '结果推导公式'];
    
    const csvContent = [
        headers.join(','),
        ...filteredRecords.map(record => [
            record.gameName,
            record.settlementMonth,
            record.rechargeAmount.toFixed(2),
            record.testFee.toFixed(2),
            record.operatingIncome.toFixed(2),
            record.channelRate.toFixed(2),
            record.channelFee.toFixed(2),
            record.taxRate.toFixed(2),
            record.tax.toFixed(2),
            record.shareRatio.toFixed(2),
            record.shareIncome.toFixed(2),
            record.formula
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `分成收入表_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// 导出为XLSX
function exportXLSX() {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(filteredRecords.map(record => ({
        '游戏名称': record.gameName,
        '结算月份': record.settlementMonth,
        '充值金额': record.rechargeAmount.toFixed(2),
        '测试费&代金券金额': record.testFee.toFixed(2),
        '可分配运营收入': record.operatingIncome.toFixed(2),
        '通道费率 (%)': record.channelRate.toFixed(2),
        '通道费': record.channelFee.toFixed(2),
        '税率 (%)': record.taxRate.toFixed(2),
        '税费': record.tax.toFixed(2),
        '分成比例 (%)': record.shareRatio.toFixed(2),
        '分成收入': record.shareIncome.toFixed(2),
        '结果推导公式': record.formula
    })));

    XLSX.utils.book_append_sheet(wb, ws, '分成收入表');
    XLSX.writeFile(wb, `分成收入表_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// 保存记录到localStorage
function saveRecords() {
    localStorage.setItem('reconciliationRecords', JSON.stringify(records));
}

// 从localStorage加载记录
function loadRecords() {
    const savedRecords = localStorage.getItem('reconciliationRecords');
    if (savedRecords) {
        records = JSON.parse(savedRecords);
    }
}

// 计算按钮点击事件
function calculate() {
    const rechargeAmount = parseFloat(document.getElementById('rechargeAmount').value) || 0;
    const testFee = parseFloat(document.getElementById('testFee').value) || 0;
    const channelRate = parseFloat(document.getElementById('channelRate').value) || 0;
    const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
    const shareRatio = parseFloat(document.getElementById('shareRatio').value) || 0;

    const operatingIncome = rechargeAmount - testFee;
    const channelFee = operatingIncome * (channelRate / 100);
    const taxableIncome = operatingIncome - channelFee;
    const tax = taxableIncome * (taxRate / 100);
    const shareIncome = taxableIncome * (shareRatio / 100);

    alert(`计算结果：
可分配运营收入：${operatingIncome.toFixed(2)}
通道费：${channelFee.toFixed(2)}
税费：${tax.toFixed(2)}
分成收入：${shareIncome.toFixed(2)}`);
}

// 保存数据到localStorage
function saveData() {
    localStorage.setItem('devReconciliationData', JSON.stringify(reconciliationData));
    updateStats();
}

// 计算单行数据
function calculateRow(row) {
    // 可分配运营收入 = 充值金额 - 测试费&代金券金额
    row.operatingIncome = parseFloat(row.rechargeAmount || 0) - parseFloat(row.testAmount || 0);
    
    // 通道费 = 可分配运营收入 * 通道费率
    row.channelFee = row.operatingIncome * (parseFloat(row.channelRate || 0) / 100);
    
    // 税费 = (可分配运营收入 - 通道费) * 税率
    row.tax = (row.operatingIncome - row.channelFee) * (parseFloat(row.taxRate || 0) / 100);
    
    // 分成收入 = (可分配运营收入 - 通道费 - 税费) * 分成比例
    row.shareIncome = (row.operatingIncome - row.channelFee - row.tax) * (parseFloat(row.shareRate || 0) / 100);
    
    return row;
}

// 更新行数据
function updateRow(index, field, value) {
    reconciliationData[index][field] = value;
    calculateRow(reconciliationData[index]);
    renderTable();
    saveData();
}

// 渲染表格
function renderTable() {
    const table = document.getElementById('reconciliationTable');
    table.innerHTML = '';
    
    reconciliationData.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <input type="checkbox" ${row.selected ? 'checked' : ''} onchange="toggleRowSelection(${index})">
            </td>
            <td><input type="text" value="${row.gameName}" onchange="updateRow(${index}, 'gameName', this.value)"></td>
            <td><input type="month" value="${row.settlementMonth}" onchange="updateRow(${index}, 'settlementMonth', this.value)"></td>
            <td><input type="number" value="${row.rechargeAmount}" onchange="updateRow(${index}, 'rechargeAmount', this.value)"></td>
            <td><input type="number" value="${row.testAmount}" onchange="updateRow(${index}, 'testAmount', this.value)"></td>
            <td>${row.operatingIncome.toFixed(2)}</td>
            <td><input type="number" value="${row.channelRate}" onchange="updateRow(${index}, 'channelRate', this.value)"></td>
            <td>${row.channelFee.toFixed(2)}</td>
            <td><input type="number" value="${row.taxRate}" onchange="updateRow(${index}, 'taxRate', this.value)"></td>
            <td>${row.tax.toFixed(2)}</td>
            <td><input type="number" value="${row.shareRate}" onchange="updateRow(${index}, 'shareRate', this.value)"></td>
            <td>${row.shareIncome.toFixed(2)}</td>
            <td>
                <button class="button danger" onclick="deleteRow(${index})">删除</button>
            </td>
        `;
        table.appendChild(tr);
    });
    
    updateSummary();
    updateMonthFilter();
}

// 删除指定行
function deleteRow(index) {
    if (confirm('确定要删除这条记录吗？')) {
        reconciliationData.splice(index, 1);
        renderTable();
        saveData();
    }
}

// 更新统计信息
function updateStats() {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const stats = reconciliationData.reduce((acc, row) => {
        acc.total += row.shareIncome;
        if (row.settlementMonth === currentMonth) {
            acc.monthly += row.shareIncome;
            acc.monthlyGames++;
        }
        return acc;
    }, { total: 0, monthly: 0, monthlyGames: 0 });

    document.getElementById('monthlyTotal').textContent = `¥${stats.monthly.toFixed(2)}`;
    document.getElementById('totalAmount').textContent = `¥${stats.total.toFixed(2)}`;
    document.getElementById('monthlyGames').textContent = stats.monthlyGames;
}

// 更新月份筛选器
function updateMonthFilter() {
    const monthFilter = document.getElementById('monthFilter');
    const months = new Set();
    reconciliationData.forEach(row => {
        if (row.settlementMonth) {
            months.add(row.settlementMonth);
        }
    });
    
    const currentOptions = Array.from(monthFilter.options).map(option => option.value);
    const newMonths = Array.from(months).filter(month => !currentOptions.includes(month));
    
    newMonths.forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = month;
        monthFilter.appendChild(option);
    });
}

// 切换行选择状态
function toggleRowSelection(index) {
    reconciliationData[index].selected = !reconciliationData[index].selected;
    saveData();
}

// 切换全选状态
function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll');
    reconciliationData.forEach(row => {
        row.selected = selectAll.checked;
    });
    renderTable();
    saveData();
}

// 删除选中的行
function deleteSelected() {
    const selectedCount = reconciliationData.filter(row => row.selected).length;
    if (selectedCount === 0) {
        alert('请先选择要删除的记录');
        return;
    }
    
    if (confirm(`确定要删除选中的 ${selectedCount} 条记录吗？`)) {
        reconciliationData = reconciliationData.filter(row => !row.selected);
        renderTable();
        saveData();
    }
}

// 导入CSV
function importCSV() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = function(event) {
            const csvData = event.target.result;
            const rows = csvData.split('\n');
            const headers = rows[0].split(',');
            
            for (let i = 1; i < rows.length; i++) {
                if (!rows[i].trim()) continue;
                
                const values = rows[i].split(',');
                const row = {
                    id: Date.now() + i,
                    selected: false,
                    gameName: values[0],
                    settlementMonth: values[1],
                    rechargeAmount: parseFloat(values[2]) || 0,
                    testAmount: parseFloat(values[3]) || 0,
                    channelRate: parseFloat(values[5]) || 0,
                    taxRate: parseFloat(values[7]) || 0,
                    shareRate: parseFloat(values[9]) || 0
                };
                
                calculateRow(row);
                reconciliationData.push(row);
            }
            
            renderTable();
            saveData();
        };
        reader.readAsText(file);
    };
    input.click();
}

// 数字转中文金额
function numberToChineseAmount(number) {
    const units = ['', '拾', '佰', '仟', '万', '拾', '佰', '仟', '亿'];
    const numbers = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
    
    let result = '';
    const integerPart = Math.floor(number);
    const decimalPart = Math.round((number - integerPart) * 100);
    
    if (integerPart === 0 && decimalPart === 0) {
        return '零元整';
    }
    
    // 处理整数部分
    const intStr = integerPart.toString();
    for (let i = 0; i < intStr.length; i++) {
        const digit = parseInt(intStr[i]);
        const unit = units[intStr.length - 1 - i];
        if (digit === 0) {
            if (result.charAt(result.length - 1) !== '零' && i !== intStr.length - 1) {
                result += '零';
            }
        } else {
            result += numbers[digit] + unit;
        }
    }
    result += '元';
    
    // 处理小数部分
    if (decimalPart > 0) {
        const jiao = Math.floor(decimalPart / 10);
        const fen = decimalPart % 10;
        if (jiao > 0) {
            result += numbers[jiao] + '角';
        }
        if (fen > 0) {
            result += numbers[fen] + '分';
        }
    } else {
        result += '整';
    }
    
    return result;
}

// 保存历史记录
function saveHistory() {
    const currentData = JSON.parse(JSON.stringify(reconciliationData));
    const historyEntry = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        data: currentData
    };
    
    historyRecords.unshift(historyEntry);
    // 只保留最近10条历史记录
    if (historyRecords.length > 10) {
        historyRecords = historyRecords.slice(0, 10);
    }
    
    localStorage.setItem('devReconciliationHistory', JSON.stringify(historyRecords));
    alert('历史记录已保存！');
}

// 显示历史记录
function showHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    historyRecords.forEach(record => {
        const li = document.createElement('li');
        li.className = 'history-item';
        li.innerHTML = `
            <span>${record.timestamp}</span>
            <div class="history-actions">
                <button class="button small" onclick="restoreHistory(${record.id})">恢复</button>
                <button class="button small danger" onclick="deleteHistory(${record.id})">删除</button>
            </div>
        `;
        historyList.appendChild(li);
    });
    
    document.getElementById('historyModal').style.display = 'block';
}

// 恢复历史记录
function restoreHistory(historyId) {
    const record = historyRecords.find(r => r.id === historyId);
    if (record) {
        if (confirm('确定要恢复此历史记录吗？当前数据将被覆盖。')) {
            reconciliationData = JSON.parse(JSON.stringify(record.data));
            renderTable();
            saveData();
            alert('历史记录已恢复！');
        }
    }
}

// 删除历史记录
function deleteHistory(historyId) {
    if (confirm('确定要删除此历史记录吗？')) {
        historyRecords = historyRecords.filter(r => r.id !== historyId);
        localStorage.setItem('devReconciliationHistory', JSON.stringify(historyRecords));
        showHistory();
    }
}

// 关闭历史记录弹窗
function closeHistoryModal() {
    document.getElementById('historyModal').style.display = 'none';
}

// 页面加载时渲染表格
document.addEventListener('DOMContentLoaded', () => {
    renderTable();
    updateStats();
}); 