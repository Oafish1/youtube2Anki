const toSeconds = (ms) => {
  if (ms) {
    const a = ms.split(":")
    return (+a[0] * 60) + (+a[1])
  }
}

const toCSV = (objArray) => {
  const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray
  let str = ``
  return array.reduce((str, next) => {
    str += `${Object.values(next).map(value => `"${value}"`).join(",")}` + '\r\n'
    return str
  }, str)
}

const download = (filename, text) => {
  const link = document.createElement('a')
  link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(text))
  link.setAttribute('download', filename)
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const getSubtitles = (cues) => {
  return cues.map((cue, i) => {
    const time = cue.querySelector(".cue-group-start-offset").innerText
    const nextTime = (cues[i + 1]
      && cues[i + 1].querySelector(".cue-group-start-offset").innerText
    ) || null
    const text = cue.querySelector(".cue").innerText
    const prevText = (cues[i - 1] && cues[i - 1].querySelector(".cue").innerText) || null
    const nextText = (cues[i + 1] && cues[i + 1].querySelector(".cue").innerText) || null

    return {
      time,
      nextTime: nextTime || time,
      text,
      prevText,
      nextText,
      id: getID(window.location.href),
      startSeconds: toSeconds(time),
      endSeconds: toSeconds(nextTime) && (toSeconds(nextTime) + 1),
      title: document.querySelector("h1.title").firstChild.innerText
    }
  })
}

const getID = (url) => {
  let ID = ''
  url = url.replace(/(>|<)/gi,'').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/)
  if(url[2] !== undefined) {
    ID = url[2].split(/[^0-9a-z_\-]/i)
    ID = ID[0]
  }
  else {
    ID = url
  }
  return ID
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { type } = request

  if (type === 'getSubtitles') {
    const cues = [...document.querySelectorAll(".cue-group")]

    if (cues.length) {
      const title = document.querySelector("h1.title").firstChild.innerText
      const subtitles = getSubtitles(cues)
      sendResponse({title, subtitles})
    } else {
      sendResponse({subtitles: null, title: null})
    }
  }

  if (type === 'download') {
      const { title, subtitles } = request
      const csv = toCSV(subtitles)
      download(`${title}.csv`, csv)
  }
})
