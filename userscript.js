// ==UserScript==
// @name               Instagram: Download Photo & Video
// @name:zh-TW         Instagram 下載照片、影片
// @name:zh-CN         Instagram 下载照片、视频
// @name:ja            Instagram 写真とビデオのダウンロード
// @name:ko            Instagram 사진 및 비디오 다운로드
// @name:ru            Instagram скачать фото и видео
// @version            1.0.12
// @description        Download photo or video by one button click.
// @description:zh-TW  即按下載 Instagram 照片或影片。
// @description:zh-CN  一键下载 Instagram 照片或视频。
// @description:ja     ボタンをクリックするだけで写真やビデオをダウンロードできます。
// @description:ko     한 번의 클릭으로 사진 또는 비디오를 다운로드하십시오.
// @description:ru     Скачать фото или видео одним нажатием кнопки.
// @author             Hayao-Gai
// @namespace          https://github.com/HayaoGai
// @icon               https://i.imgur.com/obCmlr9.png
// @match              https://www.instagram.com/*
// @grant              none
// ==/UserScript==

/* jshint esversion: 6 */

(function() {
    'use strict';

    // iconDownload made by https://www.flaticon.com/authors/freepik
    // iconNewtab made by https://www.flaticon.com/authors/those-icons
    const iconDownload = `<svg width="24" height="24" viewBox="0 0 512 512"><g><g><path d="M472,313v139c0,11.028-8.972,20-20,20H60c-11.028,0-20-8.972-20-20V313H0v139c0,33.084,26.916,60,60,60h392 c33.084,0,60-26.916,60-60V313H472z"></path></g></g><g><g><polygon points="352,235.716 276,311.716 276,0 236,0 236,311.716 160,235.716 131.716,264 256,388.284 380.284,264"></polygon></g></g></svg>`;
    const iconNewtab = `<svg width="24" height="24" viewBox="0 0 482.239 482.239"><path d="m465.016 0h-344.456c-9.52 0-17.223 7.703-17.223 17.223v86.114h-86.114c-9.52 0-17.223 7.703-17.223 17.223v344.456c0 9.52 7.703 17.223 17.223 17.223h344.456c9.52 0 17.223-7.703 17.223-17.223v-86.114h86.114c9.52 0 17.223-7.703 17.223-17.223v-344.456c0-9.52-7.703-17.223-17.223-17.223zm-120.56 447.793h-310.01v-310.01h310.011v310.01zm103.337-103.337h-68.891v-223.896c0-9.52-7.703-17.223-17.223-17.223h-223.896v-68.891h310.011v310.01z"></path></svg>`;
    let updating = false;

    init();
    locationChange();
    window.addEventListener("scroll", update);

    function update() {
        if (updating) return;
        updating = true;
        init();
        setTimeout(() => { updating = false; }, 1000);
    }

    function init(retry = 0) {
        // get
        const panels = document.querySelectorAll("section.ltpMr.Slqrh:not(.section-set)");
        // check
        if (!panels.length && retry < 10) {
            setTimeout(() => init(retry + 1), 500);
            return;
        }
        // section
        panels.forEach(panel => {
            panel.classList.add("section-set");
            waitInstagram(panel);
        });
    }

    function waitInstagram(panel, retry = 0) {
        // wait until instagram ready.
        if (panel.childNodes.length < 4 && retry < 10) {
            setTimeout(() => waitInstagram(panel, retry + 1), 500);
            return;
        }
        // button 1: download
        // firefox doesn't support direct download function.
        const isFirefox = typeof InstallTrigger !== 'undefined';
        if (!isFirefox) addButton(panel, "download-set", iconDownload);
        // button 2: new tab
        addButton(panel, "newtab-set", iconNewtab);
    }

    function addButton(panel, className, icon) {
        // create
        const button = document.createElement("button");
        button.classList.add("dCJp8", "afkep", className);
        button.innerHTML = icon;
        button.addEventListener("click", onClick);
        panel.lastElementChild.before(button);
    }

    function onClick() {
        const parent = this.closest(".eo2As").previousElementSibling;
        // a page panel under photo or video, it means there is only one photo or video if not exists.
        const single = !parent.querySelectorAll("._3eoV-.IjCL9").length;
        // photo: .FFVAD
        // video: video
        const files = !!parent.querySelectorAll(".FFVAD").length ? parent.querySelectorAll(".FFVAD") : parent.querySelectorAll("video");
        const link = single ? files[0].src : detectIndex(parent, files);
        download(this.className.includes("download"), link, this.closest("article"));
    }

    function detectIndex(parent, files) {
        // detect position by 2 dynamic arrow buttons on the view panel.
        const prev = parent.querySelectorAll(".POSa_").length;
        const next = parent.querySelectorAll("._6CZji").length;
        // first
        if (!prev && !!next) return files[0].src;
        // middle || last
        else return files[1].src;
    }

    function download(download, link, article) {
        if (download) {
            fetch(link).then(t => {
                return t.blob().then(b => {
                    const a = document.createElement("a");
                    const name = `${getUser(article)}_${getTime(article)}${getIndex(article)}`;
                    a.href = URL.createObjectURL(b);
                    a.setAttribute("download", name);
                    a.click();
                });
            });
        } else {
            const tab = window.open(link, '_blank');
            tab.focus();
        }
    }

    // function made by Paul Dmytrewycz.
    function getUser(article) {
        return article.querySelector(".e1e1d a").innerText;
    }

    function getTime(article) {
        const date = article.querySelector("time").dateTime.split(/[-,T]/);
        return `${date[0]}${date[1]}${date[2]}`;
    }

    function getIndex(article) {
        const index = article.querySelectorAll(".Yi5aA");
        if (index.length > 1) {
            // multiple
            return `-${[...index].findIndex(index => index.classList.contains("XCodT")) + 1}`;
        } else {
            // single
            return "";
        }
    }

    function locationChange() {
        window.addEventListener('locationchange', init);
        // situation 1
        history.pushState = (f => function pushState(){
            var ret = f.apply(this, arguments);
            window.dispatchEvent(new Event('pushState'));
            window.dispatchEvent(new Event('locationchange'));
            return ret;
        })(history.pushState);
        // situation 2
        history.replaceState = (f => function replaceState(){
            var ret = f.apply(this, arguments);
            window.dispatchEvent(new Event('replaceState'));
            window.dispatchEvent(new Event('locationchange'));
            return ret;
        })(history.replaceState);
        // situation 3
        window.addEventListener('popstate', () => {
            window.dispatchEvent(new Event('locationchange'));
        });
    }

})();
