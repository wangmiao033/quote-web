// 管理员账号信息
const adminAccounts = [
    { username: 'admin1', password: 'admin123' },
    { username: 'admin2', password: 'admin456' }
];

// 处理登录
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // 验证账号密码
    const isValidAdmin = adminAccounts.some(admin => 
        admin.username === username && admin.password === password
    );
    
    if (isValidAdmin) {
        // 登录成功，保存登录状态
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', username);
        
        // 跳转到首页
        window.location.href = 'index.html';
    } else {
        alert('用户名或密码错误');
    }
    
    return false;
} 