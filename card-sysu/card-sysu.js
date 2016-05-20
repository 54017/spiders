(function() {
	
	"use strict";

	const http = require('http');
	const https = require('https');

	let config = {
		studentNumber: ,
		password: ,
		maxNumberTotal: 1000 //需要设置一年消费次数的上限
	};

	let monthArray = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

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


	let AutoSpider = function(id, password) {
		this.id = id;
		this.password = password;
		this.cookie = null;
		this.validateCode = null;
		this.cardNumber = null;
		this.showid = 'li_1_3';
		this.sk = null;
		this.sum = null;
	}

	AutoSpider.prototype = {
		
		constructor: AutoSpider,

		getValidateCode: function(resolve, reject) {
			let options = {
				hostname: 'card.sysu.edu.cn',
				port: 80,
				path: '/Handler/ValidateCode.aspx',
				method: 'GET',
				headers: {
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
					'Accept-Encoding': 'gzip, deflate, sdch',
					'Accept-Language': 'zh-CN,zh;q=0.8',
					'Cache-Control': 'max-age=0',
					'Connection':'keep-alive',
					'Cookie': 'lang=zh',
					'Host': 'card.sysu.edu.cn',
					'Referer': 'http://card.sysu.edu.cn/Index.aspx',
					'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.112 Safari/537.36'
				}
			};
			let req = http.get(options, function(res) {
				this.validateCode = cookieOperator.queryItem(res.headers['set-cookie'][0], 'CheckCode');
				this.cookie = "lang=zh; CheckCode=" + this.validateCode;
				res.on('error', function(e) {
					console.log('error in get validateCode: ', e);
				});
				resolve();
			}.bind(this)).on('error', function(e) {
				console.log('error in get validateCode req: ', e);
			});
		},

		login: function(resolve, reject) {
			let postData = `__VIEWSTATE=/wEPDwULLTE0ODkwOTI1NTkPZBYEAgEPZBYCAgEPFgIeBGhyZWYFGHRoZW1lcy9kZWZhdWx0L3N0eWxlLmNzc2QCBw8WAh4HVmlzaWJsZWhkZCxM2jZLp33l3x/RmPDWGePygixudgtdskjzihFH88DR&lt=3&txt_name=${this.id}&txt_pwd=${this.password}&txt_code=${this.validateCode}`;
			let options = {
				hostname: 'card.sysu.edu.cn',
				port: 80,
				path: '/Index.aspx',
				method: 'POST',
				headers: {
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
					'Accept-Encoding': 'gzip, deflate, sdch',
					'Accept-Language': 'zh-CN,zh;q=0.8',
					'Cache-Control': 'max-age=0',
					'Connection':'keep-alive',
					'Content-Length': postData.length,
					'Content-Type': 'application/x-www-form-urlencoded',
					'Cookie': this.cookie,
					'Host': 'card.sysu.edu.cn',
					'Origin': 'http://card.sysu.edu.cn',
					'Referer': 'http://card.sysu.edu.cn/Index.aspx',
					'Upgrade-Insecure-Requests': 1,
					'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.112 Safari/537.36'
				}
			};
			let req = http.request(options, function(res) {
				this.cookie = this.cookie + "; " + res.headers['set-cookie'];
				res.on('error', function(e) {
					console.log('error in login: ', e);
				})
				resolve();
			}.bind(this)).on('error', function(e) {
				console.log('error in login req:', e);
			});
			req.write(postData);
			req.end();
		},

		clickSumItem: function(resolve, reject) {
			let sk = cookieOperator.queryItem(this.cookie, 'sk');
			this.sk = sk;
			let options = {
				hostname: 'card.sysu.edu.cn',
				port: 8092,
				path: '/pcard/acchistrjn.action?showid=li_1_3&language=zh&form=http://card.sysu.edu.cn/&sk=' + this.sk,
				method: 'GET',
				headers: {
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
					'Accept-Encoding': 'gzip, deflate',
					'Accept-Language': 'zh-CN,zh;q=0.8',
					'Connection': 'keep-alive',
					'Cookie': this.cookie,
					'Host': 'card.sysu.edu.cn:8092',
					'Referer': 'http://card.sysu.edu.cn/Main.aspx',
					'Upgrade-Insecure-Requests': 1,
					'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.112 Safari/537.36'

				} 
			};
			let req = http.get(options, function(res) {
			    this.cookie = this.cookie + "; " +	res.headers['set-cookie'];
			    res.on('error', function(e) {
			    	console.log('error in clickSumItem: ', e);
			    })
			    resolve();
			}.bind(this)).on('error', function(e) {
				console.log('error in clickSumItem req: ', e);
			})
		},

		getCardNumber: function(resolve, reject) {
			let postData = 'ok=';
			let options = {
				hostname: 'card.sysu.edu.cn',
				port: 8092,
				path: '/pcard/getAccounts.action',
				method: 'POST',
				headers: {
					'Accept': 'application/json, text/javascript, */*; q=0.01',
					'Accept-Encoding': 'gzip, deflate',
					'Accept-Language': 'zh-CN,zh;q=0.8',
					'Connection':'keep-alive',
					'Content-Length': postData.length,
					'Content-Type': 'application/x-www-form-urlencoded',
					'Cookie': this.cookie,
					'Host': 'card.sysu.edu.cn:8092',
					'Origin': 'http://card.sysu.edu.cn:8092',
					'Referer': 'http://card.sysu.edu.cn:8092/pcard/acchistrjn.action?showid=' + this.showid + "&language=&from=http://card.sysu.edu.cn/&sk=" + this.sk,
					'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.112 Safari/537.36',
					'X-Requested-With': 'XMLHttpRequest'
				}
			};

			let req = http.request(options, function(res) {
				res.on('data', function(chunk) {
					chunk = chunk.toString('utf8');
					chunk = chunk.substr(1, chunk.length - 2);
					chunk = JSON.parse(chunk);
					this.cardNumber = chunk.account;
					resolve();
				}.bind(this));
				res.on('error', function(e) {
					console.log('error in getCardNumber: ', e);
				});
			}.bind(this)).on('error', function(e) {
				console.log('error in getCardNumber: ', e);
			});
			req.write(postData);
			req.end();
		},

		getSum: function(resolve, reject) {
			this.cookie = cookieOperator.addItem(this.cookie, 'showid', this.showid);
			this.cookie = this.cookie.replace('HttpOnly,', '').replace('path=/; ', '').replace('Path=/pcard; ', '');
			let postData = 'page=1&rp=' + config.maxNumberTotal + '&sortname=jndatetime&sortorder=desc&query=&qtype=&accquary=' + this.cardNumber + '&trjnquary=';
			let date = new Date();
			let month = date.getMonth() + 1,
				year = date.getFullYear(),
				startMonth;
			if (month === 12) {
				startMonth = 1;
			} else {
				--year;
				startMonth = month + 1;
			}
			let options = {
				hostname: 'card.sysu.edu.cn',
				port: 8092,
				path: '/pcard/gettrjndataList.action',
				method: 'POST',
				headers: {
					'Accept': 'application/json, text/javascript, */*; q=0.01',
					'Accept-Encoding': 'gzip, deflate',
					'Accept-Language': 'zh-CN,zh;q=0.8',
					'Connection':'keep-alive',
					'Content-Length': (postData + '2016-05').length,
					'Content-Type': 'application/x-www-form-urlencoded',
					'Cookie': this.cookie,
					'Host': 'card.sysu.edu.cn:8092',
					'Origin': 'http://card.sysu.edu.cn:8092',
					'Referer': 'http://card.sysu.edu.cn:8092/pcard/acchistrjn.action?showid=' + this.showid + "&language=zh&from=http://card.sysu.edu.cn/&sk=" + this.sk,
					'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.112 Safari/537.36',
					'X-Requested-With': 'XMLHttpRequest'
				}
			};
			let sum = 0, count = 0;
			for (let i = 0; i < 12; ++i) {
				let myPostData = postData + year + '-' + monthArray[startMonth - 1];
				if (++startMonth == 13) {
					startMonth = 1;
					++year;
				}
				let req = http.request(options, function(res) {
					let result = '';
					res.on('data', function(chunk) {
						result = result + chunk.toString('utf-8');
					});
					res.on('end', function() {
						++count;
						if (count === 12) {
							result = JSON.parse(result);
							let total = result.total;
							for (let j = 0; j < total; ++j) {

								let row = result.rows[j].cell;
								if (row[4] < 0) {
									sum += parseFloat(row[4]);
								}
							}
							this.sum = sum;
							resolve();
						}
					}.bind(this)).on('error', function(e) {
						console.log('error in getSum req: ', e);
					});
					res.on('error', function(e) {
						console.log('error in getSum: ', e);
					});
				}.bind(this));
				req.write(myPostData);
				req.end();
			}
		}
	}

	let init = () => {
		let mySpider = new AutoSpider(config.studentNumber, config.password);
		new Promise(mySpider.getValidateCode.bind(mySpider)).then(function() {
			return new Promise(mySpider.login.bind(mySpider));
		}).then(function() {
			return new Promise(mySpider.clickSumItem.bind(mySpider));
		}).then(function() {
			return new Promise(mySpider.getCardNumber.bind(mySpider));
		}).then(function() {
			return new Promise(mySpider.getSum.bind(mySpider));
		}).then(function() {
			console.log(mySpider.sum);
		});
	}

	init();

}())





