types = ['image', 'script', 'font', 'media'] // what to block, in this order
config = {default: types}  // as a global (in window) what to block

function parseConfig(text) {
    config = {default: types}  // as a global (in window)
    for (let line of text.split('\n')) {
        if (!line.trim() || line[0] == '#') continue
        let [url, opt] = line.split(' ')
        let origin
        if (url == 'default')
            origin = url
        else try {
            origin = new URL(url).origin
        } catch {continue}
        if (isNaN(opt)) opt = '00000'
        config[origin] = types.filter((_, i) => opt[i] !== '1')
    }
}

tempo = undefined  // temporary config, set in popup.js
let dontBlockNextUrl = undefined  // can be like {url: ..., redirectTo: ...}, set in content.js

// block
function block(details) {
    if (dontBlockNextUrl && details.url == dontBlockNextUrl.url) {
        if (dontBlockNextUrl.redirectTo) {
            dontBlockNextUrl = {url: dontBlockNextUrl.redirectTo}
            return {redirectUrl: dontBlockNextUrl.url}
        }
        dontBlockNextUrl = undefined
        return
    }
    let opt
    if (tempo && details.tabId == tempo.tabId) {  // set by popup apply button
        opt = tempo.block
    } else {
        opt = config[details.initiator] || config.default
    }
    if (!opt.includes(details.type)) return
    if (details.type == 'image') {
        return {redirectUrl: chrome.runtime.getURL('redir/empty.svg')}
    } else if (details.type == 'script') {
        return {redirectUrl: chrome.runtime.getURL('redir/empty.js')}
    }
    return {cancel: true}
}

function savedDataHeader(details) {  // add Save-Data: on header
    return {requestHeaders: [...details.requestHeaders, {name: 'Save-Data', value: 'on'}]}
}

savingOn = true

function turn(on) {
    if (on) {
        chrome.webRequest.onBeforeRequest.addListener(block,
            {urls: ['http://*/*', 'https://*/*']}, ['blocking'])
        chrome.webRequest.onBeforeSendHeaders.addListener(savedDataHeader,
            {urls: ['http://*/*', 'https://*/*']}, ['blocking', 'requestHeaders'])
        savingOn = true
    } else {
        chrome.webRequest.onBeforeRequest.removeListener(block)
        chrome.webRequest.onBeforeSendHeaders.removeListener(block)
        savingOn = false
    }
}

chrome.storage.local.get(['config'], result => {
    if (result.config) parseConfig(result.config)
    else chrome.storage.local.set({config: ''})
    turn(true)  // start blocking
})

// YOUTUBE VIDEO QUALITY

youtubeQuality = 'tiny'
chrome.storage.local.get(['youtubeQuality'], result => {
    if (result.youtubeQuality)
        youtubeQuality = result.youtubeQuality
    else
        chrome.storage.local.set({youtubeQuality})
})

// MESSAGING WITH PAGE CONTEXT SCRIPTS
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.dontBlockNextUrl) { // optionally show images on contextmenu
        dontBlockNextUrl = message.dontBlockNextUrl
        sendResponse() // to indicate that what needs to be done here is over
    } else if (message == 'youtubeQuality') {  // get the desired default youtube playback quality
        sendResponse(youtubeQuality)
    }
    return true
})
