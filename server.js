const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const hpp = require('hpp');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// 安全中间件
app.use(helmet()); // 设置各种 HTTP 头以增加安全性
app.use(hpp()); // 防止 HTTP 参数污染
app.use(compression()); // 启用 Gzip 压缩

// CORS 配置
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 速率限制
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100 // 限制每个IP 15分钟内最多100个请求
});
app.use('/api/', limiter);

// 基本中间件
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.static('public'));

// 文件上传配置
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 4 * 1024 * 1024 // 4MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.mimetype)) {
            cb(new Error('不支持的文件类型'));
            return;
        }
        cb(null, true);
    }
});

// 获取百度OCR访问令牌
async function getAccessToken() {
    try {
        const response = await axios.post('https://aip.baidubce.com/oauth/2.0/token', null, {
            params: {
                grant_type: 'client_credentials',
                client_id: process.env.BAIDU_API_KEY,
                client_secret: process.env.BAIDU_SECRET_KEY
            }
        });
        return response.data.access_token;
    } catch (error) {
        console.error('获取访问令牌失败:', error);
        throw new Error('获取访问令牌失败');
    }
}

// OCR识别接口
app.post('/api/invoice/recognize', upload.single('file'), async (req, res) => {
    try {
        // 检查是否有文件上传
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '请上传文件'
            });
        }

        // 检查文件大小
        if (req.file.size > 4 * 1024 * 1024) {
            return res.status(400).json({
                success: false,
                message: '文件大小超过4MB限制'
            });
        }

        // 获取访问令牌
        const accessToken = await getAccessToken();

        // 准备图片数据
        const image = req.file.buffer.toString('base64');

        // 发送OCR请求
        const response = await axios.post(
            'https://aip.baidubce.com/rest/2.0/ocr/v1/vat_invoice',
            `image=${encodeURIComponent(image)}`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                params: {
                    access_token: accessToken
                }
            }
        );

        // 返回识别结果
        res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error('识别失败:', error);
        res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'production' 
                ? '识别失败' 
                : error.message
        });
    }
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            message: '文件上传失败: ' + err.message
        });
    }
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? '服务器错误' 
            : err.message
    });
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.info('SIGTERM 信号接收到，准备关闭服务器');
    app.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});

app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
}); 