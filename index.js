const express = require('express');
const cors = require('cors')
const mysql = require('mysql')
const { futureExchanges, futureExchangeProducts } = require("./constant/index.js")

const {
    CONNECTED_HOST,
    CONNECTED_USER,
    CONNECTED_PASSWORD,
    CONNECTED_DATABASE
} = require('./config/index.js');

// 创建一个 Express 应用程序
const app = express();
app.use(cors())

// 创建一个 MySQL 数据库连接池
const pool = mysql.createPool({
    connectionLimit: 10,
    host: CONNECTED_HOST,
    user: CONNECTED_USER,
    password: CONNECTED_PASSWORD,
    database: CONNECTED_DATABASE
});

// 定义一个 GET 请求的路由，用于查询菜单列表
app.get('/menuList', (req, res) => {
    // 从连接池中获取一个连接
    pool.getConnection((err, connection) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                code: 500,
                status: 'error',
                message: '数据库连接异常'
            });
        }
        // 执行查询语句
        connection.query('SELECT * FROM menu ORDER BY parent_id, id', (error, results, fields) => {
            // 释放连接
            connection.release();
            if (error) {
                console.error(error);
                return res.status(500).json({
                    code: 500,
                    status: 'error',
                    message: '数据库查询错误'
                });
            }
            // 处理查询结果，将子菜单关联到父菜单上
            const data = [];
            const parentMap = {};
            results.forEach(item => {
                if (item.parent_id === null) {
                    // 当前项是一级菜单
                    data.push({
                        ...item,
                        subItems: []
                    });

                    // 将当前项添加到父菜单映射表中
                    parentMap[item.id] = data[data.length - 1];
                } else if (parentMap[item.parent_id]) {
                    // 当前项是子菜单
                    parentMap[item.parent_id].subItems.push({
                        ...item,
                        subItems: []
                    });

                    // 将当前项添加到父菜单映射表中
                    parentMap[item.id] = parentMap[item.parent_id].subItems[parentMap[item.parent_id].subItems.length - 1];
                }
            });
            // 过滤掉 parent_id 为 null 的项，并将 parent_id 为 null 下的数据项中 subItems 中的数据层级提升
            // const filteredData = data.filter(item => item.parent_id !== null);
            const filteredData = [];
            data.forEach(item => {
                if (item.subItems.length > 0) {
                    filteredData.push(...item.subItems);
                }
            });
            filteredData.forEach(item => {
                if (item.parent_id === null) {
                    item.subItems.forEach(subItem => {
                        subItem.subItems.forEach(subSubItem => {
                            filteredData.push(subSubItem);
                        });
                        filteredData.push(subItem);
                    });
                    item.subItems = [];
                }
            });
            // 返回的结果增加交易所代码
            const handledFilterdData = filteredData.map(item => {
                const productCode = item.code;
                const exchange = futureExchangeProducts.find(exchange => exchange.code === productCode);
                const exchangeCode = exchange ? exchange.exchange : null;
                const productName = exchange ? exchange.name : null;
                return {
                    ...item,
                    exchange: exchangeCode,
                    name: productName
                }
            })
            // 返回查询结果
            res.json({
                code: 200,
                status: 'success',
                data: handledFilterdData
            });
        });
    });
});

// 用于查询一级菜单信息
app.get('/menuParentList', (req, res) => {
    // 从连接池中获取一个连接
    pool.getConnection((err, connection) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                code: 500,
                status: 'error',
                message: '数据库连接异常'
            });
        }
        // 执行查询语句
        connection.query('SELECT * FROM menu WHERE parent_id IS NULL', (error, results, fields) => {
            // 释放连接
            connection.release();
            if (error) {
                console.error(error);
                return res.status(500).json({
                    code: 500,
                    status: 'error',
                    message: 'Error querying database'
                });
            }
            const data = results.map(item => {
                const exchangeCode = item.code;
                const exchange = futureExchanges.find(exchange => exchange.code === exchangeCode);
                const exchangeName = exchange ? exchange.name : null;
                return {
                    ...item,
                    name: exchangeName
                }
            })

            res.json({
                code: 200,
                status: 'success',
                data
            })
        });
    });
});

// 启动应用程序并监听端口
app.listen(3000, () => {
    console.log('App is listening on port 3000');
});
