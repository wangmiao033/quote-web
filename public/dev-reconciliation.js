// 存储对账数据
let reconciliationData = JSON.parse(localStorage.getItem('devReconciliationData')) || [];

// 历史记录管理
let historyRecords = JSON.parse(localStorage.getItem('devReconciliationHistory')) || [];

// 添加新行
function addRow() {
    const newRow = {
        id: Date.now(),
        selected: false,
        gameName: '',
        settlementMonth: '',
        rechargeAmount: 0,
        testAmount: 0,
        operatingIncome: 0,
        channelRate: 0,
        channelFee: 0,
        taxRate: 0,
        tax: 0,
        shareRate: 0,
        shareIncome: 0
    };
    reconciliationData.push(newRow);
    renderTable();
    saveData();
}

// 删除最后一行
function deleteLastRow() {
    if (reconciliationData.length > 0) {
        reconciliationData.pop();
        renderTable();
        saveData();
    }
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

// 更新汇总信息
function updateSummary() {
    const summary = reconciliationData.reduce((acc, row) => {
        acc.operatingIncome += row.operatingIncome;
        acc.channelFee += row.channelFee;
        acc.tax += row.tax;
        acc.shareIncome += row.shareIncome;
        return acc;
    }, {
        operatingIncome: 0,
        channelFee: 0,
        tax: 0,
        shareIncome: 0
    });
    
    document.getElementById('totalOperatingIncome').textContent = `¥${summary.operatingIncome.toFixed(2)}`;
    document.getElementById('totalChannelFee').textContent = `¥${summary.channelFee.toFixed(2)}`;
    document.getElementById('totalTax').textContent = `¥${summary.tax.toFixed(2)}`;
    document.getElementById('totalShareIncome').textContent = `¥${summary.shareIncome.toFixed(2)}`;
    document.getElementById('amountInWords').textContent = `分成收入总计（大写）：${numberToChineseAmount(summary.shareIncome)}`;
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

// 搜索记录
function searchRecords() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const monthFilter = document.getElementById('monthFilter').value;
    
    const filteredData = reconciliationData.filter(row => {
        const matchesSearch = row.gameName.toLowerCase().includes(searchTerm);
        const matchesMonth = !monthFilter || row.settlementMonth === monthFilter;
        return matchesSearch && matchesMonth;
    });
    
    renderFilteredTable(filteredData);
}

// 按月份筛选
function filterByMonth() {
    searchRecords();
}

// 渲染筛选后的表格
function renderFilteredTable(data) {
    const table = document.getElementById('reconciliationTable');
    table.innerHTML = '';
    
    data.forEach((row, index) => {
        const originalIndex = reconciliationData.findIndex(r => r.id === row.id);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <input type="checkbox" ${row.selected ? 'checked' : ''} onchange="toggleRowSelection(${originalIndex})">
            </td>
            <td><input type="text" value="${row.gameName}" onchange="updateRow(${originalIndex}, 'gameName', this.value)"></td>
            <td><input type="month" value="${row.settlementMonth}" onchange="updateRow(${originalIndex}, 'settlementMonth', this.value)"></td>
            <td><input type="number" value="${row.rechargeAmount}" onchange="updateRow(${originalIndex}, 'rechargeAmount', this.value)"></td>
            <td><input type="number" value="${row.testAmount}" onchange="updateRow(${originalIndex}, 'testAmount', this.value)"></td>
            <td>${row.operatingIncome.toFixed(2)}</td>
            <td><input type="number" value="${row.channelRate}" onchange="updateRow(${originalIndex}, 'channelRate', this.value)"></td>
            <td>${row.channelFee.toFixed(2)}</td>
            <td><input type="number" value="${row.taxRate}" onchange="updateRow(${originalIndex}, 'taxRate', this.value)"></td>
            <td>${row.tax.toFixed(2)}</td>
            <td><input type="number" value="${row.shareRate}" onchange="updateRow(${originalIndex}, 'shareRate', this.value)"></td>
            <td>${row.shareIncome.toFixed(2)}</td>
            <td>
                <button class="button danger" onclick="deleteRow(${originalIndex})">删除</button>
            </td>
        `;
        table.appendChild(tr);
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

// 导出CSV
function exportCSV() {
    const headers = [
        '游戏名称', '结算月份', '充值金额', '测试费&代金券', '可分配收入',
        '通道费率(%)', '通道费', '税率(%)', '税费', '分成比例(%)', '分成收入'
    ];
    
    const csvContent = [
        headers.join(','),
        ...reconciliationData.map(row => [
            row.gameName,
            row.settlementMonth,
            row.rechargeAmount,
            row.testAmount,
            row.operatingIncome,
            row.channelRate,
            row.channelFee,
            row.taxRate,
            row.tax,
            row.shareRate,
            row.shareIncome
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `研发对账_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 导出XLSX
function exportXLSX() {
    const headers = [
        '游戏名称', '结算月份', '充值金额', '测试费&代金券', '可分配收入',
        '通道费率(%)', '通道费', '税率(%)', '税费', '分成比例(%)', '分成收入'
    ];
    
    const data = reconciliationData.map(row => [
        row.gameName,
        row.settlementMonth,
        row.rechargeAmount,
        row.testAmount,
        row.operatingIncome,
        row.channelRate,
        row.channelFee,
        row.taxRate,
        row.tax,
        row.shareRate,
        row.shareIncome
    ]);
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    XLSX.utils.book_append_sheet(wb, ws, '研发对账');
    
    // 设置列宽
    const colWidths = headers.map(() => ({ wch: 15 }));
    ws['!cols'] = colWidths;
    
    // 导出文件
    XLSX.writeFile(wb, `研发对账_${new Date().toISOString().split('T')[0]}.xlsx`);
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