
	'user strict';
	// 惰性载入兼容绑定函数
	var addEvent = (function(el, type, callback){
		if (el.addEventListener) {
			return function(el, type, callback) {
				el.addEventListener(type, callback, false);
			}
		} else if (el.attachEvent) {
			return function(el, type, callback) {
				el.attachEvent('on' + type, callback);
			}
		} else {
			return function(el, type, callback) {
				el[on + 'type'] = callback;
			}
		}
	});
	var ajax = function(type, url, params, callback) {
		if (!callback) {
			callback = params;
			params = null;
		}
		var xhr = new XMLHttpRequest();
		xhr.open(type, url, true);
		xhr.send(params);
		xhr.onreadystatechange = function(){
			if (xhr.readystate === 4) {console.log(xhr)
				if (xhr.status === 200 || xhr.status === 304) {
					callback(xhr.response);
				} else {
					callback(xhr.status);
				}
			}
		}
	};
	var jsonp = function (url, data, callback){
		var params = '';
		for (var i in data){
			params += i + '=' + data[i] + '&';
		}
		var script = document.createElement('script');
		script.src = url + '?' + params + 'callback=callback';
		document.body.insertBefore(script, document.body.firstChild);
		window.callback = function(res){
            callback(res);
        }  
	}
	function WaterFall(){
		this.columnHeights; //计算高度数组
		this.opt = {
			 width: 190, // 图片宽度
			 padding: 15, //cell 的内边距
			 gap_width: 15, // cell 外边距宽
			 gap_height: 15, // cell 外边距高
		}
		this.cell_width = this.opt.width + this.opt.padding * 2 + this.opt.gap_width * 2;
		this.cells = document.getElementById('cells');
		this.init();
	};
	WaterFall.prototype = {
		init: function(){
			var count = this.getColumnCount();
			this.resetHeight(count);
			this.appendCell(count * 2);
		},
		// 获得每排能放图片的最大数量
	    getColumnCount: function(){
	    	return Math.max(1, Math.floor((document.body.offsetWidth + this.opt.gap_width) / (this.opt.width + this.opt.gap_width)));
	    },
	    // 预加载图片
		preLoadImg: function(img, callback) {
			// var img = new Image();
			// img.src = src;
			if (!!window.ActiveXObject) {
				// ie
				img.onrendystatechange = function(){
					if (this.readyState == 'complete') {
						callback();
					}
				}
			} else {
				// 非ie
				img.onload = function() {
					callback();
				}
			}
		},
	    resetHeight: function(count){
	    	this.columnHeights = [];
	    	for (var i = 0; i < count; i++) {
	    		this.columnHeights.push(0);
	    	}
	    	this.cells.style.width = (count * (this.cell_width) - this.opt.gap_width)
	    },
	    adjustCell: function(cells){
	    	console.log(cells)
	    	var min_index, min_height, style, img_height, img;
	    	console.log(this.columnHeights)
	    	for (var i = 0, len = cells.length; i < len; i++) {
	    		min_height = Math.min.apply(null, this.columnHeights);
		    	min_index = this.columnHeights.indexOf(min_height);
		    	console.log(cells[i], min_height)
		    	img = cells[i].getElementsByTagName('img')[0];
		    	img.width = this.opt.width;
		    	((i) => {
		    		this.preLoadImg(img, () =>{
			    		img_height = img.offsetHeight;
			    		console.log(img_height, this.columnHeights, min_index)
			    		style = cells[i].style;
				    	style.height = (img_height + this.opt.padding) + 'px';
				    	style.top = min_height + 'px';
				    	style.left = (i * this.cell_width) + 'px';
				    	this.columnHeights[min_index] = this.columnHeights[min_index] + img_height + this.opt.gap_height;
			    	})
			    })(i);
	    	}
	    },
	    appendCell: function(count) {
	    	var fragment = document.createDocumentFragment();
	    	var cells = [], cell, images, image;
	    	jsonp('http://api.douban.com/v2/movie/top250',{start: 0, count}, (res) =>{
	    		images = res.subjects;
	    		console.log(images)
	    		for (var i = 0, len = images.length; i < len; i++) {
	    			cell = document.createElement('div');
	    			image = document.createElement('img');
	    			image.src = images[i].images.medium;
	    			image.title = images[i].title;
	    			cell.appendChild(image);
	    			cell.className = 'cell pending';
	    			cells.push(cell);
	    			fragment.append(cell)
	    		}
	    		this.cells.appendChild(fragment);
	    		this.adjustCell(cells)
	    	})
	    }

	}
