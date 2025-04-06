const axios = require('axios');

async function getAccessToken() {
    try {
        console.log('正在获取访问令牌...');
        console.log('API Key:', process.env.BAIDU_API_KEY);
        console.log('Secret Key:', process.env.BAIDU_SECRET_KEY);
        
        const response = await axios.post(
            'https://aip.baidubce.com/oauth/2.0/token',
            null,
            {
                params: {
                    grant_type: 'client_credentials',
                    client_id: process.env.BAIDU_API_KEY,
                    client_secret: process.env.BAIDU_SECRET_KEY
                }
            }
        );
        
        console.log('访问令牌响应:', response.data);
        return response.data.access_token;
    } catch (error) {
        console.error('获取访问令牌失败:', error.response ? error.response.data : error.message);
        throw new Error(`获取访问令牌失败: ${error.message}`);
    }
}

exports.handler = async function(event, context) {
    // 添加 CORS 头
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // 处理 OPTIONS 请求
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const { image } = JSON.parse(event.body);
        if (!image) {
            throw new Error('未提供图片数据');
        }

        const accessToken = await getAccessToken();
        if (!accessToken) {
            throw new Error('获取访问令牌失败');
        }

        console.log('开始调用百度 OCR API...');
        const response = await axios.post(
            'https://aip.baidubce.com/rest/2.0/ocr/v1/vat_invoice',
            `image=${encodeURIComponent(image)}`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                params: {
                    access_token: accessToken
                }
            }
        );

        console.log('OCR 识别成功');
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response.data)
        };
    } catch (error) {
        console.error('处理请求失败:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: error.message,
                details: error.response ? error.response.data : null
            })
        };
    }
}; 