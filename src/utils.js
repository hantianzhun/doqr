export const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>动态短链接服务</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 600px; margin: 2em auto; }
  h1 { text-align: center; }
  form { margin-bottom: 2em; }
  label { display: block; margin: 0.5em 0 0.2em; }
  input[type="text"], input[type="url"] { width: 100%; padding: 0.4em; }
  button { margin-top: 1em; padding: 0.6em 1.2em; cursor: pointer; }
  #result, #update-result { margin-top: 1em; color: green; }
  #error, #update-error { margin-top: 1em; color: red; }
  p.info { font-size: 1.5em; color: #555; }
</style>
</head>
<body>
  <h1>动态短链接服务</h1>

  <section>
    <h2>创建短链接</h2>
    <form id="createForm">
      <label>原始链接(URL)：<input type="url" id="url" required placeholder="https://example.com" /></label>
      <label>自定义短码(Code)：<input type="text" id="code" required placeholder="例如 abc123" /></label>
      <button type="submit">创建</button>
    </form>
    <div id="result"></div>
    <div id="error"></div>
  </section>

  <section>
    <p class="info">
      需要二维码？请复制短链接地址，然后访问 <a href="https://qr.ioi.tw/zh-cn/" target="_blank" rel="noopener noreferrer">QR码生成器</a> 粘贴生成二维码。
    </p>
  </section>

  <section>
    <h2>更新短链接目标地址</h2>
    <form id="updateForm">
      <label>短码(Code)：<input type="text" id="updateCode" required placeholder="例如 abc123" /></label>
      <label>新的目标链接(URL)：<input type="url" id="updateUrl" required placeholder="https://newexample.com" /></label>
      <button type="submit">更新</button>
    </form>
    <div id="update-result"></div>
    <div id="update-error"></div>
  </section>
  
  <script>
    const createForm = document.getElementById('createForm')
    const updateForm = document.getElementById('updateForm')
    const resultDiv = document.getElementById('result')
    const errorDiv = document.getElementById('error')
    const updateResultDiv = document.getElementById('update-result')
    const updateErrorDiv = document.getElementById('update-error')

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
        } else {
          updateErrorDiv.textContent = data.error || '更新失败'
        }
      } catch (err) {
        updateErrorDiv.textContent = '请求出错'
      }
    })
  </script>
</body>
</html>

`

