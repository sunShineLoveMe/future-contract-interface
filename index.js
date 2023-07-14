const express = require('express');
const mysql = require('mysql')
const {
    CONNECTED_HOST,
    CONNECTED_USER,
    CONNECTED_PASSWORD,
    CONNECTED_DATABASE
} = require('./config/index.js');

// 创建一个 Express 应用程序
const app = express();

// 创建一个 MySQL 数据库连接池
const pool = mysql.createPool({
    connectionLimit: 10,
    host: CONNECTED_HOST,
    user: CONNECTED_USER,
    password: CONNECTED_PASSWORD,
    database: CONNECTED_DATABASE
});

// 定义一个 GET 请求的路由
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// 定义一个 GET 请求的路由，用于查询菜单列表
app.get('/menuList', (req, res) => {
    // 从连接池中获取一个连接
    pool.getConnection((err, connection) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error connecting to database');
        }

        // 执行查询语句
        connection.query('SELECT * FROM menu', (error, results, fields) => {
            // 释放连接
            connection.release();

            if (error) {
                console.error(error);
                return res.status(500).send('Error querying database');
            }

            // 返回查询结果
            res.send(results);
        });
    });
});

// 启动应用程序并监听端口
app.listen(3000, () => {
    console.log('App is listening on port 3000');
});
