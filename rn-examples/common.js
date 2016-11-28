/*************************************
 Common script file for Radon Examples
 Created 2016-05-18 by PeterWin
*************************************/

var g_Examples = [
	{name: 'FormStd', title:'Стандартные элементы форм'},
	{name: 'RatingBar', title:'Контроллер RatingBar'},
	{name: 'FormPerson', title:'Форма ввода персональных данных'},
	{name: 'Array', title:'Контроллер Array'},
	{name: 'IntSlider', title:'Слайдер для целых чисел'},
	{name: 'ColorPicker', title:'Форма для выбора цвета'}
], g_RnDescr = "Radon - Браузерная система управления данными<br />",
g_APIRef = '../radon.html';

$(function(){
	// Шапка
	var header = $('header').html('<a class="home" href="./index.htm"><b>Radon</b> Сборник примеров</a>');
	var docBox = $('<div>').addClass('doc-box').html(g_RnDescr).appendTo(header);
	$('<a>').attr('href','../radon.html').text('API Документация').appendTo(docBox);
	
	// Определить текущий пример
	var i=g_Examples.length-1, curItem=0, curName = $('html').data('name');
	while (i>=0 && g_Examples[i].name != curName) i--;
	if (i>=0) {
		curItem = g_Examples[i];
		var ref = $('<div>').addClass('api-ref-box');
		$('<a>').attr('href',g_APIRef+'#Ex_'+curItem.name).appendTo(ref).
			text('»Детальное описание примера в составе API Документации');
		// Заголовок
		$('h1').text(curItem.title).after(ref);
	}
	// Сформировать в блоке навигации список ссылок на примеры
	var i, ul = $('<ul>').appendTo('#Sidebar');
	for (i in g_Examples) {
		var item = g_Examples[i];
		var li = $('<li>').appendTo(ul);
		$('<a>').attr('href', item.name+'.htm').text(item.title).appendTo(li).
		toggleClass('current',item==curItem);
	}
	// Footer
	$('footer').text('Copyright 2016 by PeterWin');
});
