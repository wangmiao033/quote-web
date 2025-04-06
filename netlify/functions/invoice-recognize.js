const axios = require('axios');

exports.handler = async function(event, context) {
    try {
        // 获取百度OCR访问令牌
        const accessToken = await getAccessToken();
        
        // 从请求中获取图片数据
        const { image } = JSON.parse(event.body);
        
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
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                data: response.data
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: error.message
            })
        };
    }
};

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