// 定义当前用户
const currentUser = {
    id: 'user1',
    name: '张三',
    role: 'admin'
};

// 获取表格元素
const dataTable = document.getElementById('dataTable');
const tbody = dataTable ? dataTable.querySelector('tbody') : null;

// 获取汇总数据元素
const totalIncome = document.getElementById('totalIncome');
const totalChannelFee = document.getElementById('totalChannelFee');
const totalTax = document.getElementById('totalTax');
const totalShare = document.getElementById('totalShare');

// 获取账单信息元素
const billName = document.getElementById('billName');
const billDate = document.getElementById('billDate');
const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');
const billAddress = document.getElementById('billAddress');
const billNotes = document.getElementById('billNotes');

// 获取模态框元素
const historyModal = document.getElementById('historyModal');
const historyList = document.getElementById('historyList');

// 表格相关变量
let currentPage = 1;
const pageSize = 10;
let sortColumn = '';
let sortDirection = 'asc';
let searchText = '';

// 表格搜索功能
document.getElementById('tableSearch').addEventListener('input', function(e) {
    searchText = e.target.value.toLowerCase();
    filterAndSortTable();
});

function clearSearch() {
    document.getElementById('tableSearch').value = '';
    searchText = '';
    filterAndSortTable();
}

// 表格排序功能
document.querySelectorAll('.sortable').forEach(header => {
    header.addEventListener('click', function() {
        const column = this.dataset.sort;
        if (sortColumn === column) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortColumn = column;
            sortDirection = 'asc';
        }
        
        // 更新排序图标
        document.querySelectorAll('.sortable').forEach(h => {
            h.classList.remove('asc', 'desc');
        });
        this.classList.add(sortDirection);
        
        filterAndSortTable();
    });
});

// 表格分页功能
function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        updateTable();
    }
}

function nextPage() {
    const totalPages = Math.ceil(getFilteredRows().length / pageSize);
    if (currentPage < totalPages) {
        currentPage++;
        updateTable();
    }
}

// 获取过滤后的行
function getFilteredRows() {
    const rows = Array.from(tbody.rows);
    return rows.filter(row => {
        const cells = row.cells;
        const gameName = cells[0].querySelector('input').value.toLowerCase();
        const month = cells[1].querySelector('input').value.toLowerCase();
        return gameName.includes(searchText) || month.includes(searchText);
    });
}

// 排序和过滤表格
function filterAndSortTable() {
    const rows = getFilteredRows();
    
    // 排序
    if (sortColumn) {
        rows.sort((a, b) => {
            const aValue = a.cells[getColumnIndex(sortColumn)].querySelector('input').value;
            const bValue = b.cells[getColumnIndex(sortColumn)].querySelector('input').value;
            
            if (sortColumn === 'gameName' || sortColumn === 'month') {
                return sortDirection === 'asc' ? 
                    aValue.localeCompare(bValue) : 
                    bValue.localeCompare(aValue);
            } else {
                const aNum = parseFloat(aValue) || 0;
                const bNum = parseFloat(bValue) || 0;
                return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
            }
        });
    }
    
    // 更新表格
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
    
    // 更新分页
    currentPage = 1;
    updateTable();
}

// 获取列索引
function getColumnIndex(column) {
    const headers = Array.from(document.querySelectorAll('th'));
    return headers.findIndex(h => h.dataset.sort === column);
}

// 更新表格显示
function updateTable() {
    const rows = getFilteredRows();
    const totalPages = Math.ceil(rows.length / pageSize);
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    
    // 清空表格
    tbody.innerHTML = '';
    
    // 添加当前页的行
    rows.slice(start, end).forEach(row => tbody.appendChild(row));
    
    // 更新分页信息
    document.getElementById('pageInfo').textContent = `第 ${currentPage} 页，共 ${totalPages} 页`;
    document.getElementById('tableInfo').textContent = `共 ${rows.length} 条数据`;
    
    // 更新按钮状态
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
    
    // 更新行高亮
    updateRowHighlighting();
}

// 更新行高亮
function updateRowHighlighting() {
    const rows = tbody.rows;
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        row.classList.remove('highlight-row', 'error-row');
        
        // 检查数据有效性
        const inputs = row.getElementsByTagName('input');
        const hasError = Array.from(inputs).some(input => {
            if (input.type === 'number') {
                const value = parseFloat(input.value);
                return isNaN(value) || value < 0;
            }
        return false;
        });
        
        if (hasError) {
            row.classList.add('error-row');
        } else if (i % 2 === 0) {
            row.classList.add('highlight-row');
        }
    }
}

// 格式化数字
function formatNumber(num) {
    return parseFloat(num).toFixed(2);
}

// 游戏库数据
let gameLibrary = JSON.parse(localStorage.getItem('gameLibrary')) || [];

function showGameLibrary() {
    const modal = document.getElementById('gameLibraryModal');
    if (modal) {
        modal.style.display = 'block';
        refreshGameLibraryTable();
    }
}

function closeGameLibrary() {
    const modal = document.getElementById('gameLibraryModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function addNewGame() {
    const gameName = document.getElementById('newGameName').value.trim();
    const gameCode = document.getElementById('newGameCode').value.trim();
    
    if (!gameName || !gameCode) {
        alert('请输入游戏名称和游戏代码！');
        return;
    }

    if (gameLibrary.some(game => game.name === gameName || game.code === gameCode)) {
        alert('该游戏已存在！');
        return;
    }
    
    gameLibrary.push({ name: gameName, code: gameCode });
    saveGameLibrary();
    refreshGameLibraryTable();
    document.getElementById('newGameName').value = '';
    document.getElementById('newGameCode').value = '';
}

function deleteGame(index) {
    if (confirm('确定要删除这个游戏吗？')) {
        gameLibrary.splice(index, 1);
        saveGameLibrary();
        refreshGameLibraryTable();
    }
}

function saveGameLibrary() {
    localStorage.setItem('gameLibrary', JSON.stringify(gameLibrary));
}

function refreshGameLibraryTable() {
    const tbody = document.querySelector('#gameLibraryTable tbody');
    tbody.innerHTML = '';
    
    gameLibrary.forEach((game, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${game.name}</td>
            <td>${game.code}</td>
            <td>
                <button onclick="deleteGame(${index})" class="delete-btn">删除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 添加新行
function addRow() {
    const tbody = document.querySelector('#dataTable tbody');
    if (!tbody) return;

    const tr = document.createElement('tr');
    
    // 创建游戏选择下拉框
    const gameSelectHtml = `
        <select class="game-select" onchange="calculateRow(this.parentNode.parentNode)">
            <option value="">请选择游戏</option>
            ${gameLibrary.map(game => `<option value="${game.code}">${game.name}</option>`).join('')}
        </select>
    `;
    
    tr.innerHTML = `
        <td>${gameSelectHtml}</td>
        <td><input type="number" step="0.01" class="recharge-amount" value="0" onchange="calculateRow(this.parentNode.parentNode)"></td>
        <td><input type="number" step="0.01" class="refund-amount" value="0" onchange="calculateRow(this.parentNode.parentNode)"></td>
        <td><input type="number" step="0.01" class="test-fee" value="0" onchange="calculateRow(this.parentNode.parentNode)"></td>
        <td><input type="number" step="0.01" class="coupon-amount" value="0" onchange="calculateRow(this.parentNode.parentNode)"></td>
        <td><input type="number" step="0.01" class="channel-fee" value="0" onchange="calculateRow(this.parentNode.parentNode)"></td>
        <td><input type="number" step="0.01" class="tax-rate" value="0" onchange="calculateRow(this.parentNode.parentNode)"></td>
        <td><input type="number" step="0.01" class="share-base" value="0" readonly></td>
        <td><input type="number" step="0.01" class="share-ratio" value="0" onchange="calculateRow(this.parentNode.parentNode)"></td>
        <td><input type="number" step="0.01" class="settlement-amount" value="0" readonly></td>
        <td><input type="text" class="remarks" placeholder="备注"></td>
        <td><button onclick="deleteRow(this)" class="delete-btn">删除</button></td>
    `;
    
    tbody.appendChild(tr);
    calculateRow(tr);
    updateSummary();
}

// 删除行
function deleteRow(button) {
    const row = button.parentNode.parentNode;
    if (row && row.parentNode) {
        row.parentNode.removeChild(row);
        updateSummary();
    }
}

// 删除最后一行
function deleteLastRow() {
    const tbody = document.querySelector('#dataTable tbody');
    if (tbody && tbody.lastElementChild) {
        tbody.removeChild(tbody.lastElementChild);
        updateSummary();
    }
}

// 计算行
function calculateRow(row) {
    if (!row) return;

    // 获取输入值
    const rechargeAmount = parseFloat(row.querySelector('.recharge-amount').value) || 0;
    const refundAmount = parseFloat(row.querySelector('.refund-amount').value) || 0;
    const testFee = parseFloat(row.querySelector('.test-fee').value) || 0;
    const couponAmount = parseFloat(row.querySelector('.coupon-amount').value) || 0;
    const channelFee = parseFloat(row.querySelector('.channel-fee').value) || 0;
    const taxRate = parseFloat(row.querySelector('.tax-rate').value) || 0;
    const shareRatio = parseFloat(row.querySelector('.share-ratio').value) || 0;

    // 计算参与分成金额
    const shareBase = rechargeAmount - refundAmount - testFee - couponAmount - channelFee;
    const shareBaseInput = row.querySelector('.share-base');
    if (shareBaseInput) shareBaseInput.value = formatNumber(shareBase);

    // 计算结算金额
    const settlementAmount = shareBase * (1 - taxRate / 100) * (shareRatio / 100);
    const settlementInput = row.querySelector('.settlement-amount');
    if (settlementInput) settlementInput.value = formatNumber(settlementAmount);

    // 更新汇总
    updateSummary();
}

// 更新汇总
function updateSummary() {
    const rows = document.querySelectorAll('#dataTable tbody tr');
    let totalRecharge = 0;
    let totalSettlement = 0;

    rows.forEach(row => {
        totalRecharge += parseFloat(row.querySelector('.recharge-amount').value) || 0;
        totalSettlement += parseFloat(row.querySelector('.settlement-amount').value) || 0;
    });

    const totalRechargeElement = document.getElementById('totalRecharge');
    const totalSettlementElement = document.getElementById('totalSettlement');
    const totalSettlementCNElement = document.getElementById('totalSettlementCN');

    if (totalRechargeElement) totalRechargeElement.textContent = formatNumber(totalRecharge);
    if (totalSettlementElement) totalSettlementElement.textContent = formatNumber(totalSettlement);
    if (totalSettlementCNElement) totalSettlementCNElement.textContent = convertToChineseAmount(totalSettlement);
}

// 数字转中文金额
function convertToChineseAmount(number) {
    const chnNumChar = ["零","壹","贰","叁","肆","伍","陆","柒","捌","玖"];
    const chnUnitSection = ["","万","亿","万亿"];
    const chnUnitChar = ["","拾","佰","仟"];

    function sectionToChinese(section) {
        let strIns = '', chnStr = '';
        let unitPos = 0;
        let zero = true;
        while(section > 0) {
            let v = section % 10;
            if(v === 0) {
                if(!zero) {
                    zero = true;
                    chnStr = chnNumChar[v] + chnStr;
                }
            } else {
                zero = false;
                strIns = chnNumChar[v];
                strIns += chnUnitChar[unitPos];
                chnStr = strIns + chnStr;
            }
            unitPos++;
            section = Math.floor(section / 10);
        }
        return chnStr;
    }

    let num = parseFloat(number);
    if (isNaN(num)) return "零元整";
    
    num = Math.abs(num);
    let integerPart = Math.floor(num);
    let decimalPart = Math.round((num - integerPart) * 100);
    
    let chineseStr = '';
    if (integerPart > 0) {
        let zeroCount = 0;
        let unitPos = 0;
        let strIns = '';
        while(integerPart > 0) {
            let section = integerPart % 10000;
            if(section !== 0) {
                let sectionChinese = sectionToChinese(section);
                strIns = sectionChinese + (section !== 0 ? chnUnitSection[unitPos] : chnUnitSection[0]) + strIns;
            }
            unitPos++;
            integerPart = Math.floor(integerPart / 10000);
        }
        chineseStr = strIns + "元";
    }

    if (decimalPart > 0) {
        const jiao = Math.floor(decimalPart / 10);
        const fen = decimalPart % 10;
        if (jiao > 0) chineseStr += chnNumChar[jiao] + "角";
        if (fen > 0) chineseStr += chnNumChar[fen] + "分";
    } else {
        chineseStr += "整";
    }

    return chineseStr;
}

// 导出为XLSX
function exportToXLSX() {
    const rows = document.querySelectorAll('#dataTable tbody tr');
    const data = [];
    
    // 添加表头
    data.push([
        '游戏名称',
        '充值金额',
        '异常退款',
        '测试费',
        '代金券',
        '通道费',
        '代扣税率',
        '参与分成金额',
        '分成比例',
        '结算金额',
        '备注'
    ]);
    
    // 添加数据行
    rows.forEach(row => {
        const gameSelect = row.querySelector('.game-select');
        const gameName = gameSelect ? gameSelect.options[gameSelect.selectedIndex].text : '';
        
        data.push([
            gameName,
            parseFloat(row.querySelector('.recharge-amount').value) || 0,
            parseFloat(row.querySelector('.refund-amount').value) || 0,
            parseFloat(row.querySelector('.test-fee').value) || 0,
            parseFloat(row.querySelector('.coupon-amount').value) || 0,
            parseFloat(row.querySelector('.channel-fee').value) || 0,
            parseFloat(row.querySelector('.tax-rate').value) || 0,
            parseFloat(row.querySelector('.share-base').value) || 0,
            parseFloat(row.querySelector('.share-ratio').value) || 0,
            parseFloat(row.querySelector('.settlement-amount').value) || 0,
            row.querySelector('.remarks').value || ''
        ]);
    });
    
    // 添加汇总行
    const totalRecharge = document.getElementById('totalRecharge').textContent;
    const totalSettlement = document.getElementById('totalSettlement').textContent;
    const totalSettlementCN = document.getElementById('totalSettlementCN').textContent;
    
    data.push([]);  // 空行
    data.push(['汇总信息']);
    data.push(['充值金额总计', totalRecharge]);
    data.push(['结算金额总计', totalSettlement]);
    data.push(['结算金额大写', totalSettlementCN]);
    
    // 创建工作簿
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '分成收入表');
    
    // 生成文件名
    const date = new Date();
    const fileName = `分成收入表_${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}.xlsx`;
    
    // 保存文件
    XLSX.writeFile(wb, fileName);
}

// 保存账单备注
function saveBillNotes() {
    const notes = document.getElementById('billNotes').value;
    localStorage.setItem('billNotes', notes);
    alert('账单备注已保存！');
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', () => {
    // 添加第一行
    addRow();

    // 设置今天的日期
    const today = new Date().toISOString().split('T')[0];
    const billDate = document.getElementById('billDate');
    if (billDate) billDate.value = today;

    // 设置默认的结算周期（当月）
    const firstDay = new Date(today.substring(0, 7) + '-01').toISOString().split('T')[0];
    const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    if (startDate) startDate.value = firstDay;
    if (endDate) endDate.value = lastDay;

    // 加载保存的账单备注
    const savedNotes = localStorage.getItem('billNotes');
    const billNotes = document.getElementById('billNotes');
    if (billNotes && savedNotes) {
        billNotes.value = savedNotes;
    }
}); 