const { parse } = require('json2csv');
const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  try {
    // 获取请求体中的数据
    const data = JSON.parse(event.body);
    
    // 定义CSV字段
    const fields = [
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

    // 转换数据为CSV格式
    const csv = parse(data, { fields });

    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `账单数据_${timestamp}.csv`;

    // 返回CSV文件
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      },
      body: csv
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '导出数据失败' })
    };
  }
}; 