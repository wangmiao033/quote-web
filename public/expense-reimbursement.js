// 报销数据存储
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

// 报销类型映射
const expenseTypes = {
    travel: '差旅费',
    meal: '餐费',
    office: '办公用品',
    entertainment: '招待费',
    other: '其他'
};

// 状态映射
const statusMap = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
};

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    // 设置默认日期为今天
    document.getElementById('expenseDate').valueAsDate = new Date();
    
    // 加载报销记录
    loadExpenses();
    
    // 绑定表单提交事件
    document.getElementById('expenseForm').addEventListener('submit', handleSubmit);
});

// 处理表单提交
function handleSubmit(event) {
    event.preventDefault();
    
    const formData = {
        id: Date.now(),
        date: document.getElementById('expenseDate').value,
        type: document.getElementById('expenseType').value,
        amount: parseFloat(document.getElementById('expenseAmount').value),
        description: document.getElementById('expenseDescription').value,
        status: 'pending',
        attachment: document.getElementById('expenseAttachment').files[0]?.name || '',
        createdAt: new Date().toISOString()
    };
    
    // 添加到报销列表
    expenses.push(formData);
    saveExpenses();
    loadExpenses();
    
    // 重置表单
    event.target.reset();
    document.getElementById('expenseDate').valueAsDate = new Date();
    
    // 显示成功消息
    showToast('报销申请已提交', 'success');
}

// 加载报销记录
function loadExpenses() {
    const tbody = document.querySelector('#expenseTable tbody');
    tbody.innerHTML = '';
    
    expenses.forEach(expense => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDate(expense.date)}</td>
            <td>${expenseTypes[expense.type]}</td>
            <td>¥${expense.amount.toFixed(2)}</td>
            <td><span class="status-${expense.status}">${statusMap[expense.status]}</span></td>
            <td>${expense.description}</td>
            <td>
                <button class="button small" onclick="viewExpense(${expense.id})">查看</button>
                ${expense.status === 'pending' ? `
                    <button class="button small danger" onclick="deleteExpense(${expense.id})">删除</button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 查看报销详情
function viewExpense(id) {
    const expense = expenses.find(e => e.id === id);
    if (expense) {
        alert(`
            报销详情：
            日期：${formatDate(expense.date)}
            类型：${expenseTypes[expense.type]}
            金额：¥${expense.amount.toFixed(2)}
            状态：${statusMap[expense.status]}
            说明：${expense.description}
            ${expense.attachment ? `附件：${expense.attachment}` : ''}
        `);
    }
}

// 删除报销记录
function deleteExpense(id) {
    if (confirm('确定要删除这条报销记录吗？')) {
        expenses = expenses.filter(e => e.id !== id);
        saveExpenses();
        loadExpenses();
        showToast('报销记录已删除', 'success');
    }
}

// 保存报销数据
function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
}

// 显示提示消息
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
} 