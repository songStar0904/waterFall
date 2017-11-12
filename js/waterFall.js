(function(){
	'user strict';
	// 惰性载入兼容绑定函数
	var addEvent = function(element, type, handler, ec) {
	    if(element.addEventListener) {
	      addEvent = function(element, type, handler) {
	        element.addEventListener(type, handler, false);
	      };
	    } else if(element.attachEvent) {
	      addEvent = function(element, type, handler) {
	        element.attachEvent('on' + type, handler);
	      };
	    } else {
	      addEvent = function(element, type, handler) {
	        element['on' + type] = handler;
	    };
    }
      addEvent(element, type, handler);
    };
	var ajax = function(type, url, params, callback) {
		if (!callback) {
			callback = params;
			params = null;
		}
		var xhr = new XMLHttpRequest();
		xhr.open(type, url, true);
		xhr.send(params);
		xhr.onreadystatechange = function(){
			if (xhr.readyState === 4) {
				if (xhr.status === 200 || xhr.status === 304) {
					callback(JSON.parse(xhr.response));
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
		this.managing = false;
		this.scrollDelay = null;
		this.resizeDelay = null;
		this.count;
		this.start = 0;
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
		// 获得每排能放图片的最大数量
	    getColumnCount: function(){
	    	let opt = this.opt;
	    	// 左一图片没有坐外边距 所以要加一个外边距
	    	return Math.max(1, Math.floor((document.body.offsetWidth + opt.gap_width) / (opt.width + opt.padding * 2 + opt.gap_width * 2)));
	    },
	    // 预加载图片
		preLoadImg: function(src, callback) {
			var img = new Image();
			img.src = src;
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
					callback(img.width, img.height);
				}
			}
		},
	    resetHeight: function(count){
	    	this.columnHeights = [];
	    	for (var i = 0; i < count; i++) {
	    		this.columnHeights.push(0);
	    	}
	    	this.cells.style.width = (count * (this.cell_width) - this.opt.gap_width) + 'px';
	    },
	    adjustCell: function(cells, reflow){
	    	console.log(cells)
	    	var min_index, min_height, style, img_height, img;
	    	console.log(this.columnHeights)
	    	for (var i = 0, len = cells.length; i < len; i++) {
		    	img = cells[i].getElementsByTagName('img')[0];
		    	img.width = this.opt.width;
		    	((i) => {
		    		this.preLoadImg(img.src, (width, height) =>{
		    			min_height = Math.min.apply(null, this.columnHeights);
		    	        min_index = this.columnHeights.indexOf(min_height);
			    		img_height = parseInt(height * this.opt.width/width);
			    		console.log(img_height, this.columnHeights, min_index)
			    		style = cells[i].style;
				    	style.height = img_height + 'px';
				    	style.top = min_height + 'px';
				    	style.left = (min_index * this.cell_width) + 'px';
				    	this.columnHeights[min_index] += img_height + this.opt.gap_height + this.opt.padding * 2;
				    	(this.cells.style.height = Math.max.apply(null, this.columnHeights) + 'px');
				    	if (!reflow) {
				    		cells[i].className = 'cell ready';
				    	}
			    	})
			    })(i);
	    	}
	    },
	    appendCell: function(count) {
	    	var fragment = document.createDocumentFragment();
	    	var cells = [], cell, images, image;
	    	jsonp('https://api.douban.com/v2/movie/top250',{start: this.start, count}, (res) =>{
	    	    images = res.subjects;
	    	// ajax('get', 'http://120.77.174.93/dbmovie?start=' + this.start + '&count=' + count, (res) =>{
	    	// 	images = res;
	    		for (var i = 0, len = images.length; i < len; i++) {
	    			cell = document.createElement('div');
	    			image = document.createElement('img');
	    			console.log(images[i])
	    			image.src = images[i].images.medium;
	    			image.title = images[i].title;
	    			cell.appendChild(image);
	    			cell.className = 'cell pending';
	    			cells.push(cell);
	    			fragment.append(cell)
	    		}
	    		this.start += count;
	    		this.cells.appendChild(fragment);
	    		this.adjustCell(cells)
	    	})
	    },
	    // scroll监听懒加载
	    manageCells: function(){
	    	if (this.cells.getBoundingClientRect().bottom < this.cells.offsetHeight) {
	    		this.appendCell(this.count * 2);
	    	}
	    },
	    // resize改变执行
	    reflowCells: function(){
	    	this.count = this.getColumnCount();
	    	if (this.columnHeights.length != this.count) {
	    		this.resetHeight(this.count);
	    		this.adjustCell(this.cells.children, true)
	    	} else {
	    		this.manageCells()
	    	}
	    },
	    // 延迟scroll改变
	    delayScroll: function(){
	    	clearTimeout(this.scrollDelay);
	    	this.scrollDelay = setTimeout(()=>{
	    		this.manageCells()
	    	}, 500);
	    	
	    },
	    // 延迟resize改变
	    delayResize: function(){
	    	clearTimeout(this.resizeDelay);
	    	this.resizeDelay = setTimeout(()=>{
	    		this.reflowCells();
	    	}, 500);
	    },
	    // 初始化函数
	    init: function(){
			this.count = this.getColumnCount();
			this.resetHeight(this.count);
			this.appendCell(this.count * 2);
			addEvent(window, 'scroll', this.delayScroll.bind(this));
			addEvent(window, 'resize', this.delayResize.bind(this));
		}
	}
	window.WaterFall = WaterFall;
})(window);
