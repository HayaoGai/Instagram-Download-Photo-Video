// ==UserScript==
// @name                Instagram: Download Photo & Video
// @name:zh-TW          Instagram 下載照片、影片
// @name:zh-CN          Instagram 下载照片、视频
// @name:ja             Instagram 写真とビデオのダウンロード
// @name:ko             Instagram 사진 및 비디오 다운로드
// @name:ru             Instagram скачать фото и видео
// @version             1.0.15
// @description         Download photo or video by one button click.
// @description:zh-TW   即按下載 Instagram 照片或影片。
// @description:zh-CN   一键下载 Instagram 照片或视频。
// @description:ja      ボタンをクリックするだけで写真やビデオをダウンロードできます。
// @description:ko      한 번의 클릭으로 사진 또는 비디오를 다운로드하십시오.
// @description:ru      Скачать фото или видео одним нажатием кнопки.
// @author              Hayao-Gai
// @namespace           https://github.com/HayaoGai
// @icon                https://i.imgur.com/obCmlr9.png
// @match               https://www.instagram.com/*
// @grant               none
// ==/UserScript==

/* jshint esversion: 6 */

(function() {
    'use strict';

    // iconDownload made by https://www.flaticon.com/authors/freepik
    const iconDownload = `<svg width="24" height="24" viewBox="0 0 512 512" fill="#262626"><g><g><path d="M472,313v139c0,11.028-8.972,20-20,20H60c-11.028,0-20-8.972-20-20V313H0v139c0,33.084,26.916,60,60,60h392 c33.084,0,60-26.916,60-60V313H472z"></path></g></g><g><g><polygon points="352,235.716 276,311.716 276,0 236,0 236,311.716 160,235.716 131.716,264 256,388.284 380.284,264"></polygon></g></g></svg>`;
    // iconNewtab made by https://www.flaticon.com/authors/those-icons
    const iconNewtab = `<svg width="24" height="24" viewBox="0 0 482.239 482.239" fill="#262626"><path d="m465.016 0h-344.456c-9.52 0-17.223 7.703-17.223 17.223v86.114h-86.114c-9.52 0-17.223 7.703-17.223 17.223v344.456c0 9.52 7.703 17.223 17.223 17.223h344.456c9.52 0 17.223-7.703 17.223-17.223v-86.114h86.114c9.52 0 17.223-7.703 17.223-17.223v-344.456c0-9.52-7.703-17.223-17.223-17.223zm-120.56 447.793h-310.01v-310.01h310.011v310.01zm103.337-103.337h-68.891v-223.896c0-9.52-7.703-17.223-17.223-17.223h-223.896v-68.891h310.011v310.01z"></path></svg>`;
    const quality = [ "640w", "750w", "1080w"];
    let currentUrl = document.location.href;
    let updating = false;

    init(10);

    locationChange();

    window.addEventListener("scroll", update);

    function init(times) {
        for (let i = 0; i < times; i++) {
            setTimeout(addButton, 500 * i);
            setTimeout(checkSort, 500 * i);
        }
    }

    function addButton() {
        // get panel
        document.querySelectorAll("section.ltpMr.Slqrh:not(.section-set)").forEach(panel => {
            panel.classList.add("section-set");
            // button 1: download
            // firefox doesn't support direct download function.
            const isFirefox = typeof InstallTrigger !== 'undefined';
            if (!isFirefox) setButton(panel, "download-set", iconDownload);
            // button 2: new tab
            setButton(panel, "newtab-set", iconNewtab);
        });
    }

    function checkSort() {
        // sometimes, the "share" button is created slower than this userscript.
        // this function will sort the button to the original position.
        document.querySelectorAll("section.ltpMr.Slqrh.section-set").forEach(function(panel) {
            const count = panel.childElementCount;
            const penultimate = panel.children[count - 2];
            if (!penultimate.className.includes("wpO6b")) return;
            const custom = panel.querySelector(".dCJp8");
            panel.insertBefore(penultimate, custom);
        });
    }

    function setButton(panel, myClass, icon) {
        // create
        const button = document.createElement("button");
        button.className = `dCJp8 afkep ${myClass}`;
        button.innerHTML = icon;
        button.addEventListener("click", onClick);
        panel.lastElementChild.before(button);
    }

    function onClick() {
        const parent = this.closest(".eo2As").parentNode.parentNode.previousElementSibling;
        // a page panel under photo or video, it means there is only one photo or video if not exists.
        const single = !parent.querySelectorAll("._3eoV-.IjCL9").length;
        const file = single ? parent.querySelector("video") || parent.querySelector("img") : detectIndex(parent, parent.querySelectorAll("li.Ckrof"));
        const link = !!file.srcset ? qualityPhoto(file.srcset) : file.src;
        download(this.className.includes("download"), link, this.closest("article"));
    }

    function detectIndex(parent, files) {
        let file;
        // detect position by 2 dynamic arrow buttons on the view panel.
        const prev = parent.querySelectorAll(".POSa_").length;
        const next = parent.querySelectorAll("._6CZji").length;
        // first
        if (!prev && !!next) file = files[0];
        // middle || last
        else file = files[1];
        return file.querySelector("video") || file.querySelector("img");
    }

    function qualityPhoto(srcset) {
        const srcs = srcset.split(/ |,/);
        for (let i = srcs.length - 1; i > 0; i--) {
            for (let j = quality.length - 1; j > 0; j--) {
                if (srcs[i] === quality[j]) {
                    return srcs[i - 1];
                }
            }
        }
        console.log("Error: there is no any quality of photo.");
        return null;
    }

    function download(isDownload, link, article) {
        if (isDownload) {
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
        return article.querySelector(".e1e1d a").innerText.replace(".", "-");
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

    function update() {
        if (updating) return;
        updating = true;
        init(3);
        setTimeout(() => { updating = false; }, 1000);
    }

    function locationChange() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(() => {
                if (currentUrl !== document.location.href) {
                    currentUrl = document.location.href;
                    init(10);
                }
            });
        });
        const target = document.querySelector("body");
        const config = { childList: true, subtree: true };
        observer.observe(target, config);
    }

})();
