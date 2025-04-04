// 全局变量
let rowCount = 0;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    addRow(); // 添加第一行
    setupEventListeners();
});

// 设置事件监听器
function setupEventListeners() {
    // 监听输入变化，实时计算结果
    document.getElementById('incomeTable').addEventListener('input', (e) => {
        if (e.target.tagName === 'INPUT') {
            updateCalculations(e.target.closest('tr'));
            updateTotalSummary();
        }
    });
}

// 添加新行
function addRow() {
    rowCount++;
    const tbody = document.querySelector('#incomeTable tbody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="game-name" placeholder="游戏名称"></td>
        <td><input type="month" class="settlement-month"></td>
        <td><input type="number" class="recharge-amount" step="0.01" placeholder="0.00"></td>
        <td><input type="number" class="test-fee" step="0.01" placeholder="0.00"></td>
        <td><input type="number" class="operating-income" step="0.01" placeholder="0.00" readonly></td>
        <td><input type="number" class="channel-rate" step="0.01" placeholder="0.00"></td>
        <td><input type="number" class="channel-fee" step="0.01" placeholder="0.00" readonly></td>
        <td><input type="number" class="tax-rate" step="0.01" placeholder="0.00"></td>
        <td><input type="number" class="tax-fee" step="0.01" placeholder="0.00" readonly></td>
        <td><input type="number" class="share-rate" step="0.01" placeholder="0.00"></td>
        <td><input type="number" class="share-income" step="0.01" placeholder="0.00" readonly></td>
        <td class="formula"></td>
        <td><button onclick="deleteRow(this)">删除</button></td>
    `;
    tbody.appendChild(tr);
}

// 删除最后一行
function deleteLastRow() {
    const tbody = document.querySelector('#incomeTable tbody');
    if (tbody.children.length > 0) {
        tbody.removeChild(tbody.lastChild);
        rowCount--;
        updateTotalSummary();
    }
}

// 删除指定行
function deleteRow(button) {
    const row = button.closest('tr');
    row.remove();
    rowCount--;
    updateTotalSummary();
}

// 更新单行计算
function updateCalculations(row) {
    if (!row) return;

    // 获取输入值
    const rechargeAmount = parseFloat(row.querySelector('.recharge-amount').value) || 0;
    const testFee = parseFloat(row.querySelector('.test-fee').value) || 0;
    const channelRate = parseFloat(row.querySelector('.channel-rate').value) || 0;
    const taxRate = parseFloat(row.querySelector('.tax-rate').value) || 0;
    const shareRate = parseFloat(row.querySelector('.share-rate').value) || 0;

    // 计算可分配运营收入
    const operatingIncome = rechargeAmount - testFee;
    row.querySelector('.operating-income').value = operatingIncome.toFixed(2);

    // 计算通道费
    const channelFee = operatingIncome * (channelRate / 100);
    row.querySelector('.channel-fee').value = channelFee.toFixed(2);

    // 计算税费
    const taxFee = operatingIncome * (taxRate / 100);
    row.querySelector('.tax-fee').value = taxFee.toFixed(2);

    // 计算分成收入
    const shareIncome = operatingIncome * (shareRate / 100);
    row.querySelector('.share-income').value = shareIncome.toFixed(2);

    // 更新公式
    const formula = `${operatingIncome.toFixed(2)} × ${shareRate}% = ${shareIncome.toFixed(2)}`;
    row.querySelector('.formula').textContent = formula;
}

// 更新总计
function updateTotalSummary() {
    let totalOperatingIncome = 0;
    let totalChannelFee = 0;
    let totalTax = 0;
    let totalShareIncome = 0;

    document.querySelectorAll('#incomeTable tbody tr').forEach(row => {
        totalOperatingIncome += parseFloat(row.querySelector('.operating-income').value) || 0;
        totalChannelFee += parseFloat(row.querySelector('.channel-fee').value) || 0;
        totalTax += parseFloat(row.querySelector('.tax-fee').value) || 0;
        totalShareIncome += parseFloat(row.querySelector('.share-income').value) || 0;
    });

    document.getElementById('totalOperatingIncome').textContent = totalOperatingIncome.toFixed(2);
    document.getElementById('totalChannelFee').textContent = totalChannelFee.toFixed(2);
    document.getElementById('totalTax').textContent = totalTax.toFixed(2);
    document.getElementById('totalShareIncome').textContent = totalShareIncome.toFixed(2);
}

// 导出为CSV
async function exportToCSV() {
    const data = gatherTableData();
    try {
        const response = await fetch('/.netlify/functions/export-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error('导出失败');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '账单数据.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        alert('导出失败：' + error.message);
    }
}

// 导出为XLSX
function exportToXLSX() {
    const data = gatherTableData();
    // 这里可以添加XLSX导出逻辑
    alert('XLSX导出功能开发中');
}

// 收集表格数据
function gatherTableData() {
    const rows = document.querySelectorAll('#incomeTable tbody tr');
    return Array.from(rows).map(row => ({
        '游戏名称': row.querySelector('.game-name').value,
        '结算月份': row.querySelector('.settlement-month').value,
        '充值金额': row.querySelector('.recharge-amount').value,
        '测试费&代金券金额': row.querySelector('.test-fee').value,
        '可分配运营收入': row.querySelector('.operating-income').value,
        '通道费率': row.querySelector('.channel-rate').value,
        '通道费': row.querySelector('.channel-fee').value,
        '税率': row.querySelector('.tax-rate').value,
        '税费': row.querySelector('.tax-fee').value,
        '分成比例': row.querySelector('.share-rate').value,
        '分成收入': row.querySelector('.share-income').value
    }));
}

// 保存公司信息
function saveCompanyInfo() {
    const companyInfo = {
        name: document.getElementById('companyName').value,
        taxNumber: document.getElementById('taxNumber').value,
        contact: document.getElementById('contact').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        notes: document.getElementById('notes').value
    };
    
    // 这里可以添加保存到服务器的逻辑
    localStorage.setItem('companyInfo', JSON.stringify(companyInfo));
    alert('公司信息已保存');
    document.getElementById('companyModal').style.display = 'none';
}

// 模态框相关
document.querySelector('.close').onclick = function() {
    document.getElementById('companyModal').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('companyModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}
