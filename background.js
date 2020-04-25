'use strict'

const gmailUrl = 'https://mail.google.com/mail/u/1/'

main()

function main() {
  chrome.alarms.onAlarm.addListener(alarm => {
    console.log('checking...', alarm)
    check()
  })

  chrome.browserAction.onClicked.addListener(goToInbox)

  chrome.alarms.create('check', {periodInMinutes: 1})

  console.log('first check')
  check()
}

function check() {
  fetch(gmailUrl + 'feed/atom')
    .then(response => response.text())
    .then(data => {
      const xml = new DOMParser().parseFromString(data, 'text/xml')
      console.log('feed', xml)
      const fullcount = xml.querySelector('feed > fullcount').textContent
      chrome.browserAction.setBadgeText({text: fullcount === '0' ? '' : fullcount})
    })
    .catch(error => {
      console.log('Error: ', error)
    })
}

function goToInbox() {
  chrome.tabs.query({}, tabs => {
    const re = new RegExp('^' + gmailUrl)
    const inboxTab = tabs.find(tab => tab.url && re.test(tab.url))
    if (inboxTab) {
      chrome.tabs.update(inboxTab.id, {selected: true})
    } else {
      chrome.tabs.create({url: gmailUrl})
    }
  })
}
