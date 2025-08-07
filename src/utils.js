export const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>动态短链接服务</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 700px; margin: 2em auto; }
    h1 { text-align: center; margin-bottom: 1em; }
    .section { border: 1px solid #ccc; margin-bottom: 1em; border-radius: 6px; overflow: hidden; }
    .section h2 {
      background-color: #f5f5f5;
      margin: 0;
      padding: 0.8em 1em;
      font-size: 1.1em;
      cursor: pointer;
      user-select: none;
    }
    .section .content {
      display: none;
      padding: 1em;
      background-color: #fff;
    }
    .section.active .content {
      display: block;
    }
    form label { display: block; margin: 0.5em 0 0.2em; }
    input[type="text"], input[type="url"] {
      width: 100%; padding: 0.4em; box-sizing: border-box;
    }
    button {
      margin-top: 1em; padding: 0.6em 1.2em;
      cursor: pointer; background-color: #007bff;
      border: none; color: white; border-radius: 4px;
    }
    #result, #error, #update-result, #update-error {
      margin-top: 1em;
      font-weight: bold;
    }
    #result, #update-result { color: green; }
    #error, #update-error { color: red; }
    p.info { font-size: 0.9em; color: #555; margin-top: 0.5em; }
    ul#linkList { list-style: none; padding-left: 0; }
    ul#linkList li {
      margin-bottom: 0.5em;
      border-bottom: 1px solid #ddd;
      padding-bottom: 0.5em;
      cursor: pointer;
    }
    ul#linkList li .details {
      display: none;
      margin-top: 0.3em;
      font-size: 0.9em;
      color: #333;
      word-break: break-word;
    }
    ul#linkList li.expanded .details {
      display: block;
    }
  </style>
</head>
<body>
  <h1>动态短链接服务</h1>

  <div class="section active">
    <h2 onclick="toggleSection(this)">创建短链接</h2>
    <div class="content">
      <form id="createForm">
        <label>原始链接(URL)：<input type="url" id="url" required placeholder="https://example.com" /></label>
        <label>自定义短码(Code)：<input type="text" id="code" required placeholder="例如 abc123" /></label>
        <button type="submit">创建</button>
      </form>
      <div id="result"></div>
      <div id="error"></div>
      <p class="info">
        需要二维码？复制短链接地址后访问
        <a href="https://qr.ioi.tw/zh-cn/" target="_blank" rel="noopener noreferrer">QR码生成器</a>
        粘贴生成二维码。
      </p>
    </div>
  </div>

  <div class="section">
    <h2 onclick="toggleSection(this)">已有短码列表（点击展开查看目标链接）</h2>
    <div class="content">
      <ul id="linkList"><li>加载中...</li></ul>
    </div>
  </div>

  <div class="section">
    <h2 onclick="toggleSection(this)">更新短链接目标地址</h2>
    <div class="content">
      <form id="updateForm">
        <label>短码(Code)：<input type="text" id="updateCode" required placeholder="例如 abc123" /></label>
        <label>新的目标链接(URL)：<input type="url" id="updateUrl" required placeholder="https://newexample.com" /></label>
        <button type="submit">更新</button>
      </form>
      <div id="update-result"></div>
      <div id="update-error"></div>
    </div>
  </div>

  <script>
    function toggleSection(header) {
      const section = header.parentElement
      section.classList.toggle('active')
    }

    const createForm = document.getElementById('createForm')
    const updateForm = document.getElementById('updateForm')
    const resultDiv = document.getElementById('result')
    const errorDiv = document.getElementById('error')
    const updateResultDiv = document.getElementById('update-result')
    const updateErrorDiv = document.getElementById('update-error')
    const linkList = document.getElementById('linkList')

    async function fetchLinks() {
      try {
        const res = await fetch('/api/list')
        if (!res.ok) throw new Error('获取失败')
        const data = await res.json()
        if (data.length === 0) {
          linkList.innerHTML = '<li>暂无短码</li>'
          return
        }
        linkList.innerHTML = ''
        data.forEach(({ code, url }) => {
          const li = document.createElement('li')
          li.textContent = code
          li.title = '点击查看/隐藏目标链接'
          const details = document.createElement('div')
          details.className = 'details'
          details.textContent = url
          li.appendChild(details)
          li.addEventListener('click', () => {
            li.classList.toggle('expanded')
          })
          linkList.appendChild(li)
        })
      } catch (err) {
        linkList.innerHTML = '<li>加载出错</li>'
      }
    }

    createForm.addEventListener('submit', async e => {
      e.preventDefault()
      resultDiv.textContent = ''
      errorDiv.textContent = ''
      const url = document.getElementById('url').value.trim()
      const code = document.getElementById('code').value.trim()
      const formData = new FormData()
      formData.append('url', url)
      formData.append('code', code)

      try {
        const res = await fetch('/api/create', { method: 'POST', body: formData })
        const data = await res.json()
        if (res.ok) {
          resultDiv.innerHTML = \`
            <p>创建成功！短码：<b>\${data.code}</b></p>
            <p>短链接：<a href="\${data.shortUrl}" target="_blank" rel="noopener noreferrer">\${data.shortUrl}</a></p>
          \`
          fetchLinks()
        } else {
          errorDiv.textContent = data.error || '创建失败'
        }
      } catch (err) {
        errorDiv.textContent = '请求出错'
      }
    })

    updateForm.addEventListener('submit', async e => {
      e.preventDefault()
      updateResultDiv.textContent = ''
      updateErrorDiv.textContent = ''
      const code = document.getElementById('updateCode').value.trim()
      const url = document.getElementById('updateUrl').value.trim()
      const formData = new FormData()
      formData.append('code', code)
      formData.append('url', url)

      try {
        const res = await fetch('/api/update', { method: 'POST', body: formData })
        const data = await res.json()
        if (res.ok) {
          updateResultDiv.textContent = '更新成功'
          fetchLinks()
        } else {
          updateErrorDiv.textContent = data.error || '更新失败'
        }
      } catch (err) {
        updateErrorDiv.textContent = '请求出错'
      }
    })

    fetchLinks()
  </script>
</body>
</html>
`