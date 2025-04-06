// 游戏库数据
let devGameLibrary = JSON.parse(localStorage.getItem('devGameLibrary')) || [];
let channelGameLibrary = JSON.parse(localStorage.getItem('channelGameLibrary')) || [];

// 添加新游戏
function addNewGame(type) {
    const prefix = type === 'dev' ? '' : 'Channel';
    const gameName = document.getElementById(`newGameName${prefix}`).value.trim();
    const gameCode = document.getElementById(`newGameCode${prefix}`).value.trim();
    const gameCompany = document.getElementById(`newGameCompany${prefix}`).value.trim();
    const gameShareRatio = document.getElementById(`newGameShareRatio${prefix}`).value.trim();
    
    if (!gameName || !gameCode) {
        alert('请输入游戏名称和游戏代码！');
        return;
    }
    
    const gameLibrary = type === 'dev' ? devGameLibrary : channelGameLibrary;
    if (gameLibrary.some(game => game.name === gameName || game.code === gameCode)) {
        alert('该游戏已存在！');
        return;
    }
    
    const newGame = {
        name: gameName,
        code: gameCode,
        company: gameCompany,
        shareRatio: gameShareRatio,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
    };
    
    gameLibrary.push(newGame);
    saveGameLibrary(type);
    refreshGameLibraryTable(type);
    updateStats();
    clearInputs(type);
}

// 清空输入框
function clearInputs(type) {
    const prefix = type === 'dev' ? '' : 'Channel';
    document.getElementById(`newGameName${prefix}`).value = '';
    document.getElementById(`newGameCode${prefix}`).value = '';
    document.getElementById(`newGameCompany${prefix}`).value = '';
    document.getElementById(`newGameShareRatio${prefix}`).value = '';
}

// 删除游戏
function deleteGame(type, index) {
    const gameLibrary = type === 'dev' ? devGameLibrary : channelGameLibrary;
    if (confirm('确定要删除这个游戏吗？删除后将无法恢复。')) {
        gameLibrary.splice(index, 1);
        saveGameLibrary(type);
        refreshGameLibraryTable(type);
        updateStats();
    }
}

// 编辑游戏
function editGame(type, index) {
    const gameLibrary = type === 'dev' ? devGameLibrary : channelGameLibrary;
    const game = gameLibrary[index];
    const companyLabel = type === 'dev' ? '研发公司' : '渠道公司';
    const shareRatioLabel = type === 'dev' ? '研发分成比例' : '渠道分成比例';
    
    const newName = prompt('请输入新的游戏名称：', game.name);
    const newCode = prompt('请输入新的游戏代码：', game.code);
    const newCompany = prompt(`请输入新的${companyLabel}：`, game.company);
    const newShareRatio = prompt(`请输入新的${shareRatioLabel}：`, game.shareRatio);
    
    if (newName && newCode) {
        const isDuplicate = gameLibrary.some((g, i) => 
            i !== index && (g.name === newName || g.code === newCode)
        );
        
        if (isDuplicate) {
            alert('游戏名称或代码与现有游戏重复！');
            return;
        }
        
        game.name = newName;
        game.code = newCode;
        game.company = newCompany || '';
        game.shareRatio = newShareRatio || '';
        game.updatedAt = new Date().toISOString();
        
        saveGameLibrary(type);
        refreshGameLibraryTable(type);
        updateStats();
    }
}

// 切换游戏状态
function toggleGameStatus(type, index) {
    const gameLibrary = type === 'dev' ? devGameLibrary : channelGameLibrary;
    const game = gameLibrary[index];
    game.status = game.status === 'active' ? 'inactive' : 'active';
    game.updatedAt = new Date().toISOString();
    
    saveGameLibrary(type);
    refreshGameLibraryTable(type);
    updateStats();
}

// 保存游戏库
function saveGameLibrary(type) {
    if (type === 'dev') {
        localStorage.setItem('devGameLibrary', JSON.stringify(devGameLibrary));
    } else {
        localStorage.setItem('channelGameLibrary', JSON.stringify(channelGameLibrary));
    }
}

// 刷新游戏库表格
function refreshGameLibraryTable(type, searchText = '') {
    const gameLibrary = type === 'dev' ? devGameLibrary : channelGameLibrary;
    const tableId = type === 'dev' ? 'gameLibraryTableDev' : 'gameLibraryTableChannel';
    const tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = '';
    
    const filteredGames = searchText
        ? gameLibrary.filter(game => 
            game.name.toLowerCase().includes(searchText.toLowerCase()) ||
            game.code.toLowerCase().includes(searchText.toLowerCase()) ||
            game.company.toLowerCase().includes(searchText.toLowerCase()))
        : gameLibrary;
    
    filteredGames.forEach((game, index) => {
        const tr = document.createElement('tr');
        tr.className = 'fade-in';
        tr.innerHTML = `
            <td>
                <input type="checkbox" class="game-checkbox" data-index="${index}">
            </td>
            <td>${game.name}</td>
            <td>${game.code}</td>
            <td>${game.company || '-'}</td>
            <td>${game.shareRatio || '-'}</td>
            <td>${formatDate(game.createdAt)}</td>
            <td>${formatDate(game.updatedAt)}</td>
            <td class="status-${game.status}">${game.status === 'active' ? '启用' : '停用'}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="editGame('${type}', ${index})" class="edit-btn tooltip">
                        编辑
                        <span class="tooltip-text">编辑游戏信息</span>
                    </button>
                    <button onclick="toggleGameStatus('${type}', ${index})" class="edit-btn tooltip">
                        ${game.status === 'active' ? '停用' : '启用'}
                        <span class="tooltip-text">${game.status === 'active' ? '停用此游戏' : '启用此游戏'}</span>
                    </button>
                    <button onclick="deleteGame('${type}', ${index})" class="delete-btn tooltip">
                        删除
                        <span class="tooltip-text">删除此游戏</span>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // 重置全选框状态
    const selectAllId = type === 'dev' ? 'selectAllDev' : 'selectAllChannel';
    document.getElementById(selectAllId).checked = false;
}

// 全选/取消全选
function toggleSelectAll(type) {
    const selectAllId = type === 'dev' ? 'selectAllDev' : 'selectAllChannel';
    const tableId = type === 'dev' ? 'gameLibraryTableDev' : 'gameLibraryTableChannel';
    const selectAll = document.getElementById(selectAllId);
    const checkboxes = document.querySelectorAll(`#${tableId} .game-checkbox`);
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
    });
}

// 批量删除选中的游戏
function deleteSelectedGames(type) {
    const tableId = type === 'dev' ? 'gameLibraryTableDev' : 'gameLibraryTableChannel';
    const gameLibrary = type === 'dev' ? devGameLibrary : channelGameLibrary;
    const checkboxes = document.querySelectorAll(`#${tableId} .game-checkbox:checked`);
    
    if (checkboxes.length === 0) {
        alert('请先选择要删除的游戏！');
        return;
    }
    
    if (confirm(`确定要删除选中的 ${checkboxes.length} 个游戏吗？删除后将无法恢复。`)) {
        const indexesToDelete = Array.from(checkboxes)
            .map(checkbox => parseInt(checkbox.getAttribute('data-index')))
            .sort((a, b) => b - a);
        
        indexesToDelete.forEach(index => {
            gameLibrary.splice(index, 1);
        });
        
        saveGameLibrary(type);
        refreshGameLibraryTable(type);
        updateStats();
        alert(`成功删除 ${checkboxes.length} 个游戏！`);
    }
}

// 搜索游戏
function searchGames(type) {
    const searchInputId = type === 'dev' ? 'searchInputDev' : 'searchInputChannel';
    const searchText = document.getElementById(searchInputId).value.trim();
    refreshGameLibraryTable(type, searchText);
}

// 更新统计信息
function updateStats() {
    const totalGames = devGameLibrary.length + channelGameLibrary.length;
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    const newGamesThisMonth = [
        ...devGameLibrary,
        ...channelGameLibrary
    ].filter(game => {
        const createdDate = new Date(game.createdAt);
        return createdDate.getMonth() === thisMonth && createdDate.getFullYear() === thisYear;
    }).length;
    
    const allGames = [...devGameLibrary, ...channelGameLibrary];
    const lastUpdateDate = allGames.length > 0 
        ? new Date(Math.max(...allGames.map(game => new Date(game.updatedAt))))
        : null;
    
    document.getElementById('totalGames').textContent = totalGames;
    document.getElementById('newGamesThisMonth').textContent = newGamesThisMonth;
    document.getElementById('lastUpdate').textContent = lastUpdateDate 
        ? formatDate(lastUpdateDate.toISOString())
        : '-';
}

// 导出游戏库
function exportGameLibrary() {
    const wb = XLSX.utils.book_new();
    
    // 导出研发游戏数据
    const devData = [
        ['游戏名称', '游戏代码', '研发公司', '研发分成比例', '创建时间', '最后更新', '状态']
    ];
    devGameLibrary.forEach(game => {
        devData.push([
            game.name,
            game.code,
            game.company || '-',
            game.shareRatio || '-',
            formatDate(game.createdAt),
            formatDate(game.updatedAt),
            game.status === 'active' ? '启用' : '停用'
        ]);
    });
    const wsdev = XLSX.utils.aoa_to_sheet(devData);
    XLSX.utils.book_append_sheet(wb, wsdev, '研发游戏分成');
    
    // 导出渠道游戏数据
    const channelData = [
        ['游戏名称', '游戏代码', '渠道公司', '渠道分成比例', '创建时间', '最后更新', '状态']
    ];
    channelGameLibrary.forEach(game => {
        channelData.push([
            game.name,
            game.code,
            game.company || '-',
            game.shareRatio || '-',
            formatDate(game.createdAt),
            formatDate(game.updatedAt),
            game.status === 'active' ? '启用' : '停用'
        ]);
    });
    const wschannel = XLSX.utils.aoa_to_sheet(channelData);
    XLSX.utils.book_append_sheet(wb, wschannel, '渠道分成');
    
    // 设置列宽
    const colWidths = [20, 15, 20, 10, 20, 20, 10];
    wsdev['!cols'] = colWidths.map(width => ({ width }));
    wschannel['!cols'] = colWidths.map(width => ({ width }));
    
    // 生成文件名
    const date = new Date();
    const fileName = `游戏分成管理_${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}.xlsx`;
    
    // 保存文件
    XLSX.writeFile(wb, fileName);
}

// 导入CSV文件
function importCSV(type) {
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
                const games = [];
                
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
                    
                    if (columns.length >= 2) {
                        const game = {
                            name: columns[0],
                            code: columns[1],
                            company: columns[2] || "",
                            shareRatio: columns[3] || "",
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            status: 'active'
                        };
                        games.push(game);
                    }
                }
                
                if (games.length === 0) {
                    alert('未找到有效的游戏数据，请检查CSV文件格式！');
                    return;
                }
                
                // 更新游戏数据
                if (type === 'dev') {
                    devGameLibrary = games;
                    saveGameLibrary('dev');
                    refreshGameLibraryTable('dev');
                } else {
                    channelGameLibrary = games;
                    saveGameLibrary('channel');
                    refreshGameLibraryTable('channel');
                }
                updateStats();
                
                const currentDate = new Date();
                const monthYear = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;
                const typeName = type === 'dev' ? '研发' : '渠道';
                alert(`成功导入 ${games.length} 个${typeName}游戏！\n当前对账月份：${monthYear}`);
            } catch (error) {
                console.error('导入出错：', error);
                alert('导入失败，请确保CSV文件格式正确且为GBK编码！');
            }
        };
        reader.readAsArrayBuffer(file);
    };
    
    input.click();
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 切换区域折叠状态
function toggleSection(type) {
    const content = document.getElementById(`${type}SectionContent`);
    const button = content.previousElementSibling.querySelector('.toggle-section');
    
    if (content.classList.contains('expanded')) {
        content.classList.remove('expanded');
        content.classList.add('collapsed');
        button.textContent = '▶';
    } else {
        content.classList.remove('collapsed');
        content.classList.add('expanded');
        button.textContent = '▼';
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    refreshGameLibraryTable('dev');
    refreshGameLibraryTable('channel');
    updateStats();
    
    // 保存折叠状态到localStorage
    const devContent = document.getElementById('devSectionContent');
    const channelContent = document.getElementById('channelSectionContent');
    
    // 从localStorage恢复折叠状态
    const devCollapsed = localStorage.getItem('devSectionCollapsed') === 'true';
    const channelCollapsed = localStorage.getItem('channelSectionCollapsed') === 'true';
    
    if (devCollapsed) {
        toggleSection('dev');
    }
    if (channelCollapsed) {
        toggleSection('channel');
    }
    
    // 监听折叠状态变化
    devContent.addEventListener('transitionend', () => {
        localStorage.setItem('devSectionCollapsed', devContent.classList.contains('collapsed'));
    });
    
    channelContent.addEventListener('transitionend', () => {
        localStorage.setItem('channelSectionCollapsed', channelContent.classList.contains('collapsed'));
    });
}); 