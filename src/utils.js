export const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>动态短链接服务</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 800px; margin: 2em auto; }
  h1 { text-align: center; }
  details { margin-bottom: 1.5em; border: 1px solid #ccc; border-radius: 5px; padding: 1em; background: #f9f9f9; }
  details summary { font-weight: bold; font-size: 1.1em; cursor: pointer; }
  label { display: block; margin: 0.8em 0 0.3em; }
  input[type="text"], input[type="url"] { width: 100%; padding: 0.5em; font-size: 1em; }
  button { margin-top: 1em; padding: 0.6em 1.2em; font-size: 1em; cursor: pointer; }
  #result, #update-result { margin-top: 1em; color: green; }
  #error, #update-error { margin-top: 1em; color: red; }
  p.info { font-size: 0.9em; color: #555; }

  ul#linkList { list-style: none; padding-left: 0; }
  ul#linkList li { 
    margin-bottom: 0.6em; 
    border: 1px solid #ddd; 
    border-radius: 5px; 
    padding: 0.8em; 
    background: #fff; 
    position: relative; 
  }
  ul#linkList li .details { display: none; margin-top: 0.5em; font-size: 0.9em; color: #333; word-break: break-all; }
  ul#linkList li.expanded .details { display: block; }

  .delete-btn {
    position: absolute;
    top: 0.5em;
    right: 0.8em;
    background: #e74c3c;
    color: #fff;
    border: none;
    padding: 0.3em 0.6em;
    cursor: pointer;
    border-radius: 4px;
    font-size: 0.8em;
  }
</style>
</head>
<body>
  <h1>动态短链接服务</h1>

  <details open>
    <summary>创建短链接</summary>
    <form id="createForm">
      <label>原始链接(URL)：<input type="url" id="url" required placeholder="https://example.com" /></label>
      <label>自定义短码(Code)：<input type="text" id="code" required placeholder="例如 abc123" /></label>
      <button type="submit">创建</button>
    </form>
    <div id="result"></div>
    <div id="error"></div>
  </details>

  <details>
    <summary>已有短码列表（点击每项展开详情并支持删除）</summary>
    <ul id="linkList"><li>加载中...</li></ul>
  </details>

  <details>
    <summary>更新短链接目标地址</summary>
    <form id="updateForm">
      <label>短码(Code)：<input type="text" id="updateCode" required placeholder="例如 abc123" /></label>
      <label>新的目标链接(URL)：<input type="url" id="updateUrl" required placeholder="https://newexample.com" /></label>
      <button type="submit">更新</button>
    </form>
    <div id="update-result"></div>
    <div id="update-error"></div>
  </details>

  <details>
    <summary>二维码生成说明</summary>
    <p class="info">
      需要二维码？请复制短链接地址，然后访问 <a href="https://goqr.me/" target="_blank" rel="noopener noreferrer">https://goqr.me/</a> 粘贴生成二维码。
    </p>
  </details>

  <script>
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
          li.addEventListener('click', () => {
            li.classList.toggle('expanded')
          })

          const details = document.createElement('div')
          details.className = 'details'
          details.innerHTML = \`<strong>目标链接：</strong><br><a href="\${url}" target="_blank">\${url}</a>\`
          li.appendChild(details)

          const delBtn = document.createElement('button')
          delBtn.textContent = '删除'
          delBtn.className = 'delete-btn'
          delBtn.addEventListener('click', async e => {
            e.stopPropagation()
            if (!confirm(\`确定删除短码 \${code} 吗？\`)) return
            try {
              const res = await fetch(\`/api/delete?code=\${encodeURIComponent(code)}\`, { method: 'DELETE' })
              const result = await res.json()
              if (res.ok) {
                fetchLinks()
              } else {
                alert(result.error || '删除失败')
              }
            } catch {
              alert('请求失败')
            }
          })
          li.appendChild(delBtn)

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

    // 页面加载时获取短链列表
    fetchLinks()
  </script>
</body>
</html>
`
