'use strict'

const gmailUrl = 'https://mail.google.com/mail/u/0/'

main()

function main() {
  chrome.alarms.onAlarm.addListener(alarm => {
    console.log('checking...', alarm)
    check()
  })

  chrome.browserAction.onClicked.addListener(() => {
    goToInbox()
  })

  chrome.notifications.onClicked.addListener(notificationId => {
    goToInbox()
    chrome.notifications.clear(notificationId)
  })

  chrome.alarms.create('check', {periodInMinutes: 1})

  console.log('first check')
  check()
}

function check() {
  fetch(gmailUrl + 'feed/atom')
    .then(response => {
      if (!response.ok) {
        throw new Error(response.status + ' ' + response.statusText)
      }
      return response.text()
    })
    .then(data => {
      update(data)
    })
    .catch(error => {
      console.error('Error: ', error)
      chrome.browserAction.setBadgeBackgroundColor({color: '#F00'})
      chrome.browserAction.setBadgeText({text: '!'})
    })
}

function update(data) {
  const xml = new DOMParser().parseFromString(data, 'text/xml')
  console.log('feed', xml)

  const fullcount = xml.querySelector('feed > fullcount').textContent
  chrome.browserAction.setBadgeBackgroundColor({color: [0, 0, 0, 0]})
  chrome.browserAction.setBadgeText({text: fullcount === '0' ? '' : fullcount})

  chrome.notifications.getAll(notifications => {
    const oldIds = Object.keys(notifications)

    const entries = Array.from(xml.querySelectorAll('entry')).map(entry => ({
      id: entry.querySelector('id').textContent,
      summary: entry.querySelector('summary').textContent,
      title: entry.querySelector('title').textContent,
    }))

    const newIds = entries.map(entry => entry.id)

    oldIds
      .filter(id => !newIds.includes(id))
      .forEach(id => {
        chrome.notifications.clear(id)
      })

    entries
      .filter(entry => !oldIds.includes(entry.id))
      .forEach(entry => {
        chrome.notifications.create(entry.id, {
          type: 'basic',
          iconUrl: 'icon.png',
          title: entry.title,
          message: entry.summary
        })
      })
  })
}

function goToInbox() {
  chrome.tabs.query({}, tabs => {
    const re = new RegExp('^' + gmailUrl)
    const inboxTab = tabs.find(tab => tab.url && re.test(tab.url))
    if (inboxTab) {
      chrome.tabs.update(inboxTab.id, {active: true}, tab => {
        chrome.windows.update(tab.windowId, {focused: true})
      })
    } else {
      chrome.tabs.create({url: gmailUrl}, tab => {
        chrome.windows.update(tab.windowId, {focused: true})
      })
    }
  })
  chrome.browserAction.setBadgeText({text: ''})
}
