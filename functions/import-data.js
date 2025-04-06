const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

exports.handler = async (event, context) => {
  try {
    // 获取上传的CSV文件内容
    const csvContent = event.body;
    
    // 解析CSV数据
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });

    // 数据验证
    const validatedRecords = records.map(record => {
      // 确保所有必需的字段都存在
      const requiredFields = [
        '游戏名称',
        '结算月份',
        '充值金额',
        '测试费&代金券金额',
        '可分配运营收入',
        '通道费率',
        '通道费',
        '税率',
        '税费',
        '分成比例',
        '分成收入'
      ];

      // 验证字段
      for (const field of requiredFields) {
        if (!record[field]) {
          throw new Error(`缺少必需字段: ${field}`);
        }
      }

      // 转换数值类型
      const numericFields = [
        '充值金额',
        '测试费&代金券金额',
        '可分配运营收入',
        '通道费率',
        '通道费',
        '税率',
        '税费',
        '分成比例',
        '分成收入'
      ];

      numericFields.forEach(field => {
        record[field] = parseFloat(record[field]) || 0;
      });

      return record;
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: '数据导入成功',
        data: validatedRecords
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        success: false,
        error: error.message || '数据导入失败'
      })
    };
  }
}; 