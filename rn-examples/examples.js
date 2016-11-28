/*****************************************************
 Код примеров
 *****************************************************/
 
function drawData($node, data) {
	$node.html(JSON.stringify(data).replace(/":"/g, '": "').replace(/","/g, '", "'));
}

//=======================================================
//		RatingBar
//=======================================================

function CtrlRatingBar() {
	this.superClass = "Value";
	var $bar, $stars;
	this.value = this.value0 = 1;
	this.render = function() {
		var i, ctrl = this;
		ctrl.Value_render();
		$bar = $('.rating-bar', ctrl.$def);
		for (i=0; i<5; i++) {
			Rn.tm('TmRatingStar',0,$bar);
		}
		$stars = $('.rating-star', $bar).click(function(){
			ctrl.setValue($stars.index(this)+1);
			return false;
		});
		ctrl.val2dom();
		// Совместимость с классическими формами
		if (ctrl.support)
			this.$edit = $('<input>').attr({type:'hidden', name:ctrl.name})
				.val(this.value).appendTo(ctrl.$def);
	}
	this.val2dom = function() {
		var value = this.value;
		$stars.each(function(i){
			$(this).toggleClass('active',i<value);
		});
		if (this.$edit)
			this.$edit.val(value);
	}
	this.dom2val = function() {
	}
}

//======================================================
//		FormPerson
//======================================================

var g_DocTypes = {
	"1": { label:"Паспорт РФ", docRex:/^\d{10}$/, nameRex:/^[- А-ЯЁ]*$/i, fmt:'12 12 123456'},
	"2": { label:"Загранпаспорт", docRex:/^\d{9}$/, nameRex:/^[- A-Z]*$/i, fmt:'12 1234567'},
	"3": { label:"Свидетельство о рождении", docRex:/^[IVXL]+[А-ЯЁ]{2}\d{6}$/ ,
			nameRex:/^[- А-ЯЁ]*$/i, fmt:'VI БЯ 123456'},
	"4": { label:"Другой документ", docRex:/^.+$/, nameRex:/^[- A-ZА-ЯЁ]*$/i, fmt:'Любые символы'}
}, docRF=1, docInt=2, docBC=3; // Константы типов документов

// Требование № 4. Удаление разделительных символов
function filterDocNumber(docNumber) {
	return docNumber.replace(/[- №]/g, '');
}

// Класс формы ввода персональных данных
function FormPerson() {
	this.superClass = 'Base';
	this.onUpdate = function() {
		var docType = this.ctrls.docType.val();
		this.ctrls.midName.show(docType != docInt);
	}
	this.onReset = function() {
		$('#Result').empty();
	}
	this.onSubmit = function() {
		var data = this.save({}, true);
		drawData($('#Result'), data);
	}
	var $errMsg = null;
	this.check = function(errList) {
		$errMsg = $errMsg || $('.err-msg', this.$def);
		$errMsg.toggle(!!errList.length);
		if (errList.length) {
			var record = errList[0];
			$errMsg.html(record.msg);
			$errMsg.click(function(){
				if (record.ctrl)
					record.ctrl.focus();
				return false;
			});
		}
	}
}
// Контроллер типа документа
function CtrlDocList() {
	this.superClass = "Droplist";
	var lastTariff, lastDocType;
	this.onUpdate = function() {
		var tariff = this.owner.ctrls.tariff.val();
		var docType = this.value;
		// Требование № 6: Для детского тарифа убирать Паспорт РФ
		if (lastTariff != tariff) {
			lastTariff = tariff;
			if (lastTariff=='Kid' && docType==docRF)
				this.setValue(docBC);
			this.buildList();
		}
		if (docType != lastDocType) {
			lastDocType = docType;
			// Требование № 5: Вывод подсказки с форматом номера
			var helpText = g_DocTypes[docType].fmt;
			this.form.$def.find('.docnum-fmt').text(helpText);
		}
	}
	this.isValidOption = function(value, label) {
		return !(lastTariff=='Kid' && value==docRF);
	}
}
// Валидатор номера документа
function ValidatorDocNumber() {
	this.superClass = 'Regexp';
	// Использовать регулярное выражение для текущего типа документа
	this.getRegexp = function() {
		var docType = this.ctrl.owner.ctrls.docType.val();
		return g_DocTypes[docType].docRex;
	}
	// Требование № 4: удаление разделительных символов
	this.check = function(value) {
		return this.Regexp_check(filterDocNumber(value));
	}
}
// Требование № 4: удаление разделительных символов
function FilterDocNumber() {
	this.superClass = 'Base';
	this.filter = function(dstObj) {
		dstObj.docNumber = filterDocNumber(dstObj.docNumber);
	}
}
// Проверка значений ФИО, в зависимости от типа документа
function ValidatorPassName() {
	this.superClass = 'Base';
	this.check = function(value) {
		var docType = this.ctrl.owner.ctrls.docType.val();
		var regExp = g_DocTypes[docType].nameRex;
		return regExp.test(value) ? 0 : this.msg;
	}
}
// Требование к полю Отчество:
// обязательно для заполнения только для типов документа docRF и docBC.
function ValidatorNonEmptySometime() {
	this.superClass = 'Base';
	this.check = function(value) {
		if (value=='') {
			var docType = this.ctrl.owner.ctrls.docType.val();
			if (docType==docRF || docType==docBC)
				return this.msg;
		}
	}
}

//==================================================================
//		IntSlider
//==================================================================

function CtrlIntSlider() {
	this.superClass = "String";
	var $slider, sliderWidth,
		$tracker, trackerWidth,
		screenWidth = 0;
	this.$slider = 0;
	this.msg = g_Lang.sliderMsg;
	this.msg_min = g_Lang.sliderMin;
	this.msg_max = g_Lang.sliderMax;
	this.min = this.value0 = 0;
	this.max = 100;
	function getRange(ctrl) {
		var range = {a:+ctrl.min, b:+ctrl.max};
		range.w = range.b - range.a;
		return range;
	}
	function bound(range, value) {
		return Math.max(Math.min(value, range.b), range.a);
	}
	function world2screen(ctrl, value) {
		var range = getRange(ctrl);
		if (range.w && $tracker) {
			var dx = (bound(range, value)-range.a) * screenWidth / range.w;
			$tracker.css('left', dx);
		}
	}
	function screen2world(ctrl, pos) {
		var range = getRange(ctrl);
		if (screenWidth && $tracker) {
			var worldValue = bound(range, Math.round(pos * range.w / screenWidth + range.a));
			ctrl.$edit.val(worldValue);
			ctrl.fromDOM();
			$tracker.css('left', bound({a:0, b:screenWidth}, pos));
		}
	}
	this.render = function() {
		var ctrl = this;
		ctrl.String_render();
		ctrl.$slider = $slider = $('.slider', ctrl.$def);
		$tracker = $('<div>').addClass('tracker').prependTo($slider);
		// Размеры в пикселях
		trackerWidth = $tracker.outerWidth();
		sliderWidth = $slider.innerWidth();
		screenWidth = sliderWidth - trackerWidth;
		var state=0, trackX;
		function calcScreenPos(ev) {
			return ev.pageX - trackX - $slider.offset().left;
		}
		// Обработка событий перетаскивания ползунка
		function beginDrag(ev) {
			state=1;
			trackX = ev.pageX - $tracker.offset().left;
		}
		function endDrag(ev) {
			state=0;
			world2screen(ctrl, ctrl.value);
		}
		function drag(ev) {
			if (!state) return;
			screen2world(ctrl, calcScreenPos(ev));
			ev.preventDefault();
		}
		$tracker.mousedown(beginDrag).on('touchstart', beginDrag);
		$(window).mouseup(endDrag).on('touchend', endDrag).on('touchcancel', endDrag)
		.mousemove(drag).on('touchmove', drag);
		// Просто клик на рабочую область слайдера
		// позиционирует ползунок на место клика.
		$slider.click(function(ev){
			trackX = trackerWidth/2;
			screen2world(ctrl, calcScreenPos(ev));
			return false;
		});
		world2screen(this, this.value);
	}
	this.check = function(errList) {
		var val = this.value;
		if (!/^-?\d+$/.test(val))
			return this.msg;
		if (val<this.min)
			return Rn.templText(this.msg_min, this);
		if (val>this.max)
			return Rn.templText(this.msg_max, this);
		return this.String_check(errList);
	}
	this.isRequired = function() {
		return !!this.required;
	}
	this.val2dom = function() {
		this.String_val2dom();
		world2screen(this, this.value);
	}
	this.dom2val = function() {
		this.String_dom2val();
		world2screen(this, this.value);
	}
	this.validValue = function() {
		return Math.max( Math.min(this.value || 0, +this.max), +this.min);
	}
}

function FormPolygon() {
	this.superClass = 'Classic';
	var $svg;
	this.onPostUpdate = function() {
		if (!this.ok)
			return; // Не обновлять, если есть ошибки в значениях полей
		var ctrls = this.ctrls,
			N = +ctrls.N.value,
			R = +ctrls.R.value,
			Phi = +ctrls.Phi.value;
		var	i, alpha, delta=Math.PI*2/N,
			phi = Math.PI * Phi / 180,
			$svg = $svg || $('.polygon-img', this.$def),
			d='', d1='', x, y;
		for (i=0; i<N; i++) {
			alpha = i * delta + phi;
			x = Math.round(Math.sin(alpha)*R)+100;
			y = Math.round(-Math.cos(alpha)*R)+100;
			d+= d.length==0 ? 'M' : 'L';
			d+=x+' '+y;
			d1+='M100 100 L'+x+' '+y;
		}
		d += ' z';
		Rn.tm('TmPolygonImg', {i:d1, e:d}, $svg, 1);
	}
}

//================================================
//	Color picker demo
//================================================

function makeRGB(a) {
	return 'rgb('+a[0]+','+a[1]+','+a[2]+')';;
}
function makeRGB1(a) {
	var i, b=[]
	for (i=0; i<3; i++)
		b[i] = Math.floor(a[i]*255);
	return makeRGB(b);
}

//====================================
function cvtRGBtoHSL(r, g, b) {
	var H, S, L,
		cmin = Math.min(r, g, b),
		cmax = Math.max(r, g, b);
	if (cmin==cmax) {
		H = S = 0;
		L = cmin;
	} else {
		L = (cmin+cmax)/2;
		S = 0.5*(cmax-cmin)/(L > 0.5 ? 1-L : L);
		var val, part;
		if (cmax==r) {	// red maximum
			if (cmin==b) {
				part = 0;	val = g;
			} else {
				part = 5;	val = 1-b;
			}
		} else if (cmax==g) {	// green maximum
			if (cmin==r) {
				part = 2;	val = b;	// blue up
			} else {
				part = 1;	val = 1-r;	// red down
			}
		} else {	// blue maximum
			if (cmin==g) {
				part = 4;	val = r;	// red up
			} else {
				part = 3;	val = 1-g;	// green down
			}
		}
		H = (part+val)/6;
	}
	return [H,S,L];
} // cvtRGBtoHSL

// Входные и выходные значения в диапазоне от 0 до 1
function cvtHSLtoRGB(H, S, L) {
	var	Nr=0, Ng=1, Nb=2,	// номера RGB-компонент
		rgb=[0,0,0];
	function initH(hi, lo, med, v) {
		rgb[hi] = 1;
		rgb[lo] = 0;
		rgb[med] = v;
	}
	H *= 6;	// hue
	if (H>=6) H=0;
	var n = Math.floor(H);
	switch (n) {
	case 1:
		initH(Ng, Nb, Nr, 2-H); break;
	case 2:
		initH(Ng, Nr, Nb, H-2);	break;
	case 3:
		initH(Nb, Nr, Ng, 4-H);	break;
	case 4:
		initH(Nb, Ng, Nr, H-4);	break;
	case 5:
		initH(Nr, Ng, Nb, 6-H);	break;
	default:
		initH(Nr, Nb, Ng, H);	break;
	}
	// saturation
	var j, sn = 1-S, Cs;
	for (j=0; j<3; j++) {
		Cs = rgb[j];
		rgb[j] = Cs + sn*(0.5-Cs);
	}
	// lightness
	var l2 = 2*L;
	if (l2>1.0) {
		l2 -= 1;
		for (j=0; j<3; j++) {
			Cs=rgb[j];
			rgb[j] = Cs+(1-Cs)*l2;
		}
	} else {
		for (j=0; j<3; j++) {
			rgb[j] *= l2;
		}
	}
	return rgb;
} // cvtHSLtoRGB

//====================================
function CtrlColorComponent() {
	this.superClass = 'IntSlider';
	this.min = 0;
	this.fromDOM = function() {
		this.form.changedChannel = this.name;
		this.IntSlider_fromDOM();
	}
	// Установить фоновый градиент
	// colors - массив цветов, например ['#000','#FFF']
	this.setGradient = function(colors) {
		this.$slider.css('background', 'linear-gradient(to right,'+colors.join(',')+')');
	}
}


function CtrlRGBChannel() {
	this.superClass = 'ColorComponent';
	this.max = 255;
	
	var prevKey;
	this.onUpdate = function() {
		var color1=this.form.getRGB(),
			color2=[], i;
		for (i=0; i!=3; i++) {
			if ("RGB"[i]==this.name) {
				color1[i] = 0;
				color2[i] = 255;
			} else {
				color2[i] = color1[i];
			}
		}
		var c1 = makeRGB(color1), c2 = makeRGB(color2),
			key = c1+c2;
		if (key!==prevKey) {
			prevKey = key;
			this.setGradient([c1, c2]);
		}
	}
}

function CtrlSaturation() {
	this.superClass = 'ColorComponent';
	var prevKey;
	this.onUpdate = function() {
		var ctrls = this.form.ctrls,
			H = ctrls.H.validValue()/360,
			L = ctrls.L.validValue()/100,
			low = makeRGB1(cvtHSLtoRGB(H,0,L)),
			med = makeRGB1(cvtHSLtoRGB(H,0.5,L)),
			hi = makeRGB1(cvtHSLtoRGB(H,1,L)),
			key = low+med+hi;
		if (key !== prevKey) {
			prevKey = key;
			this.setGradient([low,med,hi]);
		}
	}
}
// Контроллер для ввода HTML-цвета
function CtrlHTMLColor() {
	this.superClass = 'String';
	this.fromDOM = function() {
		this.form.changedChannel = this.name;
		this.String_fromDOM();
	}
	this.getRGB = function() {
		var i, rgb=[0,0,0], srcValue = this.value;
		if (!/^[\dA-F]+$/i.test(srcValue))
			return 0;
		if (srcValue.length==6) {
			for (i=0; i<3; i++)
				rgb[i] = parseInt(srcValue.slice(i*2,i*2+2), 16);
		} else if (srcValue.length==3) {
			for (i=0; i<3; i++) {
				var v = parseInt(srcValue[i],16);
				rgb[i] = v + (v << 4);
			}
		} else return 0;
		return rgb;
	}
	this.check = function() {
		if (!this.getRGB())
			return this.msg;
	}
}

//==============================
function FormColorPicker() {
	this.superClass = 'Base';
	this.changedChannel = 0;
	this.getRGB = function() {
		var ctrls = this.ctrls;
		return [ctrls.R.validValue(),
			ctrls.G.validValue(), ctrls.B.validValue()];
	}
	var Hex = '0123456789ABCDEF';
	function hexStr(v) {
		return Hex[v >> 4] + Hex[v & 0xF];
	}
	this.htmlColor = function() {
		var rgb = this.getRGB();
		return hexStr(rgb[0]) + hexStr(rgb[1]) + hexStr(rgb[2]);
	}
	var prevColor, $colorDemo, lastChannel;
	this.onUpdate = function() {
		var c = this.changedChannel;
		if (c) {
			lastChannel = c;
			this.changedChannel = 0;
			if ("RGB".indexOf(c)>=0) {
				this.rgb2hsl();
			} else if ("HSL".indexOf(c)>=0) {
				this.hsl2rgb();
			} else if (c=='html') {
				var i, ctrls = this.ctrls,
					rgb = ctrls.html.getRGB();
				if (rgb) for (i=0; i<3; i++)
					ctrls["RGB"[i]].setValue(rgb[i]);
				this.rgb2hsl();
			}
		}
		var color = this.htmlColor();
		if (prevColor !== color) {
			prevColor = color;
			$colorDemo = $colorDemo || $('.color-demo', this.$def);
			$colorDemo.css('background-color', '#'+color);
			if (lastChannel!='html') {
				this.ctrls.html.setValue(color);
			} else lastChannel = 0;
		}
	}
	this.rgb2hsl = function() {
		prevLocker = this.changeCounter;
		var ctrls=this.ctrls,
			b = ctrls.B.validValue()/255,
			g = ctrls.G.validValue()/255,
			r = ctrls.R.validValue()/255,
			hsl = cvtRGBtoHSL(r,g,b);
		
		ctrls.H.setValue(Math.floor(hsl[0]*360));
		ctrls.S.setValue(Math.floor(hsl[1]*100));
		ctrls.L.setValue(Math.floor(hsl[2]*100));
	}	// rgb3hsl
	
	this.hsl2rgb = function() {
		var i, ctrls = this.ctrls,
			H = ctrls.H.validValue()/360,
			S = ctrls.S.validValue()/100,
			L = ctrls.L.validValue()/100,
			rgb = cvtHSLtoRGB(H,S,L);
		for (i=0; i!=3; i++)
			ctrls["RGB"[i]].setValue(Math.floor(255*rgb[i]));
	}	// hsl2rgb
} // form

