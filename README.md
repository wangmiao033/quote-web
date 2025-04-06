# 电子发票识别系统

基于百度OCR API的电子发票识别系统，支持图片和PDF格式的发票识别。

## 功能特点

- 支持拖拽上传和点击上传
- 支持图片预览和旋转
- 显示识别置信度
- 支持JPG、PNG、PDF格式
- 文件大小限制：4MB
- 响应式设计，适配各种设备

## 本地开发

1. 克隆项目
```bash
git clone [项目地址]
cd invoice-recognition
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
创建`.env`文件，添加以下配置：
```
BAIDU_API_KEY=your_api_key_here
BAIDU_SECRET_KEY=your_secret_key_here
```

4. 启动开发服务器
```bash
npm run dev
```

## 生产环境部署

### 方式一：直接部署

1. 安装生产依赖
```bash
npm install --production
```

2. 配置环境变量
复制 `.env.production` 到 `.env`：
```bash
cp .env.production .env
```

3. 启动服务
```bash
npm run prod
```

### 方式二：Docker部署

1. 构建镜像
```bash
docker build -t invoice-recognition .
```

2. 运行容器
```bash
docker run -d -p 3000:3000 \
  --env-file .env.production \
  --name invoice-recognition \
  invoice-recognition
```

## 使用说明

1. 打开浏览器访问 `http://localhost:3000`
2. 点击上传区域或拖拽文件到上传区域
3. 等待识别结果
4. 查看识别结果和置信度

## 技术栈

- 前端：HTML5, CSS3, JavaScript
- 后端：Node.js, Express
- OCR：百度OCR API
- 容器化：Docker

## 注意事项

- 请确保百度OCR API密钥有效
- 文件大小不能超过4MB
- 仅支持JPG、PNG、PDF格式
- 建议使用清晰、完整的发票图片

## 许可证

MIT 