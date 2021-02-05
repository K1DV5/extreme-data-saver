let bgPage = chrome.extension.getBackgroundPage()

// TABS FOR OPTIONS
let pageOpt = document.getElementById('pageOpt')
let customOpt = document.getElementById('preferences')

let configText = document.getElementById('config')

document.getElementById('pageOptTab').addEventListener('click', () => {
    document.body.style.width = '16em'
    pageOpt.style.display = 'block'
    customOpt.style.display = 'none'
})

document.getElementById('prefTab').addEventListener('click', () => {
    document.body.style.width = '28em'
    pageOpt.style.display = 'none'
    customOpt.style.display = 'block'
    // show current state
    chrome.storage.local.get(['config'], result => {
        configText.value = result.config
    })
})

// TURN ON/OFF
let switchCheck = document.getElementById('switch-data')
switchCheck.checked = bgPage.savingOn
switchCheck.addEventListener('click', () => {
    if (bgPage.savingOn) {
        bgPage.turn(false)
        event.target.checked = false
    } else {
        bgPage.turn(true)
        event.target.checked = true
    }
})

// save button on custom config tab
document.getElementById('saveConfig').addEventListener('click', event => {
    chrome.extension.getBackgroundPage().parseConfig(configText.value)
    let configs = Object.entries(bgPage.config)
    if (bgPage.config.default.length == 5) configs = configs.slice(1)
    // {url: ['images', ...]} => 'url 01000'
    let newText = configs.map(([url, opt]) => url + ' ' + bgPage.types.map(type => Number(!opt.includes(type))).join('')).join('\n')
    chrome.storage.local.set({config: newText}, () => {
        configText.value = newText
        let prevText = event.target.innerText
        event.target.innerText = 'Saved'
        setTimeout(() => event.target.innerText = prevText, 1000)
    })
})


// PAGE OPTS
let checkBoard = [
    document.getElementById('image'),
    document.getElementById('script'),
    document.getElementById('font'),
    document.getElementById('media'),
]

let optsAtPopup = []  // options at popup

chrome.tabs.query({active: true}, tabs => {
    let url = new URL(tabs[0].url)
    if (['http:', 'https:'].includes(url.protocol)) {
        optsAtPopup = bgPage.config[url.origin] || bgPage.config.default  // to be checked later by details.initiator
        for (let widget of checkBoard) {
            widget.checked = !optsAtPopup.includes(widget.id)
        }
    } else {  // hide irrelevant parts
        document.getElementById('pageOptTab').style.display = 'none'
        document.getElementById('pageOpt').style.display = 'none'
    }
})

document.getElementById('apply').addEventListener('click', () => {
    chrome.tabs.query({active: true}, tabs => {
        let tab = tabs[0]
        // temporarily set different options
        let block = bgPage.types.filter((_, i) => !checkBoard[i].checked)
        if (block.length == optsAtPopup.length && block.every((val, i) => val == optsAtPopup[i]))
            return window.close()  // no change
        let tempo = {tabId: tab.id, block}
        bgPage.tempo = tempo
        let reloadCallback = (tabId, details) => {
            if (tempo && tempo.tabId !== tabId || details.status !== 'complete') return
            bgPage.tempo = undefined
            chrome.tabs.onUpdated.removeListener(reloadCallback)
        }
        chrome.tabs.onUpdated.addListener(reloadCallback)
        chrome.tabs.reload(tempo.tabId)
        window.close()
    })
})


document.getElementById('save').addEventListener('click', event => {
    chrome.tabs.query({active: true}, tabs => {
        let key = new URL(tabs[0].url).origin  // to be checked later in property initiator of details
        bgPage.config[key] = bgPage.types.filter((_, i) => !checkBoard[i].checked)
        let newText = Object.entries(bgPage.config)
            .slice(1)
            .map(([url, opt]) => url + ' ' + bgPage.types.map(type => Number(!opt.includes(type))).join(''))
            .join('\n')
        chrome.storage.local.set({config: newText})
        let prevText = event.target.innerText
        event.target.innerText = 'Saved'
        setTimeout(() => event.target.innerText = prevText, 1000)
    })
})

// YouTube quality

let qualitySelector = document.getElementById('yt-quality')

qualitySelector.value = bgPage.youtubeQuality

qualitySelector.addEventListener('change', () => {
    let quality = event.target.value
    chrome.storage.local.set({youtubeQuality: quality}, () => {
        bgPage.youtubeQuality = quality
    })
})
