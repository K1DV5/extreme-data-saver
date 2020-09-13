let cacheBuster = 'EXTREME'

document.addEventListener('contextmenu', () => {
    let target = event.target
    if (target.dataset.imageLoaded) return  // set below
    if (target.tagName === 'IMG') {
        let src = target.currentSrc
        chrome.runtime.sendMessage({dontBlockNextUrl: src + cacheBuster}, () => {
            target.srcset = ''
            target.src = src + cacheBuster
            target.dataset.imageLoaded = true  // prevent future click from re downloading
        })
        event.preventDefault()
    } else {
        let bgImg = getComputedStyle(target).backgroundImage
        let urlIndex = bgImg.indexOf('url("')
        if (urlIndex == -1) return
        // if (urlIndex > 0) console.log(bgImg)
        let urlBegin = urlIndex + 5
        let urlEnd = bgImg.indexOf('")', urlBegin)
        let url = bgImg.slice(urlBegin, urlEnd)
        chrome.runtime.sendMessage({dontBlockNextUrl: url + cacheBuster}, () => {
            target.style.backgroundImage = 'url("' + url + cacheBuster + '")'
            target.dataset.imageLoaded = true  // prevent future click from re downloading
        })
        event.preventDefault()
    }
})