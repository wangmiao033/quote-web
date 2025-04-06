const axios = require('axios');

exports.handler = async function(event, context) {
  // 只允许 POST 请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { image } = JSON.parse(event.body);
    
    // 获取百度 OCR 的 access token
    const accessToken = await getAccessToken();
    
    // 调用百度 OCR API
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

    return {
      statusCode: 200,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};

async function getAccessToken() {
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
  return response.data.access_token;
} 