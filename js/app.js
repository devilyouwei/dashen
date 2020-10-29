/*
 * 全局变量
 */

//注意，最终要使用linux服务器，做路径不易出现访问错误
IP = "dashen.devil.ren"
HTTP_DOMAIN = "http://" + IP + "/index.php/app/"; //app核心控制器服务器地址
SHARE_URL = "http://" + IP + "/index.php/wap/Wx/share"; //分享地址
UPLOAD_URL = "http://zhongbang.oss-cn-beijing.aliyuncs.com/"; //阿里oss服务器

(function($, owner) {
	$(".mui-scroll-wrapper").scroll({
		deceleration: 0.0005 //flick 减速系数，系数越大，滚动速度越慢，滚动距离越小，默认值0.0006
	});
	//使用全局进度条
	//把通用的ajax请求打包起来
	/*
	 * ctl 控制器
	 * act 方法
	 * dataObj 数据json
	 * callback 成功回掉函数
	 * ecallback 失败回掉函数
	 * waiting 等待界面,none为不显示
	 */
	owner.request = function(ctl, act, dataObj, callback, ecallback, waiting) {
		ctl = ctl || "";
		act = act || "";
		callback = callback || $.noop;
		ecallback = ecallback || $.noop;
		waiting = waiting || true;

		if(ctl == "" || act == "")
			return;
		var url = HTTP_DOMAIN + ctl + "/" + act;
		console.log(url);
		console.log(JSON.stringify(dataObj));
		mui.ajax(url, {
			data: dataObj,
			dataType: 'json',
			timeout: 5000,
			type: 'post',
			beforeSend: function(XMLHttpRequest) {
				if(waiting == true)
					plus.nativeUI.showWaiting("稍等片刻", {
						back: 'none'
					}); //显示加载等待
			},
			complete: function(XMLHttpRequest, textStatus) {
				if(waiting == true)
					plus.nativeUI.closeWaiting();
			},
			success: function(response) {
				if(callback && typeof callback == "function")
					return callback(response);
				else
					return;
			},
			error: function(xhr, type, error) {
				//检查超时和网络
				if(type === "timeout")
					mui.toast("连接超时，请检查网络");
				//错误信息
				else {
					switch(xhr.status) {
						case 500:
							mui.toast("很抱歉，服务器错误！");
							break;
						case 503:
							mui.toast("很抱歉，服务器超时！");
							break;
						case 404:
							mui.toast("很抱歉，请求方法丢失或不存在！");
							break;
						default:
							mui.toast("未知网络错误，请稍后重试！");
							break;

					}
				}

				if(ecallback && typeof ecallback == "function")
					return ecallback(xhr); //将xhr交给具体调用者检查
				else
					return;
			}
		});
	};

	/**
	 * 获取当前状态
	 **/
	owner.getState = function() {
		var stateText = localStorage.getItem('$state') || "{}";
		return JSON.parse(stateText);
	};

	/**
	 * 设置当前状态
	 **/
	owner.setState = function(state) {
		state = state || {};
		localStorage.setItem('$state', JSON.stringify(state));
	};

	//清空本地token
	owner.clearToken = function() {
		var state = owner.getState();
		state.token = false;
		owner.setState(state);
	}

	//保存登陆过的手机号
	owner.saveLoginPhone = function(p) {
		localStorage.setItem("$phone", p)
	}
	//获得登录手机号
	owner.getLoginPhone = function() {
		return localStorage.getItem("$phone");
	}

	//邮箱正则表达式匹配
	owner.checkEmail = function(email) {
		var reg = /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/;
		return reg.test(email);
	};
	owner.checkQQ = function(qq) {
		var reg = /^[1-9][0-9]{4,9}$/;
		return reg.test(qq);
	}
	owner.checkPhoneNumber = function(phone) {
		var reg = /^(((13[0-9]{1})|(15[0-9]{1})|(18[0-9]{1}))+\d{8})$/;
		return reg.test(phone);
	}

	/**
	 * 找回密码
	 **/
	owner.forgetPassword = function(email, callback) {
		callback = callback || $.noop;
		if(!owner.checkEmail(email)) {
			return callback('邮箱地址不合法');
		}
		return callback(null, '新的随机密码已经发送到您的邮箱，请查收邮件。');
	};

	/**
	 * 获取应用本地配置
	 **/
	owner.setSettings = function(settings) {
		settings = settings || {};
		localStorage.setItem('$settings', JSON.stringify(settings));
	}

	//设置应用本地配置
	owner.getSettings = function() {
		var settingsText = localStorage.getItem('$settings') || "{}";
		return JSON.parse(settingsText);
	}

	// 获取用户个人信息
	owner.getUserInfo = function() {
		var userText = localStorage.getItem('$user') || "{}";
		return JSON.parse(userText);
	}

	// 存储用户个人信息
	owner.setUserInfo = function(user) {
		user = user || {};
		localStorage.setItem('$user', JSON.stringify(user));
	}

	// 获取用户头像，size选取图片大小
	owner.getHeadImg = function(size) {
		size = size || "lg";
		var headImg;
		if(size == "sm") {
			headImg = owner.getUserInfo().my_icon_sm || "";
		} else {
			headImg = owner.getUserInfo().my_icon || "";
		}
		return headImg;
	}

	//设置用户头像,分为大图，小图，格式为base64
	owner.setHeadImg = function(lg, sm) {
		lg = lg || "";
		sm = sm || "";
		var userInfo = owner.getUserInfo();
		userInfo.my_icon = lg;
		userInfo.my_icon_sm = sm;
		owner.setUserInfo(userInfo); //保存对象
	}

	//获取用户签名
	owner.getSignature = function() {
		var signature = owner.getUserInfo().signature || "";
		return signature;
	}

	//修改签名
	owner.setSignature = function(signature) {
		var userInfo = owner.getUserInfo();
		userInfo.signature = signature; //只对my_icon这一项进行修改，其他不动
		owner.setUserInfo(userInfo);
	}

	//将BASE 64保存为文件,传入图片名，base64，质量，回掉函数
	owner.baseImgFile = function(uid, base64, quality, callback) {
		if(!base64 || base64 == "")
			return;
		quality = quality || 10;
		callback = callback || $.noop;
		var bitmap = new plus.nativeObj.Bitmap();
		// 从本地加载Bitmap图片
		bitmap.loadBase64Data(base64, function() {
			bitmap.save("_doc/" + uid + ".jpg", {
				overwrite: true,
				quality: quality
			}, function(i) {
				bitmap.clear();
				return callback(i);
			}, function(e) {
				bitmap.clear();
				console.log('保存图片失败：' + JSON.stringify(e));
			});
		}, function(e) {
			bitmap.clear();
			console.log('加载图片失败：' + JSON.stringify(e));
		});
	}

	//base64：图片压缩函数,i为图片(base64格式),w为压缩宽度,h为压缩高，img读取时异步的，需要用到回调同步
	owner.zipBaseImg = function(i, w, h, callback) {
		w = w || 100;
		h = h || 100;

		var img = document.createElement("img"); //创建临时图片
		img.src = i;

		var canvas = document.createElement("canvas"); //创建临时画布
		canvas.width = w;
		canvas.height = h;

		var ctx = canvas.getContext("2d");
		img.onload = function() {
			ctx.drawImage(img, 0, 0, w, h); //传入临时图片
			if(callback && typeof callback == "function")
				return callback(canvas.toDataURL("image/jpeg", 1)); //第二个参数是质量
		};
	}

	//强制返回基座页
	owner.toLogin = function(info) {
		//如果有服务器消息，toast该消息
		if(info != null && info != "" && info != undefined)
			mui.toast(info);
		//清楚本地登录信息
		owner.clearToken();
		//清空所有的webview
		var all = plus.webview.all();
		var launch = plus.webview.getLaunchWebview() //基座，不可以关掉
		for(var i = 0; i < all.length; i++) {
			if(all[i] === launch)
				continue;
			all[i].clear();
			all[i].close();
		}
		setTimeout(function() {
			launch.show(); //不要重新打开login，app的基座就是login页面，直接show出来就行了
		}, 0);
	}

	owner.log = function() {
		console.log("当前页：" + plus.webview.currentWebview().id);
	}

	//传入时间戳，返回时间
	owner.getLocalTime = function(nS) {
		return new Date(parseInt(nS) * 1000).toLocaleString().replace(/:\d{1,2}$/, ' ');
	}

	//检查是否是当前页面的子页面
	//传入子页面webViewObj
	owner.isChildWebview = function(webView) {
		var children = plus.webview.currentWebview().children();
		for(var i = 0; i < children.length; i++) {
			if(webView === children[i])
				return true;
		}
		return false;
	}

}(mui, window.app = {}));

function fullscreen() {
	// 设置应用全屏显示！
	plus.navigator.setFullscreen(true);
}

function unfullscreen() {
	// 设置应用非全屏显示！
	plus.navigator.setFullscreen(false);
}

function isfullscreen() {
	// 查询应用当前是否全屏显示！
	console.log("是否全屏：" + (plus.navigator.isFullscreen() ? "是" : "否"));
}

function trim(str) {
	return str.replace(/(^\s*)|(\s*$)/g, "");
}

function playRefresh() {
	plus.audio.createPlayer("/audio/2.wav").play(function() {}, function(e) {
		//alert("Audio play failed:" + e.message);
	});
}

//格式化价格
function formatPrice(price) {
	price = parseFloat(price) //转换为浮点数
	if(isNaN(price)) {
		return false;
	}
	return price.toFixed(2);
}
/**
 * 格式化时间的辅助类，将一个时间转换成x小时前、y天前等
 */
Date.prototype.format = function(fmt) {
	var o = {
		"M+": this.getMonth() + 1, //月份 
		"d+": this.getDate(), //日 
		"h+": this.getHours(), //小时 
		"m+": this.getMinutes(), //分 
		"s+": this.getSeconds(), //秒 
		"q+": Math.floor((this.getMonth() + 3) / 3), //季度 
		"S": this.getMilliseconds() //毫秒 
	};
	if(/(y+)/.test(fmt)) {
		fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	}
	for(var k in o) {
		if(new RegExp("(" + k + ")").test(fmt)) {
			fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
		}
	}
	return fmt;
}
var dateUtils = {
	UNITS: {
		'年': 31557600000,
		'月': 2629800000,
		'天': 86400000,
		'小时': 3600000,
		'分钟': 60000,
		'秒': 1000
	},

	humanize: function(milliseconds) {
		var humanize = '';
		mui.each(this.UNITS, function(unit, value) {
			if(milliseconds >= value) {
				humanize = Math.floor(milliseconds / value) + unit + '前';
				return false;
			}
			return true;
		});
		return humanize || '刚刚';
	},
	format: function(dateStr) {
		var date = new Date(parseInt(dateStr) * 1000);
		var diff = Date.now() - date.getTime();
		if(diff < this.UNITS['天']) {
			return this.humanize(diff);
		}
		return date.format("yyyy-MM-dd hh:mm");
	}
};

/*
 * 更新用户位置的方法，注意：自己只能更新自己的，用session判断更新谁的
 * 传入map：Point对象
 * callback回掉函数
 * ecallback错误回掉函数
 */
var updatePos = function(pos, callback, ecallback) {
	var longitude = pos.longitude;
	var latitude = pos.latitude;
	//将位置发送到服务器
	app.request('Service', 'updateUserPos', {
		'longitude': longitude,
		'latitude': latitude
	}, function(res) {
		//服务器方登陆失效
		if(res.login == 0) {
			mui.toast(res.info);
			return app.toLogin(res.info);
		}
		if(callback && typeof callback == "function")
			return callback();
	}, function() {
		if(ecallback && typeof ecallback == "function")
			return ecallback();
	}, "none");
}

//方法一扩展（C#中PadLeft、PadRight）
String.prototype.PadLeft = function(len, charStr) {
	var s = this + '';
	return new Array(len - s.length + 1).join(charStr, '') + s;
}
String.prototype.PadRight = function(len, charStr) {
	var s = this + '';
	return s + new Array(len - s.length + 1).join(charStr, '');
}

//格式化订单编号
function format_id(id) {
	return id.toString().PadLeft(11, '0');
}

/*
 * 使用map插件进行定位
 * m：地图插件对象plus.Maps.map
 * callback(plus.maps.point):成功回调
 * ecallback(string):失败回调
 */
function mapGetPos(m, callback, ecallback) {
	m.getUserLocation(function(state, pos) {
		if(state == 0) {
			if(callback && typeof callback == "function")
				callback(pos);
		} else {
			if(ecallback && typeof ecallback == "function") {
				var message = "获取当前位置失败，请检查GPS权限或地图模块";
				ecallback(message);
			}
		}
	});
}

//由gps模块获得定位,callback(plus.maps.Point)成功回调，ecallback(string)失败回调
function geoGetPos(callback, ecallback) {
	//geo模块获得position转换为map可用的point类型
	plus.geolocation.getCurrentPosition(function(pos) {
		var p = new plus.maps.Point(pos.coords.longitude, pos.coords.latitude);
		if(callback && typeof callback == "function")
			callback(p);
	}, function(e) {
		if(ecallback && typeof ecallback == "function")
			ecallback(e.message);
	}, {
		enableHighAccuracy: true,
		provider: "baidu"
	});
}

//plus gps监控位置
function geoWatchPos(callback) {
	//plus监控位置变化
	plus.geolocation.watchPosition(function(p) {
		var ps = new plus.maps.Point(p.coords.longitude, p.coords.latitude);
		updatePos(ps, callback);
	}, function(e) {
		mui.toast('Geolocation error: ' + e.message);
	}, {
		enableHighAccuracy: true,
		maximumAge: 5000,
		provider: "baidu"
	});
}

//map 插件监控位置
function mapWatchPos(map, callback) {
	var inter= setInterval(function() {
		map.getUserLocation(function(state, pos) {
			if(state == 0) {
				updatePos(pos,callback);
			} else {
				mui.alert('无法实时监控位置，请打开GPS或检查权限后，重试');
				clearInterval(inter);
			}
		})
	}, 5000);
}