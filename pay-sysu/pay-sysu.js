(function() {

	"use strict";

	let http = require('http');
	let fs = require('fs');
	let tesseract = require('node-tesseract');
	let gm = require('gm');

	let config = {
		id: ,
		password: 
	};

	let cookieOperator = {
		queryItem: function(cookie, key) {
			let pattern = new RegExp(key + '=(\\w+);?');
			return pattern.exec(cookie)[1];
		},
		deleteItem: function(cookie, key) {
			let pattern = new RegExp(key + '=(\\w+);?');
			return cookie.replace(pattern, '');
		},
		addItem: function(cookie, key, value) {
			return cookie + "; " + key + "=" + value;
		}
	}

	let AutoSpider = function(id, password, loginType) {
		this.id = id;
		this.password = password;
		this.cookie = null;
		this.validateCode = null;
		this.sum = null;
		this.loginType = loginType || 0;
	}

	AutoSpider.prototype = {
		
		constructor: AutoSpider,

		getValidateCode: function(resolve, reject) {
			let options = {
				hostname: 'pay.sysu.edu.cn',
				port: 80,
				path: '/Common/GetValidateCode',
				method: 'GET',
				headers: {
					'Accept': 'image/webp,image/*,*/*;q=0.8',
					'Accept-Encoding': 'gzip, deflate, sdch',
					'Accept-Language': 'zh-CN,zh;q=0.8',
					'Connection':'keep-alive',
					'Host': 'pay.sysu.edu.cn',
					'Referer': ':http://pay.sysu.edu.cn/login.html?returnurl=http%3a%2f%2fpay.sysu.edu.cn%2fhome',
					'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.112 Safari/537.36'
				}
			};
			let req = http.get(options, function(res) {
				this.cookie = 'ASP.NET_SessionId=' + cookieOperator.queryItem(res.headers['set-cookie'], 'ASP.NET_SessionId');
				let imageData = '';
				res.setEncoding('binary');
				res.on('data', function(chunk) {
					imageData += chunk;
				});
				res.on('end', function() {
					fs.writeFile('code.jpg', imageData, 'binary', function(err) {
						if (err) {
							console.log(err);
							throw err;
						}
						//55%阈值图像处理
						let imagePath = __dirname + '/code.jpg';
						let newPath = __dirname + '/codeTwo.jpg';
						gm(imagePath).threshold(55, 1).write(newPath, function(err) {
							if (err) {
								console.log('err in gm ', err);
							}
						});
						let options = {
							psm: 6
						}
						tesseract.process(newPath, options, function(err, text) {
						    if(err) {
						        console.log("err", err);
						    } else {
						        text = text.replace(/[^0-9]+/g, '');
						        this.validateCode = text;
						        resolve();
						    }
						}.bind(this));

					}.bind(this));
				}.bind(this));
				res.on('error', function(e) {
					console.log('error in get validateCode: ', e);
					reject('error in get validateCode');
				});
			}.bind(this)).on('error', function(e) {
				console.log('error in get validateCode req: ', e);
				reject('error in get validateCode req');
			});
		},

		login: function(resolve, reject) {
			try {
			let postData = 'UserName=' + this.id + '&Password=' + this.password + '&checkNum=' + this.validateCode + '&x=0&y=0&returnUrl=http%3a%2f%2fpay.sysu.edu.cn%2f&loginType=' + this.loginType;
			let options = {
				hostname: 'pay.sysu.edu.cn',
				port: 80,
				path: '/Login/LogOn',
				method: 'POST',
				headers: {
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
					'Accept-Encoding': 'gzip, deflate',
					'Accept-Language': 'zh-CN,zh;q=0.8',
					'Cache-Control': 'max-age=0',
					'Connection':'keep-alive',
					'Content-Length': postData.length,
					'Content-Type': 'application/x-www-form-urlencoded',
					'Cookie': this.cookie,
					'Host': 'pay.sysu.edu.cn',
					'Origin': 'http://pay.sysu.edu.cn',
					'Referer': 'http://pay.sysu.edu.cn/login.html?returnurl=http%3a%2f%2fpay.sysu.edu.cn%2f',
					'Upgrade-Insecure-Requests': 1,
					'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.112 Safari/537.36'
				}
			};
			
			let req = http.request(options, function(res) {
				if (res.headers.location.indexOf('login') >= 0) {
					reject(1);
				} else {
					resolve();
				}
				res.on('error', function(e) {
					console.log('error in login, ', e);
				})
			});
			req.write(postData);
			req.end();
			} catch(e) {
				console.log(e);
			}
		},

		getSum: function(resolve, reject) {
			let postData = 'page=1&rp=50&sortname=undefined&sortorder=undefined&query=&qtype=&qop=Eq&opertype=201&json=true';
			let options = {
				hostname: 'pay.sysu.edu.cn',
				port: 80,
				path: '/Transact/Actuamt_List',
				method: 'POST',
				headers: {
					'Accept': 'application/json, text/javascript, */*',
					'Accept-Encoding': 'gzip, deflate',
					'Accept-Language': 'zh-CN,zh;q=0.8',
					'Cache-Control': 'max-age=0',
					'Connection':'keep-alive',
					'Content-Length': postData.length,
					'Content-Type': 'application/x-www-form-urlencoded',
					'Cookie': this.cookie,
					'Host': 'pay.sysu.edu.cn',
					'Origin': 'http://pay.sysu.edu.cn',
					'Referer': 'http://pay.sysu.edu.cn/transact/actuamt_list',
					'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.112 Safari/537.36',
					'X-Requested-With': 'XMLHttpRequest'
				}
			}
			let sum = 0, data = '';
			let req = http.request(options, function(res) {
				res.on('data', function(chunk) {
					data += chunk.toString('utf8');
				}).on('end', function() {
					let chunk = JSON.parse(data);
					let total = chunk.total;
					let rows = chunk.rows;
					for (let i = 0; i < total; ++i) {
						let cell = rows[i].cell;
						sum += parseFloat(cell[6]);
					}
					this.sum = sum;
					resolve();
				}.bind(this));
				res.on('error', function(e) {
					console.log('error in getSum, ', e);
				})
			}.bind(this));
			req.write(postData);
			req.end();
		}
	}

	let init = function() {
		let spider = new AutoSpider(config.id, config.password);
		new Promise(spider.getValidateCode.bind(spider)).then(function() {
			return new Promise(spider.login.bind(spider));
		}).then(function() {
			return new Promise(spider.getSum.bind(spider));
		}).then(function() {
			console.log("你共消费了: ", spider.sum)
		}).catch(function(e) {
			if (e === 1) {
				init(); //验证码错误
			} else {
				console.log('error catched ', e);
			}
		});
	}

	init();



}())








