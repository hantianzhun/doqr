export const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>动态二维码短链服务</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 2rem; max-width: 500px; margin: auto; }
    input, button { padding: 0.5rem; margin: 0.5rem 0; width: 100%; font-size: 1rem; }
    img { margin-top: 1rem; }
  </style>
</head>
<body>
  <h1>生成动态二维码短链</h1>
  <form id="form">
    <input type="url" name="url" placeholder="目标网址" required />
    <input type="text" name="code" placeholder="自定义短码（可选）" maxlength="10" />
    <button type="submit">生成短链和二维码</button>
  </form>
  <div id="result"></div>

  <script>
    const form = document.getElementById('form')
    const result = document.getElementById('result')

    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      result.innerHTML = '生成中...'
      const formData = new FormData(form)

      const resp = await fetch('/api/create', {
        method: 'POST',
        body: formData
      })

      if (!resp.ok) {
        const err = await resp.json()
        result.innerHTML = '<p style="color:red;">错误：' + (err.error || '未知错误') + '</p>'
        return
      }

      const data = await resp.json()
      result.innerHTML = \`
        <p>短链：<a href="\${data.shortUrl}" target="_blank">\${data.shortUrl}</a></p>
        <img src="\${data.qrUrl}" alt="二维码" />
      \`
    })
  </script>
</body>
</html>`
