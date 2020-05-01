'use strict'

const gmailUrl = 'https://mail.google.com/mail/u/1/'

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
    .then(response => response.text())
    .then(update)
    .catch(error => {
      console.log('Error: ', error)
    })
}

function update(data) {
  const xml = new DOMParser().parseFromString(data, 'text/xml')
  console.log('feed', xml)

  const fullcount = xml.querySelector('feed > fullcount').textContent
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
      chrome.tabs.update(inboxTab.id, {selected: true})
    } else {
      chrome.tabs.create({url: gmailUrl})
    }
  })
  chrome.browserAction.setBadgeText({text: ''})
}
